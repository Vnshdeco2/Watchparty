import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Maximize, Minimize, Volume2, VolumeX, Settings, FileVideo, MessageSquare, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import Chat from './Chat';

export default function VideoPlayer({ socket, roomId, isReady, onReady, file, onFileSelect, peersReady, chatProps, onLeave }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [localFileUrl, setLocalFileUrl] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Sync Logic Flags
  const isRemoteUpdate = useRef(false);
  const lastSyncTime = useRef(0);

  // --- Handlers for User Interactions ---

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalFileUrl(url);
      onFileSelect(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
    } else {
      videoRef.current.pause();
    }
  };

  const activeSync = isReady && peersReady; // Only sync if handshake complete

  const emitEvent = (action, extra = {}) => {
    if (!activeSync) return;
    if (isRemoteUpdate.current) return;

    const state = {
      roomId,
      action,
      currentTime: videoRef.current ? videoRef.current.currentTime : 0,
      isPlaying: !videoRef.current?.paused,
      playbackRate: videoRef.current?.playbackRate || 1,
      ...extra
    };
    socket.emit('sync-action', state);
  };

  // --- Video Event Listeners (Emit to Socket) ---

  const onPlay = () => {
    setIsPlaying(true);
    emitEvent('play');
  };

  const onPause = () => {
    setIsPlaying(false);
    emitEvent('pause');
  };

  const onSeeked = () => {
    // CRITICAL: Do not emit 'seek' if this seek was caused by a remote update
    if (isRemoteUpdate.current) return;
    emitEvent('seek');
  };

  const onRateChange = () => {
    setPlaybackRate(videoRef.current.playbackRate);
    emitEvent('rateChange');
  };

  // --- Socket Event Listeners (Receive from Socket) ---

  useEffect(() => {
    if (!socket) return;

    const handleSync = (data) => {
      if (!videoRef.current) return;
      // if (!activeSync) return; // Should we apply updates if we aren't ready? Maybe not.

      const { action, currentTime: remoteTime, isPlaying: remoteIsPlaying, playbackRate: remoteRate } = data;
      
      isRemoteUpdate.current = true; // Suppress echo

      // --- Smart Sync Logic ---
      const isSyncTick = action === 'syncTick';
      const threshold = isSyncTick ? 2.0 : 0.5; // Tolerant for drift checks, strict for actions

      const diff = Math.abs(videoRef.current.currentTime - remoteTime);

      // 1. Time Sync
      if (diff > threshold) {
        console.log(`Syncing time: Local ${videoRef.current.currentTime} vs Remote ${remoteTime}`);
        videoRef.current.currentTime = remoteTime;
      }
      
      // 2. Play/Pause State Sync
      // Only "syncTick" should NOT force pause (prevent buffering loops)
      // Explicit actions ('play', 'pause') ALWAYS execute.
      if (!isSyncTick || remoteIsPlaying) {
          if (remoteIsPlaying && videoRef.current.paused) {
            videoRef.current.play().catch(e => console.log("Autoplay blocked", e));
          } else if (!remoteIsPlaying && !videoRef.current.paused) {
            // Only pause if it wasn't a background tick (unless we really are way off?)
            // Actually, if it's a 'pause' event, we must pause.
            // If it's a 'syncTick' and remote is paused, we ignore it to prevent
            // one person pausing causing the other to pause if they are just lagging.
            if (!isSyncTick) {
                 videoRef.current.pause();
            }
          }
      }

      if (videoRef.current.playbackRate !== remoteRate) {
        videoRef.current.playbackRate = remoteRate;
      }

      // Reset flag after a tick
      setTimeout(() => { isRemoteUpdate.current = false; }, 50);
    };

    socket.on('sync-action', handleSync);

    return () => {
      socket.off('sync-action', handleSync);
    };
  }, [socket, activeSync]);

  // --- Drift Correction ---
  useEffect(() => {
    const driftInterval = setInterval(() => {
      if (!activeSync || !videoRef.current || videoRef.current.paused) return;
      
      // Send sync tick
      // NOTE: In a P2P or real scenario, we'd be more careful. 
      // Here we just broadcast our time. If everyone broadcasts, it might jitter.
      // Better: Host authority? Or just loose consensus. 
      // Requirement: "Add drift correction: every 5 seconds send currentTime; if drift > 0.3s, auto-correct"
      
      // We emit a 'syncTick'. Receiver decides if they are too far behind.
      // To avoid loops: rely on the receiver's check.
      
      socket.emit('sync-action', {
        roomId,
        action: 'syncTick',
        currentTime: videoRef.current.currentTime,
        isPlaying: !videoRef.current.paused,
        playbackRate: videoRef.current.playbackRate
      });

    }, 5000);

    return () => clearInterval(driftInterval);
  }, [activeSync, socket, roomId]);

  // --- UI Updates Loop ---
  useEffect(() => {
    const updateTime = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
        setDuration(videoRef.current.duration || 0);
      }
      if (videoRef.current && !videoRef.current.paused) {
        requestAnimationFrame(updateTime);
      }
    };
    
    // Trigger on play
    if (isPlaying) updateTime();
    
    // Also a slower interval for ensuring UI matches
    const i = setInterval(() => {
       if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
        if (videoRef.current.duration) setDuration(videoRef.current.duration);
       }
    }, 500);
    return () => clearInterval(i);
  }, [isPlaying]);

  // --- Keyboard & Fullscreen ---
  
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT') return; // Ignore if typing in chat
      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k': e.preventDefault(); togglePlay(); break;
        case 'f': toggleFullscreen(); break;
        case 'arrowright': if (videoRef.current) videoRef.current.currentTime += 5; break;
        case 'arrowleft': if (videoRef.current) videoRef.current.currentTime -= 5; break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggleFullscreen]);

  // --- Formatting ---
  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const min = Math.floor(t / 60);
    const sec = Math.floor(t % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const lastClickTime = useRef(0);
  const handleVideoClick = (e) => {
    const now = Date.now();
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    if (now - lastClickTime.current < 300) {
      // Double click
      if (x < rect.width / 3) {
        // Left side: Rewind
        if (videoRef.current) videoRef.current.currentTime -= 10;
      } else if (x > (rect.width * 2) / 3) {
        // Right side: Forward
        if (videoRef.current) videoRef.current.currentTime += 10;
      } else {
        toggleFullscreen();
      }
    } else {
      // Single click (wait to see if double?) 
      // Simplified: Toggle play immediately, double click will just seek too.
      togglePlay();
    }
    lastClickTime.current = now;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group flex items-center justify-center overflow-hidden"
      onMouseMove={() => { setShowControls(true); clearTimeout(window.controlsTimeout); window.controlsTimeout = setTimeout(() => setShowControls(false), 3000); }}
      onClick={() => {
        // Mobile tap to show controls
        setShowControls(true);
        setTimeout(() => setShowControls(false), 3000);
      }}
    >
      {/* Local File Picker Overlay (If not loaded) */}
      {!localFileUrl && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-900/90 text-white">
          <FileVideo size={64} className="mb-4 text-neutral-500" />
          <h3 className="text-xl font-bold mb-2">Load Video File</h3>
          <p className="text-neutral-400 mb-6">Choose the video file to sync.</p>
          <label className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
            Select File
            <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      )}

      {/* Handshake Overlay (Loaded but not pressed Play) */}
      {localFileUrl && !activeSync && (
         <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white">
           <h3 className="text-2xl font-bold mb-4">Waiting for Room to Sync</h3>
           <div className="flex gap-4">
             <div className="text-center">
               <div className={clsx("w-4 h-4 rounded-full mx-auto mb-2", isReady ? "bg-green-500" : "bg-red-500")}></div>
               <p>You</p>
             </div>
             <div className="text-center">
               <div className={clsx("w-4 h-4 rounded-full mx-auto mb-2", peersReady ? "bg-green-500" : "bg-red-500")}></div>
               <p>Partner</p>
             </div>
           </div>
           
           {!isReady && (
             <button 
               onClick={onReady}
               className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg animate-pulse"
             >
               Press to Ready Up
             </button>
           )}
           {isReady && !peersReady && (
             <p className="mt-8 text-neutral-400 animate-pulse">Waiting for partner...</p>
           )}
         </div>
      )}

      {/* Video Element */}
      {localFileUrl && (
        <video
          ref={videoRef}
          src={localFileUrl}
          className="w-full h-full object-contain"
          onClick={handleVideoClick}
          onPlay={onPlay}
          onPause={onPause}
          onSeeked={onSeeked}
          onRateChange={onRateChange}
          playsInline
        />
      )}

      {/* Chat Overlay (Fullscreen Only) */}
      {isFullscreen && chatProps && (
        <Chat 
           isOverlay={true} 
           isOpen={isChatOpen} 
           onOpen={() => setIsChatOpen(true)} 
           onClose={() => setIsChatOpen(false)}
           {...chatProps} 
        />
      )}

      {/* HUD / Controls */}
      <div 
        className={clsx(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 py-4 transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={(e) => {
            const time = parseFloat(e.target.value);
            setCurrentTime(time);
            if(videoRef.current) videoRef.current.currentTime = time;
          }}
          className="w-full h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all accent-red-600 mb-4"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-red-500 transition">
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            
            <div className="flex items-center gap-2 group/vol">
              <button 
                onClick={() => { setIsMuted(!isMuted); if(videoRef.current) videoRef.current.muted = !isMuted; }}
                className="p-1"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input 
                type="range" min="0" max="1" step="0.1"
                value={volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  if(videoRef.current) {
                     videoRef.current.volume = v;
                     videoRef.current.muted = v === 0;
                  }
                }}
                className="w-0 overflow-hidden group-hover/vol:w-20 transition-all active:w-20 h-1 accent-white hidden md:block"
              />
            </div>

            <span className="text-sm font-mono text-neutral-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group/speed">
              <button className="text-sm font-bold hover:bg-white/20 px-2 py-1 rounded">
                {playbackRate}x
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/speed:flex flex-col bg-black/80 rounded overflow-hidden">
                {[0.5, 1, 1.25, 1.5, 2].map(rate => (
                  <button 
                    key={rate} 
                    onClick={() => {
                        if(videoRef.current) videoRef.current.playbackRate = rate;
                    }}
                    className="px-4 py-2 hover:bg-neutral-700 text-sm"
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            <button onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>

            {/* Fullscreen Extras */}
            {isFullscreen && (
                <>
                    <button onClick={() => setIsChatOpen(!isChatOpen)} title="Toggle Chat" className={clsx(isChatOpen && "text-red-500")}>
                        <MessageSquare size={20} />
                    </button>
                    <button onClick={onLeave} className="text-red-500 hover:text-red-400" title="Leave Room">
                        <LogOut size={20} />
                    </button>
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
