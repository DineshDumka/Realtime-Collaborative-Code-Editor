import React from 'react';

const Client = ({ username, isHost }) => {
    // Generate avatar color based on username
    const getColorFromUsername = (username) => {
        const colors = [
            '#2196F3', // Blue
            '#4CAF50', // Green
            '#FF9800', // Orange
            '#9C27B0', // Purple
            '#E91E63', // Pink
            '#00BCD4'  // Cyan
        ];
        
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };
    
    // Get initials from username (max 2 characters)
    const getInitials = (username) => {
        if (!username) return '?';
        
        const nameParts = username.split(/[ -]/);
        if (nameParts.length === 1) {
            return username.substring(0, 2).toUpperCase();
        }
        
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    };
    
    const avatarColor = getColorFromUsername(username);
    const initials = getInitials(username);
    
    return (
        <div className="client">
            <div 
                className="avatar" 
                style={{ 
                    backgroundColor: avatarColor,
                }}
            >
                {initials}
            </div>
            <div className="client-info">
                <span className="username">{username}</span>
                {isHost && <span className="host-badge">Host</span>}
            </div>
        </div>
    );
};

export default Client;