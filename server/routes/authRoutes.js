const express = require('express');
const router = express.Router();
const { registerUser, verifyUser, updateUserRole } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes use the authMiddleware
router.use(authMiddleware);

// Register a new user or update existing user
router.post('/register', registerUser);

// Verify user token and get/create user
router.post('/verify', verifyUser);

// Update user role
router.put('/role', updateUserRole);

module.exports = router; 