import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Copy, Users, LogOut } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import Chat from './Chat';

// Use the Vercel ENV VAR first (Production)
// Fallback to localhost (Development)
// Added at: {new Date().toISOString()}
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';

export default function Room({ user }) {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const password = searchParams.get('pass') || '';
  const isCreate = searchParams.get('create') === 'true';
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  
  // My State
  const [isFileLoaded, setIsFileLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set()); // Track who is typing
  const [isConnected, setIsConnected] = useState(true); // Track connection health

  useEffect(() => {
    console.log("Connecting to Server:", SERVER_URL);
    
    // Connect to Backend
    // Note: Render free tier spins down. We need robust retry logic (built-in to socket.io)
    const newSocket = io(SERVER_URL, {
        transports: ['websocket', 'polling'], // Try websocket first
        reconnection: true,
        reconnectionAttempts: Infinity, // Keep trying!
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
    });
    setSocket(newSocket);

    // Monitor Connection Health
    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    newSocket.on('connect_error', () => setIsConnected(false));
    
    // Join or Create Room
    const event = isCreate ? 'create-room' : 'join-room';
    
    // Connection listener to ensure we don't emit before connected
    const triggerJoin = () => {
        if(newSocket.connected) {
            newSocket.emit(event, { roomId, password, userName: user.name }, (response) => {
                if (!response.success) {
                    // Auto-fix: If failed to create because exists, try joining
                    if (isCreate && response.message === "Room ID already exists.") {
                        newSocket.emit('join-room', { roomId, password, userName: user.name }, (joinRes) => {
                            if (joinRes.success) {
                                setRoomState(joinRes.room);
                            } else {
                                setError(joinRes.message);
                            }
                        });
                    } else {
                        setError(response.message);
                    }
                } else {
                    setRoomState(response.room);
                }
            });
        }
    };

    newSocket.on('connect', triggerJoin);
    
    // Fallback if already connected fast
    if(newSocket.connected) triggerJoin();

    newSocket.on('user-joined', ({ userName }) => {
      // Could show toast
      console.log(`${userName} joined`);
    });

    newSocket.on('user-left', ({ userName }) => {
      // Could show toast
      console.log(`${userName} left`);
    });

    newSocket.on('room-update', ({ users }) => {
      setRoomState(prev => prev ? { ...prev, users } : null);
    });

    newSocket.on('receive-message', (msg) => {
      setMessages(prev => {
        // Optimistic UI Deduplication
        const last = prev[prev.length - 1];
        if (last && last.senderName === msg.senderName && last.text === msg.text) {
             return prev;
        }
        return [...prev, msg];
      });
    });

    newSocket.on('user-typing', ({ userName, isTyping }) => {
        setTypingUsers(prev => {
            const next = new Set(prev);
            if (isTyping) next.add(userName);
            else next.delete(userName);
            return next;
        });
    });

    return () => {
        newSocket.off('connect', triggerJoin);
        newSocket.disconnect();
    };
  }, [roomId, password, user.name, navigate]); // Removed isCreate from dependency to avoid loop

  // Derived State
  const myUser = roomState?.users.find(u => u.id === socket?.id);
  const otherUser = roomState?.users.find(u => u.id !== socket?.id);
  const peersReady = otherUser?.ready; // Simplified: check if partner is ready

  // Actions
  const handleSendMessage = (text) => {
    if (socket) {
      // Optimistic UI: Show immediately
      const tempMsg = {
          text,
          senderName: user.name,
          senderId: socket.id,
          timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMsg]);

      socket.emit('send-message', { roomId, message: text, userName: user.name });
    }
  };

  const handleTyping = (isTyping) => {
    if (socket) {
        socket.emit('typing', { roomId, userName: user.name, isTyping });
    }
  };

  const handleFileSelect = (loaded) => {
    setIsFileLoaded(loaded);
    socket.emit('status-update', { roomId, type: 'fileLoaded', value: loaded });
  };

  const handleReady = () => {
    setIsReady(true);
    socket.emit('status-update', { roomId, type: 'ready', value: true });
  };

  const copyLink = () => {
    const url = window.location.href.split('?')[0] + `?pass=${password}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const leaveRoom = () => {
    if (socket) socket.disconnect();
    navigate('/lobby');
  };

  if (error) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black text-red-500 p-4 text-center">
        <div>
           <h2 className="text-2xl font-bold mb-4">{error}</h2>
           <button onClick={() => navigate('/')} className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700">Back to Home</button>
        </div>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center bg-black text-white space-y-4">
        <div className="animate-spin h-10 w-10 border-4 border-red-500 rounded-full border-t-transparent"></div>
        <p className="animate-pulse">Connecting to Server...</p>
        <p className="text-xs text-neutral-500 max-w-xs text-center">(Takes up to 60s if server is waking up)</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-neutral-900 overflow-hidden">
      {/* Sidebar Chat (Order 1 on Desktop, Order 2 on Mobile) */}
      <div className="flex flex-col w-full md:w-80 h-[65%] md:h-full bg-neutral-900 md:bg-neutral-800 border-t md:border-t-0 md:border-r border-neutral-700 order-2 md:order-1 z-10">
        {!isConnected && (
            <div className="bg-red-600 text-white text-xs p-1 text-center font-bold uppercase tracking-wider animate-pulse">
                Reconnecting to server...
            </div>
        )}
        <div className="p-3 md:p-4 border-b border-neutral-700 bg-neutral-800">
           <div className="flex justify-between items-center mb-1">
             <div className="flex flex-col">
                <h2 className="font-bold text-base md:text-lg text-white">Room <span className="font-mono text-red-500">{roomId.substr(0,4)}</span></h2>
                <span className="text-[10px] text-neutral-500 font-mono hidden md:inline">ID: {roomId}</span>
             </div>
             <div className="flex gap-2">
                <button onClick={copyLink} className="p-2 bg-neutral-700 hover:bg-neutral-600 rounded-full text-white" title="Copy Link">
                    <Copy size={16} />
                </button>
                <button onClick={leaveRoom} className="p-2 bg-neutral-700 hover:bg-red-900/50 rounded-full text-red-500" title="Leave Room">
                    <LogOut size={16} />
                </button>
             </div>
           </div>
           <div className="text-xs text-neutral-400 flex items-center gap-2">
             <Users size={12} />
             {roomState?.users.length || 0}/2 Users
           </div>
        </div>
        
        <Chat 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          user={{ ...user, socketId: socket?.id }}
          typingUsers={Array.from(typingUsers)}
          onTyping={handleTyping}
        />
      </div>

      {/* Main Content (Video) (Order 2 on Desktop, Order 1 on Mobile) */}
      <div className="w-full md:flex-1 h-[35%] md:h-full relative flex flex-col min-w-0 order-1 md:order-2 bg-black">
        <VideoPlayer 
          socket={socket}
          roomId={roomId}
          isReady={isReady}
          onReady={handleReady}
          peersReady={peersReady}
          onFileSelect={handleFileSelect}
          onLeave={leaveRoom}
          chatProps={{ 
            messages, 
            onSendMessage: handleSendMessage, 
            user: { ...user, socketId: socket?.id },
            typingUsers: Array.from(typingUsers),
            onTyping: handleTyping
          }}
        />
      </div>
    </div>
  );
}
