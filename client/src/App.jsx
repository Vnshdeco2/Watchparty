import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Lobby from './components/Lobby';
import Room from './components/Room';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check local storage for user
    const savedName = localStorage.getItem('watchparty_username');
    if (savedName) {
      setUser({ name: savedName });
    }
  }, []);

  const handleLogin = (name) => {
    localStorage.setItem('watchparty_username', name);
    setUser({ name });
    // Go to lobby if currently on login page, otherwise stay (e.g. if opened shared link)
    if (location.pathname === '/') {
      navigate('/lobby');
    }
  };

  // Protected Routes Wrapper
  const RequireAuth = ({ children }) => {
    if (!user) {
      // If trying to access a room directly, save it to redirect later? 
      // Simplified: Just show login.
      return <Login onJoin={handleLogin} />;
    }
    return children;
  };

  return (
    <div className="h-screen w-screen bg-neutral-900 text-white overflow-hidden">
      <Routes>
        <Route path="/" element={user ? <Lobby user={user} /> : <Login onJoin={handleLogin} />} />
        <Route path="/lobby" element={<RequireAuth><Lobby user={user} /></RequireAuth>} />
        <Route path="/room/:roomId" element={<RequireAuth><Room user={user} /></RequireAuth>} />
      </Routes>
    </div>
  );
}

export default App;
