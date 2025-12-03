const syncDocument = require('./main.js');

const mockAddDocuments = jest.fn();
const mockDeleteDocument = jest.fn();

jest.mock('meilisearch', () => ({
  MeiliSearch: jest.fn().mockImplementation(() => ({
    index: () => ({
      addDocuments: mockAddDocuments,
      deleteDocument: mockDeleteDocument,
    }),
  })),
}));

describe('Appwrite Document Event → Meilisearch Sync', () => {
  let req, res, log;

  beforeEach(() => {
    process.env.MEILISEARCH_ENDPOINT = 'http://localhost:7700';
    process.env.MEILISEARCH_ADMIN_API_KEY = 'key';

    req = { headers: {}, body: {} };
    res = { text: jest.fn() };
    log = jest.fn();

    mockAddDocuments.mockReset();
    mockDeleteDocument.mockReset();
  });

  it('syncs document on create event', async () => {
    req.headers['x-appwrite-trigger'] = 'documents.create';
    req.headers['x-appwrite-event'] = 'collections.stories.documents.create';
    req.body = { $id: 'doc1', title: 'Test Story' };

    await syncDocument({ req, res, log });

    expect(mockAddDocuments).toHaveBeenCalledWith([req.body], { primaryKey: '$id' });
    expect(res.text).toHaveBeenCalledWith('Document doc1 synced to Meilisearch', 200);
  });

  it('syncs document on update event', async () => {
    req.headers['x-appwrite-trigger'] = 'documents.update';
    req.headers['x-appwrite-event'] = 'collections.stories.documents.update';
    req.body = { $id: 'doc2', title: 'Updated Story' };

    await syncDocument({ req, res, log });

    expect(mockAddDocuments).toHaveBeenCalledWith([req.body], { primaryKey: '$id' });
    expect(res.text).toHaveBeenCalledWith('Document doc2 synced to Meilisearch', 200);
  });

  it('deletes document on delete event', async () => {
    req.headers['x-appwrite-trigger'] = 'documents.delete';
    req.headers['x-appwrite-event'] = 'collections.stories.documents.delete';
    req.body = { $id: 'doc3' };

    await syncDocument({ req, res, log });

    expect(mockDeleteDocument).toHaveBeenCalledWith('doc3');
    expect(res.text).toHaveBeenCalledWith('Document doc3 deleted from Meilisearch', 200);
  });

  it('returns 400 if no document ID', async () => {
    req.headers['x-appwrite-trigger'] = 'documents.create';
    req.headers['x-appwrite-event'] = 'collections.stories.documents.create';
    req.body = {};

    await syncDocument({ req, res, log });

    expect(res.text).toHaveBeenCalledWith('No document ID found in event', 400);
  });

  it('returns 400 if no x-appwrite-trigger', async () => {
    await syncDocument({ req, res, log });
    expect(res.text).toHaveBeenCalledWith(
      'No action taken. This endpoint only handles Appwrite document events.',
      400
    );
  });
});
