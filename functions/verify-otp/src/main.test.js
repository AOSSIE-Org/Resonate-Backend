const fn = require("./main.js");
const { throwIfMissing } = require("./utils.js");

jest.mock("./utils.js", () => ({
  throwIfMissing: jest.fn(),
}));

let mockGetDocument = jest.fn();
let mockCreateDocument = jest.fn();

jest.mock("node-appwrite", () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      setEndpoint: jest.fn().mockReturnThis(),
      setProject: jest.fn().mockReturnThis(),
      setKey: jest.fn().mockReturnThis(),
    })),
    Databases: jest.fn().mockImplementation(() => ({
      getDocument: mockGetDocument,
      createDocument: mockCreateDocument,
    })),
  };
});

describe("OTP Verification Function", () => {
  let mockReq, mockRes, mockLog, mockError;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.APPWRITE_API_KEY = "key";
    process.env.VERIFICATION_DATABASE_ID = "db1";
    process.env.OTP_COLLECTION_ID = "otpColl";
    process.env.VERIFY_COLLECTION_ID = "verifyColl";
    process.env.APPWRITE_FUNCTION_PROJECT_ID = "proj1";
    process.env.APPWRITE_ENDPOINT = "url";

    mockReq = {
      body: JSON.stringify({
        otpID: "123",
        userOTP: "5555",
        verify_ID: "verify-1",
      }),
    };

    mockRes = {
      json: jest.fn(),
    };

    mockLog = jest.fn();
    mockError = jest.fn();
  });

  test("success — OTP verified & verification document created", async () => {
    mockGetDocument.mockResolvedValue({ otp: "5555" });
    mockCreateDocument.mockResolvedValue({});

    await fn({ req: mockReq, res: mockRes, log: mockLog, error: mockError });

    expect(mockGetDocument).toHaveBeenCalledWith("db1", "otpColl", "123");
    expect(mockCreateDocument).toHaveBeenCalledWith(
      "db1",
      "verifyColl",
      "verify-1",
      { status: "true" }
    );

    expect(mockRes.json).toHaveBeenCalledWith({ message: "null" }, 200);
  });

  test("fail — error when fetching OTP document", async () => {
    mockGetDocument.mockRejectedValue(new Error("DB fetch error"));

    await fn({ req: mockReq, res: mockRes, log: mockLog, error: mockError });

    expect(mockError).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith(
      { message: "Error: DB fetch error" },
      500
    );
  });

  test("fail — error when creating verification document", async () => {
    mockGetDocument.mockResolvedValue({ otp: "5555" });
    mockCreateDocument.mockRejectedValue(new Error("DB create error"));

    await fn({ req: mockReq, res: mockRes, log: mockLog, error: mockError });

    expect(mockError).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith(
      { message: "Error: DB create error" },
      500
    );
  });
});
