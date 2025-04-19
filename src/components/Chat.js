import React, { useState, useEffect, useRef } from 'react';
import ACTIONS from '../actions/Actions';

const Chat = ({ socketRef, roomId, username, onResize }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);
    
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const resizerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socketRef.current) return;
        
        const socket = socketRef.current;
        
        const handleChatMessage = ({ username, message, timestamp }) => {
            setMessages(prevMessages => [...prevMessages, { username, message, timestamp }]);
        };
        
        socket.on(ACTIONS.CHAT_MESSAGE, handleChatMessage);
        
        return () => {
            socket.off(ACTIONS.CHAT_MESSAGE, handleChatMessage);
        };
    }, [socketRef]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        const timestamp = new Date().toLocaleTimeString();
        
        setMessages(prevMessages => [
            ...prevMessages, 
            { username, message: newMessage, timestamp }
        ]);
        
        socketRef.current?.emit(ACTIONS.CHAT_MESSAGE, {
            roomId,
            username,
            message: newMessage,
            timestamp
        });
        
        setNewMessage('');
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };
    
    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setStartX(e.clientX);
        setStartWidth(chatContainerRef.current?.parentElement?.offsetWidth || 300);
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        if (resizerRef.current) {
            resizerRef.current.classList.add('active');
        }
    };
    
    const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        const chatPanel = chatContainerRef.current?.parentElement;
        if (!chatPanel) return;
        
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(220, Math.min(500, startWidth - deltaX));
        
        chatPanel.style.width = `${newWidth}px`;
        if (onResize) {
            onResize(newWidth);
        }
    };
    
    const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        if (resizerRef.current) {
            resizerRef.current.classList.remove('active');
        }
    };

    return (
        <>
            <div 
                ref={resizerRef} 
                className="resizer" 
                onMouseDown={handleMouseDown}
            ></div>
            <div 
                ref={chatContainerRef} 
                className={`chat-container ${isOpen ? 'open' : 'closed'}`}
            >
                <div className="chat-header">
                    <h3>Chat</h3>
                    <button 
                        className="toggle-chat-btn"
                        onClick={toggleChat}
                        aria-label={isOpen ? "Close chat" : "Open chat"}
                    >
                        {isOpen ? '✕' : '💬'}
                    </button>
                </div>
                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="no-messages">
                            <p>No messages yet. Start chatting!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`message ${msg.username === username ? 'own-message' : 'other-message'}`}
                            >
                                <div className="message-header">
                                    <span className="message-username">{msg.username}</span>
                                    <span className="message-timestamp">{msg.timestamp}</span>
                                </div>
                                <div className="message-content">{msg.message}</div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="chat-input">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button type="submit">Send</button>
                </form>
            </div>
        </>
    );
};

export default Chat; 