import React, { useState, useEffect } from 'react';

const JoinRequestModal = ({ requests, onApprove, onReject }) => {
    const [visible, setVisible] = useState(false);
    const [activeRequests, setActiveRequests] = useState([]);
    
    // Track window width for responsive design
    const [isMobile, setIsMobile] = useState(window.innerWidth < 576);
    
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 576);
        };
        
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        if (requests.length > 0) {
            setActiveRequests(requests);
            setVisible(true);
        } else {
            // Don't hide immediately if there are no requests, 
            // keep the modal open until user takes action on current requests
            if (activeRequests.length === 0) {
                setVisible(false);
            }
        }
    }, [requests]);

    // Track current active requests
    useEffect(() => {
        if (activeRequests.length === 0) {
            setVisible(false);
        }
    }, [activeRequests]);

    const handleApprove = (socketId) => {
        onApprove(socketId);
        setActiveRequests(prev => prev.filter(req => req.socketId !== socketId));
    };

    const handleReject = (socketId) => {
        onReject(socketId);
        setActiveRequests(prev => prev.filter(req => req.socketId !== socketId));
    };

    if (!visible) return null;

    return (
        <div className="join-request-modal">
            <div className="join-request-content">
                <h2>{activeRequests.length > 1 ? 'Join Requests' : 'Join Request'}</h2>
                
                {activeRequests.length === 0 ? (
                    <p className="no-requests">No pending requests</p>
                ) : (
                    <div className="join-request-list">
                        {activeRequests.map(request => (
                            <div key={request.socketId} className="join-request-item">
                                <div className="join-request-info">
                                    <span className="join-request-username">{request.username}</span>
                                    {request.email && <span className="join-request-email">{request.email}</span>}
                                </div>
                                <div className="join-request-actions">
                                    <button 
                                        className="approve-btn"
                                        onClick={() => handleApprove(request.socketId)}
                                    >
                                        {isMobile ? 'OK' : 'Approve'}
                                    </button>
                                    <button 
                                        className="reject-btn"
                                        onClick={() => handleReject(request.socketId)}
                                    >
                                        {isMobile ? '×' : 'Reject'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JoinRequestModal; 