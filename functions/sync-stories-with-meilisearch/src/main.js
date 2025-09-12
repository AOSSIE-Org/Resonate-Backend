import { Client, Databases, Query } from 'node-appwrite';
import { getStaticFile, interpolate, throwIfMissing } from './utils.js';
import { MeiliSearch } from 'meilisearch';

export default async ({ req, res, log }) => {
  throwIfMissing(process.env, [
    'MEILISEARCH_ENDPOINT',
    'MEILISEARCH_ADMIN_API_KEY',
  ]);



  // Check if function was triggered by a document event
  if (req.headers['x-appwrite-trigger']) {
    const meilisearch = new MeiliSearch({
      host: process.env.MEILISEARCH_ENDPOINT,
      apiKey: process.env.MEILISEARCH_ADMIN_API_KEY,
    });

    const index = meilisearch.index("stories");

    try {
      // Extract document data from the event payload (req.body is already an object)
      const payload = req.body || {};
      const documentId = payload.$id;
      const eventType = req.headers['x-appwrite-event'] || '';

      if (!documentId) {
        log('No document ID found in event payload');
        return res.text('No document ID found in event', 400);
      }

      if (eventType.includes('.delete')) {
        log(`Deleting document ${documentId} from Meilisearch due to deletion event`);
        await index.deleteDocument(documentId);
        log(`Successfully deleted document ${documentId} from Meilisearch`);
        return res.text(`Document ${documentId} deleted from Meilisearch`, 200);
      } else if (eventType.includes('.create') || eventType.includes('.update')) {
        const action = eventType.includes('.create') ? 'create' : 'update';
        log(`Syncing document ${documentId} to Meilisearch due to ${action} event`);
        await index.addDocuments([payload], { primaryKey: '$id' });
        log(`Successfully synced document ${documentId} to Meilisearch`);
        return res.text(`Document ${documentId} synced to Meilisearch`, 200);
      }
    } catch (error) {
      log(`Error processing document event in Meilisearch: ${error.message}`);
      return res.text(`Error: ${error.message}`, 500);
    }
  }
  else {
    return res.text('No action taken. This endpoint only handles Appwrite document events.', 400);
  }



};
