import { Client, TablesDB, ID, Query } from 'node-appwrite';
import { throwIfMissing } from './utils.js';

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        'APPWRITE_API_KEY',
        'APPWRITE_FUNCTION_PROJECT_ID',
        'DATABASE_ID',
        'REQUESTS_TABLE_ID',
        'ACTIVE_PAIRS_TABLE_ID',
    ]);

    const client = new Client()
        .setEndpoint(
            process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
        )
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const db = new TablesDB(client);

    log(req.headers);
    const triggerEvent = req.headers['x-appwrite-event'];
    const newRequestDocId = triggerEvent.split('.')[5];
    log(newRequestDocId);

    const newRequestResult = await db.getRows({
        databaseId: process.env.DATABASE_ID,
        tableId: process.env.REQUESTS_TABLE_ID,
        queries: [Query.equal('$id', [newRequestDocId])]
    });
    
    if (newRequestResult.rows.length === 0) {
        return res.json({
            message: 'Request not found',
        });
    }
    
    const newRequestDoc = newRequestResult.rows[0];
    if (!newRequestDoc.isRandom) {
        return res.json({
            message: 'Request is not Random',
        });
    }

    const requestDocsRef = await db.listRows({
        databaseId: process.env.DATABASE_ID,
        tableId: process.env.REQUESTS_TABLE_ID,
        queries: [
            Query.notEqual('$id', [newRequestDocId]),
            Query.equal('languageIso', [newRequestDoc.languageIso]),
            Query.equal('isAnonymous', [newRequestDoc.isAnonymous]),
            Query.equal('isRandom', [true]),
            Query.orderAsc('$createdAt'),
            Query.limit(25),
        ]
    });
    log(requestDocsRef.rows); // We get all the requests

    //Check if any other request can be matched
    for (let index = 0; index < requestDocsRef.total; index++) {
        try {
            // Create an active pair document (Gives error if a record with same userDocId exists and then we move to the next request)
            const newPairResult = await db.createRows({
                databaseId: process.env.DATABASE_ID,
                tableId: process.env.ACTIVE_PAIRS_TABLE_ID,
                rows: [{
                    $id: ID.unique(),
                    uid1: newRequestDoc.uid,
                    uid2: requestDocsRef.rows[index].uid,
                    userDocId1: newRequestDocId,
                    userDocId2: requestDocsRef.rows[index].$id,
                    ...(newRequestDoc.isAnonymous
                        ? {}
                        : {
                            userName1: newRequestDoc.userName,
                            userName2:
                                requestDocsRef.rows[index].userName,
                        }),
                }]
            });
            const newPairDoc = newPairResult.rows[0];
            log(newPairDoc);

            // Delete requests since we have paired them
            await db.deleteRows({
                databaseId: process.env.DATABASE_ID,
                tableId: process.env.REQUESTS_TABLE_ID,
                queries: [Query.equal('$id', [requestDocsRef.rows[index].$id, newRequestDocId])]
            });

            return res.json({
                message: 'Request was paired',
                newPair: newPairDoc,
            });
        } catch (e) {
            error('That request is already paired: ');
            error(String(e));
        }
    }

    // If there is no second user or new request was paired with another request, end the execution
    return res.json({
        message: 'Request in queue or was paired already.',
    });
};
