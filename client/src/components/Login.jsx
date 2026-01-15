import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { useTheme } from './ThemeContext';

export default function Login({ onJoin }) {
  const [username, setUsername] = useState('');
  const { currentTheme } = useTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    // Simple Entry - No Password required as per request
    const userData = { 
        name: username, 
        id: username.toLowerCase() + '-' + Math.floor(Math.random() * 1000) 
    };
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Display Name</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              placeholder="e.g. Vansh"
              autoFocus
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-transform active:scale-95"
            disabled={!username.trim()}
          >
            Enter Party
          </button>
        </form>
        
        <p className="mt-6 text-center text-xs text-neutral-600">
           Enter a name to join or create rooms.
        </p>
      </div>
    </div>
  );
}
