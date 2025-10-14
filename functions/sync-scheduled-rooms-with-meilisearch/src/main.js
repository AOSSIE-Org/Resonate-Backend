import { throwIfMissing, parseQueryParams } from './utils.js';
import { MeiliSearch } from 'meilisearch';

export default async ({ req, res, log }) => {
  throwIfMissing(process.env, [
    'MEILISEARCH_ENDPOINT',
    'MEILISEARCH_ADMIN_API_KEY',
  ]);

  const meilisearch = new MeiliSearch({
    host: process.env.MEILISEARCH_ENDPOINT,
    apiKey: process.env.MEILISEARCH_ADMIN_API_KEY,
  });

  try {
    await meilisearch.createIndex('upcoming_rooms', { primaryKey: '$id' });
  } catch (error) {
    if (error.code !== 'index_already_exists') {
      log(`Index creation error: ${error.message}`);
    }
  }

  const index = meilisearch.index('upcoming_rooms');

  let body = req.body || {};
  if (typeof body === 'string' && body.length > 0) {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  
  const triggerType = req.headers['x-appwrite-trigger'];
  const isDocumentEvent = triggerType === 'event' && 
    (typeof body === 'object' && body !== null && 
     ('$databaseId' in body || '$collectionId' in body || '$id' in body));
     
  const isSearchRequest = req.method === 'GET' || 
    (req.method === 'POST' && !isDocumentEvent);

  if (isSearchRequest) {
    try {
      const queryData = req.method === 'GET' ? (req.query || {}) : body;
      const params = parseQueryParams(queryData);

      const searchResults = await index.search(params.q, {
        limit: params.limit,
        offset: params.offset,
      });

      return res.json(searchResults.hits, 200);
    } catch (error) {
      return res.json({ success: false, error: error.message }, 500);
    }
  }

  if (isDocumentEvent) {
    await index.updateSearchableAttributes(['name', 'description', 'tags']);

    try {
      const documentId = body.$id;
      const eventType = req.headers['x-appwrite-event'] || '';

      if (!documentId) {
        return res.text('No document ID found', 400);
      }

      if (eventType.includes('.delete')) {
        await index.deleteDocument(documentId);
        return res.text(`Room ${documentId} deleted`, 200);
      } else if (eventType.includes('.create') || eventType.includes('.update')) {
        await index.addDocuments([body], { primaryKey: '$id' });
        return res.text(`Room ${documentId} synced`, 200);
      }
    } catch (error) {
      return res.text(`Error: ${error.message}`, 500);
    }
  }

  // Invalid request
  return res.json({ success: false, message: 'Invalid request' }, 400);
};
