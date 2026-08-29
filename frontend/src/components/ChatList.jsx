import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import {
  Search,
  Plus,
  Users,
  MoreVertical,
  Pin,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Mic,
  FileText,
  Video,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useImageViewerStore } from '../store/useImageViewerStore';
import { Lock, Unlock } from 'lucide-react';
import api from '../services/api';

export const ChatList = ({ onOpenSettings }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isLockedView, setIsLockedView] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const openImageViewer = useImageViewerStore((state) => state.openImageViewer);
  const {
    chats,
    activeChat,
    selectChat,
    searchQuery,
    setSearchQuery,
    chatFilter,
    setChatFilter,
    onlineUsers,
    typingUsers,
    setIsNewChatModalOpen,
    setIsCreateGroupModalOpen,
  } = useChatStore();

  // Filter & Search chats
  const filteredChats = chats.filter((chat) => {
    // Search query
    const chatName = chat.isGroupChat
      ? chat.chatName
      : chat.users.find((u) => u._id !== user?._id)?.name || 'WhatsApp User';

    const matchesSearch = chatName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Category filter
    if (chatFilter === 'groups') return chat.isGroupChat;
    if (chatFilter === 'unread') {
      const latest = chat.latestMessage;
      if (!latest) return false;
      const isReadByMe = latest.readBy?.some(
        (r) => r.user === user?._id || r.user?._id === user?._id
      );
      return latest.sender?._id !== user?._id && !isReadByMe;
    }
    if (chatFilter === 'favorites') {
      return user?.favoriteChats?.includes(chat._id);
    }
    if (isLockedView) {
      return user?.lockedChats?.includes(chat._id);
    }
    // Exclude locked chats from normal view
    if (user?.lockedChats?.includes(chat._id) && !isLockedView) {
      return false;
    }
    
    return true;
  });

  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chat });
  };

  const handleToggleFavorite = async () => {
    if (!contextMenu) return;
    try {
      const res = await api.put(`/users/favorite-chat/${contextMenu.chat._id}`);
      if (res.data.success) {
        useAuthStore.setState({ user: { ...user, favoriteChats: res.data.favoriteChats } });
      }
    } catch(err) {}
    setContextMenu(null);
  };

  const handleToggleLock = async () => {
    if (!contextMenu) return;
    try {
      const res = await api.put(`/users/lock-chat/${contextMenu.chat._id}`);
      if (res.data.success) {
        useAuthStore.setState({ user: { ...user, lockedChats: res.data.lockedChats } });
      }
    } catch(err) {}
    setContextMenu(null);
  };
  
  const handleVerifyPin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users/verify-lock-pin', { pin });
      if (res.data.success) {
        setIsLockedView(true);
        setShowPinModal(false);
        setPin('');
      }
    } catch(err) {
      setPinError(err.response?.data?.message || 'Incorrect PIN');
    }
  };
  
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);


  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isToday(date)) return format(date, 'p');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MM/dd/yy');
  };

  const getChatDetails = (chat) => {
    if (chat.isGroupChat) {
      return {
        name: chat.chatName || 'Group Chat',
        avatar: chat.chatAvatar || '/default-avatar.svg',
        isOnline: false,
      };
    }
    const otherUser = chat.users.find((u) => u._id !== user?._id) || chat.users[0];
    const isOnline = otherUser ? onlineUsers.has(otherUser._id) || otherUser.isOnline : false;

    return {
      name: otherUser?.name || 'Contact',
      avatar: otherUser?.avatar || '/default-avatar.svg',
      isOnline,
    };
  };

  return (
    <div className="w-full h-full flex flex-col bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel border-r border-wa-dark-border dark:border-wa-dark-border border-wa-light-border pb-16 lg:pb-0">
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between bg-white dark:bg-wa-dark-panel">
        <h1 className="text-xl font-bold text-[#25d366] tracking-tight">
          WhatsApp Mini
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-[#54656f] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <MoreVertical className="w-6 h-6" />
            </button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-wa-dark-panel rounded-xl shadow-xl py-2 z-50 text-[15px] text-[#111b21] dark:text-white border border-gray-100 dark:border-gray-800">
                  <button onClick={() => { setIsMenuOpen(false); setIsCreateGroupModalOpen(true); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">New group</button>
                  <button onClick={() => { setIsMenuOpen(false); if (onOpenSettings) onOpenSettings(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">Settings</button>
                  <button onClick={() => { setIsMenuOpen(false); logout(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">Log out</button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            title="New Chat"
            className="p-1.5 bg-[#00a884] text-white rounded-md hover:bg-[#06cf9c] transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-wa-text-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary focus:outline-none focus:ring-1 focus:ring-wa-green"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          {['All', 'Unread', 'Favorites', 'Groups'].map((tab) => {
            const val = tab.toLowerCase();
            return (
              <button
                key={tab}
                onClick={() => setChatFilter(val)}
                className={`flex-shrink-0 px-4 py-1.5 text-sm rounded-full font-medium transition-all ${
                  chatFilter === val
                    ? 'bg-[#d9fdd3] dark:bg-[#0a332c] text-[#00a884] border-transparent'
                    : 'bg-[#f0f2f5] dark:bg-gray-800 text-[#54656f] dark:text-gray-300 border-transparent hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-2 divide-y divide-wa-dark-border/40 dark:divide-wa-dark-border/40 divide-wa-light-border/40">
        
        {/* Locked Chats Banner */}
        {user?.lockedChats?.length > 0 && !isLockedView && !searchQuery && (
          <div 
            onClick={() => setShowPinModal(true)}
            className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-wa-light-hover dark:hover:bg-wa-dark-hover transition-colors text-wa-green"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-wa-green/10">
              <Lock className="w-5 h-5" />
            </div>
            <span className="font-semibold">Locked Chats</span>
          </div>
        )}
        
        {isLockedView && (
          <div 
            onClick={() => setIsLockedView(false)}
            className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-wa-light-hover dark:hover:bg-wa-dark-hover transition-colors text-wa-text-primary border-b border-wa-dark-border"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
              <Unlock className="w-5 h-5" />
            </div>
            <span className="font-semibold">Exit Locked View</span>
          </div>
        )}
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-wa-text-secondary">
            <p className="text-sm">No chats found.</p>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="mt-3 text-xs text-wa-green hover:underline"
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const { name, avatar, isOnline } = getChatDetails(chat);
            const isSelected = activeChat?._id === chat._id;
            const typingInChat = typingUsers[chat._id] || [];
            const isTyping = typingInChat.length > 0;
            const latest = chat.latestMessage;

            const isSentByMe = latest?.sender?._id === user?._id;
            const isReadByRecipient =
              isSentByMe && latest?.readBy?.length > 1;

            return (
              <div
                key={chat._id}
                onClick={() => selectChat(chat)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors relative group ${
                  isSelected
                    ? 'bg-wa-dark-hover dark:bg-wa-dark-hover bg-wa-light-hover'
                    : 'hover:bg-wa-dark-hover/50 dark:hover:bg-wa-dark-hover/50 hover:bg-wa-light-hover/50'
                }`}
              >
                {/* Avatar with Online Badge */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const other = !chat.isGroupChat
                      ? chat.users.find((u) => u._id !== user?._id) || chat.users[0]
                      : null;
                    openImageViewer({
                      imageUrl: avatar,
                      title: name,
                      subtitle: chat.isGroupChat ? `${chat.users?.length || 0} participants` : isOnline ? 'Online' : 'Contact',
                      user: other,
                    });
                  }}
                  title="Click to view profile photo"
                  className="relative flex-shrink-0 cursor-pointer group/avatar"
                >
                  <img
                    src={avatar}
                    alt={name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover/avatar:ring-wa-green transition-all"
                  />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-wa-green rounded-full border-2 border-wa-dark-panel" />
                  )}
                </div>

                {/* Chat Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-wa-text-primary truncate">
                      {name}
                    </h3>
                    <span className="text-xs text-wa-text-secondary">
                      {formatMessageTime(latest?.createdAt || chat.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1 text-xs text-wa-text-secondary truncate">
                      {isTyping ? (
                        <span className="text-wa-green font-medium animate-pulse">
                          typing...
                        </span>
                      ) : (
                        <>
                          {isSentByMe && latest && (
                            <span>
                              {isReadByRecipient ? (
                                <CheckCheck className="w-3.5 h-3.5 text-wa-blue-tick" />
                              ) : latest.deliveredTo?.length > 1 ? (
                                <CheckCheck className="w-3.5 h-3.5 text-wa-text-secondary" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-wa-text-secondary" />
                              )}
                            </span>
                          )}

                          {latest?.fileType === 'image' && (
                            <ImageIcon className="w-3.5 h-3.5 text-wa-text-secondary" />
                          )}
                          {latest?.fileType === 'video' && (
                            <Video className="w-3.5 h-3.5 text-wa-text-secondary" />
                          )}
                          {latest?.fileType === 'voice' && (
                            <Mic className="w-3.5 h-3.5 text-wa-green" />
                          )}
                          {latest?.fileType === 'document' && (
                            <FileText className="w-3.5 h-3.5 text-wa-text-secondary" />
                          )}

                          <span className="truncate">
                            {latest
                              ? latest.isDeletedForEveryone
                                ? '🚫 This message was deleted'
                                : latest.content || latest.fileName || 'Media file'
                              : 'Start chatting...'}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {/* Unread Badge */}
                    {chat.unreadCount > 0 && (
                      <div className="flex-shrink-0 ml-2 bg-wa-green text-wa-dark-panel text-[10px] font-bold px-1.5 py-0.5 min-w-[20px] text-center rounded-full">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Floating Action Buttons */}
      <div className="lg:hidden absolute bottom-24 right-4 flex flex-col items-center gap-4 z-50">

        <button
          onClick={() => setIsNewChatModalOpen(true)}
          className="w-16 h-16 bg-[#00a884] rounded-2xl flex items-center justify-center shadow-xl transition-transform active:scale-95"
        >
          <MessageSquare className="w-7 h-7 text-white" fill="currentColor" />
          <div className="absolute w-3 h-3 bg-[#00a884] top-[34%] right-[32%] flex items-center justify-center">
            <Plus className="w-4 h-4 text-white font-bold" strokeWidth={4} />
          </div>
        </button>
      </div>
      
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-white dark:bg-wa-dark-panel shadow-xl rounded-lg py-2 border border-gray-200 dark:border-wa-dark-border min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            onClick={handleToggleFavorite}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-gray-800 dark:text-gray-200"
          >
            {user?.favoriteChats?.includes(contextMenu.chat._id) ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>
          <button 
            onClick={handleToggleLock}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2"
          >
            <Lock className="w-4 h-4" /> {user?.lockedChats?.includes(contextMenu.chat._id) ? 'Unlock Chat' : 'Lock Chat'}
          </button>
        </div>
      )}
      {showPinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleVerifyPin} className="bg-white dark:bg-wa-dark-panel p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-wa-text-primary mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-wa-green" /> 
              {user?.chatLockPin ? 'Enter PIN' : 'Set a 4-Digit PIN'}
            </h3>
            <p className="text-sm text-wa-text-secondary mb-4">
              {user?.chatLockPin ? 'To view your locked chats, enter your PIN.' : 'Set up a PIN to lock and hide specific chats.'}
            </p>
            
            <input 
              type="password" 
              maxLength="4" 
              autoFocus
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/[^0-9]/g, '')); setPinError(''); }}
              className="w-full text-center tracking-[1em] font-bold text-2xl py-3 rounded-xl bg-gray-100 dark:bg-wa-dark-bg text-wa-text-primary focus:outline-none focus:ring-2 focus:ring-wa-green mb-2"
              placeholder="••••"
            />
            {pinError && <p className="text-red-500 text-xs font-semibold text-center mb-4">{pinError}</p>}
            
            <div className="flex gap-3 mt-4">
              <button 
                type="button" 
                onClick={() => { setShowPinModal(false); setPinError(''); setPin(''); }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-wa-text-secondary bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={pin.length < 4}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-wa-green hover:bg-wa-green-dark transition-colors disabled:opacity-50"
              >
                {user?.chatLockPin ? 'Unlock' : 'Set PIN'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};