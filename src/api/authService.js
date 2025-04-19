import { auth } from '../firebase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Register user in the backend after Firebase auth
export const registerUser = async (userData) => {
    try {
        const token = await auth.currentUser.getIdToken();
        
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

// Verify and create/update user in backend when logging in
export const verifyUser = async () => {
    try {
        const token = await auth.currentUser.getIdToken();
        
        const response = await fetch(`${API_URL}/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'User verification failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Verification error:', error);
        throw error;
    }
};

// Update user role in backend
export const updateUserRole = async (role) => {
    try {
        const token = await auth.currentUser.getIdToken();
        
        const response = await fetch(`${API_URL}/auth/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Role update failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Role update error:', error);
        throw error;
    }
};

// Generate auth headers with Firebase token
export const getAuthHeaders = async () => {
    try {
        const token = await auth.currentUser.getIdToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    } catch (error) {
        console.error('Error generating auth headers:', error);
        return { 'Content-Type': 'application/json' };
    }
}; 