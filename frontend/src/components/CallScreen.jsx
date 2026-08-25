import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff, Lock, Users } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAuthStore } from '../store/useAuthStore';
import AgoraRTC, { AgoraRTCProvider, useRTCClient, useLocalMicrophoneTrack, useLocalCameraTrack, usePublish, useJoin, useRemoteUsers, RemoteUser } from 'agora-rtc-react';
import api from '../services/api';

const appId = 'eb9f5ea21d374767921563597696b9d2';

const CallUI = () => {
  const user = useAuthStore((state) => state.user);
  const {
    callStatus,
    callType,
    isGroupCall,
    groupInfo,
    caller,
    receiver,
    isMuted,
    isCameraOff,
    isScreenSharing,
    callDuration,
    setCallDuration,
    toggleMute,
    toggleCamera,
    chatId,
    endActiveCall,
  } = useCallStore();
  const { toggleScreenShare, cleanupPeer } = useWebRTC();

  const [token, setToken] = useState(null);
  const [uid, setUid] = useState(0);

  // Generate token dynamically when connected
  useEffect(() => {
    let isMounted = true;
    if (callStatus === 'connected') {
      const fetchToken = async () => {
        try {
          const res = await api.get(`/agora/token?channelName=${chatId}`);
          if (isMounted) {
            setToken(res.data.token);
            setUid(res.data.uid);
          }
        } catch (error) {
          console.error("Failed to fetch Agora token", error);
        }
      };
      fetchToken();
    }
    return () => { isMounted = false; };
  }, [callStatus, chatId]);

  // Agora Hooks
  const { isLoading: isJoining, isConnected } = useJoin(
    { appid: appId, channel: chatId, token: token, uid: uid },
    callStatus === 'connected' && !!token
  );
  
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(callStatus === 'connected');
  const { localCameraTrack } = useLocalCameraTrack(callStatus === 'connected' && callType === 'video');
  
  usePublish([localMicrophoneTrack, localCameraTrack]);
  const remoteUsers = useRemoteUsers();

  // Handle Mute/Camera Toggles
  useEffect(() => {
    if (localMicrophoneTrack) localMicrophoneTrack.setMuted(isMuted);
  }, [isMuted, localMicrophoneTrack]);

  useEffect(() => {
    if (localCameraTrack) localCameraTrack.setMuted(isCameraOff);
  }, [isCameraOff, localCameraTrack]);

  // Timer logic
  useEffect(() => {
    let timer;
    if (callStatus === 'connected' && isConnected) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus, isConnected, setCallDuration]);

  if (callStatus !== 'calling' && callStatus !== 'connecting' && callStatus !== 'connected') return null;

  const peer = isGroupCall
    ? { name: groupInfo?.groupName || 'Group Call', avatar: groupInfo?.groupAvatar }
    : receiver || caller || { name: 'WhatsApp Contact' };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    cleanupPeer();
    endActiveCall();
  };

  return (
    <div className="fixed inset-0 bg-[#0b141a] z-50 flex flex-col font-sans">
      {/* Header */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2 text-wa-green/90">
          <Lock className="w-4 h-4" />
          <span className="text-xs font-medium">End-to-End Encrypted</span>
        </div>
        
        {isGroupCall && (
          <div className="flex items-center gap-2 bg-wa-dark-panel/80 px-3 py-1.5 rounded-full">
            <Users className="w-4 h-4 text-wa-icon" />
            <span className="text-xs font-medium text-wa-text-primary">Group Call</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative w-full h-full flex flex-col justify-center items-center overflow-hidden pt-16 pb-32">
        {callType === 'video' ? (
          <div className="w-full h-full relative">
            {/* Remote Videos */}
            <div className="w-full h-full flex flex-wrap bg-black">
              {remoteUsers.length > 0 ? (
                remoteUsers.map((user) => (
                  <div key={user.uid} className={`relative flex-grow ${remoteUsers.length > 1 ? 'w-1/2 h-1/2' : 'w-full h-full'}`}>
                    <RemoteUser user={user} playVideo={true} playAudio={true} className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      {isGroupCall ? `Participant ${user.uid}` : peer.name}
                    </span>
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#111b21]">
                  <img src={peer.avatar || '/default-avatar.png'} alt={peer.name} className="w-32 h-32 rounded-full mb-6 shadow-2xl object-cover ring-4 ring-wa-dark-border" />
                  <h2 className="text-white text-3xl font-normal tracking-wide">
                    {peer.name}
                  </h2>
                  <p className="text-sm text-wa-text-secondary mt-2">
                    {callStatus === 'calling' ? 'Ringing...' : callStatus === 'connecting' ? 'Connecting...' : !isConnected ? 'Joining Secure Channel...' : 'Video call in progress'}
                  </p>
                </div>
              )}
            </div>

            {/* Local Video */}
            <div className={`absolute bottom-6 right-6 w-28 h-40 md:w-40 md:h-56 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700/50 z-20 transition-all duration-300`}>
              {localCameraTrack ? (
                <div className="w-full h-full" ref={(node) => { if (node) localCameraTrack.play(node) }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
                  <VideoOff className="w-8 h-8 opacity-50" />
                </div>
              )}
            </div>
            
            {/* Overlay Timer */}
            {callStatus === 'connected' && isConnected && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 shadow-lg z-20">
                <span className="text-sm font-medium text-white tracking-widest">{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>
        ) : (
          /* Voice Call UI */
          <div className="w-full max-w-sm flex flex-col items-center mt-[-10vh]">
            <div className="relative mb-8">
              <div className={`absolute inset-0 bg-wa-green/20 rounded-full blur-xl scale-110 transition-opacity duration-1000 ${(callStatus === 'calling' || !isConnected) ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
              <img src={peer.avatar || '/default-avatar.png'} alt={peer.name} className="w-40 h-40 rounded-full object-cover shadow-2xl ring-4 ring-wa-dark-panel z-10 relative" />
            </div>
            
            <h2 className="text-white text-3xl font-normal tracking-wide text-center px-4 mb-2">
              {peer.name}
            </h2>
            
            <p className="text-base text-wa-text-secondary">
              {callStatus === 'calling' ? 'Ringing...' : callStatus === 'connecting' ? 'Connecting...' : !isConnected ? 'Joining Secure Channel...' : formatDuration(callDuration)}
            </p>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-0 w-full px-6 pb-8 pt-12 bg-gradient-to-t from-black via-black/80 to-transparent z-30">
        <div className="flex items-center justify-center gap-6 max-w-md mx-auto">
          <button onClick={toggleMute} className={`p-4 rounded-full transition-all duration-300 shadow-lg flex-shrink-0 ${isMuted ? 'bg-white text-black' : 'bg-wa-dark-panel text-white hover:bg-gray-700 border border-gray-700/50'}`}>
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          {callType === 'video' && (
            <button onClick={toggleCamera} className={`p-4 rounded-full transition-all duration-300 shadow-lg flex-shrink-0 ${isCameraOff ? 'bg-white text-black' : 'bg-wa-dark-panel text-white hover:bg-gray-700 border border-gray-700/50'}`}>
              {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          <button onClick={handleEndCall} className="p-5 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transform hover:scale-105 transition-all duration-300 flex-shrink-0 mx-2">
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const CallScreen = () => {
  const agoraClient = useRTCClient(AgoraRTC.createClient({ codec: 'vp8', mode: 'rtc' }));
  return (
    <AgoraRTCProvider client={agoraClient}>
      <CallUI />
    </AgoraRTCProvider>
  );
};
