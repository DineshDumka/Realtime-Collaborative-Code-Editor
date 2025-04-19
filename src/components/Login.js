import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaGoogle, FaGithub, FaUserSecret } from 'react-icons/fa';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, signInWithGoogle, signInWithGithub, signInAsGuest } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            await login(email, password);
            toast.success('Login successful');
            navigate('/role-selector');
        } catch (error) {
            toast.error(error.message || 'Failed to login');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsSubmitting(true);
        try {
            await signInWithGoogle();
            toast.success('Login successful');
            navigate('/role-selector');
        } catch (error) {
            toast.error(error.message || 'Failed to login with Google');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGithubSignIn = async () => {
        setIsSubmitting(true);
        try {
            await signInWithGithub();
            toast.success('Login successful');
            navigate('/role-selector');
        } catch (error) {
            toast.error(error.message || 'Failed to login with GitHub');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGuestSignIn = async () => {
        setIsSubmitting(true);
        try {
            await signInAsGuest();
            toast.success('Logged in as guest');
            navigate('/role-selector');
        } catch (error) {
            toast.error(error.message || 'Failed to login as guest');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="homePageWrapper">
            <div className="formWrapper">
                <img
                    className="homePageLogo"
                    src="/CodETogether.png"
                    alt="CodETogether Logo"
                />
                <h2 className="mainLabel">Login</h2>
                <form onSubmit={handleSubmit} className="inputGroup">
                    <input
                        type="email"
                        className="inputBox"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        className="inputBox"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button 
                        type="submit" 
                        className="btn joinBtn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Logging In...' : 'Login'}
                    </button>
                </form>

                <div className="social-login">
                    <p className="social-divider">or continue with</p>
                    <div className="social-buttons">
                        <button 
                            type="button" 
                            className="social-btn google-btn"
                            onClick={handleGoogleSignIn}
                            disabled={isSubmitting}
                        >
                            <FaGoogle /> Google
                        </button>
                        <button 
                            type="button" 
                            className="social-btn github-btn"
                            onClick={handleGithubSignIn}
                            disabled={isSubmitting}
                        >
                            <FaGithub /> GitHub
                        </button>
                    </div>
                    
                    <button 
                        type="button" 
                        className="social-btn guest-btn"
                        onClick={handleGuestSignIn}
                        disabled={isSubmitting}
                    >
                        <FaUserSecret /> Continue as Guest
                    </button>
                </div>

                <div className="createInfo">
                    Don't have an account? <Link to="/signup" className="createNewBtn">Sign Up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login; 