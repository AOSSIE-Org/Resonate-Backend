import { Client, Databases, ID, Query } from 'node-appwrite';
import { throwIfMissing } from './utils.js';

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        'APPWRITE_API_KEY',
        'DATABASE_ID',
        'REQUESTS_COLLECTION_ID',
        'ACTIVE_PAIRS_COLLECTION_ID',
    ]);

    const client = new Client()
        .setEndpoint(
            process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
        )
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const db = new Databases(client);

    log(req.headers);
    const triggerEvent = req.headers['x-appwrite-event'];
    const newRequestDocId = triggerEvent.split('.')[5];
    log(newRequestDocId);

    const newRequestDoc = await db.getDocument(
        process.env.DATABASE_ID,
        process.env.REQUESTS_COLLECTION_ID,
        newRequestDocId
    );
    if (!newRequestDoc.isRandom) {
        return res.json({
            message: 'Request is not Random',
        });
    }

    const requestDocsRef = await db.listDocuments(
        process.env.DATABASE_ID,
        process.env.REQUESTS_COLLECTION_ID,
        [
            Query.notEqual('$id', [newRequestDocId]),
            Query.equal('languageIso', [newRequestDoc.languageIso]),
            Query.equal('isAnonymous', [newRequestDoc.isAnonymous]),
            Query.equal('isRandom', [true]),
            Query.orderAsc('$createdAt'),
            Query.limit(25),

        ]
    );
    log(requestDocsRef.documents); // We get all the requests

    //Check if any other request can be matched
    for (let index = 0; index < requestDocsRef.total; index++) {
        try {
            // Create an active pair document (Gives error if a record with same userDocId exists and then we move to the next request)
            const newPairDoc = await db.createDocument(
                process.env.DATABASE_ID,
                process.env.ACTIVE_PAIRS_COLLECTION_ID,
                ID.unique(),
                {
                    uid1: newRequestDoc.uid,
                    uid2: requestDocsRef.documents[index].uid,
                    userDocId1: newRequestDocId,
                    userDocId2: requestDocsRef.documents[index].$id,
                    ...(newRequestDoc.isAnonymous
                        ? {}
                        : {
                            userName1: newRequestDoc.userName,
                            userName2:
                                requestDocsRef.documents[index].userName,
                        }),
                }
            );
            log(newPairDoc);

            // Delete requests since we have paired them
            await db.deleteDocument(
                process.env.DATABASE_ID,
                process.env.REQUESTS_COLLECTION_ID,
                requestDocsRef.documents[index].$id
            );
            await db.deleteDocument(
                process.env.DATABASE_ID,
                process.env.REQUESTS_COLLECTION_ID,
                newRequestDocId
            );

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
