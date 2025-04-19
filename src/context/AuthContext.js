import React, { createContext, useState, useContext, useEffect } from 'react';

// Import individual Firebase auth functions
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { GithubAuthProvider } from 'firebase/auth';
import { signInWithPopup } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
import { signInAnonymously } from 'firebase/auth';

// Import the Firebase app instance
import app from '../firebase';

// Get auth instance
const auth = getAuth(app);

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Listen for auth state changes
    useEffect(() => {
        console.log('Setting up auth state listener');
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log('Auth state changed:', user ? `User: ${user.email || 'Anonymous'}` : 'No user');
            if (user) {
                // Get user role from localStorage (or could be fetched from backend)
                const role = localStorage.getItem(`role_${user.uid}`) || 'participant';
                
                // Create user object with Firebase user data and role
                const userData = {
                    id: user.uid,
                    email: user.email,
                    username: user.displayName || user.email?.split('@')[0] || `Guest-${user.uid.slice(0,5)}`,
                    photoURL: user.photoURL,
                    role: role,
                    provider: user.providerData[0]?.providerId || 'anonymous',
                    isAnonymous: user.isAnonymous
                };
                
                setCurrentUser(userData);
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Sign in anonymously as a guest
    const signInAsGuest = async () => {
        try {
            console.log('Signing in anonymously');
            const userCredential = await signInAnonymously(auth);
            
            // Set default role for anonymous users
            setUserRole('participant', userCredential.user.uid);
            
            return userCredential.user;
        } catch (error) {
            console.error('Anonymous sign-in error:', error);
            throw error;
        }
    };

    // Register a new user with email/password
    const signup = async (email, password, username) => {
        try {
            console.log('Signing up with email/password:', email);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update profile to add username
            await updateProfile(userCredential.user, {
                displayName: username
            });
            
            // Set default role
            setUserRole('participant', userCredential.user.uid);
            
            return userCredential.user;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    };

    // Login with email/password
    const login = async (email, password) => {
        try {
            console.log('Logging in with email/password:', email);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    // Sign in with Google
    const signInWithGoogle = async () => {
        try {
            console.log('Signing in with Google');
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            
            // If this is a new user, set default role
            const isNewUser = userCredential._tokenResponse?.isNewUser;
            if (isNewUser) {
                setUserRole('participant', userCredential.user.uid);
            }
            
            return userCredential.user;
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    };

    // Sign in with GitHub
    const signInWithGithub = async () => {
        try {
            console.log('Signing in with GitHub');
            const provider = new GithubAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            
            // If this is a new user, set default role
            const isNewUser = userCredential._tokenResponse?.isNewUser;
            if (isNewUser) {
                setUserRole('participant', userCredential.user.uid);
            }
            
            return userCredential.user;
        } catch (error) {
            console.error('GitHub sign-in error:', error);
            throw error;
        }
    };

    // Logout the current user
    const logout = async () => {
        try {
            console.log('Logging out');
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    // Update user role
    const setUserRole = (role, userId = null) => {
        const uid = userId || currentUser?.id;
        if (uid) {
            localStorage.setItem(`role_${uid}`, role);
            
            if (currentUser) {
                setCurrentUser(prev => ({
                    ...prev,
                    role
                }));
            }
        }
    };

    // Get user's ID token for backend auth
    const getIdToken = async () => {
        if (auth.currentUser) {
            return await auth.currentUser.getIdToken(true);
        }
        return null;
    };

    const value = {
        currentUser,
        signup,
        login,
        logout,
        signInWithGoogle,
        signInWithGithub,
        signInAsGuest,
        setUserRole,
        getIdToken,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}; 