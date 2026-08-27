import { create } from 'zustand';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { playMessageSentSound, playMessageReceivedSound } from '../services/audio';
import { useAuthStore } from './useAuthStore';
import { decryptMessage } from '../services/crypto';

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
      const decryptedChats = await Promise.all(res.data.map(async (chat) => {
        if (chat.latestMessage?.encrypted && chat.latestMessage?.content?.startsWith('enc:')) {
          chat.latestMessage.content = await decryptMessage(chat.latestMessage.content, chat._id);
        }
        return chat;
      }));
      set({ chats: decryptedChats, isLoadingChats: false });
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
      const decryptedMessages = await Promise.all(res.data.map(async (msg) => {
        if (msg.encrypted && msg.content?.startsWith('enc:')) {
          msg.content = await decryptMessage(msg.content, chatId);
        }
        return msg;
      }));
      set({ messages: decryptedMessages, isLoadingMessages: false });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async ({ content, file, fileUrl: customFileUrl, replyToId, encrypted, fileType }) => {
    const activeChat = get().activeChat;
    const user = useAuthStore.getState().user || JSON.parse(localStorage.getItem('wa_user') || 'null');
    if (!activeChat) {
      console.warn('[sendMessage] No active chat selected');
      return;
    }

    const chatId = (activeChat._id || activeChat.id)?.toString();
    if (!chatId) return;

    let resolvedFileType = fileType || null;
    if (file) {
      if (file.type.startsWith('image/')) resolvedFileType = 'image';
      else if (file.type.startsWith('video/')) resolvedFileType = 'video';
      else if (file.type.startsWith('audio/')) resolvedFileType = 'audio';
      else resolvedFileType = 'document';
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMessage = {
      _id: tempId,
      sender: user || { name: 'You', _id: 'self' },
      content: content || '',
      fileUrl: customFileUrl || (file ? URL.createObjectURL(file) : null),
      fileType: resolvedFileType,
      fileName: file?.name || null,
      fileSize: file?.size || null,
      chat: activeChat,
      createdAt: new Date().toISOString(),
      readBy: user ? [{ user: user._id, timestamp: new Date() }] : [],
      deliveredTo: user ? [{ user: user._id, timestamp: new Date() }] : [],
      replyTo: get().quotedMessage,
      encrypted: Boolean(encrypted),
      isOptimistic: true,
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
      quotedMessage: null,
      pendingMediaFile: null,
      isMediaPreviewOpen: false,
    }));

    playMessageSentSound();
    get().updateChatLatestMessage(chatId, optimisticMessage);

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('chatId', chatId);
        if (content) formData.append('content', content);
        formData.append('file', file);
        if (replyToId) formData.append('replyToId', replyToId);
        if (encrypted) formData.append('encrypted', encrypted);
        if (resolvedFileType) formData.append('fileType', resolvedFileType);

        res = await api.post('/messages', formData);
      } else {
        res = await api.post('/messages', {
          chatId,
          content: content || '',
          replyToId,
          encrypted: Boolean(encrypted),
          fileType: resolvedFileType,
          fileUrl: customFileUrl || null,
        });
      }

      const newMessage = res.data;

      // Replace optimistic message with actual persisted message
      set((state) => ({
        messages: state.messages.map((m) => (m._id === tempId ? newMessage : m)),
      }));

      // Emit via socket
      const socket = getSocket();
      if (socket) {
        socket.emit('send_message', newMessage);
      }

      get().updateChatLatestMessage(chatId, newMessage);
      return newMessage;
    } catch (err) {
      console.error('[sendMessage error]:', err?.response?.data || err.message);
    }
  },

  receiveMessage: async (message) => {
    if (message.encrypted && message.content?.startsWith('enc:')) {
      const chatId = typeof message.chat === 'object' ? message.chat?._id : message.chat;
      message.content = await decryptMessage(message.content, chatId);
    }
    const activeChat = get().activeChat;
    const isCurrentChat = activeChat && (activeChat._id === message.chat?._id || activeChat._id === message.chat);

    if (isCurrentChat) {
      set((state) => {
        // Prevent duplicate messages
        if (state.messages.some((m) => m._id === message._id)) return state;
        const filtered = state.messages.filter(
          (m) => !(m.isOptimistic && m.content === message.content && m.sender?._id === message.sender?._id)
        );
        return { messages: [...filtered, message] };
      });
      get().markChatAsRead(activeChat._id);
    } else {
      // Chat is not open -> Emit Delivery Receipt to sender
      const socket = getSocket();
      const me = useAuthStore.getState().user;
      if (socket && me && message.sender?._id !== me._id) {
        socket.emit('message_delivered', {
          messageId: message._id,
          chatId: message.chat?._id || message.chat,
          senderId: message.sender?._id || message.sender,
          recipientId: me._id,
        });
      }
    }

    playMessageReceivedSound();
    const chatId = message.chat?._id || message.chat;
    if (chatId) {
      get().updateChatLatestMessage(chatId, message);
    }
  },

  updateChatLatestMessage: (chatId, message) => {
    set((state) => {
      const chatIndex = state.chats.findIndex((c) => c._id === chatId);
      if (chatIndex === -1) {
        get().fetchChats();
        return state;
      }
      const updatedChats = [...state.chats];
      const existingChat = updatedChats[chatIndex];
      const isCurrentChat = state.activeChat?._id === chatId;
      const isFromMe = message.sender?._id === useAuthStore.getState().user?._id;
      
      const newUnreadCount = 
        !isCurrentChat && !isFromMe 
          ? (existingChat.unreadCount || 0) + 1 
          : (isCurrentChat ? 0 : existingChat.unreadCount);

      const chat = { 
        ...existingChat, 
        latestMessage: message, 
        updatedAt: new Date(),
        unreadCount: newUnreadCount 
      };
      
      updatedChats.splice(chatIndex, 1);
      updatedChats.unshift(chat); // Move to top of chat list
      return { chats: updatedChats };
    });
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      const res = await api.put(`/messages/react/${messageId}`, { emoji });
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? res.data : m)),
      }));

      const socket = getSocket();
      if (socket) {
        socket.emit('react_message', {
          messageId,
          reactions: res.data.reactions,
          chatId: get().activeChat?._id,
        });
      }
    } catch (err) {
      console.error('Failed to react to message:', err);
    }
  },

  toggleStarMessage: async (messageId) => {
    try {
      const res = await api.put(`/messages/star/${messageId}`);
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? res.data : m)),
      }));
    } catch (err) {
      console.error('Failed to star message:', err);
    }
  },

  deleteMessage: async (messageId, forEveryone = false) => {
    try {
      await api.delete(`/messages/${messageId}`, {
        params: { forEveryone },
      });

      if (forEveryone) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === messageId
              ? { ...m, isDeletedForEveryone: true, content: 'This message was deleted' }
              : m
          ),
        }));

        const socket = getSocket();
        if (socket) {
          socket.emit('delete_message', {
            messageId,
            chatId: get().activeChat?._id,
          });
        }
      } else {
        set((state) => ({
          messages: state.messages.filter((m) => m._id !== messageId),
        }));
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  },

  markChatAsRead: async (chatId) => {
    try {
      await api.put(`/messages/read/${chatId}`);
      const socket = getSocket();
      if (socket) {
        socket.emit('read_messages', { chatId });
      }

      set((state) => {
        const chatIndex = state.chats.findIndex((c) => c._id === chatId);
        if (chatIndex === -1) return state;
        const updatedChats = [...state.chats];
        updatedChats[chatIndex] = { ...updatedChats[chatIndex], unreadCount: 0 };
        return { chats: updatedChats };
      });
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  },

  handleReadReceipt: (chatId, readByUserId) => {
    set((state) => {
      const updatedState = { ...state };
      
      // Update open chat messages
      if (state.activeChat?._id === chatId) {
        updatedState.messages = state.messages.map((m) => ({
          ...m,
          readBy: [...(m.readBy || []), { user: readByUserId, timestamp: new Date() }],
        }));
      }

      // Update latest message in chat list
      const chatIndex = state.chats.findIndex((c) => c._id === chatId);
      if (chatIndex !== -1) {
        const chat = state.chats[chatIndex];
        if (chat.latestMessage) {
          const updatedChats = [...state.chats];
          updatedChats[chatIndex] = {
            ...chat,
            latestMessage: {
              ...chat.latestMessage,
              readBy: [...(chat.latestMessage.readBy || []), { user: readByUserId, timestamp: new Date() }],
            },
          };
          updatedState.chats = updatedChats;
        }
      }

      return updatedState;
    });
  },

  handleDeliveryReceipt: (chatId, messageId, deliveredToUserId) => {
    set((state) => {
      const updatedState = { ...state };
      
      // Update open chat messages
      if (state.activeChat?._id === chatId) {
        updatedState.messages = state.messages.map((m) => {
          if (m._id === messageId || !messageId) {
            return {
              ...m,
              deliveredTo: [...(m.deliveredTo || []), { user: deliveredToUserId, timestamp: new Date() }],
            };
          }
          return m;
        });
      }

      // Update latest message in chat list
      const chatIndex = state.chats.findIndex((c) => c._id === chatId);
      if (chatIndex !== -1) {
        const chat = state.chats[chatIndex];
        if (chat.latestMessage && (chat.latestMessage._id === messageId || !messageId)) {
          const updatedChats = [...state.chats];
          updatedChats[chatIndex] = {
            ...chat,
            latestMessage: {
              ...chat.latestMessage,
              deliveredTo: [...(chat.latestMessage.deliveredTo || []), { user: deliveredToUserId, timestamp: new Date() }],
            },
          };
          updatedState.chats = updatedChats;
        }
      }

      return updatedState;
    });
  },

  setTyping: (chatId, user, isTyping) => {
    set((state) => {
      const current = state.typingUsers[chatId] || [];
      const updated = isTyping
        ? [...current.filter((u) => u.userId !== user.userId), user]
        : current.filter((u) => u.userId !== user.userId);
      return { typingUsers: { ...state.typingUsers, [chatId]: updated } };
    });
  },

  setOnlineUsers: (list) => {
    set({ onlineUsers: new Set(list) });
  },

  setUserStatus: (userId, isOnline) => {
    set((state) => {
      const newOnline = new Set(state.onlineUsers);
      if (isOnline) newOnline.add(userId);
      else newOnline.delete(userId);
      return { onlineUsers: newOnline };
    });
  },
}));
