import React, { useEffect, useState } from 'react';
import { useCallStore } from '../store/useCallStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { Phone, Mic, MicOff, Video, VideoOff, Users, Maximize } from 'lucide-react';
import AgoraRTC, { 
  AgoraRTCProvider, 
  useRTCClient, 
  useLocalMicrophoneTrack, 
  useLocalCameraTrack, 
  usePublish, 
  useJoin, 
  useRemoteUsers,
  RemoteUser 
} from 'agora-rtc-react';
import api from '../services/api';

const appId = 'eb9f5ea21d374767921563597696b9d2';

const CallUI = () => {
  const { callStatus, callType, caller, receiver, endActiveCall, isMuted, isCameraOff, toggleMute, toggleCamera, isGroupCall, groupInfo, chatId } = useCallStore();
  const { cleanupPeer } = useWebRTC();
  const [token, setToken] = useState(null);
  const [uid, setUid] = useState(0);

  const peer = isGroupCall
    ? { name: groupInfo?.groupName || 'Group Call', avatar: groupInfo?.groupAvatar }
    : receiver || caller || { name: 'WhatsApp Contact' };

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

  return (
    <div className="fixed inset-0 bg-[#0b141a] z-50 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-8 text-center z-10 w-full px-4">
        <h2 className="text-white text-2xl font-light mb-2">{peer.name}</h2>
        <p className="text-gray-400">
          {callStatus === 'calling' && 'Calling...'}
          {callStatus === 'connecting' && 'Connecting...'}
          {callStatus === 'connected' && !isConnected && 'Joining Secure Channel...'}
          {callStatus === 'connected' && isConnected && (callType === 'video' ? 'Video Call' : 'Voice Call')}
        </p>
      </div>

      {/* Video Container */}
      <div className="w-full h-full relative">
        {callType === 'video' ? (
          <>
            {/* Remote Videos */}
            <div className="w-full h-full flex flex-wrap bg-black">
              {remoteUsers.length > 0 ? (
                remoteUsers.map((user) => (
                  <div key={user.uid} className={`relative flex-grow ${remoteUsers.length > 1 ? 'w-1/2 h-1/2' : 'w-full h-full'}`}>
                    <RemoteUser user={user} playVideo={true} playAudio={true} className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      Participant {user.uid}
                    </span>
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {callStatus === 'connected' ? (
                    <p className="text-gray-400">Waiting for others to join...</p>
                  ) : (
                    <img src={peer.avatar || 'https://via.placeholder.com/150'} alt="Avatar" className="w-32 h-32 rounded-full shadow-2xl opacity-50" />
                  )}
                </div>
              )}
            </div>
            
            {/* Local Video */}
            <div className="absolute bottom-32 right-6 w-32 h-48 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 z-20">
              {localCameraTrack ? (
                <div className="w-full h-full" ref={(node) => { if (node) localCameraTrack.play(node) }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500 text-xs">
                  {isCameraOff ? 'Camera Off' : 'Loading...'}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Audio Call UI */
          <div className="w-full h-full flex items-center justify-center bg-[#0b141a]">
            <div className="relative">
              <img src={peer.avatar || 'https://via.placeholder.com/150'} alt="Avatar" className="w-48 h-48 rounded-full shadow-2xl" />
              {(callStatus === 'calling' || callStatus === 'connecting' || !isConnected) && (
                <div className="absolute inset-0 rounded-full animate-ping border-4 border-[#00a884] opacity-20"></div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 w-full flex justify-center items-center space-x-8 z-30">
        <button onClick={toggleMute} className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-white text-black' : 'bg-gray-800 text-white bg-opacity-70 hover:bg-opacity-100'}`}>
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        {callType === 'video' && (
          <button onClick={toggleCamera} className={`p-4 rounded-full transition-colors ${isCameraOff ? 'bg-white text-black' : 'bg-gray-800 text-white bg-opacity-70 hover:bg-opacity-100'}`}>
            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}
        <button onClick={() => { cleanupPeer(); endActiveCall(); }} className="p-4 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-xl transform hover:scale-105 transition-all">
          <Phone className="w-8 h-8 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
};

// Root Component providing the Agora Client Context
export const CallScreen = () => {
  const agoraClient = useRTCClient(AgoraRTC.createClient({ codec: 'vp8', mode: 'rtc' }));
  return (
    <AgoraRTCProvider client={agoraClient}>
      <CallUI />
    </AgoraRTCProvider>
  );
};
