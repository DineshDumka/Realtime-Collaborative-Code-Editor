import React from 'react';

const OutputPanel = ({ output, error, isLoading }) => {
    return (
        <div className="output-panel">
            {isLoading && (
                <div className="loading">
                    <p>Running code...</p>
                </div>
            )}
            {error && (
                <div className="error">
                    <pre>{error}</pre>
                </div>
            )}
            {!isLoading && !error && output && (
                <div className="output">
                    <pre>{output}</pre>
                </div>
            )}
            {!isLoading && !error && !output && (
                <div className="placeholder">
                    <p>Run code to see output here</p>
                </div>
            )}
        </div>
    );
};

export default OutputPanel; 