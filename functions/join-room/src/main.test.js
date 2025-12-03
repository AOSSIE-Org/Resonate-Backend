const fn = require("./main.js");
const { throwIfMissing } = require("./utils.js");

const mockGenerateToken = jest.fn();
jest.mock("./livekit.js", () => ({
  generateToken: jest.fn((...args) => mockGenerateToken(...args)),
}));

jest.mock("./utils.js", () => ({
  throwIfMissing: jest.fn((obj, arr) => {
    arr.forEach((key) => {
      if (!obj[key]) throw new Error(`Missing required field: ${key}`);
    });
  }),
}));

describe("Livekit Join Room Function", () => {
  let mockReq, mockRes, mockLog, mockError;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.LIVEKIT_API_KEY = "lk_key";
    process.env.LIVEKIT_API_SECRET = "lk_secret";
    process.env.LIVEKIT_SOCKET_URL = "wss://livekit.server";
    
    mockReq = {
      body: JSON.stringify({
        roomName: "room1",
        uid: "user123",
      }),
    };

    mockRes = {
      json: jest.fn(),
    };

    mockLog = jest.fn();
    mockError = jest.fn();
  });

  test("success — token generated & response sent", async () => {
    mockGenerateToken.mockReturnValue("TOKEN_ABC");

    await fn({ req: mockReq, res: mockRes, log: mockLog, error: mockError });

    expect(mockGenerateToken).toHaveBeenCalledWith(
      process.env,
      "room1",
      "user123",
      false
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      msg: "Success",
      livekit_socket_url: "wss://livekit.server",
      access_token: "TOKEN_ABC",
    });
  });

  test("failure — missing required body fields", async () => {
    mockReq.body = JSON.stringify({ uid: "user123" }); // roomName missing

    await fn({ req: mockReq, res: mockRes, log: mockLog, error: mockError });

    expect(mockRes.json).toHaveBeenCalledWith(
      { msg: "Missing required field: roomName" },
      400
    );
  });

  test("failure — generateToken throws error", async () => {
    mockGenerateToken.mockImplementation(() => {
      throw new Error("token gen failed");
    });

    await fn({ req: mockReq, res: mockRes, log: mockLog, error: mockError });

    expect(mockError).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith(
      { msg: "Error joining room" },
      500
    );
  });
});
