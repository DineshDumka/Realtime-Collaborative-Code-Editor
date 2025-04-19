import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import ACTIONS from '../actions/Actions';

const MonacoEditor = ({ 
    socketRef, 
    roomId, 
    onCodeChange,
    language = 'javascript',
    theme = 'vs-dark',
    themeMode = 'dark'
}) => {
    const editorRef = useRef(null);
    const [value, setValue] = useState('');
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Check for mobile viewport on resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const getDefaultCode = (language) => {
        switch (language) {
            case 'javascript':
                return '// Welcome to CodETogether!\n// Start coding here...\n\nconsole.log("Hello, World!");\n';
            case 'python':
                return '# Welcome to CodETogether!\n# Start coding here...\n\nprint("Hello, World!")\n';
            case 'java':
                return '// Welcome to CodETogether!\n// Start coding here...\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n';
            case 'cpp':
                return '// Welcome to CodETogether!\n// Start coding here...\n\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n';
            default:
                return '// Welcome to CodETogether!\n// Start coding here...\n';
        }
    };

    useEffect(() => {
        if (editorRef.current && isEditorReady) {
            // Set default code when language changes
            if (!value || value === '') {
                const defaultCode = getDefaultCode(language);
                setValue(defaultCode);
                onCodeChange(defaultCode);
            }
        }
    }, [language, isEditorReady, value, onCodeChange]);

    useEffect(() => {
        if (!socketRef.current) return;
        
        const handleCodeChange = ({ code }) => {
            if (code !== null) {
                setValue(code);
                if (editorRef.current) {
                    // Only update if the value is different
                    if (editorRef.current.getValue() !== code) {
                        editorRef.current.setValue(code);
                    }
                }
            }
        };

        socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef.current, editorRef.current]);

    function handleEditorDidMount(editor, monaco) {
        editorRef.current = editor;
        setIsEditorReady(true);
        
        // Apply mobile-friendly settings for small screens
        if (isMobile) {
            editor.updateOptions({
                fontSize: 14,
                lineNumbers: 'off',
                minimap: { enabled: false },
                scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    verticalScrollbarSize: 12,
                    horizontalScrollbarSize: 12
                }
            });
        } else {
            editor.updateOptions({
                fontSize: 16,
                lineNumbers: 'on',
                minimap: { enabled: true },
                scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible'
                }
            });
        }

        // Set initial value
        if (!value) {
            const defaultCode = getDefaultCode(language);
            setValue(defaultCode);
            editor.setValue(defaultCode);
            onCodeChange(defaultCode);
        }

        // Add keyboard-friendly navigation
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
            // Save functionality if needed
            console.log("Save command triggered");
        });
    }

    function handleEditorChange(value) {
        setValue(value);
        onCodeChange(value);
        
        if (socketRef.current) {
            socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                roomId,
                code: value,
            });
        }
    }

    // Update editor options when screen size changes
    useEffect(() => {
        if (editorRef.current && isEditorReady) {
            if (isMobile) {
                editorRef.current.updateOptions({
                    fontSize: 14,
                    lineNumbers: 'off',
                    minimap: { enabled: false },
                    scrollbar: {
                        verticalScrollbarSize: 12,
                        horizontalScrollbarSize: 12
                    }
                });
            } else {
                editorRef.current.updateOptions({
                    fontSize: 16,
                    lineNumbers: 'on',
                    minimap: { enabled: true }
                });
            }
        }
    }, [isMobile, isEditorReady]);

    return (
        <div className="monaco-editor-container">
            <Editor
                height="100%"
                width="100%"
                language={language}
                value={value}
                theme={themeMode === 'dark' ? theme : 'vs-light'}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    wordWrap: 'on',
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    fontSize: isMobile ? 14 : 16,
                    minimap: { enabled: !isMobile },
                    lineNumbers: isMobile ? 'off' : 'on',
                }}
                className="editor-instance"
            />
        </div>
    );
};

export default MonacoEditor; 