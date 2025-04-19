import {io} from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempt: 0
    };
    
    // Use environment variable if available, otherwise use relative path
    // This works better for deployment where frontend and backend are on the same domain
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    console.log('Connecting to socket server at:', BACKEND_URL);
    
    // Connect to the server
    const socket = io(BACKEND_URL, options);
    
    // Handle connection errors
    return new Promise((resolve, reject) => {
        socket.on('connect', () => {
            console.log('Socket connected successfully!');
            resolve(socket);
        });
        
        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            
            // In production, we don't want to try alternative ports
            // Just report the error and let the reconnection logic handle it
            console.log('Connection error. Reconnection will be attempted automatically.');
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