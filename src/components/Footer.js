import React from 'react';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="footer">
            <div className="footer-brand">
                <a href="https://github.com/yourusername/codeshare" target="_blank" rel="noopener noreferrer">
                    <span>CodeShare</span>
                </a>
                <span>- Realtime Collaborative Code Editor</span>
            </div>
            <div className="footer-date">
                &copy; {currentYear} All rights reserved
            </div>
        </footer>
    );
};

export default Footer; 