import React from 'react';
import {
  Search,
  Plus,
  Users,
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

export const ChatList = () => {
  const user = useAuthStore((state) => state.user);
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
    return true;
  });

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
        avatar: chat.chatAvatar || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
        isOnline: false,
      };
    }
    const otherUser = chat.users.find((u) => u._id !== user?._id) || chat.users[0];
    const isOnline = otherUser ? onlineUsers.has(otherUser._id) || otherUser.isOnline : false;

    return {
      name: otherUser?.name || 'Contact',
      avatar: otherUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isOnline,
    };
  };

  return (
    <div className="w-full h-full flex flex-col bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel border-r border-wa-dark-border dark:border-wa-dark-border border-wa-light-border pb-16 lg:pb-0">
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between border-b border-wa-dark-border dark:border-wa-dark-border border-wa-light-border">
        <h1 className="text-xl sm:text-2xl font-bold text-wa-text-primary">
          Chats
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateGroupModalOpen(true)}
            title="New Group"
            className="p-2 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-hover dark:hover:bg-wa-dark-hover hover:bg-wa-light-hover rounded-full transition-colors"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            title="New Chat"
            className="p-2 bg-wa-green text-white rounded-full hover:bg-wa-green-dark transition-colors shadow"
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
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
          {['all', 'unread', 'groups'].map((tab) => (
            <button
              key={tab}
              onClick={() => setChatFilter(tab)}
              className={`px-3 py-1 text-xs rounded-full capitalize font-medium transition-all ${
                chatFilter === tab
                  ? 'bg-wa-green/20 text-wa-green border border-wa-green/30'
                  : 'bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input text-wa-text-secondary hover:text-wa-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-2 divide-y divide-wa-dark-border/40 dark:divide-wa-dark-border/40 divide-wa-light-border/40">
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
    </div>
  );
};
