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
            const result = await this.tables.getRows({
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
