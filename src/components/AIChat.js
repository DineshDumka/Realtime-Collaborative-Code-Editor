import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chat.css';

const AIChat = ({ language, themeMode }) => {
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiResponses, setAiResponses] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const apiKey = 'AIzaSyBDfW6Z_D1Xw3okyzrm2bipNTYFj9eofw8';
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [aiResponses, isAiLoading]);
    
    const submitAiPrompt = async (e) => {
        e.preventDefault();
        if (!aiPrompt.trim()) return;
        
        // Reset any previous API errors
        setApiError(null);
        
        // Add user message to responses
        setAiResponses(prev => [...prev, { role: 'user', content: aiPrompt }]);
        
        // Store the user's prompt before clearing the input
        const userPrompt = aiPrompt;
        setAiPrompt('');
        
        // Call AI API
        setIsAiLoading(true);
        try {
            // Build prompt context with programming language
            const fullPrompt = `I'm working with ${language} code. ${userPrompt}`;
            
            // Call Gemini API
            const response = await axios.post(
                `${apiUrl}?key=${apiKey}`,
                {
                    contents: [
                        {
                            parts: [
                                { text: fullPrompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 20000 // 20 second timeout
                }
            );

            // Extract the text response from API
            let aiResponse = '';
            if (response.data && 
                response.data.candidates && 
                response.data.candidates[0] && 
                response.data.candidates[0].content && 
                response.data.candidates[0].content.parts && 
                response.data.candidates[0].content.parts[0]) {
                aiResponse = response.data.candidates[0].content.parts[0].text;
            } else {
                aiResponse = "I couldn't generate a response. Please try rephrasing your question.";
            }
            
            // Add AI response to state
            setAiResponses(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        } catch (error) {
            console.error('AI chat error:', error);
            let errorMessage = "There was a problem connecting to the AI service. Please try again.";
            
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('API Error Data:', error.response.data);
                console.error('API Error Status:', error.response.status);
                
                if (error.response.status === 403) {
                    errorMessage = "Authentication error. Please check that your API key is valid.";
                } else if (error.response.status === 429) {
                    errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
                } else if (error.response.data && error.response.data.error) {
                    errorMessage = `Error: ${error.response.data.error.message || 'Unknown error occurred'}`;
                }
            } else if (error.request) {
                // The request was made but no response was received
                console.error('API Error Request:', error.request);
                errorMessage = "The request was sent but no response was received. Please check your connection.";
            }
            
            setApiError(errorMessage);
            setAiResponses(prev => [...prev, { 
                role: 'assistant', 
                content: errorMessage
            }]);
        } finally {
            setIsAiLoading(false);
            // Focus back on the input field
            inputRef.current?.focus();
        }
    };

    // Format code blocks in responses
    const formatResponse = (text) => {
        if (!text) return '';
        
        // Add proper formatting for code blocks
        return text.split('```').map((segment, index) => {
            if (index % 2 === 1) {
                // This is a code block (odd indices after splitting by ```)
                const codeContent = segment.trim();
                const languageMatch = codeContent.match(/^([a-zA-Z0-9_+-]+)\n/);
                
                if (languageMatch) {
                    // If language is specified, remove it from the content
                    const language = languageMatch[1];
                    const code = codeContent.slice(languageMatch[0].length);
                    return (
                        <pre key={index} className={`ai-code-block language-${language}`}>
                            <code>{code}</code>
                        </pre>
                    );
                } else {
                    // No language specified
                    return (
                        <pre key={index} className="ai-code-block">
                            <code>{codeContent}</code>
                        </pre>
                    );
                }
            } else {
                // Regular text - split by newlines and preserve paragraphs
                return (
                    <span key={index} className="ai-text">
                        {segment.split('\n\n').map((para, i) => (
                            <p key={i}>{para}</p>
                        ))}
                    </span>
                );
            }
        });
    };

    return (
        <div className="ai-chat-container">
            <div className="chat-header ai-chat-header">
                <h3>Ask with AI</h3>
            </div>
            <div className="ai-chat-messages">
                {aiResponses.length === 0 ? (
                    <div className="no-messages">
                        <p>Ask the AI assistant for coding help!</p>
                        <p className="ai-tip">Try: "Show me an example in {language}" or "How do I fix this error?"</p>
                    </div>
                ) : (
                    <div className="messages-wrapper">
                        {aiResponses.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`message ${msg.role === 'user' ? 'own-message' : 'ai-message'}`}
                            >
                                <div className="message-header">
                                    <span className="message-username">
                                        {msg.role === 'user' ? 'You' : 'AI Assistant'}
                                    </span>
                                </div>
                                <div className="message-content">
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        formatResponse(msg.content)
                                    )}
                                </div>
                            </div>
                        ))}
                        {isAiLoading && (
                            <div className="ai-typing">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <span className="typing-text">AI is thinking...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>
            <form onSubmit={submitAiPrompt} className="ai-chat-input">
                <div className="ai-input-container">
                    <input
                        ref={inputRef}
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ask AI for coding help..."
                        disabled={isAiLoading}
                        aria-label="AI prompt input"
                    />
                    <button 
                        type="submit" 
                        disabled={isAiLoading || !aiPrompt.trim()}
                        className={themeMode === 'light' ? 'light-btn' : ''}
                        aria-label="Send to AI"
                    >
                        {isAiLoading ? 'Thinking...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIChat; 