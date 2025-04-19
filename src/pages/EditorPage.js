import React, {useState, useRef, useEffect} from 'react';
import toast from 'react-hot-toast';
import Client from '../components/Client';
import MonacoEditor from '../components/MonacoEditor';
// import Chat from '../components/Chat';
// import GroupChat from '../components/GroupChat';
import AIChat from '../components/AIChat';
import Resizer from '../components/Resizer';
import ACTIONS from '../actions/Actions';
import {initSocket} from '../socket';
import {useLocation, useNavigate, Navigate, useParams} from 'react-router-dom';
import {executeCode} from '../components/CodeExecution';
import {useAuth} from '../context/AuthContext';
import JoinRequestModal from '../components/JoinRequestModal';
import {useTheme} from '../context/ThemeContext';

const EditorPage = () => {
    const {currentUser} = useAuth();
    const {themeMode, toggleThemeMode} = useTheme();
    const [clients, setClients] = useState([]);
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const theme = themeMode === 'dark' ? 'vs-dark' : 'vs-light';
    const [language, setLanguage] = useState('javascript');
    const [stdinInput, setStdinInput] = useState('');
    
    // Chat related state
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    
    // Join request state
    const [joinRequests, setJoinRequests] = useState([]);
    const [isApproved, setIsApproved] = useState(false);
    const [isRejected, setIsRejected] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const {roomId} = useParams();
    const reactNavigator = useNavigate();
    
    // Determine if the current user is a host
    const isHost = location.state?.isHost || currentUser?.role === 'host';

    // Set default sidebar widths with proper initial values
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(320);
    const [chatWidth, setChatWidth] = useState(280);

    // Add message end ref for scrolling
    const messagesEndRef = useRef(null);
    
    // Scroll to bottom functionality
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    // Scroll after messages update
    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    // Add state for mobile chat drawer
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

    // Listener for room-check-echo - moved up to avoid conditional hook call error
    useEffect(() => {
        if (!socketRef.current) return;

        // Add listener for room-check-echo
        socketRef.current.on('room-check-echo', ({ message, fromSocketId, timestamp }) => {
            console.log('Received room-check-echo:', { message, fromSocketId, timestamp });
            
            // Display toast to confirm receipt
            toast.success(`Echo received: ${message}`, {
                duration: 3000
            });
        });

        // Cleanup function
        return () => {
            socketRef.current?.off('room-check-echo');
        };
    }, []); // Removed socketRef.current from dependencies

    useEffect(() => {
        const init = async () => {
            try {
                socketRef.current = await initSocket();
                
                // Handle socket connection errors
                socketRef.current.on('connect_error', (err) => handleErrors(err));
                socketRef.current.on('connect_failed', (err) => handleErrors(err));
                socketRef.current.on('disconnect', () => {
                    toast.error('Disconnected from server. Trying to reconnect...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                });

                function handleErrors(e) {
                    console.log('socket error', e);
                    toast.error('Socket connection failed, try again later.');
                    reactNavigator('/');
                }
                
                // Send a join request
                if (socketRef.current.connected) {
                    console.log('Sending join request as:', isHost ? 'host' : 'participant');
                    socketRef.current.emit(ACTIONS.JOIN_REQUEST, {
                        roomId,
                        username: location.state?.username || currentUser?.username,
                        userId: location.state?.userId || currentUser?.id,
                        isHost: isHost
                    });
                    
                    // Add logging to track socket connection and room
                    console.log('Socket connected with ID:', socketRef.current.id);
                    console.log('Attempting to join room:', roomId);
                } else {
                    toast.error('Socket not connected. Please try refreshing the page.');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            
                // Set up the GROUP_MESSAGE listener directly here
                socketRef.current.on(ACTIONS.GROUP_MESSAGE, ({ message, username, timestamp }) => {
                    console.log('Received GROUP_MESSAGE in init:', { message, username, timestamp });
                    
                    // Add to chat messages state
                    setChatMessages(prev => {
                        const isDuplicate = prev.some(
                            msg => msg.message === message && 
                                   msg.username === username &&
                                   msg.timestamp === timestamp
                        );
                        
                        if (isDuplicate) {
                            return prev;
                        }
                        
                        return [...prev, { message, username, timestamp }];
                    });
                });
            
                // Handle join requests (only for hosts)
                socketRef.current.on(ACTIONS.JOIN_REQUEST, (data) => {
                    console.log('Received join request from:', data.username);
                    if (isHost) {
                        // Check for duplicates before adding
                        setJoinRequests(prev => {
                            const isDuplicate = prev.some(req => req.socketId === data.socketId);
                            if (isDuplicate) {
                                return prev;
                            }
                            return [...prev, data];
                        });
                        toast.success(`${data.username} wants to join the room`);
                    } else {
                        console.log('Ignoring join request as non-host');
                    }
                });
                
                // Listen for request received confirmation
                socketRef.current.on('request-received', (data) => {
                    toast.success(data.message);
                });
            
                // Handle join approval
                socketRef.current.on(ACTIONS.JOIN_APPROVED, ({ roomId }) => {
                    setIsApproved(true);
                    
                    // Now that we're approved, join the room
                    socketRef.current.emit(ACTIONS.JOIN, {
                        roomId,
                        username: location.state?.username || currentUser?.username,
                        userId: location.state?.userId || currentUser?.id,
                        isHost: isHost
                    });
                    
                    toast.success('You have been approved to join the room');
                });
                
                // Handle join rejection
                socketRef.current.on(ACTIONS.JOIN_REJECTED, ({ reason }) => {
                    setIsRejected(true);
                    setRejectionReason(reason);
                    toast.error(reason);
                    // We'll show a message and redirect in the UI
                });
                
                // Handle meeting ended by host
                socketRef.current.on(ACTIONS.END_MEETING, ({ message }) => {
                    toast.error(message);
                    setTimeout(() => {
                        reactNavigator('/');
                    }, 3000);
                });

                // Listening for joined event
                socketRef.current.on(
                    ACTIONS.JOINED,
                    ({ clients, username, socketId, isHost }) => {
                        if (username !== location.state?.username && username !== currentUser?.username) {
                            toast.success(`${username} joined the room.`);
                            console.log(`${username} joined`);
                        }
                        setClients(clients);
                        socketRef.current.emit(ACTIONS.SYNC_CODE, {
                            code: codeRef.current,
                            socketId,
                        });
                    }
                );

                // Listening for disconnected
                socketRef.current.on(
                    ACTIONS.DISCONNECTED,
                    ({ socketId, username, isHost }) => {
                        toast.success(`${username} left the room.`);
                        if (isHost) {
                            toast.error('Host has left the room. The session will end.');
                            setTimeout(() => {
                                reactNavigator('/');
                            }, 3000);
                        }
                        setClients((prev) => {
                            return prev.filter(
                                (client) => client.socketId !== socketId
                            );
                        });
                    }
                );
            } catch (err) {
                console.error("Socket initialization error:", err);
                toast.error('Failed to connect to server. Please refresh or try again later.');
                reactNavigator('/');
            }
        };

        init();
        
        return () => {
            // Clean up all socket listeners and connections
            if (socketRef.current) {
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off(ACTIONS.JOIN_APPROVED);
                socketRef.current.off(ACTIONS.JOIN_REJECTED);
                socketRef.current.off(ACTIONS.JOIN_REQUEST);
                socketRef.current.off(ACTIONS.END_MEETING);
                socketRef.current.off(ACTIONS.CODE_CHANGE);
                socketRef.current.off(ACTIONS.SYNC_STDIN);
                socketRef.current.off(ACTIONS.CHAT_MESSAGE);
                socketRef.current.off(ACTIONS.GROUP_MESSAGE);
                socketRef.current.off('connect_error');
                socketRef.current.off('connect_failed');
                socketRef.current.off('disconnect');
                socketRef.current.disconnect();
            }
        };
    }, [
        currentUser?.id,
        currentUser?.username,
        isHost,
        location.state?.userId,
        location.state?.username,
        reactNavigator,
        roomId
    ]);

    // Check for proper access
    useEffect(() => {
        // If user is not authenticated, this will be handled by ProtectedRoute
        
        // If user is a participant and tries to join a room that doesn't exist yet
        if (currentUser?.role === 'participant' && !isApproved && !isRejected) {
            // We'll check in the JOIN_REQUEST handler if there's a host
            // If no host is present, the server will reject with a message
        }
    }, [currentUser?.role, isApproved, isRejected]);

    // Approval handler for join requests
    const handleApproveJoin = (socketId) => {
        console.log(`Approving join request for socketId: ${socketId}`);
        if (!socketRef.current || !socketRef.current.connected) {
            toast.error('Socket disconnected. Please refresh the page.');
            return;
        }
        
        socketRef.current.emit(ACTIONS.JOIN_APPROVED, {
            roomId,
            socketId
        });
        
        setJoinRequests(prev => prev.filter(req => req.socketId !== socketId));
        toast.success('User has been approved to join the room');
    };
    
    // Rejection handler for join requests
    const handleRejectJoin = (socketId) => {
        console.log(`Rejecting join request for socketId: ${socketId}`);
        if (!socketRef.current || !socketRef.current.connected) {
            toast.error('Socket disconnected. Please refresh the page.');
            return;
        }
        
        socketRef.current.emit(ACTIONS.JOIN_REJECTED, {
            roomId,
            socketId
        });
        
        setJoinRequests(prev => prev.filter(req => req.socketId !== socketId));
        toast.success('User has been rejected from joining the room');
    };
    
    // End meeting handler (host only)
    const handleEndMeeting = () => {
        if (isHost && socketRef.current) {
            try {
            socketRef.current.emit(ACTIONS.END_MEETING, { roomId });
                toast.success('Meeting ended. Redirecting to home...');
                setTimeout(() => {
                    reactNavigator('/');
                }, 1500);
            } catch (error) {
                console.error("Error ending meeting:", error);
                toast.error('Failed to end meeting. Redirecting anyway...');
                setTimeout(() => {
                    reactNavigator('/');
                }, 1500);
            }
        } else {
            reactNavigator('/');
        }
    };

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID copied!');
        } catch (err) {
            toast.error('Failed to copy room ID');
            console.error(err);
        }
    }

    function handleLanguageChange(e) {
        setLanguage(e.target.value);
    }

    function handleRunCode() {
        const code = codeRef.current;
        executeCode(code, language, setOutput, setError, setIsExecuting, stdinInput);
        
        // Emit stdin input to other clients for sync
        socketRef.current.emit(ACTIONS.SYNC_STDIN, {
            roomId,
            stdinInput,
        });
    }

    // Handle left sidebar resize
    const handleLeftSidebarResize = (newWidth) => {
        // Limit minimum and maximum width for better UX
        const limitedWidth = Math.max(280, Math.min(420, newWidth));
        setLeftSidebarWidth(limitedWidth);
    };
    
    // Handle right sidebar (chat) resize
    const handleChatResize = (newWidth) => {
        // Limit minimum and maximum width for better UX
        const limitedWidth = Math.max(200, Math.min(380, newWidth));
        setChatWidth(limitedWidth);
    };
    
    // Verify that we're actually in the room after approval
    useEffect(() => {
        if (isApproved && socketRef.current) {
            console.log('Verifying room connection after approval');
            
            // Extra check to ensure we've properly joined the room
            setTimeout(() => {
                console.log('Performing delayed room membership check');
                socketRef.current.emit('ping-room', { roomId }, (response) => {
                    if (response && response.success) {
                        console.log('Room connection verified:', response);
                        
                        // Send a test message to the room (visible only in console)
                        socketRef.current.emit('room-check', { 
                            roomId, 
                            message: `User ${location.state?.username || currentUser?.username} connection confirmed` 
                        });
                    } else {
                        console.warn('Room connection failed verification, rejoining room');
                        // Force rejoin the room
                        socketRef.current.emit(ACTIONS.JOIN, {
                            roomId,
                            username: location.state?.username || currentUser?.username,
                            userId: location.state?.userId || currentUser?.id,
                            isHost: isHost
                        });
                    }
                });
            }, 2000); // Give time for approval process to complete
        }
    }, [isApproved, roomId, isHost, location.state?.username, location.state?.userId, currentUser?.username, currentUser?.id]);

    // Chat message handler - Improved with retry logic
    const handleSendChatMessage = (e) => {
        e.preventDefault();
        if (chatInput.trim() === '') return;
        
        const timestamp = new Date().toISOString();
        const username = location.state?.username || currentUser?.username;
        const messageContent = chatInput.trim();
        
        // Create message object
        const newMessage = {
            message: messageContent,
            username: username,
            timestamp: timestamp
        };
        
        // Show sending feedback
        toast.success('Sending message...', {
            id: 'sending-msg',
            duration: 1000
        });
        
        // Add message to local state immediately for sender
        setChatMessages(prev => [...prev, newMessage]);
        
        // If socket connection is available, broadcast the message
        if (socketRef.current) {
            console.log('Sending message to room:', roomId, {
                message: messageContent,
                username: username, 
                timestamp: timestamp
            });
            
            // First verify we're in the room
            socketRef.current.emit('ping-room', { roomId }, (response) => {
                if (response && response.success) {
                    // We're in the room, send the message
                    socketRef.current.emit(ACTIONS.GROUP_MESSAGE, {
                        roomId,
                        message: messageContent,
                        username: username,
                        timestamp: timestamp
                    });
                } else {
                    console.warn('Room connection lost, rejoining before sending message');
                    
                    // Rejoin the room first
                    socketRef.current.emit(ACTIONS.JOIN, {
                        roomId,
                        username: username,
                        userId: location.state?.userId || currentUser?.id,
                        isHost: isHost
                    });
                    
                    // Then send the message after a short delay
                    setTimeout(() => {
                        socketRef.current.emit(ACTIONS.GROUP_MESSAGE, {
                            roomId,
                            message: messageContent,
                            username: username,
                            timestamp: timestamp
                        });
                    }, 500);
                }
            });
        } else {
            console.error('Socket not connected, cannot send message');
            toast.error('Connection issue. Message may not be delivered to others.');
        }
        
        setChatInput('');
        
        // Force scroll to bottom after sending
        setTimeout(scrollToBottom, 100);
    };

    // Add useEffect for syncing stdin input
    useEffect(() => {
        if (!socketRef.current) return;
        
        const socket = socketRef.current;
        
        const handleSyncStdin = ({ stdinInput }) => {
            if (stdinInput !== null) {
                setStdinInput(stdinInput);
            }
        };
        
        socket.on(ACTIONS.SYNC_STDIN, handleSyncStdin);

        return () => {
            socket.off(ACTIONS.SYNC_STDIN, handleSyncStdin);
        };
    }, []);

    // Add effect to verify room connection
    useEffect(() => {
        // Skip if not approved or no socket
        if (!isApproved || !socketRef.current) return;
        
        // Verify that we're properly connected
        console.log('Verifying room connection status:', roomId);
        
        // Ping the server to make sure we're connected to the room
        socketRef.current.emit('ping-room', { roomId }, (response) => {
            if (response && response.success) {
                console.log('Room connection verified:', response);
            } else {
                console.warn('Room connection might have issues');
                // Attempt to rejoin the room
                socketRef.current.emit(ACTIONS.JOIN, {
                    roomId,
                    username: location.state?.username || currentUser?.username,
                    userId: location.state?.userId || currentUser?.id,
                    isHost: isHost
                });
            }
        });
    }, [isApproved, roomId, isHost, location.state?.username, location.state?.userId, currentUser?.username, currentUser?.id]);

    // Toggle chat drawer
    const toggleChatDrawer = () => {
        setIsChatDrawerOpen(prev => !prev);
    };

    // If rejected, show rejection message and redirect button
    if (isRejected) {
        return (
            <div className="rejection-page">
                <div className="rejection-container">
                    <h2>Access Denied</h2>
                    <p>{rejectionReason}</p>
                    <button 
                        className="btn joinBtn"
                        onClick={() => reactNavigator('/')}
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    // If not approved yet and not host, show waiting screen
    if (!isApproved && !isHost) {
        return (
            <div className="waiting-page">
                <div className="waiting-container">
                    <h2>Waiting for Approval</h2>
                    <p>The host needs to approve your request to join this room.</p>
                    <div className="loader"></div>
                    <button 
                        className="btn leaveBtn"
                        onClick={() => reactNavigator('/')}
                        style={{ marginTop: '20px' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    if (!location.state && !currentUser) {
        return <Navigate to="/" />;
    }

    // eslint-disable-next-line no-unused-vars
    function testRoomConnection() {
        if (!socketRef.current || !roomId) return;
        
        // Log attempt
        console.log('Testing room connection...');
        
        // Send a test message to the room
        socketRef.current.emit('room-check', {
            roomId,
            message: `Test message from ${location.state?.username || currentUser?.username} at ${new Date().toLocaleTimeString()}`
        });
        
        // Display toast for user feedback - changed from info to success
        toast.success('Sending test message to room...', {
            duration: 2000
        });
    }

    return (
        <div className="editor-page">
            <header className="header">
                <div className="header-left">
                    <div className="logo">
                        <img src="/CodETogether.png" alt="CodETogether Logo" className="header-logo" />
                    </div>
                    
                    <div className="user-info">
                        <div className="welcome-message">
                            Welcome, {location.state?.username || currentUser?.username}
                        </div>
                        <div className="user-role">
                            Role: {isHost ? 'Host' : 'Participant'}
                        </div>
                    </div>
                    
                    <div className="theme-controls">
                        <button 
                            onClick={toggleThemeMode} 
                            className="theme-toggle-btn"
                            aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {themeMode === 'dark' ? '☀️' : '🌙'}
                        </button>
                    </div>
                </div>
                
                <div className="header-actions">
                    <button className="copyBtn" onClick={copyRoomId}>
                        <span className="material-icons">content_copy</span> Copy Room ID
                    </button>
                    
                    {isHost ? (
                        <button 
                            className="end-meeting-btn" 
                            onClick={handleEndMeeting}
                        >
                            <span className="material-icons">call_end</span> End Meeting
                        </button>
                    ) : (
                        <button 
                            className="leave-meeting-btn" 
                            onClick={() => reactNavigator('/')}
                        >
                            <span className="material-icons">exit_to_app</span> Leave Meeting
                        </button>
                    )}
                </div>
            </header>

            <div className="main-content">
                <div className="left-sidebar" style={{ width: `${leftSidebarWidth}px` }}>
                    <div className="sidebar-content">
                        <div className="language-selector">
                            <h3>Choose Language</h3>
                            <select
                                value={language}
                                onChange={handleLanguageChange}
                                className="language-select"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                                <option value="c">C</option>
                                <option value="ruby">Ruby</option>
                                <option value="go">Go</option>
                                <option value="rust">Rust</option>
                                <option value="php">PHP</option>
                                <option value="typescript">TypeScript</option>
                                <option value="csharp">C#</option>
                                <option value="html">HTML</option>
                                <option value="css">CSS</option>
                                <option value="sql">SQL</option>
                            </select>
                        </div>
                        
                        <div className="discussion-section">
                            <h3>Chat Discussion</h3>
                            <div className="chat-messages highlighted">
                                {chatMessages.length === 0 ? (
                                    <div className="no-messages">
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    <div className="messages-wrapper">
                                        {chatMessages.map((message, index) => (
                                            <div 
                                                key={index} 
                                                className={`message ${message.username === (location.state?.username || currentUser?.username) ? 'own-message' : 'other-message'}`}
                                            >
                                                <div className="message-sender">
                                                    <span className="message-username">{message.username}</span>
                                                </div>
                                                <div className="message-content">{message.message}</div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} style={{ float: 'left', clear: 'both' }} />
                                    </div>
                                )}
                            </div>
                            
                            {/* Chat Input Area */}
                            <div className="chat-input-container discussion-chat-input">
                                <input 
                                    type="text" 
                                    className="chat-input"
                                    placeholder="Type your message..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && chatInput.trim()) {
                                            e.preventDefault();
                                            handleSendChatMessage(e);
                                        }
                                    }}
                                />
                                <button 
                                    type="button"
                                    className="chat-send-btn"
                                    disabled={!chatInput.trim()}
                                    onClick={handleSendChatMessage}
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                        
                        <div className="connected-users">
                            <h3>Connected Users</h3>
                            <div className="clients-list">
                                {clients.map((client) => (
                                    <Client
                                        key={client.socketId}
                                        username={client.username}
                                        isHost={client.isHost}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <Resizer onResize={handleLeftSidebarResize} side="left" />

                <div className="editor-container">
                    <div className="editor-area">
                        <MonacoEditor
                            socketRef={socketRef}
                            roomId={roomId}
                            onCodeChange={(code) => {
                                codeRef.current = code;
                            }}
                            language={language}
                            theme={theme}
                            themeMode={themeMode}
                        />
                    </div>
                    <div className="output-area">
                        <div className="output-header">
                            <h3>Output</h3>
                            <div className="run-controls">
                                <div className="stdin-container">
                                    <textarea 
                                        className="stdin-textarea" 
                                        value={stdinInput}
                                        onChange={(e) => setStdinInput(e.target.value)}
                                        placeholder="Enter input (stdin) for your program..."
                                        rows="2"
                                    />
                                </div>
                            <button 
                                className="run-btn" 
                                onClick={handleRunCode}
                                disabled={isExecuting}
                            >
                                {isExecuting ? 'Running...' : 'Run Code'}
                            </button>
                            </div>
                        </div>
                        <div className="output-content">
                            {isExecuting && (
                                <div className="loading">
                                    <div className="spinner"></div>
                                    <p>Executing code...</p>
                                </div>
                            )}
                            {!isExecuting && error && (
                                <div className="error">
                                    <pre>{error}</pre>
                                </div>
                            )}
                            {!isExecuting && !error && output && (
                                    <pre>{output}</pre>
                            )}
                            {!isExecuting && !error && !output && (
                                <div className="placeholder">
                                    <p>Run your code to see the output here</p>
                                    <p className="tip">Tip: You can use the input box for stdin values</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Resizer onResize={handleChatResize} side="right" />
                
                <div className="right-sidebar" style={{ width: `${chatWidth}px` }}>
                    <AIChat 
                        language={language}
                        themeMode={themeMode}
                    />
                </div>
            </div>
            
            {isHost && <JoinRequestModal 
                requests={joinRequests} 
                    onApprove={handleApproveJoin}
                    onReject={handleRejectJoin}
            />}

            {/* Mobile Chat Drawer */}
            <div 
                className={`chat-drawer-overlay ${isChatDrawerOpen ? 'overlay-visible' : ''}`}
                onClick={toggleChatDrawer}
            ></div>
            
            <button 
                className="chat-drawer-button" 
                onClick={toggleChatDrawer}
                aria-label="Open chat"
            >
                💬
            </button>
            
            <div className={`chat-drawer-container ${isChatDrawerOpen ? 'chat-drawer-open' : ''}`}>
                <div className="chat-drawer-header">
                    <h3>Chat Discussion</h3>
                    <button className="chat-drawer-close" onClick={toggleChatDrawer}>✕</button>
                </div>
                <div className="chat-drawer-content">
                    <div className="discussion-section">
                        <div className="chat-messages highlighted">
                            {chatMessages.length === 0 ? (
                                <div className="no-messages">
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                <div className="messages-wrapper">
                                    {chatMessages.map((message, index) => (
                                        <div 
                                            key={index} 
                                            className={`message ${message.username === (location.state?.username || currentUser?.username) ? 'own-message' : 'other-message'}`}
                                        >
                                            <div className="message-sender">
                                                <span className="message-username">{message.username}</span>
                                            </div>
                                            <div className="message-content">{message.message}</div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} style={{ float: 'left', clear: 'both' }} />
                                </div>
                            )}
                        </div>
                        
                        <div className="chat-input-container discussion-chat-input">
                            <input 
                                type="text" 
                                className="chat-input"
                                placeholder="Type your message..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && chatInput.trim()) {
                                        e.preventDefault();
                                        handleSendChatMessage(e);
                                    }
                                }}
                            />
                            <button 
                                type="button"
                                className="chat-send-btn"
                                disabled={!chatInput.trim()}
                                onClick={handleSendChatMessage}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;