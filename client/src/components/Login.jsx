import React, { useState, useEffect } from 'react';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';

// Reuse the server URL logic
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';

export default function Login({ onJoin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize a socket just for auth
  useEffect(() => {
    const newSocket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
    });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    if (!socket) {
        setError("Connecting to server... please wait.");
        return;
    }

    setIsLoading(true);
    setError(null);

    const event = isLogin ? 'auth-login' : 'auth-signup';
    
    socket.emit(event, { username, password }, (response) => {
        setIsLoading(false);
        if (response.success) {
            // Success!
            onJoin(response.user);
        } else {
            // Error (Wrong password, User exists, User not found rule)
            setError(response.message);
        }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-4">
      <div className="w-full max-w-md p-8 bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800">
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-red-900/50">
                <Play size={32} fill="white" className="ml-1" />
            </div>
            <h1 className="text-3xl font-bold">WatchParty</h1>
            <p className="text-neutral-500">Sync movies with friends locally</p>
        </div>

        <div className="flex w-full bg-neutral-800 rounded-lg p-1 mb-6">
            <button 
                onClick={() => { setIsLogin(true); setError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
            >
                Login
            </button>
            <button 
                onClick={() => { setIsLogin(false); setError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
            >
                Sign Up
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              placeholder="e.g. Vansh"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>
        
        <p className="mt-6 text-center text-xs text-neutral-600">
           {isLogin ? "Use your permanent ID to track stats." : "Your ID will be saved for future sessions."}
        </p>
      </div>
    </div>
  );
}
