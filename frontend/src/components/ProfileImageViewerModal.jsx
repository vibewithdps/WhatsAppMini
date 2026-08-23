import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Phone,
  Video,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { useImageViewerStore } from '../store/useImageViewerStore';
import { useChatStore } from '../store/useChatStore';
import { useWebRTC } from '../hooks/useWebRTC';

export const ProfileImageViewerModal = () => {
  const { isOpen, imageUrl, title, subtitle, user, closeImageViewer } = useImageViewerStore();
  const { selectChat, chats } = useChatStore();
  const { startCall } = useWebRTC();

  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleMessageUser = () => {
    if (user) {
      const existingChat = chats.find(
        (c) =>
          !c.isGroupChat &&
          c.users.some((u) => u._id === user._id)
      );
      if (existingChat) {
        selectChat(existingChat);
      }
    }
    closeImageViewer();
  };

  const handleStartCall = (callType) => {
    if (user) {
      const existingChat = chats.find(
        (c) =>
          !c.isGroupChat &&
          c.users.some((u) => u._id === user._id)
      );
      startCall({
        receiverUser: user,
        callType,
        chatId: existingChat?._id || 'direct_call',
      });
    }
    closeImageViewer();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title.replace(/\s+/g, '_')}_profile.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none animate-fade-in">
      {/* Top Header */}
      <div className="p-4 md:px-8 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3.5">
          <img
            src={imageUrl}
            alt={title}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-wa-green/60 shadow-lg"
          />
          <div>
            <h2 className="text-base md:text-lg font-bold text-white leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-wa-text-secondary">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleRotate}
            title="Rotate"
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            title="Download Full Image"
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Close Button */}
          <button
            onClick={closeImageViewer}
            title="Close"
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors ml-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Center Full-Screen Image Preview */}
      <div
        onClick={closeImageViewer}
        className="flex-1 flex items-center justify-center p-4 overflow-hidden cursor-zoom-out"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-[90vw] max-h-[75vh] flex items-center justify-center cursor-default transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
          }}
        >
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
          />
        </div>
      </div>

      {/* Bottom Action Bar for Contacts */}
      <div className="p-4 md:pb-6 flex items-center justify-center gap-4 sm:gap-6 z-10 bg-gradient-to-t from-black/80 to-transparent">
        {user && (
          <>
            <button
              onClick={handleMessageUser}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-wa-dark-panel hover:bg-wa-dark-hover text-white text-xs font-semibold border border-wa-dark-border shadow-lg transition-transform active:scale-95"
            >
              <MessageSquare className="w-4 h-4 text-wa-green" />
              <span>Message</span>
            </button>

            <button
              onClick={() => handleStartCall('audio')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-wa-dark-panel hover:bg-wa-dark-hover text-white text-xs font-semibold border border-wa-dark-border shadow-lg transition-transform active:scale-95"
            >
              <Phone className="w-4 h-4 text-cyan-400" />
              <span>Voice Call</span>
            </button>

            <button
              onClick={() => handleStartCall('video')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-wa-dark-panel hover:bg-wa-dark-hover text-white text-xs font-semibold border border-wa-dark-border shadow-lg transition-transform active:scale-95"
            >
              <Video className="w-4 h-4 text-emerald-400" />
              <span>Video Call</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
