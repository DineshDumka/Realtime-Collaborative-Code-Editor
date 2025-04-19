import React, { useState, useEffect } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const isHost = currentUser?.role === 'host';

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    useEffect(() => {
        if (currentUser?.username) {
            setUsername(currentUser.username);
        }
    }, [currentUser]);

    const createNewRoom = (e) => {
        e.preventDefault();
        
        // Only hosts can create rooms
        if (!isHost) {
            toast.error('Only hosts can create new rooms');
            return;
        }
        
        const id = uuidV4();
        setRoomId(id);
        toast.success('Created a new room');
    };

    const joinRoom = () => {
        if (!roomId) {
            toast.error('ROOM ID is required');
            return;
        }

        // Redirect
        navigate(`/editor/${roomId}`, {
            state: {
                username: currentUser?.username || username,
                isHost: currentUser?.role === 'host',
                userId: currentUser?.id
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            toast.error('Failed to log out');
        }
    };
    
    const goToRoleSelector = () => {
        navigate('/role-selector');
    };

    return (
        <div className="homePageWrapper">
            <div className="formWrapper">
                <img
                    className="homePageLogo"
                    src="/CodETogether.png"
                    alt="CodETogether Logo"
                />
                <h4 className="mainLabel">Welcome, {currentUser?.username || 'User'}</h4>
                <p className="roleText">
                    Current role: <strong>{currentUser?.role || 'user'}</strong> 
                    <Link to="/role-selector" className="roleSelectorLink"> [Change]</Link>
                </p>
                
                {isHost ? (
                    <>
                        <h4 className="mainLabel">Generate new room or paste invitation ROOM ID</h4>
                        <div className="inputGroup">
                            <input
                                type="text"
                                className="inputBox"
                                placeholder="ROOM ID"
                                onChange={(e) => setRoomId(e.target.value)}
                                value={roomId}
                                onKeyUp={handleInputEnter}
                            />
                            <button className="btn joinBtn" onClick={joinRoom}>
                                Join
                            </button>
                            <span className="createInfo">
                                If you don't have an invite then create &nbsp;
                                <Link
                                    onClick={createNewRoom}
                                    href=""
                                    className="createNewBtn"
                                >
                                    new room
                                </Link>
                            </span>
                        </div>
                    </>
                ) : (
                    <>
                        <h4 className="mainLabel">Join a room with invitation code</h4>
                        <div className="inputGroup">
                            <input
                                type="text"
                                className="inputBox"
                                placeholder="ROOM ID"
                                onChange={(e) => setRoomId(e.target.value)}
                                value={roomId}
                                onKeyUp={handleInputEnter}
                            />
                            <button className="btn joinBtn" onClick={joinRoom}>
                                Join Room with Invite
                            </button>
                            <div className="participant-note">
                                <p>As a participant, you can only join existing rooms</p>
                            </div>
                        </div>
                    </>
                )}
                
                <div className="action-buttons">
                    <button 
                        onClick={goToRoleSelector} 
                        className="btn roleBtn"
                    >
                        Change Role
                    </button>
                    <button 
                        onClick={handleLogout} 
                        className="btn leaveBtn"
                    >
                        Logout
                    </button>
                </div>
            </div>
            <footer>
                <h4>
                    Built with ❤️ by&nbsp;
                    <a href="https://github.com/DineshDumka" target="_blank" rel="noopener noreferrer">Dinesh Dumka</a>
                </h4>
            </footer>
        </div>
    );
};

export default Home;