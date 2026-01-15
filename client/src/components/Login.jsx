import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { useTheme } from './ThemeContext';

export default function Login({ onJoin }) {
  const [isLogin, setIsLogin] = useState(true); // Login vs Signup
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { currentTheme } = useTheme(); // Just for initial styling (we might default to dark)

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    
    // In a real app, we'd verify with server.
    // For now, we trust the client and save to local storage as requested.
    // "when they first enter... they will set there username... set up there password... use that same id"
    
    const userData = { name: username, id: username.toLowerCase() }; // ID is handle
    onJoin(userData);
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
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
            >
                Login
            </button>
            <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
            >
                Sign Up
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              placeholder="e.g. Vansh"
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
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-transform active:scale-95"
          >
            {isLogin ? 'Enter Party' : 'Create Account'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-xs text-neutral-600">
           {isLogin ? "Use your permanent ID to track stats." : "Your ID will be saved for future sessions."}
        </p>
      </div>
    </div>
  );
}
