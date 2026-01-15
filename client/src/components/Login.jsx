import React, { useState } from 'react';
import { PlayCircle } from 'lucide-react';

export default function Login({ onJoin }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-neutral-900 to-black p-4">
      <div className="w-full max-w-md bg-neutral-800 p-8 rounded-2xl shadow-xl border border-neutral-700">
        <div className="flex justify-center mb-6">
          <PlayCircle size={64} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-center mb-2">Local Watch Party</h1>
        <p className="text-neutral-400 text-center mb-8">Sync local videos with friends.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:border-red-500 focus:outline-none text-white placeholder-neutral-500"
              placeholder="Enter your name"
              autoFocus
              maxLength={20}
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
