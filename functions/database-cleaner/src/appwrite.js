import { Client, TablesDB, Query } from "node-appwrite";
import { getExpiryDate } from "./utils.js";

class AppwriteService {
    constructor() {
        const client = new Client();
        client
            .setEndpoint(
                process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
            )
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        this.tables = new TablesDB(client);
    }

    async doesRoomExist(roomId) {
        try {
            const result = await this.tables.listRows({
                databaseId: process.env.MASTER_DATABASE_ID,
                tableId: process.env.ROOMS_TABLE_ID,
                queries: [Query.equal("$id", [roomId])]
            });
            return result.rows.length > 0;
        } catch (err) {
            if (err.code !== 404) throw err;
            return false;
        }
    }

    async doesPollExist(pollId) {
        try {
            const result = await this.tables.listRows({
                databaseId: process.env.MASTER_DATABASE_ID,
                tableId: process.env.POLLS_TABLE_ID,
                queries: [Query.equal("$id", [pollId])]
            });
            return result.rows.length > 0;
        } catch (err) {
            if (err.code !== 404) throw err;
            return false;
        }
    }

    // Collects every row of a table up front (cursor pagination), so callers
    // can delete rows afterwards without invalidating an in-flight cursor.
    async listAllRows(tableId) {
        const rows = [];
        let lastId = null;
        while (true) {
            const queries = [Query.limit(100)];
            if (lastId !== null) {
                queries.push(Query.cursorAfter(lastId));
            }
            const page = await this.tables.listRows({
                databaseId: process.env.MASTER_DATABASE_ID,
                tableId,
                queries
            });
            rows.push(...page.rows);
            if (page.rows.length === 0) break;
            lastId = page.rows[page.rows.length - 1].$id;
        }
        return rows;
    }

    async cleanParticipantsCollection() {
        const participantsList = await this.tables.listRows({
            databaseId: process.env.MASTER_DATABASE_ID,
            tableId: process.env.PARTICIPANTS_TABLE_ID
        });

        await Promise.all(
            participantsList.rows.map(async(participantRow)=>{
                try{
                    if(!(await this.doesRoomExist(participantRow.roomId))){
                        await this.tables.deleteRows({
                            databaseId: process.env.MASTER_DATABASE_ID,
                            tableId: process.env.PARTICIPANTS_TABLE_ID,
                            queries: [Query.equal("$id", [participantRow.$id])]
                        });
                    }
                }catch(error){
                    console.error(`Failed to clean participant ${participantRow.$id}:`, error);
                }
            })
        );
    }

    async cleanRoomPollsCollection() {
        const pollRows = await this.listAllRows(process.env.POLLS_TABLE_ID);

        await Promise.all(
            pollRows.map(async(pollRow)=>{
                try{
                    if(!(await this.doesRoomExist(pollRow.roomId))){
                        await this.tables.deleteRows({
                            databaseId: process.env.MASTER_DATABASE_ID,
                            tableId: process.env.POLLS_TABLE_ID,
                            queries: [Query.equal("$id", [pollRow.$id])]
                        });
                    }
                }catch(error){
                    console.error(`Failed to clean poll ${pollRow.$id}:`, error);
                }
            })
        );
    }

    async cleanRoomPollVotesCollection() {
        const pollVoteRows = await this.listAllRows(process.env.POLL_VOTES_TABLE_ID);

        await Promise.all(
            pollVoteRows.map(async(pollVoteRow)=>{
                try{
                    if(!(await this.doesRoomExist(pollVoteRow.roomId)) || !(await this.doesPollExist(pollVoteRow.pollId))){
                        await this.tables.deleteRows({
                            databaseId: process.env.MASTER_DATABASE_ID,
                            tableId: process.env.POLL_VOTES_TABLE_ID,
                            queries: [Query.equal("$id", [pollVoteRow.$id])]
                        });
                    }
                }catch(error){
                    console.error(`Failed to clean poll vote ${pollVoteRow.$id}:`, error);
                }
            })
        );
    }

    async cleanActivePairsCollection() {
        let done = true;
        const queries = [
            Query.lessThan("$createdAt", getExpiryDate()),
            Query.limit(25),
        ];
        do {
            const activePairsList = await this.tables.listRows({
                databaseId: process.env.MASTER_DATABASE_ID,
                tableId: process.env.ACTIVE_PAIRS_TABLE_ID,
                queries
            });
            
            if (activePairsList.rows.length > 0) {
                await this.tables.deleteRows({
                    databaseId: process.env.MASTER_DATABASE_ID,
                    tableId: process.env.ACTIVE_PAIRS_TABLE_ID,
                    queries: [Query.equal("$id", activePairsList.rows.map(r => r.$id))]
                });
            }
            
            done = activePairsList.total === 0;
        } while (!done);
    }



    // Clear all OTPs which are one day old
    async clearOldOTPs() {

        let done;

        const currentDate = new Date().toDateString();

        const queries = [
            Query.notEqual("date", currentDate),
            Query.limit(100),
        ];

        //
        do {
            const oneDayOldOTPs = await this.tables.listRows({
                databaseId: process.env.VERIFICATION_DATABASE_ID,
                tableId: process.env.OTP_TABLE_ID,
                queries
            });
    
            if (oneDayOldOTPs.rows.length > 0) {
                await this.tables.deleteRows({
                    databaseId: process.env.VERIFICATION_DATABASE_ID,
                    tableId: process.env.OTP_TABLE_ID,
                    queries: [Query.equal("$id", oneDayOldOTPs.rows.map(r => r.$id))]
                });
            }

            done = oneDayOldOTPs.total === 0;

        } while (!done);

        
    }
}

export default AppwriteService;
