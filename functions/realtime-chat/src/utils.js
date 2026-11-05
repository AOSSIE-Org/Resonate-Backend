export function throwIfMissing(obj, keys) {
    const missing = [];
    for (let key of keys) {
        if (!(key in obj) || obj[key] === undefined || obj[key] === null || obj[key] === '') {
            missing.push(key);
        }
    }
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
}

export function validateMessage(content) {
    if (!content || typeof content !== 'string') {
        throw new Error('Message content is required and must be a string');
    }

    const trimmedContent = content.trim();
    
    if (trimmedContent.length === 0) {
        throw new Error('Message content cannot be empty');
    }

    if (trimmedContent.length > 1000) {
        throw new Error('Message content too long (max 1000 characters)');
    }

    // Check for potential XSS or injection attempts
    const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /data:\s*text\/html/gi
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(trimmedContent)) {
            throw new Error('Message contains potentially dangerous content');
        }
    }

    return true;
}

export function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
        .replace(/&/g, '&amp;') // Escape &
        .replace(/"/g, '&quot;') // Escape "
        .replace(/'/g, '&#x27;') // Escape '
        .replace(/\//g, '&#x2F;'); // Escape /
}

export function validateUserId(userId) {
    if (!userId || typeof userId !== 'string') {
        throw new Error('User ID is required and must be a string');
    }
    
    if (userId.length < 1 || userId.length > 36) {
        throw new Error('User ID must be between 1 and 36 characters');
    }
    
    // Basic UUID validation pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const simpleIdPattern = /^[a-zA-Z0-9_-]+$/;
    
    if (!uuidPattern.test(userId) && !simpleIdPattern.test(userId)) {
        throw new Error('Invalid user ID format');
    }
    
    return true;
}

export function validateRoomId(roomId) {
    if (!roomId || typeof roomId !== 'string') {
        throw new Error('Room ID is required and must be a string');
    }
    
    if (roomId.length < 1 || roomId.length > 36) {
        throw new Error('Room ID must be between 1 and 36 characters');
    }
    
    // Basic ID validation
    const idPattern = /^[a-zA-Z0-9_-]+$/;
    
    if (!idPattern.test(roomId)) {
        throw new Error('Invalid room ID format');
    }
    
    return true;
}

export function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return {
        iso: date.toISOString(),
        unix: timestamp,
        formatted: date.toLocaleString()
    };
}

export function createRateLimiter(maxRequests = 10, windowMs = 60000) { // 10 requests per minute default
    const requests = new Map();
    
    return function rateLimit(key) {
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Clean up old entries
        for (const [reqKey, timestamps] of requests.entries()) {
            const validTimestamps = timestamps.filter(ts => ts > windowStart);
            if (validTimestamps.length === 0) {
                requests.delete(reqKey);
            } else {
                requests.set(reqKey, validTimestamps);
            }
        }
        
        // Check current requests for this key
        const userRequests = requests.get(key) || [];
        const validRequests = userRequests.filter(ts => ts > windowStart);
        
        if (validRequests.length >= maxRequests) {
            return false; // Rate limit exceeded
        }
        
        // Add current request
        validRequests.push(now);
        requests.set(key, validRequests);
        
        return true; // Request allowed
    };
}

export function generateMessageId() {
    return 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

export function isProfanity(text) {
    // Basic profanity filter - can be enhanced with a proper library
    const profanityList = [
        'spam', 'abuse', 'hate', 'violence', 'harassment'
    ];
    
    const lowerText = text.toLowerCase();
    
    return profanityList.some(word => lowerText.includes(word));
}

export function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
}

export function validateSocketEvent(event, data) {
    const validEvents = [
        'join-room',
        'send-message',
        'delete-message',
        'typing-start',
        'typing-stop',
        'reaction-add',
        'reaction-remove'
    ];
    
    if (!validEvents.includes(event)) {
        throw new Error(`Invalid socket event: ${event}`);
    }
    
    // Validate event-specific data
    switch (event) {
        case 'join-room':
            throwIfMissing(data, ['roomId', 'userId', 'token']);
            validateRoomId(data.roomId);
            validateUserId(data.userId);
            break;
            
        case 'send-message':
            throwIfMissing(data, ['content', 'roomId']);
            validateRoomId(data.roomId);
            validateMessage(data.content);
            break;
            
        case 'delete-message':
            throwIfMissing(data, ['messageId']);
            break;
            
        default:
            break;
    }
    
    return true;
}