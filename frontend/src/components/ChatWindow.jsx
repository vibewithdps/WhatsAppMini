import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Clock,
  Lock,
  ArrowLeft,
  X,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useImageViewerStore } from '../store/useImageViewerStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { QuotedReplyBanner } from './QuotedReplyBanner';
import { MediaPreviewModal } from './MediaPreviewModal';

export const ChatWindow = ({ onBack }) => {
  const user = useAuthStore((state) => state.user);
  const openImageViewer = useImageViewerStore((state) => state.openImageViewer);
  const {
    activeChat,
    messages,
    onlineUsers,
    typingUsers,
    quotedMessage,
    setQuotedMessage,
    setIsGroupInfoModalOpen,
    setIsForwardModalOpen,
  } = useChatStore();

  const { startCall, startGroupCall } = useWebRTC();

  const [searchInChatText, setSearchInChatText] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeChat) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-wa-dark-bg dark:bg-wa-dark-bg bg-wa-light-bg p-8 text-center border-b-4 border-wa-green">
        <div className="w-32 h-32 md:w-40 md:h-40 mb-6 rounded-3xl p-2 bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel flex items-center justify-center shadow-2xl border border-cyan-500/20">
          <img src="/logo.png" alt="WhatsApp Mini" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-wa-text-primary mb-2">
          WhatsApp_Mini
        </h2>
        <p className="text-sm text-wa-text-secondary max-w-md leading-relaxed">
          Send and receive messages in real time with high-quality voice & video calls, end-to-end encryption, and 24-hour status updates.
        </p>
        <div className="mt-8 flex items-center gap-2 text-xs text-wa-text-secondary">
          <Lock className="w-3.5 h-3.5 text-wa-green" />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    );
  }

  // Get recipient info
  const otherUser = !activeChat.isGroupChat
    ? activeChat.users.find((u) => u._id !== user?._id) || activeChat.users[0]
    : null;

  const chatName = activeChat.isGroupChat
    ? activeChat.chatName
    : otherUser?.name || 'WhatsApp User';

  const chatAvatar = activeChat.isGroupChat
    ? activeChat.chatAvatar || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150'
    : otherUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  const isOnline = otherUser ? onlineUsers.has(otherUser._id) || otherUser.isOnline : false;
  const isTyping = (typingUsers[activeChat._id] || []).length > 0;

  // Filter messages by search in chat
  const displayedMessages = isSearchOpen && searchInChatText.trim()
    ? messages.filter((m) =>
        m.content?.toLowerCase().includes(searchInChatText.toLowerCase())
      )
    : messages;

  // Initiate Calls (1-on-1 or Group)
  const handleVoiceCall = () => {
    if (activeChat.isGroupChat) {
      startGroupCall({ chat: activeChat, callType: 'audio' });
    } else if (otherUser) {
      startCall({
        receiverUser: otherUser,
        callType: 'audio',
        chatId: activeChat._id,
      });
    }
  };

  const handleVideoCall = () => {
    if (activeChat.isGroupChat) {
      startGroupCall({ chat: activeChat, callType: 'video' });
    } else if (otherUser) {
      startCall({
        receiverUser: otherUser,
        callType: 'video',
        chatId: activeChat._id,
      });
    }
  };

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    openImageViewer({
      imageUrl: chatAvatar,
      title: chatName,
      subtitle: activeChat.isGroupChat
        ? `${activeChat.users?.length || 0} participants`
        : isOnline
        ? 'Online'
        : 'Contact',
      user: otherUser,
    });
  };

  return (
    <div className="flex-1 h-full w-full flex flex-col min-h-0 bg-wa-dark-bg dark:bg-wa-dark-bg bg-wa-light-bg relative overflow-hidden">
      {/* Chat Header */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-2.5 bg-wa-dark-header dark:bg-wa-dark-header bg-wa-light-header border-b border-wa-dark-border dark:border-wa-dark-border border-wa-light-border flex items-center justify-between z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              if (onBack) onBack();
            }}
            className="lg:hidden p-1.5 sm:p-2 text-wa-text-secondary hover:text-wa-text-primary -ml-1 rounded-full hover:bg-wa-dark-hover"
            title="Back to chats"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={handleAvatarClick}
              title="Click to view full photo"
              className="relative cursor-pointer hover:opacity-90 transition-opacity"
            >
              <img
                src={chatAvatar}
                alt={chatName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-wa-green transition-all"
              />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-wa-green rounded-full border-2 border-wa-dark-header" />
              )}
            </div>

            <div onClick={() => activeChat.isGroupChat && setIsGroupInfoModalOpen(true)}>
              <h2 className="text-sm font-semibold text-wa-text-primary group-hover:text-wa-green transition-colors">
                {chatName}
              </h2>
              <p className="text-xs text-wa-text-secondary">
                {isTyping ? (
                  <span className="text-wa-green font-medium animate-pulse">
                    typing...
                  </span>
                ) : isOnline ? (
                  <span className="text-wa-green">online</span>
                ) : activeChat.isGroupChat ? (
                  `${activeChat.users?.length || 0} participants`
                ) : otherUser?.lastSeen ? (
                  `last seen ${format(new Date(otherUser.lastSeen), 'p')}`
                ) : (
                  'offline'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Audio Call */}
          <button
            onClick={handleVoiceCall}
            title={activeChat.isGroupChat ? 'Group Voice Call' : 'Voice Call'}
            className="p-2.5 rounded-full text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-hover dark:hover:bg-wa-dark-hover hover:bg-wa-light-hover transition-colors"
          >
            <Phone className="w-5 h-5" />
          </button>

          {/* Video Call */}
          <button
            onClick={handleVideoCall}
            title={activeChat.isGroupChat ? 'Group Video Call' : 'Video Call'}
            className="p-2.5 rounded-full text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-hover dark:hover:bg-wa-dark-hover hover:bg-wa-light-hover transition-colors"
          >
            <Video className="w-5 h-5" />
          </button>

          {/* Search in Chat */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="Search messages"
            className="p-2.5 rounded-full text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-hover dark:hover:bg-wa-dark-hover hover:bg-wa-light-hover transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Group Details */}
          {activeChat.isGroupChat && (
            <button
              onClick={() => setIsGroupInfoModalOpen(true)}
              title="Group Info"
              className="p-2.5 rounded-full text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-hover dark:hover:bg-wa-dark-hover hover:bg-wa-light-hover transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search in chat bar */}
      {isSearchOpen && (
        <div className="px-4 py-2 bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel border-b border-wa-dark-border flex items-center gap-2 animate-fade-in">
          <Search className="w-4 h-4 text-wa-text-secondary" />
          <input
            type="text"
            value={searchInChatText}
            onChange={(e) => setSearchInChatText(e.target.value)}
            placeholder="Search in this conversation..."
            className="flex-1 bg-transparent text-sm text-wa-text-primary focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setSearchInChatText('');
            }}
            className="text-wa-text-secondary hover:text-wa-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-8 py-3 space-y-1 wa-chat-bg-dark dark:wa-chat-bg-dark wa-chat-bg-light overscroll-contain">
        {/* Disappearing Messages Notice */}
        {activeChat.disappearingMessagesTimer > 0 && (
          <div className="flex justify-center my-2">
            <div className="bg-wa-dark-panel/90 dark:bg-wa-dark-panel/90 bg-white/90 text-wa-text-secondary px-3 py-1 rounded-full text-[11px] flex items-center gap-1.5 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-wa-green" />
              <span>
                Disappearing messages turned on ({activeChat.disappearingMessagesTimer / 86400} days)
              </span>
            </div>
          </div>
        )}

        {/* Messages List */}
        {displayedMessages.map((msg, index) => {
          const prevMsg = displayedMessages[index - 1];
          const isNewDay =
            !prevMsg ||
            new Date(msg.createdAt).toDateString() !==
              new Date(prevMsg.createdAt).toDateString();

          return (
            <React.Fragment key={msg._id || index}>
              {/* Date Separator */}
              {isNewDay && (
                <div className="flex justify-center my-3">
                  <span className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-white text-wa-text-secondary text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm">
                    {isToday(new Date(msg.createdAt))
                      ? 'Today'
                      : isYesterday(new Date(msg.createdAt))
                      ? 'Yesterday'
                      : format(new Date(msg.createdAt), 'MMMM d, yyyy')}
                  </span>
                </div>
              )}

              {/* Message Bubble */}
              <MessageBubble
                message={msg}
                onReply={(m) => setQuotedMessage(m)}
                onForward={(m) => setIsForwardModalOpen(true, m)}
              />
            </React.Fragment>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Quoted Message Banner */}
      <QuotedReplyBanner
        quotedMessage={quotedMessage}
        onDismiss={() => setQuotedMessage(null)}
      />

      {/* Message Input Bar Pinned */}
      <div className="flex-shrink-0 z-20">
        <MessageInput />
      </div>

      {/* Media Preview Modal */}
      <MediaPreviewModal />
    </div>
  );
};
