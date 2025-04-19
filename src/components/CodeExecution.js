import axios from 'axios';

const executeCode = async (code, language, setOutput, setError, setIsExecuting, stdinInput = '') => {
    setIsExecuting(true);
    setError('');
    setOutput('');

    try {
        // Map editor language names to Piston API language names
        const languageMap = {
            'javascript': 'javascript',
            'python': 'python',
            'java': 'java',
            'cpp': 'c++', 
            'ruby': 'ruby',
            'go': 'go',
            'rust': 'rust',
            'php': 'php',
            'c': 'c',
            'csharp': 'c#',
            'typescript': 'typescript',
            'kotlin': 'kotlin',
            'swift': 'swift'
        };

        const pistonLanguage = languageMap[language];
        
        if (!pistonLanguage) {
            setError(`Language "${language}" is not supported by the code execution engine.`);
            setIsExecuting(false);
            return;
        }

        // Piston API URL (using the public API endpoint)
        const apiUrl = 'https://emkc.org/api/v2/piston/execute';

        const payload = {
            language: pistonLanguage,
            version: '*', // Use the latest version available
            files: [
                {
                    name: 'main',
                    content: code
                }
            ],
            stdin: stdinInput, // Pass the provided stdin input
            args: [], // Command line arguments (can be customized later)
            compile_timeout: 10000, // 10 seconds
            run_timeout: 5000 // 5 seconds
        };

        console.log("Executing code with Piston API:", { language: pistonLanguage, code, stdin: stdinInput });
        
        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000 // 15 seconds timeout for the request
        });

        console.log("Piston API response:", response.data);

        if (response.data.run) {
            if (response.data.run.stdout) {
                setOutput(response.data.run.stdout);
            } else if (response.data.run.stderr) {
                setError(`Runtime Error: ${response.data.run.stderr}`);
            } else {
                setOutput('Code executed successfully with no output.');
            }
            
            // Add execution time info
            if (response.data.run.time !== undefined) {
                const timeInfo = `\n[Execution finished in ${response.data.run.time}ms]`;
                setOutput(prev => prev ? prev + timeInfo : timeInfo);
            }
        } else if (response.data.compile) {
            if (response.data.compile.stderr) {
                setError(`Compilation Error: ${response.data.compile.stderr}`);
            }
        } else {
            setError('Unknown response format from the code execution service.');
        }
    } catch (err) {
        console.error("Code execution error:", err);
        
        if (err.code === 'ECONNABORTED') {
            setError('Request timed out. Your code might be taking too long to execute.');
        } else if (err.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            setError(`API Error (${err.response.status}): ${err.response.data.message || 'Unknown error'}`);
        } else if (err.request) {
            // The request was made but no response was received
            setError('No response from the code execution service. Please check your internet connection.');
        } else {
            // Something happened in setting up the request
            setError(`Error: ${err.message || 'An unknown error occurred during code execution'}`);
        }
    } finally {
        setIsExecuting(false);
    }
};

export { executeCode }; 