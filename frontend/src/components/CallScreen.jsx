import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff, Lock, Users, RefreshCw, Minimize2, Maximize2 } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAuthStore } from '../store/useAuthStore';

const CallUI = () => {
  const user = useAuthStore((state) => state.user);
  const {
    callStatus,
    callType,
    caller,
    receiver,
    isMuted,
    isCameraOff,
    callDuration,
    setCallDuration,
    toggleMute,
    toggleCamera,
    isMinimized,
    toggleMinimize,
    endActiveCall,
    localStream,
    remoteStream,
  } = useCallStore();

  const { toggleScreenShare, cleanupPeer, flipCamera } = useWebRTC();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);


  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
    }
  }, [localStream, callStatus]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
    }
  }, [remoteStream, callStatus]);

  useEffect(() => {
    return () => {
      cleanupPeer();
    };
  }, []);

  // Handle Call Timer
  useEffect(() => {
    let interval;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        useCallStore.setState((state) => ({ callDuration: state.callDuration + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus, setCallDuration]);

  // Format Duration
  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    cleanupPeer();
    endActiveCall();
  };

  const otherUser = caller?._id === user?._id ? receiver : caller;

  if (callStatus === 'idle' || callStatus === 'incoming') return null;

  return (
    <div className={`${isMinimized ? 'fixed top-20 right-4 w-32 h-48 sm:w-48 sm:h-72 rounded-2xl shadow-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform' : 'fixed inset-0'} z-[100] bg-[#0b141a] flex flex-col items-center justify-center text-white`}>
      {/* Top Bar */}
      {!isMinimized && (
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Lock size={14} className="text-[#25d366]" /> End-to-end encrypted
        </div>
        <button onClick={toggleMinimize} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all text-white">
          <Minimize2 size={20} />
        </button>
      </div>
      )}

      {/* Main Video Area */}
      <div onClick={() => isMinimized && toggleMinimize()} className="relative w-full h-full flex flex-col items-center justify-center">
      {isMinimized && (
        <div className="absolute inset-0 z-50 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
          <Maximize2 size={32} className="text-white drop-shadow-lg" />
        </div>
      )}
        {callType === 'video' && remoteStream ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Overlay Timer for Video Call */}
            {callStatus === 'connected' && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-1.5 rounded-full text-white/90 text-sm font-medium z-10 tracking-widest backdrop-blur-md">
                {formatDuration(callDuration)}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <img src={otherUser?.avatar || 'https://via.placeholder.com/150'} alt="Avatar" className="w-40 h-40 rounded-full mb-6 object-cover border-4 border-gray-700" />
            <h1 className="text-3xl font-semibold">{otherUser?.name || 'Unknown User'}</h1>
            <p className="text-gray-400 mt-2">
              {callStatus === 'ringing' && 'Ringing...'}
              {callStatus === 'calling' && 'Calling...'}
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'connected' && formatDuration(callDuration)}
            </p>
          </div>
        )}

        {/* Local Mini Video for PiP */}
        {callType === 'video' && callStatus === 'connected' && localStream && (
          <div className="absolute top-20 right-6 w-32 h-44 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-600 z-20">
            <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform scale-x-[-1] ${isCameraOff ? 'hidden' : ''}`}
              />
              {isCameraOff && (
                <div className="absolute inset-0 bg-[#1b252d] flex flex-col items-center justify-center z-30">
                  <img src={user?.avatar || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-full border-2 border-gray-600 object-cover" />
                  <span className="text-gray-400 mt-2 text-xs">Video paused</span>
                </div>
              )}
          </div>
        )}
        
        {/* Remote audio player for Audio calls */}
        {callType === 'audio' && remoteStream && (
            <audio ref={remoteVideoRef} autoPlay />
        )}
      </div>

      {/* Bottom Controls */}
      {!isMinimized && (
      <div className="absolute bottom-24 flex items-center justify-center gap-4 sm:gap-6 px-4 sm:px-8 py-4 bg-gray-900/80 rounded-full backdrop-blur-md z-10 scale-75 sm:scale-100">
        <button
          onClick={() => {
             if (localStream && localStream.getAudioTracks()[0]) {
               const track = localStream.getAudioTracks()[0];
               track.enabled = !track.enabled;
             }
             toggleMute();
          }}
          className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white/20 text-white' : 'bg-white/10 hover:bg-white/20'}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

                {callType === 'video' && (
          <button
            onClick={flipCamera}
            className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
            title="Flip Camera"
          >
            <RefreshCw size={24} />
          </button>
        )}
        
        {callType === 'video' && (
          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-all ${isScreenSharing ? 'bg-blue-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            title="Share Screen"
          >
            <MonitorUp size={24} />
          </button>
        )}

        {callType === 'video' && (
          <button
            onClick={() => {
              if (localStream && localStream.getVideoTracks()[0]) {
                const track = localStream.getVideoTracks()[0];
                track.enabled = !track.enabled;
              }
              toggleCamera();
            }}
            className={`p-4 rounded-full transition-all ${isCameraOff ? 'bg-white/20 text-white' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
        )}

        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-all text-white mx-4 shadow-lg shadow-red-500/20"
        >
          <PhoneOff size={28} />
        </button>
      </div>
      )}
    </div>
  );
};

export { CallUI as CallScreen };
export default CallUI;
