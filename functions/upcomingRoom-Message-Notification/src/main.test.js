
jest.mock("./resonate-service-account.json", () => ({}), { virtual: true });

const mockSendEachForMulticast = jest.fn();

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(() => ({})),
  credential: { cert: jest.fn() }
}));

jest.mock("firebase-admin/messaging", () => ({
  getMessaging: () => ({
    sendEachForMulticast: mockSendEachForMulticast
  })
}));

const mockListDocuments = jest.fn();
const mockGetDocument = jest.fn();

jest.mock("node-appwrite", () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      setEndpoint: () => ({ setProject: () => ({ setKey: () => {} }) })
    })),
    Databases: jest.fn().mockImplementation(() => ({
      listDocuments: mockListDocuments,
      getDocument: mockGetDocument
    })),
    Query: { equal: jest.fn() }
  };
});

const sendFn = require("./main.js");

describe("Send Notification Function", () => {
  let req, res, log, error;

  beforeEach(() => {
    process.env.UpcomingRoomsDataBaseID = "db";
    process.env.SubscriberCollectionID = "subs";
    process.env.UpcomingRoomsCollectionID = "upRooms";

    mockSendEachForMulticast.mockReset();
    mockListDocuments.mockReset();
    mockGetDocument.mockReset();

    req = {
      body: JSON.stringify({
        roomId: "123",
        payload: { title: "Hello", body: "World" }
      })
    };

    res = { json: jest.fn() };
    log = jest.fn();
    error = jest.fn();
  });

  it("should send firebase notification to subscribers + creator tokens", async () => {
    mockListDocuments.mockResolvedValue({
      documents: [
        { registrationTokens: ["token1", "token2"] },
        { registrationTokens: ["token3"] }
      ],
    });

    mockGetDocument.mockResolvedValue({
      creator_fcm_tokens: ["creatorToken1", "creatorToken2"]
    });

    mockSendEachForMulticast.mockResolvedValue({ failureCount: 0 });

    await sendFn({ req, res, log, error });

    expect(mockSendEachForMulticast).toHaveBeenCalledWith({
      notification: { title: "Hello", body: "World" },
      tokens: ["token1", "token2", "token3", "creatorToken1", "creatorToken2"],
      priority: "high",
      android: { priority: "high" }
    });

    expect(res.json).toHaveBeenCalledWith({
      message: "Notification sent"
    });
  });

  it("should still return success even if firebase returns failures", async () => {
    mockListDocuments.mockResolvedValue({
      documents: [{ registrationTokens: ["tokenA"] }]
    });

    mockGetDocument.mockResolvedValue({
      creator_fcm_tokens: []
    });

    mockSendEachForMulticast.mockResolvedValue({ failureCount: 1 });

    await sendFn({ req, res, log, error });

    expect(res.json).toHaveBeenCalledWith({ message: "Notification sent" });
    expect(log).toHaveBeenCalledWith("Failed");
  });

  it("should handle missing tokens gracefully", async () => {
    mockListDocuments.mockResolvedValue({ documents: [] });
    mockGetDocument.mockResolvedValue({ creator_fcm_tokens: [] });
    mockSendEachForMulticast.mockResolvedValue({ failureCount: 0 });

    await sendFn({ req, res, log, error });

    expect(mockSendEachForMulticast).toHaveBeenCalledWith({
      notification: { title: "Hello", body: "World" },
      tokens: [],
      priority: "high",
      android: { priority: "high" }
    });
  });
});
