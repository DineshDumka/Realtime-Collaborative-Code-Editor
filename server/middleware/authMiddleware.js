const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin (should be done in a separate initialization file)
// In this middleware file, we assume Firebase Admin is already initialized

const authMiddleware = async (req, res, next) => {
    try {
        // For testing purposes, allow skipping token verification
        if (process.env.SKIP_DB_CONNECTION === 'true') {
            console.log('Skipping auth token verification for testing');
            req.user = {
                uid: 'test-user-id',
                email: 'test@example.com',
                emailVerified: true,
                provider: 'password'
            };
            
            // Use a test user
            req.dbUser = {
                _id: 'test-db-id',
                firebaseUid: 'test-user-id',
                email: 'test@example.com',
                username: 'TestUser',
                role: 'host'
            };
            
            return next();
        }
        
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Add user data to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            provider: decodedToken.firebase.sign_in_provider
        };
        
        // Check if user exists in our database
        const userExists = await User.findOne({ firebaseUid: decodedToken.uid });
        
        if (userExists) {
            // Add MongoDB user to request
            req.dbUser = userExists;
        }
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Invalid token. Authentication failed.' });
    }
};

// Middleware to check if user is a host
const isHost = async (req, res, next) => {
    try {
        // For testing purposes
        if (process.env.SKIP_DB_CONNECTION === 'true') {
            return next();
        }
        
        if (!req.dbUser) {
            return res.status(404).json({ message: 'User not found in database' });
        }
        
        if (req.dbUser.role !== 'host') {
            return res.status(403).json({ message: 'Access denied. Only hosts can perform this action.' });
        }
        
        next();
    } catch (error) {
        console.error('Host check error:', error);
        res.status(500).json({ message: 'Server error checking user role' });
    }
};

module.exports = { authMiddleware, isHost }; 