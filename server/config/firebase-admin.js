const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const initializeFirebaseAdmin = () => {
    // Check if already initialized
    if (admin.apps.length === 0) {
        try {
            if (process.env.SKIP_DB_CONNECTION === 'true') {
                // For testing, use a minimal app config without credentials
                admin.initializeApp({
                    projectId: 'test-project'
                });
                console.log('Firebase Admin SDK initialized with minimal config for testing');
                return; // Exit early
            }
            
            // For production, use environment variables
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                try {
                    // Initialize with environment variable (JSON string)
                    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                    
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount)
                    });
                    console.log('Firebase Admin SDK initialized with environment variable');
                } catch (error) {
                    console.error('Error parsing service account JSON:', error);
                    throw error;
                }
            } else {
                // For development, initialize with minimal config
                admin.initializeApp({
                    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'test-project'
                });
                console.log('Firebase Admin SDK initialized with minimal development config');
            }
        } catch (error) {
            console.error('Firebase Admin SDK initialization error:', error);
            // Fallback to minimal config
            admin.initializeApp({
                projectId: 'test-project'
            });
            console.log('Firebase Admin SDK initialized with fallback minimal config');
        }
    }
};

module.exports = initializeFirebaseAdmin; 