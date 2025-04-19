const User = require('../models/User');
const admin = require('firebase-admin');

// Register or update user in MongoDB after Firebase auth
const registerUser = async (req, res) => {
    try {
        const { uid, email, provider } = req.user;
        const { username, role } = req.body;
        
        // Check if user already exists
        let user = await User.findOne({ firebaseUid: uid });
        
        if (user) {
            // Update existing user
            user.username = username || user.username;
            user.provider = provider || user.provider;
            
            // Only update role if provided
            if (role) {
                user.role = role;
            }
            
            await user.save();
            return res.status(200).json(user);
        }
        
        // Create new user
        user = new User({
            firebaseUid: uid,
            email: email,
            username: username || email.split('@')[0],
            role: role || 'participant',
            provider: provider
        });
        
        await user.save();
        
        res.status(201).json(user);
    } catch (error) {
        console.error('Register user error:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
};

// Verify user token and return user data
const verifyUser = async (req, res) => {
    try {
        const { uid, email, provider } = req.user;
        
        // Check if user exists in our database
        let user = await User.findOne({ firebaseUid: uid });
        
        // If user doesn't exist, create a new one
        if (!user) {
            user = new User({
                firebaseUid: uid,
                email: email,
                username: email.split('@')[0],
                provider: provider
            });
            
            await user.save();
        }
        
        res.status(200).json(user);
    } catch (error) {
        console.error('Verify user error:', error);
        res.status(500).json({ message: 'Error verifying user' });
    }
};

// Update user role
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const { uid } = req.user;
        
        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }
        
        if (!['host', 'participant'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        
        const user = await User.findOne({ firebaseUid: uid });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.role = role;
        await user.save();
        
        res.status(200).json(user);
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ message: 'Error updating user role' });
    }
};

module.exports = {
    registerUser,
    verifyUser,
    updateUserRole
}; 