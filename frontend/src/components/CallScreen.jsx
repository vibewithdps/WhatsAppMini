import React, { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Lock,
  Users,
} from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAuthStore } from '../store/useAuthStore';

export const CallScreen = () => {
  const user = useAuthStore((state) => state.user);
  const {
    callStatus,
    callType,
    isGroupCall,
    groupInfo,
    groupPeers,
    caller,
    receiver,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    callDuration,
    setCallDuration,
    toggleMute,
    toggleCamera,
    endActiveCall,
  } = useCallStore();

  const { toggleScreenShare, cleanupPeer } = useWebRTC();

  const remoteAudioRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  // Auto-play remote audio stream
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch((e) => console.log('Audio autoplay:', e));
    }
  }, [remoteStream]);

  // Auto-play remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((e) => console.log('Video autoplay:', e));
    }
  }, [remoteStream, callType]);

  // Auto-play local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Duration timer
  useEffect(() => {
    let timer;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration(useCallStore.getState().callDuration + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus, setCallDuration]);

  if (callStatus !== 'calling' && callStatus !== 'connected') return null;

  const peer = isGroupCall
    ? { name: groupInfo?.groupName || 'Group Call', avatar: groupInfo?.groupAvatar }
    : receiver || caller || { name: 'WhatsApp Contact' };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHangup = () => {
    cleanupPeer();
    endActiveCall(true);
  };

  const handleScreenTouchToPlay = () => {
    if (remoteAudioRef.current) remoteAudioRef.current.play().catch(() => {});
    if (remoteVideoRef.current) remoteVideoRef.current.play().catch(() => {});
  };

  return (
    <div
      onClick={handleScreenTouchToPlay}
      className="fixed inset-0 z-50 bg-wa-dark-bg flex flex-col justify-between p-3 sm:p-6 select-none animate-fade-in"
    >
      {/* Hidden Audio Player for Remote Audio Stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Header */}
      <div className="flex items-center justify-between z-10 pt-2 sm:pt-0">
        <div className="flex items-center gap-2 text-xs text-wa-text-secondary">
          <Lock className="w-3.5 h-3.5 text-wa-green" />
          <span className="inline">
            {isGroupCall ? 'Encrypted Group Call' : 'End-to-End Encrypted'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isGroupCall && (
            <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center gap-1.5 text-xs text-cyan-400 font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>Group ({1 + groupPeers.length})</span>
            </div>
          )}

          <div className="px-3 py-1 bg-wa-dark-panel/90 rounded-full border border-wa-dark-border shadow">
            <span className="text-xs font-semibold text-wa-green">
              {callStatus === 'calling' ? 'Calling...' : formatDuration(callDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Center Stage: Video Display or Audio Presentation */}
      <div className="flex-1 relative flex items-center justify-center my-2 sm:my-3 overflow-hidden rounded-3xl bg-black/60 border border-wa-dark-border">
        {isGroupCall ? (
          /* Multi-Participant Group Call Grid */
          <div className="w-full h-full p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 overflow-y-auto">
            {/* Self Video Card */}
            <div className="relative rounded-2xl overflow-hidden bg-wa-dark-panel border border-wa-dark-border flex items-center justify-center min-h-[160px] shadow-lg">
              {callType === 'video' && !isCameraOff ? (
                <video
                  ref={(el) => {
                    if (el && localStream) {
                      el.srcObject = localStream;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt="You"
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-wa-green"
                  />
                  <span className="text-xs font-bold text-wa-text-primary">You</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 text-[11px] text-white font-semibold">
                You {isMuted && '(Muted)'}
              </div>
            </div>

            {/* Other Remote Peers */}
            {groupPeers.map((p, idx) => (
              <div
                key={p.socketId || idx}
                className="relative rounded-2xl overflow-hidden bg-wa-dark-panel border border-wa-dark-border flex items-center justify-center min-h-[160px] shadow-lg"
              >
                {p.stream ? (
                  <video
                    ref={(el) => {
                      if (el && p.stream) {
                        el.srcObject = p.stream;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={p.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={p.user?.name || 'Member'}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-cyan-400"
                    />
                    <span className="text-xs font-bold text-wa-text-primary">
                      {p.user?.name || 'Participant'}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 text-[11px] text-white font-semibold">
                  {p.user?.name || 'Participant'}
                </div>
              </div>
            ))}
          </div>
        ) : callType === 'video' ? (
          /* 1-on-1 Video Call Layout */
          <>
            {/* Remote Full Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover rounded-3xl transition-opacity duration-300 ${
                remoteStream ? 'opacity-100' : 'opacity-0 absolute'
              }`}
            />

            {!remoteStream && (
              <div className="flex flex-col items-center gap-4 text-center p-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-wa-green/20 animate-ping absolute inset-0" />
                  <img
                    src={
                      peer.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                    }
                    alt={peer.name}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-wa-dark-panel relative z-10 shadow-xl"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-wa-text-primary">
                    {peer.name}
                  </h2>
                  <p className="text-xs text-wa-text-secondary mt-1">
                    {callStatus === 'calling' ? 'Ringing...' : 'Connecting video...'}
                  </p>
                </div>
              </div>
            )}

            {/* Local PIP Video (Self Camera) */}
            <div className="absolute bottom-3 right-3 w-28 h-40 sm:w-36 sm:h-48 md:w-48 md:h-64 bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-wa-dark-border z-20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isCameraOff && (
                <div className="absolute inset-0 bg-wa-dark-panel flex items-center justify-center">
                  <VideoOff className="w-6 h-6 text-wa-text-secondary" />
                </div>
              )}
            </div>
          </>
        ) : (
          /* 1-on-1 Voice Call Presentation */
          <div className="flex flex-col items-center gap-6 p-4">
            <div className="relative">
              {callStatus === 'connected' && (
                <div className="absolute inset-0 rounded-full bg-wa-green/20 animate-ping" />
              )}
              <img
                src={
                  peer.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                }
                alt={peer.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ring-8 ring-wa-dark-panel relative z-10 shadow-2xl"
              />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-wa-text-primary">
                {peer.name}
              </h2>
              <p className="text-sm text-wa-text-secondary mt-1">
                {callStatus === 'calling' ? 'Ringing...' : 'Voice call in progress'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 z-10 pb-2 sm:pb-0">
        {/* Toggle Microphone */}
        <button
          onClick={toggleMute}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted
              ? 'bg-red-500 text-white'
              : 'bg-wa-dark-panel hover:bg-wa-dark-hover text-wa-text-primary border border-wa-dark-border shadow'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        {/* Toggle Video Camera */}
        {callType === 'video' && (
          <button
            onClick={toggleCamera}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
              isCameraOff
                ? 'bg-red-500 text-white'
                : 'bg-wa-dark-panel hover:bg-wa-dark-hover text-wa-text-primary border border-wa-dark-border shadow'
            }`}
            title={isCameraOff ? 'Turn on Camera' : 'Turn off Camera'}
          >
            {isCameraOff ? (
              <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Video className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>
        )}

        {/* Screen Share (Desktop) */}
        {callType === 'video' && (
          <button
            onClick={toggleScreenShare}
            className={`hidden md:flex w-12 h-12 sm:w-14 sm:h-14 rounded-full items-center justify-center transition-all ${
              isScreenSharing
                ? 'bg-wa-green text-white'
                : 'bg-wa-dark-panel hover:bg-wa-dark-hover text-wa-text-primary border border-wa-dark-border shadow'
            }`}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          >
            <ScreenShare className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={handleHangup}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>
    </div>
  );
};
