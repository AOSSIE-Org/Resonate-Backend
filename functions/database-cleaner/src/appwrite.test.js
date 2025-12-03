jest.mock("node-appwrite", () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      setEndpoint: jest.fn().mockReturnThis(),
      setProject: jest.fn().mockReturnThis(),
      setKey: jest.fn().mockReturnThis(),
    })),

    Databases: jest.fn().mockImplementation(() => ({
      createDocument: jest.fn(),
      getDocument: jest.fn(),
      listDocuments: jest.fn(),
      deleteDocument: jest.fn(),
    })),

    Query: {
      lessThan: jest.fn((field, value) => ({ field, value })),
      limit: jest.fn((value) => ({ value })),
      notEqual: jest.fn((field, value) => ({ field, value })),
    },
  };
});

const AppwriteService = require("./appwrite");

describe("Testing AppwriteService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AppwriteService();
  });

  test("doesRoomExist test case", async () => {
    const { Databases } = require("node-appwrite");

    const mockGetDocument = Databases.mock.results[0].value.getDocument;

    mockGetDocument.mockResolvedValueOnce({ $id: "room-123" });

    let res = await service.doesRoomExist("room-123");
    expect(res).toBe(true);

    const notFoundErr = new Error("Not Found");
    notFoundErr.code = 404;
    mockGetDocument.mockRejectedValueOnce(notFoundErr);

    res = await service.doesRoomExist("invalid-room");
    expect(res).toBe(false);

    const serverErr = new Error("Server Down");
    serverErr.code = 500;
    mockGetDocument.mockRejectedValueOnce(serverErr);

    await expect(service.doesRoomExist("bad-room")).rejects.toThrow(
      "Server Down"
    );
  });

  test("cleanParticipantsCollection test case ", async () => {
    const { Databases } = require("node-appwrite");

    const mockListDocuments = Databases.mock.results[0].value.listDocuments;
    const mockDeleteDocument = Databases.mock.results[0].value.deleteDocument;
    const mockGetDocument = Databases.mock.results[0].value.getDocument;

    mockListDocuments.mockResolvedValueOnce({
      documents: [
        { $id: "p1", roomId: "room-ok" },
        { $id: "p2", roomId: "room-missing" },
      ],
    });

    mockGetDocument.mockResolvedValueOnce({ $id: "room-ok" });

    const err = new Error("not found");
    err.code = 404;
    mockGetDocument.mockRejectedValueOnce(err);

    await service.cleanParticipantsCollection();

    await new Promise(process.nextTick);

    expect(mockDeleteDocument).toHaveBeenCalledTimes(1);
    expect(mockDeleteDocument).toHaveBeenCalledWith(
      process.env.MASTER_DATABASE_ID,
      process.env.PARTICIPANTS_COLLECTION_ID,
      "p2"
    );
  });

  test("clearOldOTPs deletes all OTPs older than today", async () => {
    const { Databases } = require("node-appwrite");

    const mockListDocuments = Databases.mock.results[0].value.listDocuments;
    const mockDeleteDocument = Databases.mock.results[0].value.deleteDocument;

    mockListDocuments.mockResolvedValueOnce({
      documents: [{ $id: "otp1" }, { $id: "otp2" }],
      total: 2,
    });

    mockListDocuments.mockResolvedValueOnce({
      documents: [],
      total: 0,
    });

    await service.clearOldOTPs();

    expect(mockDeleteDocument).toHaveBeenCalledTimes(2);

    expect(mockDeleteDocument).toHaveBeenCalledWith(
      process.env.VERIFICATION_DATABASE_ID,
      process.env.OTP_COLLECTION_ID,
      "otp1"
    );

    expect(mockDeleteDocument).toHaveBeenCalledWith(
      process.env.VERIFICATION_DATABASE_ID,
      process.env.OTP_COLLECTION_ID,
      "otp2"
    );

    expect(mockListDocuments).toHaveBeenCalledTimes(2);
  });
});
