const sendOtp = require('./main');
const MailService = require('./mail');
const AppwriteService = require('./appwrite');
const { throwIfMissing } = require('./utils');

jest.mock('./mail');
jest.mock('./appwrite');
jest.mock('./utils');

describe('Send OTP Function', () => {
  let req, res, log, mockSendMail, mockCreateDoc;

  beforeEach(() => {
    process.env.APPWRITE_API_KEY = 'test';
    process.env.VERIFICATION_DATABASE_ID = 'test';
    process.env.OTP_COLLECTION_ID = 'test';
    process.env.SENDER_MAIL = 'test@gmail.com';
    process.env.SENDER_PASSWORD = 'password';

    req = { body: JSON.stringify({ otpID: '123', email: 'test@example.com' }) };
    res = { json: jest.fn() };
    log = jest.fn();

    mockSendMail = jest.fn().mockResolvedValue(true);
    mockCreateDoc = jest.fn().mockResolvedValue(true);

    MailService.mockImplementation(() => ({ sendMail: mockSendMail }));
    AppwriteService.mockImplementation(() => ({ createOtpDocument: mockCreateDoc }));
    throwIfMissing.mockImplementation(() => {}); // skip env validation
  });

  it('should send mail and create OTP document', async () => {
    await sendOtp({ req, res, log });

    expect(mockSendMail).toHaveBeenCalledWith('test@example.com', expect.any(String));
    expect(mockCreateDoc).toHaveBeenCalledWith('123', expect.any(String), expect.any(String));
    expect(res.json).toHaveBeenCalledWith({ message: 'mail sent' });
  });
});
