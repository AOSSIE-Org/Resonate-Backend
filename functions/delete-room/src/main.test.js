const handler = require("../src/main.js"); // adjust path if needed

jest.mock("node-appwrite", () => ({
  Client: jest.fn().mockImplementation(() => ({
    setEndpoint: jest.fn().mockReturnThis(),
    setProject: jest.fn().mockReturnThis(),
    setKey: jest.fn().mockReturnThis(),
  })),
  Databases: jest.fn().mockImplementation(() => ({
    getDocument: jest.fn(),
    deleteDocument: jest.fn(),
    listDocuments: jest.fn(),
  })),
  Query: {
    equal: jest.fn((field, value) => ({ field, value })),
  },
}));

jest.mock("livekit-server-sdk", () => ({
  RoomServiceClient: jest.fn().mockImplementation(() => ({
    deleteRoom: jest.fn(),
  })),
}));

jest.mock("../src/utils.js", () => ({
  throwIfMissing: jest.fn((obj, keys) => {
    keys.forEach((key) => {
      if (!obj[key]) throw new Error(`Missing ${key}`);
    });
    const missing = [];
    for (let key of keys) {
      if (!(key in obj) || !obj[key]) {
        missing.push(key);
      }
    }
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }
  }),
}));

const { Databases } = require("node-appwrite");

describe("Delete Room Function", () => {
  let req, res, log, error, mockDb;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env = {
      APPWRITE_API_KEY: "key",
      MASTER_DATABASE_ID: "master",
      ROOMS_COLLECTION_ID: "roomsCol",
      PARTICIPANTS_COLLECTION_ID: "participantsCol",
      APPWRITE_FUNCTION_PROJECT_ID: "pid",
      LIVEKIT_HOST: "lkhost",
      LIVEKIT_API_KEY: "lkkey",
      LIVEKIT_API_SECRET: "lksecret",
    };

    mockDb = new Databases();

    req = { headers: {}, body: "" };
    res = { json: jest.fn() };
    log = jest.fn();
    error = jest.fn();
  });

  it("should return 400 if appwriteRoomDocId is missing", async () => {
    req.body = JSON.stringify({});

    await handler({ req, res, log, error });

    expect(res.json).toHaveBeenCalledWith(
      +{ msg: "Missing required fields: appwriteRoomDocId" },
      400
    );
  });

  it("should return 500 if something fails", async () => {
    req.body = JSON.stringify({ appwriteRoomDocId: "room99" });
    req.headers["x-appwrite-user-id"] = "admin123";

    mockDb.getDocument.mockRejectedValue(new Error("DB ERROR"));

    await handler({ req, res, log, error });

    expect(res.json).toHaveBeenCalledWith({ msg: "Room deletion failed" }, 500);
  });
});
