const fn = require("./main.js");
const { throwIfMissing } = require("./utils.js");

jest.mock("./utils.js", () => ({
  throwIfMissing: jest.fn(),
}));

let mockUpdateEmailVerification = jest.fn();

jest.mock("node-appwrite", () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      setEndpoint: jest.fn().mockReturnThis(),
      setProject: jest.fn().mockReturnThis(),
      setKey: jest.fn().mockReturnThis(),
    })),
    Users: jest.fn().mockImplementation(() => ({
      updateEmailVerification: mockUpdateEmailVerification,
    })),
  };
});

describe("Email Verification Function", () => {
  let mockReq, mockRes, mockLog, mockError;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.APPWRITE_API_KEY = "key";
    process.env.APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
    process.env.APPWRITE_FUNCTION_PROJECT_ID = "proj1";

    mockReq = {
      body: JSON.stringify({
        userID: "user123",
      }),
    };

    mockRes = {
      json: jest.fn(),
    };

    mockLog = jest.fn();
    mockError = jest.fn();
  });

  test("success — email verification enabled", async () => {
    mockUpdateEmailVerification.mockResolvedValue({});

    await fn({ req: mockReq, res: mockRes, log: mockLog, error: mockError });

    expect(mockUpdateEmailVerification).toHaveBeenCalledWith("user123", true);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "null" });
  });

  test("failure — updateEmailVerification throws an error", async () => {
    mockUpdateEmailVerification.mockRejectedValue(new Error("update error"));

    await fn({ req: mockReq, res: mockRes, log: mockLog, error: mockError });

    expect(mockError).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith(
      { message: "Error: update error" },
      500
    );
  });
});
