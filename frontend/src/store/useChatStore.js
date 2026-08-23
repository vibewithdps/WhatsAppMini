import { create } from 'zustand';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { playMessageSentSound, playMessageReceivedSound } from '../services/audio';

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  onlineUsers: new Set(),
  typingUsers: {}, // { chatId: [ { userId, userName } ] }
  quotedMessage: null,
  searchQuery: '',
  chatFilter: 'all', // 'all' | 'unread' | 'groups'
  isLoadingChats: false,
  isLoadingMessages: false,

  // Modals state
  isNewChatModalOpen: false,
  isCreateGroupModalOpen: false,
  isGroupInfoModalOpen: false,
  isForwardModalOpen: false,
  messageToForward: null,
  isMediaPreviewOpen: false,
  pendingMediaFile: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setChatFilter: (filter) => set({ chatFilter: filter }),
  setQuotedMessage: (msg) => set({ quotedMessage: msg }),
  setIsNewChatModalOpen: (isOpen) => set({ isNewChatModalOpen: isOpen }),
  setIsCreateGroupModalOpen: (isOpen) => set({ isCreateGroupModalOpen: isOpen }),
  setIsGroupInfoModalOpen: (isOpen) => set({ isGroupInfoModalOpen: isOpen }),
  setIsForwardModalOpen: (isOpen, msg = null) =>
    set({ isForwardModalOpen: isOpen, messageToForward: msg }),
  setPendingMedia: (file) =>
    set({ pendingMediaFile: file, isMediaPreviewOpen: Boolean(file) }),

  fetchChats: async () => {
    set({ isLoadingChats: true });
    try {
      const res = await api.get('/chats');
      set({ chats: res.data, isLoadingChats: false });
    } catch (err) {
      console.error('Failed to fetch chats:', err);
      set({ isLoadingChats: false });
    }
  },

  selectChat: async (chat) => {
    const socket = getSocket();
    const currentActive = get().activeChat;

    if (currentActive && socket) {
      socket.emit('leave_chat', currentActive._id);
    }

    set({ activeChat: chat, messages: [], quotedMessage: null });

    if (chat) {
      if (socket) {
        socket.emit('join_chat', chat._id);
      }
      get().fetchMessages(chat._id);
      get().markChatAsRead(chat._id);
    }
  },

  fetchMessages: async (chatId) => {
    set({ isLoadingMessages: true });
    try {
      const res = await api.get(`/messages/${chatId}`);
      set({ messages: res.data, isLoadingMessages: false });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async ({ content, file, replyToId, encrypted, fileType }) => {
    const activeChat = get().activeChat;
    if (!activeChat) return;

    try {
      const formData = new FormData();
      formData.append('chatId', activeChat._id);
      if (content) formData.append('content', content);
      if (file) formData.append('file', file);
      if (replyToId) formData.append('replyToId', replyToId);
      if (encrypted) formData.append('encrypted', encrypted);
      if (fileType) formData.append('fileType', fileType);

      const res = await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newMessage = res.data;

      // Add to messages list
      set((state) => ({
        messages: [...state.messages, newMessage],
        quotedMessage: null,
        pendingMediaFile: null,
        isMediaPreviewOpen: false,
      }));

      // Play audio effect
      playMessageSentSound();

      // Emit via socket
      const socket = getSocket();
      if (socket) {
        socket.emit('send_message', newMessage);
      }

      // Update chat list latest message
      get().updateChatLatestMessage(activeChat._id, newMessage);

      return newMessage;
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    }
  },

  receiveMessage: (message) => {
    const activeChat = get().activeChat;
    const isCurrentChat = activeChat && activeChat._id === message.chat._id;

    if (isCurrentChat) {
      set((state) => {
        // Prevent duplicate messages
        if (state.messages.some((m) => m._id === message._id)) return state;
        return { messages: [...state.messages, message] };
      });
      get().markChatAsRead(message.chat._id);
    }

    playMessageReceivedSound();
    get().updateChatLatestMessage(message.chat._id, message);
  },

  updateChatLatestMessage: (chatId, message) => {
    set((state) => {
      const chatIndex = state.chats.findIndex((c) => c._id === chatId);
      if (chatIndex === -1) {
        get().fetchChats();
        return state;
      }
      const updatedChats = [...state.chats];
      const chat = { ...updatedChats[chatIndex], latestMessage: message, updatedAt: new Date() };
      updatedChats.splice(chatIndex, 1);
      updatedChats.unshift(chat); // Move to top of chat list
      return { chats: updatedChats };
    });
  },

  markChatAsRead: async (chatId) => {
    try {
      await api.put(`/messages/read/${chatId}`);
      const socket = getSocket();
      const user = JSON.parse(localStorage.getItem('wa_user') || '{}');
      if (socket && user._id) {
        socket.emit('mark_read', { chatId, userId: user._id });
      }
    } catch (e) {}
  },

  handleReadReceipt: (chatId, readByUserId) => {
    set((state) => {
      if (state.activeChat?._id === chatId) {
        const updatedMessages = state.messages.map((msg) => {
          if (!msg.readBy.some((r) => r.user === readByUserId || r.user?._id === readByUserId)) {
            return {
              ...msg,
              readBy: [...msg.readBy, { user: readByUserId, timestamp: new Date() }],
            };
          }
          return msg;
        });
        return { messages: updatedMessages };
      }
      return state;
    });
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      const res = await api.put(`/messages/react/${messageId}`, { emoji });
      const updatedMsg = res.data;

      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? updatedMsg : m)),
      }));

      const socket = getSocket();
      if (socket && get().activeChat) {
        socket.emit('message_reaction', {
          chatId: get().activeChat._id,
          messageId,
          reactions: updatedMsg.reactions,
        });
      }
    } catch (err) {
      console.error('Failed to react:', err);
    }
  },

  toggleStarMessage: async (messageId) => {
    try {
      const res = await api.put(`/messages/star/${messageId}`);
      const { isStarred } = res.data;
      const user = JSON.parse(localStorage.getItem('wa_user') || '{}');

      set((state) => ({
        messages: state.messages.map((m) => {
          if (m._id === messageId) {
            const stars = isStarred
              ? [...(m.isStarred || []), user._id]
              : (m.isStarred || []).filter((id) => id !== user._id);
            return { ...m, isStarred: stars };
          }
          return m;
        }),
      }));
    } catch (err) {
      console.error('Failed to star message:', err);
    }
  },

  deleteMessage: async (messageId, type = 'forMe') => {
    try {
      await api.delete(`/messages/${messageId}`, { data: { type } });

      set((state) => {
        if (type === 'forEveryone') {
          return {
            messages: state.messages.map((m) =>
              m._id === messageId
                ? { ...m, isDeletedForEveryone: true, content: 'This message was deleted', fileUrl: null }
                : m
            ),
          };
        } else {
          return {
            messages: state.messages.filter((m) => m._id !== messageId),
          };
        }
      });

      const socket = getSocket();
      if (socket && get().activeChat) {
        socket.emit('message_deleted', {
          chatId: get().activeChat._id,
          messageId,
          type,
          isDeletedForEveryone: type === 'forEveryone',
        });
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  },

  setTyping: (chatId, user, isTyping) => {
    set((state) => {
      const currentList = state.typingUsers[chatId] || [];
      let updated;
      if (isTyping) {
        if (!currentList.some((u) => u.userId === user.userId)) {
          updated = [...currentList, user];
        } else {
          updated = currentList;
        }
      } else {
        updated = currentList.filter((u) => u.userId !== user.userId);
      }
      return {
        typingUsers: { ...state.typingUsers, [chatId]: updated },
      };
    });
  },

  setOnlineUsers: (userList) => {
    set({ onlineUsers: new Set(userList) });
  },

  setUserStatus: (userId, isOnline) => {
    set((state) => {
      const nextOnline = new Set(state.onlineUsers);
      if (isOnline) nextOnline.add(userId);
      else nextOnline.delete(userId);
      return { onlineUsers: nextOnline };
    });
  },
}));
