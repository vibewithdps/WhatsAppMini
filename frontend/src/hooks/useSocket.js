import { useEffect } from 'react';
import { getSocket } from '../services/socket';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useCallStore } from '../store/useCallStore';
import { stopIncomingRingtone } from '../services/audio';
import api from '../services/api';
import { processIceCandidate } from './useWebRTC';

export const useSocket = () => {
  const user = useAuthStore((state) => state.user);
  const receiveMessage = useChatStore((state) => state.receiveMessage);
  const handleReadReceipt = useChatStore((state) => state.handleReadReceipt);
  const setTyping = useChatStore((state) => state.setTyping);
  const setOnlineUsers = useChatStore((state) => state.setOnlineUsers);
  const setUserStatus = useChatStore((state) => state.setUserStatus);
  const handleIncomingCall = useCallStore((state) => state.handleIncomingCall);
  const endActiveCall = useCallStore((state) => state.endActiveCall);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    // Presence
    socket.on('all_online_users', (list) => {
      setOnlineUsers(list);
    });

    socket.on('user_status', ({ userId, isOnline }) => {
      setUserStatus(userId, isOnline);
    });

    // Messaging
    socket.on('message_received', (newMessage) => {
      receiveMessage(newMessage);
    });

    socket.on('messages_read_receipt', ({ chatId, readByUserId }) => {
      handleReadReceipt(chatId, readByUserId);
    });

    socket.on('message_delivered_receipt', ({ chatId, messageId, deliveredToUserId }) => {
      useChatStore.getState().handleDeliveryReceipt(chatId, messageId, deliveredToUserId);
    });

    socket.on('typing', ({ chatId, user: typingUser }) => {
      setTyping(chatId, typingUser, true);
    });

    socket.on('stop_typing', ({ chatId, userId }) => {
      setTyping(chatId, { userId }, false);
    });

    // Calls
    socket.on('incoming_call', (data) => {
      handleIncomingCall(data);
    });

    socket.on('incoming_group_call', (data) => {
      useCallStore.getState().handleIncomingGroupCall(data);
    });

    socket.on('call_ended', () => {
      stopIncomingRingtone();
      endActiveCall(false);
    });

    socket.on('call_rejected', () => {
      stopIncomingRingtone();
      endActiveCall(false);
    });

    socket.on('ice_candidate', ({ candidate }) => {
      processIceCandidate(candidate);
    });

    // Safe background auto-sync polling every 4 seconds (preserves pending optimistic messages)
    const syncInterval = setInterval(async () => {
      const activeChat = useChatStore.getState().activeChat;
      if (activeChat) {
        try {
          const res = await api.get(`/messages/${activeChat._id}`);
          if (res.data && Array.isArray(res.data)) {
            const serverMsgs = res.data;
            const currentMsgs = useChatStore.getState().messages;
            
            const hasNewServerMsg = serverMsgs.some(
              (sm) => !currentMsgs.some((cm) => cm._id === sm._id)
            );

            if (hasNewServerMsg) {
              const pendingOptimistic = currentMsgs.filter(
                (m) => m.isOptimistic || m._id?.startsWith('temp_')
              );
              useChatStore.setState({ messages: [...serverMsgs, ...pendingOptimistic] });
            }
          }
        } catch (e) {}
      }
    }, 4000);

    return () => {
      clearInterval(syncInterval);
      socket.off('all_online_users');
      socket.off('user_status');
      socket.off('message_received');
      socket.off('messages_read_receipt');
      socket.off('message_delivered_receipt');
      socket.off('typing');
      socket.off('stop_typing');
      socket.off('incoming_call');
      socket.off('incoming_group_call');
      socket.off('call_ended');
      socket.off('call_rejected');
      socket.off('ice_candidate');
    };
  }, [user, receiveMessage, handleReadReceipt, setTyping, setOnlineUsers, setUserStatus, handleIncomingCall, endActiveCall]);
};
