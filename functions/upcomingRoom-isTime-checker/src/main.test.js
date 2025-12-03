

const mockListDocuments = jest.fn();
const mockUpdateDocument = jest.fn();

jest.mock("node-appwrite", () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      setEndpoint: () => ({ setProject: () => ({ setKey: () => {} }) })
    })),
    Databases: jest.fn().mockImplementation(() => ({
      listDocuments: mockListDocuments,
      updateDocument: mockUpdateDocument
    })),
    Query: { equal: jest.fn() }
  };
});

const sendFn = require("./main.js");

describe("Upcoming rooms CRON function", () => {
  let req, res, log;

  beforeEach(() => {
    process.env.UpcomingRoomsDataBaseID = "db";
    process.env.UpcomingRoomsCollectionID = "rooms";

    req = { body: "" };
    res = { json: jest.fn() };
    log = jest.fn();

    mockListDocuments.mockReset();
    mockUpdateDocument.mockReset();
  });

  it("should update isTime=true when scheduled time is within ±5 min and isTime is false", async () => {
    const now = new Date();
    const fiveMinLater = new Date(now.getTime() + 3 * 60 * 1000);

    mockListDocuments.mockResolvedValue({
      documents: [
        {
          $id: "room123",
          scheduledDateTime: fiveMinLater.toISOString(),
          isTime: false
        }
      ]
    });

    await sendFn({ req, res, log });

    expect(mockUpdateDocument).toHaveBeenCalledWith(
      "db",
      "rooms",
      "room123",
      { isTime: true }
    );

    expect(res.json).toHaveBeenCalledWith({ message: "set verified" });
  });

  it("should NOT update if isTime is already true", async () => {
    const now = new Date();
    const fiveMinLater = new Date(now.getTime() + 3 * 60 * 1000);

    mockListDocuments.mockResolvedValue({
      documents: [
        {
          $id: "roomX",
          scheduledDateTime: fiveMinLater.toISOString(),
          isTime: true
        }
      ]
    });

    await sendFn({ req, res, log });

    expect(mockUpdateDocument).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: "set verified" });
  });

  it("should NOT update if scheduled time is outside ±5 min range", async () => {
    const now = new Date();
    const twentyMinLater = new Date(now.getTime() + 20 * 60 * 1000);

    mockListDocuments.mockResolvedValue({
      documents: [
        {
          $id: "roomY",
          scheduledDateTime: twentyMinLater.toISOString(),
          isTime: false
        }
      ]
    });

    await sendFn({ req, res, log });

    expect(mockUpdateDocument).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: "set verified" });
  });

  it("should loop through multiple rooms and update only valid ones", async () => {
    const now = new Date();
    const insideRange = new Date(now.getTime() + 4 * 60 * 1000);
    const outsideRange = new Date(now.getTime() + 20 * 60 * 1000);

    mockListDocuments.mockResolvedValue({
      documents: [
        { $id: "A", scheduledDateTime: insideRange.toISOString(), isTime: false },  
        { $id: "B", scheduledDateTime: insideRange.toISOString(), isTime: true }, 
        { $id: "C", scheduledDateTime: outsideRange.toISOString(), isTime: false }, 
      ]
    });

    await sendFn({ req, res, log });

    expect(mockUpdateDocument).toHaveBeenCalledTimes(1);
    expect(mockUpdateDocument).toHaveBeenCalledWith(
      "db",
      "rooms",
      "A",
      { isTime: true }
    );

    expect(res.json).toHaveBeenCalledWith({ message: "set verified" });
  });
});
