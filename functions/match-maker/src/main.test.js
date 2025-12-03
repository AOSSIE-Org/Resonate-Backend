const sendPairRequest = require("./main");
const { Client, Databases, ID, Query } = require("node-appwrite");
const { throwIfMissing } = require("./utils");

jest.mock("node-appwrite", () => {
  const mockDb = {
    getDocument: jest.fn(),
    listDocuments: jest.fn(),
    createDocument: jest.fn(),
    deleteDocument: jest.fn(),
  };

  const mockClient = {
    setEndpoint: jest.fn(() => mockClient),
    setProject: jest.fn(() => mockClient),
    setKey: jest.fn(() => mockClient),
  };

  return {
    Client: jest.fn(() => mockClient),
    Databases: jest.fn(() => mockDb),
    ID: { unique: jest.fn(() => "unique-id") },
    Query: {
      notEqual: jest.fn(),
      equal: jest.fn(),
      orderAsc: jest.fn(),
      limit: jest.fn(),
    },
  };
});

jest.mock("./utils", () => {
  const originalModule = jest.requireActual("./utils");
  return {
    throwIfMissing: originalModule.throwIfMissing,
  };
});

describe("Random Pairing Function", () => {
  let req, res, log, error;
  let mockDb;

  beforeEach(() => {
    process.env.APPWRITE_API_KEY = "test";
    process.env.DATABASE_ID = "db";
    process.env.REQUESTS_COLLECTION_ID = "requests";
    process.env.ACTIVE_PAIRS_COLLECTION_ID = "pairs";

    req = {
      headers: {
        "x-appwrite-event": "collections.requests.documents.create.123",
      },
    };
    res = { json: jest.fn() };
    log = jest.fn();
    error = jest.fn();

    mockDb = new Databases();

    mockDb.getDocument.mockResolvedValue({
      isRandom: true,
      languageIso: "en",
      isAnonymous: false,
      uid: "uid1",
      userName: "Alice",
    });
    mockDb.listDocuments.mockResolvedValue({
      total: 1,
      documents: [{ $id: "456", uid: "uid2", userName: "Bob" }],
    });
    mockDb.createDocument.mockResolvedValue({
      uid1: "uid1",
      uid2: "uid2",
      userDocId1: "123",
      userDocId2: "456",
    });
    mockDb.deleteDocument.mockResolvedValue({});
  });

  it("should return message if request is not random", async () => {
    mockDb.getDocument.mockResolvedValueOnce({ isRandom: false });

    await sendPairRequest({ req, res, log, error });

    expect(res.json).toHaveBeenCalledWith({
      message: "Request is not Random",
    });
  });

  it("should return message if queue is empty", async () => {
    mockDb.listDocuments.mockResolvedValueOnce({ total: 0, documents: [] });

    await sendPairRequest({ req, res, log, error });

    expect(res.json).toHaveBeenCalledWith({
      message: "Request in queue or was paired already.",
    });
  });

  it("should handle errors during pairing", async () => {
    mockDb.createDocument.mockRejectedValueOnce(new Error("Pairing failed"));

    await sendPairRequest({ req, res, log, error });

    expect(error).toHaveBeenCalledWith("That request is already paired: ");
    expect(error).toHaveBeenCalledWith("Error: Pairing failed");
  });

  it("should create pair and delete requests on successful match", async () => {
    await sendPairRequest({ req, res, log, error });

    expect(mockDb.createDocument).toHaveBeenCalledWith(
      "db",
      "pairs",
      "unique-id",
      expect.objectContaining({
        uid1: "uid1",
        uid2: "uid2",
        userDocId1: "123",
        userDocId2: "456",
      })
    );
    expect(mockDb.deleteDocument).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
      })
    );
  });
});
