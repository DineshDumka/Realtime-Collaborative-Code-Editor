const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['host', 'participant'],
        default: 'participant'
    },
    photoURL: {
        type: String,
        default: ''
    },
    provider: {
        type: String,
        enum: ['password', 'google.com', 'github.com', 'anonymous'],
        default: 'password'
    },
    createdRooms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    }],
    joinedRooms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 