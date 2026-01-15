import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, LogIn } from 'lucide-react';
import { io } from 'socket.io-client';

// Helper to create safe IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function Lobby({ user }) {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [joinError, setJoinError] = useState('');

  // Local state for the "Create Room" modal/form
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomPass, setNewRoomPass] = useState('');

  // Socket connection is handled inside the Room component usually, 
  // but we can do a quick check or just navigate.
  // For simplicity, we navigate to the room route and let the Room component handle the socket Join logic.

  const createRoom = () => {
    const newRoomId = generateId();
    // In a real app we might verify ID uniqueness with backend first, but probability collision low.
    // We navigate with state.
    navigate(`/room/${newRoomId}?pass=${newRoomPass || ''}&create=true`);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!roomId) return;
    navigate(`/room/${roomId}?pass=${password}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-neutral-900 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create Room Card */}
        <div className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700 hover:border-red-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <Plus className="text-red-500" size={32} />
            <h2 className="text-2xl font-bold">Create Room</h2>
          </div>
          <p className="text-neutral-400 mb-6">Start a new watch party and invite a friend.</p>
          
          <div className="space-y-4">
             <div>
              <label className="block text-xs uppercase text-neutral-500 font-bold mb-1">Room Password (Optional)</label>
              <input 
                type="text" 
                value={newRoomPass}
                onChange={e => setNewRoomPass(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:outline-none focus:border-red-500"
                placeholder="secret123"
              />
            </div>
            <button 
              onClick={createRoom}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
            >
              Create New Room
            </button>
          </div>
        </div>

        {/* Join Room Card */}
        <div className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700 hover:border-blue-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <LogIn className="text-blue-500" size={32} />
            <h2 className="text-2xl font-bold">Join Room</h2>
          </div>
          <p className="text-neutral-400 mb-6">Enter an existing Room ID to join.</p>
          
          <form onSubmit={joinRoom} className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-neutral-500 font-bold mb-1">Room ID</label>
              <input 
                type="text" 
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. xk92js"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-neutral-500 font-bold mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="If required"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Join Room
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
