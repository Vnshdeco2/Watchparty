import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import Login from './components/Login';
import Lobby from './components/Lobby';
import Room from './components/Room';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check local storage for user object (v2)
    const savedUser = localStorage.getItem('watchparty_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('watchparty_user');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('watchparty_user', JSON.stringify(userData));
    setUser(userData);
    if (location.pathname === '/' || location.pathname === '/login') {
      navigate('/lobby');
    }
  };

  // Protected Routes Wrapper
  const RequireAuth = ({ children }) => {
    if (!user) {
      return <Login onJoin={handleLogin} />;
    }
    return children;
  };

  return (
    <ThemeProvider>
        <div className="h-screen w-screen overflow-hidden">
        <Routes>
            <Route path="/" element={<Login onJoin={handleLogin} />} />
            <Route path="/lobby" element={<RequireAuth><Lobby user={user} /></RequireAuth>} />
            <Route path="/room/:roomId" element={<RequireAuth><Room user={user} /></RequireAuth>} />
        </Routes>
        </div>
    </ThemeProvider>
  );
}


export default App;
