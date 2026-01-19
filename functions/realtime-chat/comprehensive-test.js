import { validateMessage, sanitizeInput, createRateLimiter, throwIfMissing, validateUserId, validateRoomId, isProfanity, escapeHtml } from './src/utils.js';
import AppwriteService from './src/appwrite.js';
import ChatService from './src/chat.js';

console.log('🧪 COMPREHENSIVE REAL-TIME CHAT BACKEND TEST SUITE');
console.log('=' .repeat(60));

let passedTests = 0;
let failedTests = 0;

function test(description, testFn) {
  try {
    testFn();
    console.log(`✅ ${description}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test 1: Message Validation
console.log('\n📋 1. MESSAGE VALIDATION TESTS');
console.log('-'.repeat(40));

test('Valid message passes validation', () => {
  assert(validateMessage('Hello world!') === true, 'Valid message should pass');
});

test('Empty message fails validation', () => {
  let errorThrown = false;
  try {
    validateMessage('');
  } catch (error) {
    errorThrown = true;
  }
  assert(errorThrown, 'Empty message should throw error');
});

test('XSS attempt is blocked', () => {
  let errorThrown = false;
  try {
    validateMessage('<script>alert("hack")</script>');
  } catch (error) {
    errorThrown = true;
  }
  assert(errorThrown, 'XSS attempt should be blocked');
});

test('Very long message is rejected', () => {
  const longMessage = 'a'.repeat(1001);
  let errorThrown = false;
  try {
    validateMessage(longMessage);
  } catch (error) {
    errorThrown = true;
  }
  assert(errorThrown, 'Message over 1000 chars should be rejected');
});

// Test 2: Input Sanitization
console.log('\n📋 2. INPUT SANITIZATION TESTS');
console.log('-'.repeat(40));

test('HTML tags are sanitized', () => {
  const input = '<script>alert("xss")</script>';
  const sanitized = sanitizeInput(input);
  assert(!sanitized.includes('<'), 'HTML tags should be removed');
  assert(!sanitized.includes('>'), 'HTML tags should be removed');
});

test('Special characters are escaped', () => {
  const input = '<>&"\'';
  const sanitized = sanitizeInput(input);
  assert(sanitized.includes('&amp;'), '& should be escaped');
  assert(sanitized.includes('&quot;'), '" should be escaped');
});

// Test 3: Rate Limiting
console.log('\n📋 3. RATE LIMITING TESTS');
console.log('-'.repeat(40));

test('Rate limiter allows requests within limit', () => {
  const rateLimiter = createRateLimiter(3, 1000);
  assert(rateLimiter('user1') === true, 'First request should pass');
  assert(rateLimiter('user1') === true, 'Second request should pass');
  assert(rateLimiter('user1') === true, 'Third request should pass');
});

test('Rate limiter blocks requests over limit', () => {
  const rateLimiter = createRateLimiter(3, 1000);
  rateLimiter('user2');
  rateLimiter('user2');
  rateLimiter('user2');
  assert(rateLimiter('user2') === false, 'Fourth request should be blocked');
});

test('Rate limiter resets after time window', (done) => {
  const rateLimiter = createRateLimiter(2, 100);
  rateLimiter('user3');
  rateLimiter('user3');
  assert(rateLimiter('user3') === false, 'Third request should be blocked');
  
  setTimeout(() => {
    assert(rateLimiter('user3') === true, 'Request after delay should pass');
    done();
  }, 150);
});

// Test 4: User ID Validation
console.log('\n📋 4. USER ID VALIDATION TESTS');
console.log('-'.repeat(40));

test('Valid UUID passes validation', () => {
  assert(validateUserId('550e8400-e29b-41d4-a716-446655440000') === true, 'Valid UUID should pass');
});

test('Valid simple ID passes validation', () => {
  assert(validateUserId('user123_abc') === true, 'Simple ID should pass');
});

test('Empty ID fails validation', () => {
  let errorThrown = false;
  try {
    validateUserId('');
  } catch (error) {
    errorThrown = true;
  }
  assert(errorThrown, 'Empty ID should fail');
});

// Test 5: Room ID Validation
console.log('\n📋 5. ROOM ID VALIDATION TESTS');
console.log('-'.repeat(40));

test('Valid room ID passes validation', () => {
  assert(validateRoomId('room_123_abc') === true, 'Valid room ID should pass');
});

test('Invalid room ID fails validation', () => {
  let errorThrown = false;
  try {
    validateRoomId('room@123');
  } catch (error) {
    errorThrown = true;
  }
  assert(errorThrown, 'Invalid room ID should fail');
});

// Test 6: Profanity Filter
console.log('\n📋 6. PROFANITY FILTER TESTS');
console.log('-'.repeat(40));

test('Profanity is detected', () => {
  assert(isProfanity('This message contains spam') === true, 'Profanity should be detected');
});

test('Clean message passes filter', () => {
  assert(isProfanity('Hello world') === false, 'Clean message should pass');
});

// Test 7: HTML Escaping
console.log('\n📋 7. HTML ESCAPING TESTS');
console.log('-'.repeat(40));

test('HTML characters are properly escaped', () => {
  const input = '<div>Hello & "World"</div>';
  const escaped = escapeHtml(input);
  assert(escaped.includes('&lt;'), '< should be escaped');
  assert(escaped.includes('&gt;'), '> should be escaped');
  assert(escaped.includes('&amp;'), '& should be escaped');
  assert(escaped.includes('&quot;'), '" should be escaped');
});

// Test 8: Utility Functions
console.log('\n📋 8. UTILITY FUNCTIONS TESTS');
console.log('-'.repeat(40));

test('throwIfMissing detects missing fields', () => {
  let errorThrown = false;
  try {
    throwIfMissing({ name: 'John' }, ['name', 'email']);
  } catch (error) {
    errorThrown = true;
  }
  assert(errorThrown, 'Missing email should throw error');
});

test('throwIfMissing passes when all fields present', () => {
  let errorThrown = false;
  try {
    throwIfMissing({ name: 'John', email: 'john@example.com' }, ['name', 'email']);
  } catch (error) {
    errorThrown = true;
  }
  assert(!errorThrown, 'All fields present should not throw error');
});

// Test 9: Mock Service Tests
console.log('\n📋 9. MOCK SERVICE TESTS');
console.log('-'.repeat(40));

// Mock environment variables
process.env.APPWRITE_API_KEY = 'test_key';
process.env.MASTER_DATABASE_ID = 'test_db';
process.env.ROOMS_TABLE_ID = 'test_rooms';
process.env.MESSAGES_TABLE_ID = 'test_messages';
process.env.APPWRITE_FUNCTION_PROJECT_ID = 'test_project';

test('AppwriteService can be instantiated', () => {
  const appwrite = new AppwriteService();
  assert(appwrite !== null, 'AppwriteService should instantiate');
});

test('ChatService can be instantiated', () => {
  const chat = new ChatService();
  assert(chat !== null, 'ChatService should instantiate');
});

// Test 10: Message Content Validation
console.log('\n📋 10. MESSAGE CONTENT VALIDATION TESTS');
console.log('-'.repeat(40));

test('Message service validates content length', () => {
  const chat = new ChatService();
  let errorThrown = false;
  try {
    chat.validateMessageContent('a'.repeat(1001));
  } catch (error) {
    errorThrown = true;
  }
  assert(errorThrown, 'Message over 1000 chars should fail validation');
});

test('Message service accepts valid content', () => {
  const chat = new ChatService();
  let errorThrown = false;
  try {
    chat.validateMessageContent('Hello world!');
  } catch (error) {
    errorThrown = true;
  }
  assert(!errorThrown, 'Valid message should pass validation');
});

// Test 11: Security Tests
console.log('\n📋 11. SECURITY TESTS');
console.log('-'.repeat(40));

test('XSS payload is blocked', () => {
  const maliciousPayloads = [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src="x" onerror="alert(1)">',
    '<svg onload="alert(1)">',
  ];
  
  maliciousPayloads.forEach(payload => {
    let errorThrown = false;
    try {
      validateMessage(payload);
    } catch (error) {
      errorThrown = true;
    }
    assert(errorThrown, `Payload should be blocked: ${payload}`);
  });
});

test('SQL injection attempts are sanitized', () => {
  const sqlPayload = "'; DROP TABLE users; --";
  const sanitized = sanitizeInput(sqlPayload);
  assert(!sanitized.includes("'"), 'Quotes should be escaped');
});

// Test 12: Performance Tests
console.log('\n📋 12. PERFORMANCE TESTS');
console.log('-'.repeat(40));

test('Rate limiter handles high load efficiently', () => {
  const rateLimiter = createRateLimiter(100, 1000);
  const start = Date.now();
  
  for (let i = 0; i < 1000; i++) {
    rateLimiter(`user${i % 10}`);
  }
  
  const duration = Date.now() - start;
  assert(duration < 100, 'Rate limiter should handle 1000 requests in under 100ms');
});

test('Message validation is fast', () => {
  const start = Date.now();
  
  for (let i = 0; i < 10000; i++) {
    validateMessage('Hello world!');
  }
  
  const duration = Date.now() - start;
  assert(duration < 100, 'Message validation should handle 10000 requests in under 100ms');
});

// Test 13: Edge Cases
console.log('\n📋 13. EDGE CASE TESTS');
console.log('-'.repeat(40));

test('Empty strings are handled correctly', () => {
  let errorThrown = false;
  try {
    validateMessage('   '); // Whitespace only
  } catch (error) {
    errorThrown = true;
  }
  assert(errorThrown, 'Whitespace-only message should fail');
});

test('Unicode characters are supported', () => {
  assert(validateMessage('Hello 世界 🌍') === true, 'Unicode should be supported');
});

test('Very long room IDs are rejected', () => {
  let errorThrown = false;
  try {
    validateRoomId('a'.repeat(37));
  } catch (error) {
    errorThrown = true;
  }
  assert(errorThrown, 'Room ID over 36 chars should be rejected');
});

// Final Summary
console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 ALL TESTS PASSED! The backend is working correctly.');
  console.log('✨ Ready for production deployment.');
} else {
  console.log('\n⚠️  Some tests failed. Please review and fix the issues.');
  process.exit(1);
}

// Create test summary for pull request
const testSummary = {
  totalTests: passedTests + failedTests,
  passed: passedTests,
  failed: failedTests,
  successRate: ((passedTests / (passedTests + failedTests)) * 100).toFixed(1),
  timestamp: new Date().toISOString(),
  status: failedTests === 0 ? 'PASSED' : 'FAILED'
};

console.log('\n📄 Test Summary JSON:');
console.log(JSON.stringify(testSummary, null, 2));