import { Client, Databases, Query } from 'node-appwrite';
import { throwIfMissing } from './utils.js';
import { MeiliSearch } from 'meilisearch';

export default async ({ req, res, log }) => {
  throwIfMissing(process.env, [
    'MEILISEARCH_ENDPOINT',
    'MEILISEARCH_ADMIN_API_KEY',
  ]);


  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  const meilisearch = new MeiliSearch({
    host: process.env.MEILISEARCH_ENDPOINT,
    apiKey: process.env.MEILISEARCH_ADMIN_API_KEY,
  });

  const storiesIndex = meilisearch.index('stories');

  let storiesCursor = null;

  do {
    const queries = [Query.limit(100)];

    if (storiesCursor) {
      queries.push(Query.cursorAfter(storiesCursor));
    }

    const { documents } = await databases.listDocuments(
      "stories",
      "670259e900321c12a5a2",
      queries
    );

    if (documents.length > 0) {
      storiesCursor = documents[documents.length - 1].$id;
    } else {
      log(`No more documents found.`);
      storiesCursor = null;
      break;
    }

    log(`Syncing chunk of ${documents.length} Story documents ...`);
    await storiesIndex.addDocuments(documents, { primaryKey: '$id' });
  } while (storiesCursor !== null);

  const usersIndex = meilisearch.index("users");

  let usersCursor = null;

  do {
    const queries = [Query.limit(100)];

    if (usersCursor) {
      queries.push(Query.cursorAfter(usersCursor));
    }

    const { documents } = await databases.listDocuments(
      "64a1319104a149e16f5c",
      "64a52f0a6c41ded09def",
      queries
    );

    if (documents.length > 0) {
      usersCursor = documents[documents.length - 1].$id;
    } else {
      log(`No more documents found.`);
      usersCursor = null;
      break;
    }

    log(`Syncing chunk of ${documents.length} User documents ...`);
    await usersIndex.addDocuments(documents, { primaryKey: '$id' });
  } while (usersCursor !== null);

  log('Sync finished.');

  return res.text('Sync finished.', 200);
};
