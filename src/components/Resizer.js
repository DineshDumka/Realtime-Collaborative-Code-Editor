import React, { useState, useEffect } from 'react';

const Resizer = ({ onResize, side = 'right' }) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        document.body.style.cursor = 'col-resize';
    };
    
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const containerWidth = document.querySelector('.main-content').clientWidth;
            
            if (side === 'left') {
                // For left sidebar resizing (drags from right edge of sidebar)
                const leftSidebarWidth = Math.max(200, Math.min(350, e.clientX));
                
                if (onResize) {
                    onResize(leftSidebarWidth);
                }
            } else {
                // For right sidebar resizing (drags from left edge of sidebar)
                const rightEdge = containerWidth;
                const distanceFromRight = rightEdge - e.clientX;
                const chatWidth = Math.max(200, Math.min(350, distanceFromRight));
                
                if (onResize) {
                    onResize(chatWidth);
                }
            }
        };
        
        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = '';
        };
        
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onResize, side]);
    
    return (
        <div 
            className={`resizer ${isDragging ? 'active' : ''} ${side === 'left' ? 'left-resizer' : 'right-resizer'}`}
            onMouseDown={handleMouseDown}
        />
    );
};

export default Resizer; 