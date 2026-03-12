import { Client, Users } from 'node-appwrite';
import { throwIfMissing } from './utils.js';

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, ['APPWRITE_API_KEY']);

    // Appwrite automatically sets x-appwrite-user-id when an authenticated
    // user invokes a function — use this to ensure users can only delete
    // their own account.
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) {
        return res.json({ message: 'Unauthorized: no user session found' }, 401);
    }

    const client = new Client()
        .setEndpoint(
            process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
        )
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    try {
        log(`Deleting auth account for user: ${userId}`);

        // Hard-delete the Appwrite auth account. This is only possible
        // server-side via the Users API — the client SDK has no equivalent.
        // The client-side already handles: profile picture, user doc,
        // username doc. Appwrite cascade relationships handle: followers, friends.
        await new Users(client).deleteUser(userId);

        log(`Auth account deleted successfully for user: ${userId}`);
    } catch (e) {
        error(String(e));
        return res.json({ message: String(e) }, 500);
    }

    return res.json({ message: 'Account permanently deleted' });
};
