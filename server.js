const express = require('express');
const PORT = process.env.PORT || 5000;
const app = express();
const http = require('http');
const path = require('path');
const {Server} = require('socket.io');
const cors = require('cors');
const ACTIONS = require('./src/serverActions/Actions');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./server/routes/authRoutes');
const initializeFirebaseAdmin = require('./server/config/firebase-admin');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin only if not skipping DB
if (process.env.SKIP_DB_CONNECTION !== 'true') {
    initializeFirebaseAdmin();
} else {
    console.log('Skipping Firebase Admin SDK initialization for testing');
}

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Enable JSON parsing
app.use(express.json());

// Enable CORS
app.use(cors());

// API Routes
app.use('/api/auth', authRoutes);

// Serve static files in production
app.use(express.static('build'));

// Connect to MongoDB if not skipped
if (process.env.SKIP_DB_CONNECTION !== 'true') {
    try {
        mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/code-editor', {
            serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
        })
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => {
            console.error('MongoDB connection error:', err);
            console.log('Continuing without MongoDB connection');
        });
    } catch (error) {
        console.error('MongoDB connection attempt error:', error);
        console.log('Continuing without MongoDB connection');
    }
} else {
    console.log('Skipping MongoDB connection for testing');
}

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};
const roomHostMap = {}; // Store host information for each room
const pendingJoinRequests = {}; // Store pending join requests

function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId].username,
                isHost: userSocketMap[socketId].isHost,
                userId: userSocketMap[socketId].userId
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Handle join requests
    socket.on(ACTIONS.JOIN_REQUEST, ({ roomId, username, userId, isHost }) => {
        console.log(`Join request from ${username} for room ${roomId}`);
        
        // If user is host, automatically approve and set as room host
        if (isHost) {
            // Register the user
            userSocketMap[socket.id] = { username, isHost, userId };
            
            // Set as room host
            roomHostMap[roomId] = { socketId: socket.id, username, userId };
            
            // Join the room
            socket.join(roomId);
            
            // Notify existing users
            const clients = getAllConnectedClients(roomId);
            clients.forEach(({ socketId }) => {
                io.to(socketId).emit(ACTIONS.JOINED, {
                    clients,
                    username,
                    socketId: socket.id,
                    isHost
                });
            });
            
            // Notify the host that they've been approved
            socket.emit(ACTIONS.JOIN_APPROVED, { roomId });
            
            console.log(`Host ${username} joined room ${roomId}`);
        } else {
            // Check if a host exists for this room
            if (roomHostMap[roomId]) {
                // Log host info for debugging
                console.log(`Host found for room ${roomId}: `, roomHostMap[roomId]);
                
                // Store the pending request
                if (!pendingJoinRequests[roomId]) {
                    pendingJoinRequests[roomId] = [];
                }
                
                pendingJoinRequests[roomId].push({
                    socketId: socket.id,
                    username,
                    userId,
                    isHost: false
                });
                
                // Send join request directly to host (both ways)
                // Method 1: Using direct socketId
                io.to(roomHostMap[roomId].socketId).emit(ACTIONS.JOIN_REQUEST, {
                    username,
                    userId,
                    socketId: socket.id
                });
                
                // Method 2: Broadcast to the room (the host should be in this room)
                socket.to(roomId).emit(ACTIONS.JOIN_REQUEST, {
                    username,
                    userId,
                    socketId: socket.id
                });
                
                console.log(`Join request from ${username} sent to host for approval (socketId: ${roomHostMap[roomId].socketId})`);
                
                // Send acknowledgment to participant
                socket.emit('request-received', { 
                    message: 'Your join request has been sent to the host' 
                });
            } else {
                // No host exists, reject the request
                socket.emit(ACTIONS.JOIN_REJECTED, {
                    reason: 'No host is present in this room. Please try again later.'
                });
                
                console.log(`Join request from ${username} rejected - no host in room ${roomId}`);
            }
        }
    });

    // Handle join approval from host
    socket.on(ACTIONS.JOIN_APPROVED, ({ roomId, socketId }) => {
        const pendingRequests = pendingJoinRequests[roomId] || [];
        const requestIndex = pendingRequests.findIndex(req => req.socketId === socketId);
        
        if (requestIndex !== -1) {
            const request = pendingRequests[requestIndex];
            
            // Register the user
            userSocketMap[socketId] = {
                username: request.username,
                isHost: false,
                userId: request.userId
            };
            
            // Remove from pending requests
            pendingRequests.splice(requestIndex, 1);
            pendingJoinRequests[roomId] = pendingRequests;
            
            // Get the socket for the approved user
            const approvedSocket = io.sockets.sockets.get(socketId);
            if (approvedSocket) {
                console.log(`Host approved join request from ${request.username} (${socketId}) for room ${roomId}`);
                
                // Join the room
                approvedSocket.join(roomId);
                
                // Verify room membership after joining
                const roomMembers = io.sockets.adapter.rooms.get(roomId);
                console.log(`Room ${roomId} now has ${roomMembers?.size || 0} members`);
                console.log(`Is socket ${socketId} in room? ${roomMembers?.has(socketId) || false}`);
                
                // Notify existing users
                const clients = getAllConnectedClients(roomId);
                console.log(`Connected clients in room ${roomId}:`, clients.map(c => c.username));
                
                clients.forEach(({ socketId: clientSocketId }) => {
                    io.to(clientSocketId).emit(ACTIONS.JOINED, {
                        clients,
                        username: request.username,
                        socketId,
                        isHost: false
                    });
                });
                
                // Notify the user that they've been approved
                io.to(socketId).emit(ACTIONS.JOIN_APPROVED, { roomId });
                
                console.log(`Join approval complete for ${request.username} in room ${roomId}`);
            }
        }
    });

    // Handle join rejection from host
    socket.on(ACTIONS.JOIN_REJECTED, ({ roomId, socketId }) => {
        const pendingRequests = pendingJoinRequests[roomId] || [];
        const requestIndex = pendingRequests.findIndex(req => req.socketId === socketId);
        
        if (requestIndex !== -1) {
            const request = pendingRequests[requestIndex];
            
            // Remove from pending requests
            pendingRequests.splice(requestIndex, 1);
            pendingJoinRequests[roomId] = pendingRequests;
            
            // Notify the user that they've been rejected
            io.to(socketId).emit(ACTIONS.JOIN_REJECTED, {
                reason: 'Host declined your request to join the room.'
            });
            
            console.log(`Host rejected join request from ${request.username} for room ${roomId}`);
        }
    });

    // Traditional join - for backward compatibility, now used only after approval
    socket.on(ACTIONS.JOIN, ({ roomId, username, isHost, userId }) => {
        userSocketMap[socket.id] = { username, isHost, userId };
        
        if (isHost) {
            roomHostMap[roomId] = { socketId: socket.id, username, userId };
        }
        
        // Log before joining
        console.log(`${username} (${socket.id}) joining room ${roomId}`);
        
        // Force leave any existing rooms first (to prevent dual memberships)
        const currentRooms = [...socket.rooms].filter(room => room !== socket.id);
        if (currentRooms.length > 0) {
            console.log(`Socket ${socket.id} leaving existing rooms:`, currentRooms);
            currentRooms.forEach(room => socket.leave(room));
        }
        
        // Now join the new room
        socket.join(roomId);
        
        // Wait a moment to ensure room membership is updated
        setTimeout(() => {
            // Verify room membership
            const roomMembers = io.sockets.adapter.rooms.get(roomId);
            console.log(`Room ${roomId} now has ${roomMembers?.size || 0} members`);
            console.log(`Is socket ${socket.id} in room? ${roomMembers?.has(socket.id) || false}`);
            
            const clients = getAllConnectedClients(roomId);
            console.log(`Connected clients in room ${roomId}:`, clients.map(c => c.username));
            
            clients.forEach(({ socketId }) => {
                io.to(socketId).emit(ACTIONS.JOINED, {
                    clients,
                    username,
                    socketId: socket.id,
                    isHost
                });
            });
        }, 100); // Small delay to ensure room membership is updated
    });

    socket.on(ACTIONS.CODE_CHANGE, ({roomId, code}) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, {code});
    });

    socket.on(ACTIONS.SYNC_CODE, ({socketId, code}) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, {code});
    });

    socket.on(ACTIONS.SYNC_STDIN, ({roomId, stdinInput}) => {
        socket.in(roomId).emit(ACTIONS.SYNC_STDIN, {stdinInput});
    });

    // Add a ping handler to verify room connection
    socket.on('ping-room', ({ roomId }, callback) => {
        // Check if socket is in the room
        const isInRoom = io.sockets.adapter.rooms.get(roomId)?.has(socket.id) || false;
        const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        
        console.log(`PING: Socket ${socket.id} in room ${roomId}? ${isInRoom} (room size: ${roomSize})`);
        
        // If socket is not in room but should be, add them
        if (!isInRoom && userSocketMap[socket.id]) {
            console.log(`Socket ${socket.id} not in room ${roomId}, rejoining automatically`);
            socket.join(roomId);
        }
        
        // If callback exists, send back result
        if (typeof callback === 'function') {
            // Check again after potential rejoin
            const nowInRoom = io.sockets.adapter.rooms.get(roomId)?.has(socket.id) || false;
            callback({
                success: nowInRoom,
                roomSize: io.sockets.adapter.rooms.get(roomId)?.size || 0,
                socketId: socket.id
            });
        }
    });
    
    // Handle room-check event
    socket.on('room-check', ({ roomId, message }) => {
        console.log(`Room-check request from socket ${socket.id} for room ${roomId} with message: ${message}`);
        
        // Check if socket is in the room
        const isInRoom = socket.rooms.has(roomId);
        console.log(`Is socket ${socket.id} in room ${roomId}? ${isInRoom}`);
        
        // Count members in the room
        const room = io.sockets.adapter.rooms.get(roomId);
        const numClients = room ? room.size : 0;
        console.log(`Number of clients in room ${roomId}: ${numClients}`);
        
        // Join room if not already in it
        if (!isInRoom) {
            console.log(`Auto-joining socket ${socket.id} to room ${roomId}`);
            socket.join(roomId);
        }
        
        // Echo the message back to all clients in the room (except the sender)
        const timestamp = new Date().toISOString();
        socket.to(roomId).emit('room-check-echo', {
            message,
            fromSocketId: socket.id,
            timestamp
        });
        
        // Also echo back to the sender so they know it worked
        socket.emit('room-check-echo', {
            message: `${message} (echoed back to sender)`,
            fromSocketId: 'server',
            timestamp
        });
        
        console.log(`Echoed room-check message to room ${roomId}`);
    });

    // Handle chat messages
    socket.on(ACTIONS.CHAT_MESSAGE, ({roomId, username, message, timestamp}) => {
        // Verify socket is in room before broadcasting
        const isInRoom = io.sockets.adapter.rooms.get(roomId)?.has(socket.id) || false;
        if (!isInRoom) {
            console.log(`Socket ${socket.id} not in room ${roomId}, joining before chat broadcast`);
            socket.join(roomId);
        }
        
        io.to(roomId).emit(ACTIONS.CHAT_MESSAGE, {
            username,
            message,
            timestamp: timestamp || new Date().toISOString()
        });
    });

    // Handle group chat messages
    socket.on(ACTIONS.GROUP_MESSAGE, ({roomId, username, message, timestamp}) => {
        // Use provided timestamp or create a new one
        const messageTimestamp = timestamp || new Date().toISOString();
        
        console.log(`Broadcasting message from ${username} to room ${roomId}:`, {
            message: message.substring(0, 30) + (message.length > 30 ? '...' : ''), // Truncate long messages in logs
            roomClients: io.sockets.adapter.rooms.get(roomId)?.size || 0
        });
        
        // Verify socket is in room
        const isInRoom = io.sockets.adapter.rooms.get(roomId)?.has(socket.id) || false;
        if (!isInRoom) {
            console.log(`Socket ${socket.id} not in room ${roomId}, joining before message broadcast`);
            socket.join(roomId);
            
            // Small delay to ensure join completes
            setTimeout(() => {
                broadcastMessage();
            }, 100);
        } else {
            broadcastMessage();
        }
        
        function broadcastMessage() {
            try {
                // Broadcast to ALL clients in the room (including sender for consistency)
                io.to(roomId).emit(ACTIONS.GROUP_MESSAGE, {
                    username,
                    message,
                    timestamp: messageTimestamp
                });
                
                const roomMembers = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
                console.log(`Message broadcast complete to ${roomMembers.length} clients`);
            } catch (error) {
                console.error(`Error broadcasting message to room ${roomId}:`, error);
            }
        }
    });

    // Handle end meeting (only hosts can do this)
    socket.on(ACTIONS.END_MEETING, ({ roomId }) => {
        const socketData = userSocketMap[socket.id];
        
        if (socketData && socketData.isHost) {
            // Get all clients in the room
            const clients = getAllConnectedClients(roomId);
            
            // Notify everyone that the meeting is ending
            clients.forEach(({ socketId }) => {
                io.to(socketId).emit(ACTIONS.END_MEETING, {
                    message: 'Host has ended the session.'
                });
            });
            
            // Clean up room data
            delete roomHostMap[roomId];
            delete pendingJoinRequests[roomId];
            
            console.log(`Host ${socketData.username} ended meeting in room ${roomId}`);
        }
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        
        rooms.forEach((roomId) => {
            const socketData = userSocketMap[socket.id];
            
            if (socketData) {
                // Notify others that this user is disconnecting
                socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                    socketId: socket.id,
                    username: socketData.username,
                    isHost: socketData.isHost
                });
                
                // If the disconnecting user is a host, clean up the room
                if (socketData.isHost && roomHostMap[roomId]?.socketId === socket.id) {
                    delete roomHostMap[roomId];
                    
                    // Notify everyone that the host has left
                    socket.in(roomId).emit(ACTIONS.END_MEETING, {
                        message: 'Host has left the session.'
                    });
                    
                    console.log(`Host ${socketData.username} disconnected from room ${roomId}`);
                }
            }
        });
        
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

// Serve response in production
app.get('/', (req, res) => {
    const htmlContent = '<h1>Welcome to the code editor server</h1>';
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
});

// Improved server start with error handling
let currentPort = PORT;
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${currentPort} is already in use. Trying port ${currentPort + 1}`);
        currentPort = currentPort + 1;
        
        // Try the next port
        setTimeout(() => {
            server.close();
            server.listen(currentPort);
        }, 1000);
    } else {
        console.error('Server error:', error);
    }
});

server.listen(currentPort, () => console.log(`Listening on port ${currentPort}`));