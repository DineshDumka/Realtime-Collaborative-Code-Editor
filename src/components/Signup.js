import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaGoogle, FaGithub, FaUserSecret } from 'react-icons/fa';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { signup, signInWithGoogle, signInWithGithub, signInAsGuest } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email || !username || !password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            await signup(email, password, username);
            toast.success('Account created successfully');
            navigate('/role-selector');
        } catch (error) {
            toast.error(error.message || 'Failed to create account');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setIsSubmitting(true);
        try {
            await signInWithGoogle();
            toast.success('Account created successfully');
            navigate('/role-selector');
        } catch (error) {
            toast.error(error.message || 'Failed to sign up with Google');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGithubSignUp = async () => {
        setIsSubmitting(true);
        try {
            await signInWithGithub();
            toast.success('Account created successfully');
            navigate('/role-selector');
        } catch (error) {
            toast.error(error.message || 'Failed to sign up with GitHub');
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
                <h2 className="mainLabel">Create an Account</h2>
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
                        type="text"
                        className="inputBox"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
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
                    <input
                        type="password"
                        className="inputBox"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button 
                        type="submit" 
                        className="btn joinBtn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="social-login">
                    <p className="social-divider">or sign up with</p>
                    <div className="social-buttons">
                        <button 
                            type="button" 
                            className="social-btn google-btn"
                            onClick={handleGoogleSignUp}
                            disabled={isSubmitting}
                        >
                            <FaGoogle /> Google
                        </button>
                        <button 
                            type="button" 
                            className="social-btn github-btn"
                            onClick={handleGithubSignUp}
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
                    Already have an account? <Link to="/login" className="createNewBtn">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup; 