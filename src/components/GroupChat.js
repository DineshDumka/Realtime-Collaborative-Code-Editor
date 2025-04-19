import React, { useState, useEffect, useRef } from 'react';
import ACTIONS from '../actions/Actions';
import './Chat.css';

const GroupChat = ({ socketRef, roomId, username }) => {
    const [messages, setMessages] = useState([]);
    const [msg, setMsg] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (socketRef.current) {
            // Listen for group messages from other users
            socketRef.current.on(ACTIONS.GROUP_MESSAGE, ({ message, username, timestamp }) => {
                setMessages(prevMessages => [...prevMessages, { message, username, timestamp }]);
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.off(ACTIONS.GROUP_MESSAGE);
            }
        };
    }, [socketRef]);

    // Auto-scroll to bottom when new messages come in
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (msg.trim() === '') return;
        
        // Create timestamp for the message
        const timestamp = new Date().toISOString();
        
        // Add message to local state immediately for instant display
        const newMessage = {
            message: msg,
            username: username,
            timestamp: timestamp
        };
        
        setMessages(prevMessages => [...prevMessages, newMessage]);
        
        // Send message to server for broadcasting to others
        socketRef.current.emit(ACTIONS.GROUP_MESSAGE, {
            roomId,
            message: msg,
            username
        });

        setMsg('');
        
        // Focus back on input after sending
        inputRef.current?.focus();
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="group-chat-container">
            <div className="group-chat-messages">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    <div className="messages-wrapper">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`message ${message.username === username ? 'own-message' : 'other-message'}`}
                            >
                                <div className="message-header">
                                    <span className="message-username">{message.username}</span>
                                    <span className="message-timestamp">
                                        {formatTimestamp(message.timestamp)}
                                    </span>
                                </div>
                                <div className="message-content">{message.message}</div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <form className="group-chat-input" onSubmit={sendMessage}>
                <input
                    ref={inputRef}
                    type="text"
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    placeholder="Type your message..."
                    aria-label="Message input"
                />
                <button type="submit" aria-label="Send message">Send</button>
            </form>
        </div>
    );
};

export default GroupChat; 