const syncFn = require("./main.js");

jest.mock("node-appwrite", () => {
  const mockListDocuments = jest.fn();
  return {
    Client: jest.fn().mockImplementation(() => ({
      setEndpoint: () => ({ setProject: () => ({ setKey: () => {} }) }),
    })),
    Databases: jest.fn().mockImplementation(() => ({
      listDocuments: mockListDocuments,
    })),
    Query: {
      limit: jest.fn(),
      cursorAfter: jest.fn(),
    },
    __mockListDocuments: mockListDocuments,
  };
});

const mockAddDocuments = jest.fn();
jest.mock("meilisearch", () => ({
  MeiliSearch: jest.fn().mockImplementation(() => ({
    index: () => ({
      addDocuments: mockAddDocuments,
    }),
  })),
}));

describe("MeiliSearch Sync Function", () => {
  let req, res, log, mockListDocuments;

  beforeEach(() => {
    process.env.MEILISEARCH_ENDPOINT = "http://localhost:7700";
    process.env.MEILISEARCH_ADMIN_API_KEY = "key";
    process.env.APPWRITE_ENDPOINT = "https://appwrite.test/v1";
    process.env.APPWRITE_FUNCTION_PROJECT_ID = "pid";
    process.env.APPWRITE_API_KEY = "ak";

    req = {};
    res = { text: jest.fn() };
    log = jest.fn();

    mockListDocuments = require("node-appwrite").__mockListDocuments;
    mockListDocuments.mockReset();
    mockAddDocuments.mockReset();
  });

  it("syncs stories and users with pagination", async () => {
    mockListDocuments
      .mockResolvedValueOnce({ documents: [{ $id: "s1" }, { $id: "s2" }] })
      .mockResolvedValueOnce({ documents: [{ $id: "s3" }] })
      .mockResolvedValueOnce({ documents: [] })
      .mockResolvedValueOnce({ documents: [{ $id: "u1" }] })
      .mockResolvedValueOnce({ documents: [{ $id: "u2" }] })
      .mockResolvedValueOnce({ documents: [] });

    await syncFn({ req, res, log });

    expect(mockAddDocuments).toHaveBeenCalledTimes(4);
    expect(res.text).toHaveBeenCalledWith("Sync finished.", 200);
  });

  it("handles empty documents", async () => {
    mockListDocuments
      .mockResolvedValueOnce({ documents: [] }) 
      .mockResolvedValueOnce({ documents: [] });

    await syncFn({ req, res, log });

    expect(mockAddDocuments).not.toHaveBeenCalled();
    expect(res.text).toHaveBeenCalledWith("Sync finished.", 200);
  });
});
