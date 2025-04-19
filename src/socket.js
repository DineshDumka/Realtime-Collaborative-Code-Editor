import {io} from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempt: 0
    };
    
    // Use environment variable if available, otherwise use localhost
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    console.log('Connecting to socket server at:', BACKEND_URL);
    
    // Try connecting to the primary port
    let socket = io(BACKEND_URL, options);
    
    // Handle connection errors
    return new Promise((resolve, reject) => {
        socket.on('connect', () => {
            console.log('Socket connected successfully!');
            resolve(socket);
        });
        
        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            
            // Close the current connection attempt
            socket.close();
            
            // If we can't connect to port 5000, try port 5001 instead
            const altUrl = 'http://localhost:5001';
            console.log('Trying alternative server at:', altUrl);
            
            // Create a new socket connection to the alternative port
            socket = io(altUrl, options);
            
            socket.on('connect', () => {
                console.log('Socket connected successfully to alternative port!');
                resolve(socket);
            });
            
            socket.on('connect_error', (secondErr) => {
                console.error('Alternative socket connection also failed:', secondErr.message);
                reject(new Error('Failed to connect to both primary and fallback servers'));
            });
        });
        
        // Add a 10-second timeout
        setTimeout(() => {
            if (!socket.connected) {
                console.error('Socket connection timeout after 10 seconds');
                reject(new Error('Connection timeout'));
            }
        }, 10000);
    });
};