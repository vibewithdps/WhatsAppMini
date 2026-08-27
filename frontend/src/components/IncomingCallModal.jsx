import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import { useWebRTC } from '../hooks/useWebRTC';

export const IncomingCallModal = () => {
  const { callStatus, caller, callType, rejectIncomingCall } = useCallStore();
  const { answerCall } = useWebRTC();

  if (callStatus !== 'incoming' || !caller) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center border border-wa-dark-border">
        {/* Pulsing Avatar Ring */}
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-full bg-wa-green/20 animate-ping absolute inset-0" />
          <img
            src={
              caller.avatar ||
              '/default-avatar.svg'
            }
            alt={caller.name}
            className="w-28 h-28 rounded-full object-cover relative z-10 shadow-lg ring-4 ring-wa-green"
          />
        </div>

        <h3 className="text-xl font-bold text-wa-text-primary mb-1">
          {caller.name}
        </h3>
        <p className="text-sm text-wa-green font-medium flex items-center gap-1.5 mb-8">
          {callType === 'video' ? (
            <Video className="w-4 h-4" />
          ) : (
            <Phone className="w-4 h-4" />
          )}
          <span>Incoming {callType === 'video' ? 'Video' : 'Voice'} Call...</span>
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-10 w-full">
          {/* Decline */}
          <button
            onClick={rejectIncomingCall}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-red-600 group-hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-xs text-wa-text-secondary">Decline</span>
          </button>

          {/* Accept */}
          <button
            onClick={answerCall}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-wa-green group-hover:bg-wa-green-dark text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 animate-bounce">
              <Phone className="w-6 h-6" />
            </div>
            <span className="text-xs text-wa-green font-semibold">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};
