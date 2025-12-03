const createDocumentMock = jest.fn().mockResolvedValue({ $id: "room-123" });

jest.mock("node-appwrite", () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      setEndpoint: jest.fn().mockReturnThis(),
      setProject: jest.fn().mockReturnThis(),
      setKey: jest.fn().mockReturnThis(),
    })),
    Databases: jest.fn().mockImplementation(() => ({
      createDocument: createDocumentMock,
    })),
    ID: {
      unique: jest.fn(() => "unique-id-123"),
    },
  };
});

const AppwriteService = require("./appwrite");

describe("Testing AppwriteService", () => {
  let service;

  beforeEach(() => {
    service = new AppwriteService();
  });

  test("should call createDocument with correct params", async () => {
    const roomId = await service.createRoom({ name: "Test Room" });

    expect(createDocumentMock).toHaveBeenCalledWith(
      process.env.MASTER_DATABASE_ID,
      process.env.ROOMS_COLLECTION_ID,
      "unique-id-123",
      { name: "Test Room" }
    );

    expect(roomId).toBe("room-123");
  });
});
