import { Client, Databases } from 'node-appwrite';
import { throwIfMissing } from './utils.js';

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        'APPWRITE_API_KEY',
        'VERIFICATION_DATABASE_ID',
        'OTP_COLLECTION_ID',
        'VERIFY_COLLECTION_ID',
    ]);

    const client = new Client()
        .setEndpoint(
            process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
        )
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const db = new Databases(client);
    log(req.body);
    const {
        otpID,
        userOTP: userOtp,
        verify_ID: verificationId,
    } = JSON.parse(req.body);

    let otpDocument;

    // Step 1: Retrieve OTP document
    try {
        otpDocument = await db.getDocument(
            process.env.VERIFICATION_DATABASE_ID,
            process.env.OTP_COLLECTION_ID,
            otpID
        );
    } catch (e) {
        log("Error retrieving OTP document");
        error(String(e));
        return res.json({ 
            success: false,
            message: 'OTP not found or invalid' 
        }, 404);
    }

    // Step 2: Check if OTP has expired
    const now = new Date();
    
    // Validate expiresAt field exists and is valid
    if (!otpDocument.expiresAt) {
        log("OTP missing expiresAt field - treating as expired");
        // Delete OTP with missing expiry
        try {
            await db.deleteDocument(
                process.env.VERIFICATION_DATABASE_ID,
                process.env.OTP_COLLECTION_ID,
                otpID
            );
        } catch (deleteError) {
            log("Failed to delete expired OTP");
            error(String(deleteError));
        }
        
        return res.json({ 
            success: false,
            message: 'OTP has expired' 
        }, 401);
    }
    
    const expiryTime = new Date(otpDocument.expiresAt);
    
    // Check if expiresAt is a valid date
    if (isNaN(expiryTime.getTime())) {
        log("OTP has invalid expiresAt field - treating as expired");
        // Delete OTP with invalid expiry
        try {
            await db.deleteDocument(
                process.env.VERIFICATION_DATABASE_ID,
                process.env.OTP_COLLECTION_ID,
                otpID
            );
        } catch (deleteError) {
            log("Failed to delete expired OTP");
            error(String(deleteError));
        }
        
        return res.json({ 
            success: false,
            message: 'OTP has expired' 
        }, 401);
    }
    
    if (now > expiryTime) {
        log("OTP has expired");
        // Delete expired OTP
        try {
            await db.deleteDocument(
                process.env.VERIFICATION_DATABASE_ID,
                process.env.OTP_COLLECTION_ID,
                otpID
            );
        } catch (deleteError) {
            log("Failed to delete expired OTP");
            error(String(deleteError));
        }
        
        return res.json({ 
            success: false,
            message: 'OTP has expired' 
        }, 401);
    }

    // Step 3: Validate OTP
    const isValid = otpDocument.otp === userOtp;
    
    // Step 4: Delete OTP document (one-time use)
    try {
        await db.deleteDocument(
            process.env.VERIFICATION_DATABASE_ID,
            process.env.OTP_COLLECTION_ID,
            otpID
        );
        log("OTP document deleted after verification attempt");
    } catch (deleteError) {
        log("Failed to delete OTP document");
        error(String(deleteError));
        return res.json({ 
            success: false,
            message: 'Internal server error' 
        }, 500);
    }

    // Step 5: Create verification document
    try {
        await db.createDocument(
            process.env.VERIFICATION_DATABASE_ID,
            process.env.VERIFY_COLLECTION_ID,
            verificationId,
            {
                status: isValid,
            }
        );
    } catch (e) {
        log("Error creating verification document");
        error(String(e));
        return res.json({ 
            success: false,
            message: 'Failed to create verification record' 
        }, 500);
    }

    // Step 6: Return appropriate response
    if (isValid) {
        return res.json({ 
            success: true,
            message: 'OTP verified successfully' 
        }, 200);
    } else {
        return res.json({ 
            success: false,
            message: 'Invalid OTP' 
        }, 401);
    }
};
