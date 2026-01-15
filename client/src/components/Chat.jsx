import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X } from 'lucide-react';
import { clsx } from 'clsx';

export default function Chat({ messages, onSendMessage, user, isOverlay = false, isOpen = false, onOpen, onClose, typingUsers = [], onTyping }) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [now, setNow] = useState(Date.now());

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOverlay, isOpen]);

  // For overlay mode fading (only when closed)
  useEffect(() => {
    if (!isOverlay || isOpen) return;
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [isOverlay, isOpen]);

  const handleInput = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (onTyping) {
        onTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 2000);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
    
    // Clear typing immediately
    if (onTyping) {
        onTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  // Filter for overlay:
  // If Closed: Show only last 5 messages within 5 seconds
  // If Open: Show all messages
  let visibleMessages = messages;
  if (isOverlay && !isOpen) {
    visibleMessages = messages.filter(m => now - new Date(m.timestamp).getTime() < 5000);
    if (visibleMessages.length > 5) {
      visibleMessages = visibleMessages.slice(-5);
    }
  }

  return (
    <div className={clsx(
      "flex flex-col transition-all duration-300",
      isOverlay 
        ? (isOpen 
            ? "absolute bottom-24 right-4 z-50 w-96 h-[60%] bg-black/80 backdrop-blur border border-white/10 rounded-xl" 
            : "absolute bottom-24 right-4 z-50 w-96 max-h-[60%] justify-end pointer-events-none")
        : "h-full bg-neutral-800 border-r border-neutral-700 w-80"
    )}>
      {/* Header */}
      {(!isOverlay || (isOverlay && isOpen)) && (
        <div className="p-4 border-b border-white/10 font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-red-500" />
            Chat
          </div>
          {isOverlay && (
            <button onClick={onClose} className="text-neutral-400 hover:text-white">
                <X size={20} />
            </button>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div className={clsx(
        "flex-1 px-4 py-2 space-y-3 scrollbar-hide",
        isOverlay ? (isOpen ? "overflow-y-auto" : "overflow-hidden flex flex-col justify-end") : "overflow-y-auto"
      )}>
        {visibleMessages.length === 0 && !isOverlay && isOpen && (
          <div className="text-neutral-500 text-center text-sm mt-10">No messages yet</div>
        )}

        {visibleMessages.map((msg) => {
          const isMe = msg.senderId === user.socketId; 
          return (
            <div 
              key={msg.id} 
              onClick={() => { if(isOverlay && !isOpen && onOpen) onOpen(); }}
              className={clsx(
                "flex flex-col animate-in slide-in-from-right-10 fade-in duration-300",
                isMe ? "items-end" : "items-start",
                (isOverlay && !isOpen) && "cursor-pointer pointer-events-auto hover:scale-105 transition-transform"
              )}
            >
              <div className={clsx(
                "max-w-[90%] rounded-2xl px-4 py-2 text-sm break-words shadow-md",
                isOverlay ? (
                    isMe ? "bg-red-600/90 text-white backdrop-blur-md" : "bg-neutral-800/90 text-white backdrop-blur-md border border-white/10"
                ) : (
                  isMe ? "bg-red-600 text-white" : "bg-neutral-700 text-neutral-200"
                )
              )}>
                {!isMe && <div className="text-[10px] font-bold opacity-70 mb-0.5">{msg.senderName}</div>}
                {msg.text}
              </div>
            </div>
          );
        })}
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
            <div className="text-xs text-neutral-500 italic px-2 pb-1 animate-pulse">
                {typingUsers.join(', ')} is typing...
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={clsx(
        "p-4",
        isOverlay 
            ? (isOpen ? "border-t border-white/10" : "opacity-0 h-0 p-0 overflow-hidden") 
            : "border-t border-neutral-700 bg-neutral-800"
      )}>
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={inputText}
            onChange={handleInput}
            placeholder="Type a message..."
            className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-full pl-4 pr-10 py-2 focus:outline-none focus:border-red-500 text-sm shadow-lg"
          />
          <button 
            type="submit"
            className="absolute right-1 top-1 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
