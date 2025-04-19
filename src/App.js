import './App.css';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import {Toaster} from 'react-hot-toast';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';
import Login from './components/Login';
import Signup from './components/Signup';
import {AuthProvider} from './context/AuthContext';
import {ThemeProvider} from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleSelector from './components/RoleSelector';

function App() {

    return (
        <AuthProvider>
            <ThemeProvider>
                <div>
                    <Toaster
                        position="top-center"
                        toastOptions={{
                            success: {
                                theme: {
                                    primary: '#4aed88',
                                },
                            },
                        }}
                    ></Toaster>
                </div>
                <BrowserRouter>
                    <Routes>
                        <Route 
                            path="/" 
                            element={
                                <ProtectedRoute>
                                    <Home />
                                </ProtectedRoute>
                            } 
                        />
                        <Route
                            path="/editor/:roomId"
                            element={
                                <ProtectedRoute>
                                    <EditorPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route 
                            path="/role-selector" 
                            element={
                                <ProtectedRoute>
                                    <RoleSelector />
                                </ProtectedRoute>
                            } 
                        />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;