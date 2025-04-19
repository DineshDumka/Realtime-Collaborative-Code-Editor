import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RoleSelector = () => {
    const { currentUser, setUserRole } = useAuth();
    const navigate = useNavigate();

    const handleRoleChange = (role) => {
        setUserRole(role);
        toast.success(`Role changed to: ${role}`);
        navigate('/');
    };

    return (
        <div className="homePageWrapper">
            <div className="formWrapper">
                <h2 className="mainLabel">Select User Role</h2>
                <p className="role-subtitle">Choose a role before continuing</p>
                <div className="role-info">
                    <span className="role-label">Current Role:</span>
                    <span className="role-value">{currentUser?.role || 'none'}</span>
                </div>
                
                <div className="role-buttons">
                    <button 
                        className="btn role-btn host-btn"
                        onClick={() => handleRoleChange('host')}
                    >
                        Set as Host
                    </button>
                    <div className="role-description">
                        <small>Will be able to create rooms and approve join requests</small>
                    </div>
                    
                    <button 
                        className="btn role-btn participant-btn"
                        onClick={() => handleRoleChange('participant')}
                    >
                        Set as Participant
                    </button>
                    <div className="role-description">
                        <small>Can only join existing rooms with permission</small>
                    </div>
                </div>
                
                <button 
                    className="btn back-btn"
                    onClick={() => navigate('/')}
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default RoleSelector; 