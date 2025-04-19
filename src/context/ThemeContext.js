import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [themeMode, setThemeMode] = useState(() => {
        return localStorage.getItem('themeMode') || 'dark';
    });

    useEffect(() => {
        // Apply theme to document body
        document.body.setAttribute('data-theme', themeMode);
        localStorage.setItem('themeMode', themeMode);
    }, [themeMode]);

    const toggleThemeMode = () => {
        const newMode = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(newMode);
    };

    return (
        <ThemeContext.Provider value={{ themeMode, toggleThemeMode, setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider; 