import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Clock,
  Lock,
  ArrowLeft,
  UserPlus,
  Sparkles,
  FileText as FileIcon,
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
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-wa-dark-bg p-8 text-center">
        {/* Main Card */}
        <div className="bg-white dark:bg-wa-dark-panel rounded-3xl shadow-sm border border-gray-100 dark:border-wa-dark-border p-12 max-w-lg w-full flex flex-col items-center mb-8">
          
          {/* Illustration Mock */}
          <div className="relative mb-8 w-48 h-32 flex items-center justify-center">
            {/* Laptop Base */}
            <div className="absolute bottom-0 w-48 h-2 bg-[#d1d7db] dark:bg-gray-700 rounded-b-xl border border-gray-400 dark:border-gray-600"></div>
            {/* Laptop Screen */}
            <div className="absolute bottom-2 w-40 h-28 bg-[#fdfdfd] dark:bg-gray-800 rounded-t-xl border-2 border-[#d1d7db] dark:border-gray-600 flex items-center justify-center">
              {/* WhatsApp UI inside screen */}
              <div className="w-full h-full flex">
                <div className="w-1/3 border-r-2 border-[#e9edef] dark:border-gray-700 p-2 flex flex-col gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#00a884] opacity-80"></div>
                  <div className="w-full h-1 bg-[#e9edef] dark:bg-gray-700 rounded"></div>
                  <div className="w-full h-1 bg-[#e9edef] dark:bg-gray-700 rounded"></div>
                </div>
                <div className="flex-1 flex items-center justify-center bg-[#efeae2] dark:bg-wa-dark-bg">
                  <div className="bg-[#d9fdd3] dark:bg-[#005c4b] p-3 rounded-xl rounded-tr-none shadow-sm flex items-center justify-center border border-gray-300 dark:border-transparent">
                    <Phone className="w-6 h-6 text-[#111b21] dark:text-white" fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-normal text-[#41525d] dark:text-white mb-4">
            Voice and video calling is now available
          </h2>
          <p className="text-[15px] text-[#8696a0] dark:text-gray-400 mb-8 max-w-sm">
            Now you can make and join calls on WhatsApp Web.
          </p>
          <button className="bg-[#25d366] hover:bg-[#06cf9c] text-white font-semibold py-2.5 px-6 rounded-full transition-colors">
            Go to Calls
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-12 mt-4">
          <div className="flex flex-col items-center gap-2 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-wa-dark-panel shadow-sm border border-gray-200 dark:border-wa-dark-border flex items-center justify-center group-hover:bg-gray-50 transition-colors">
              <FileIcon className="w-5 h-5 text-[#54656f] dark:text-gray-300" />
            </div>
            <span className="text-xs text-[#54656f] dark:text-gray-400 font-medium">Send document</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setIsNewChatModalOpen(true)}>
            <div className="w-12 h-12 rounded-full bg-white dark:bg-wa-dark-panel shadow-sm border border-gray-200 dark:border-wa-dark-border flex items-center justify-center group-hover:bg-gray-50 transition-colors">
              <UserPlus className="w-5 h-5 text-[#54656f] dark:text-gray-300" />
            </div>
            <span className="text-xs text-[#54656f] dark:text-gray-400 font-medium">Add contact</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => {}}>
            <div className="w-12 h-12 rounded-full bg-white dark:bg-wa-dark-panel shadow-sm border border-gray-200 dark:border-wa-dark-border flex items-center justify-center group-hover:bg-gray-50 transition-colors">
              <Video className="w-5 h-5 text-[#54656f] dark:text-gray-300" />
            </div>
            <span className="text-xs text-[#54656f] dark:text-gray-400 font-medium">New call</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-wa-dark-panel shadow-sm border border-gray-200 dark:border-wa-dark-border flex items-center justify-center group-hover:bg-gray-50 transition-colors">
              <Sparkles className="w-5 h-5 text-[#00a884]" />
            </div>
            <span className="text-xs text-[#54656f] dark:text-gray-400 font-medium">Ask Meta AI</span>
          </div>
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
    ? activeChat.chatAvatar || '/default-avatar.svg'
    : otherUser?.avatar || '/default-avatar.svg';

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
    <div className="absolute inset-0 lg:relative lg:flex-1 h-full w-full flex flex-col justify-between overflow-hidden bg-wa-dark-bg dark:bg-wa-dark-bg bg-wa-light-bg z-30">
      {/* Chat Header */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-2.5 bg-wa-dark-header dark:bg-wa-dark-header bg-wa-light-header border-b border-wa-dark-border dark:border-wa-dark-border border-wa-light-border flex items-center justify-between z-10 shadow-sm">
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

      {/* Message Input Bar Pinned at bottom */}
      <div className="flex-shrink-0 w-full z-40 pb-safe">
        <MessageInput />
      </div>

      {/* Media Preview Modal */}
      <MediaPreviewModal />
    </div>
  );
};
