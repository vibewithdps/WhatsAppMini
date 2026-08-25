import User from '../models/User.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import Call from '../models/Call.js';
import { getCacheClient } from '../config/redis.js';

// In-memory mapping of active socket connections: userId -> Set of socketIds
const onlineUserSockets = new Map();

export const setupSocketHandlers = (io) => {
  const cache = getCacheClient();

  io.on('connection', (socket) => {
    let currentUserId = null;

    /**
     * User Setup & Authentication on Socket
     */
    socket.on('setup', async (userData) => {
      if (!userData || !userData._id) return;
      currentUserId = userData._id.toString();

      socket.join(currentUserId);
      socket.emit('connected');

      // Track socket ID
      if (!onlineUserSockets.has(currentUserId)) {
        onlineUserSockets.set(currentUserId, new Set());
      }
      onlineUserSockets.get(currentUserId).add(socket.id);

      // Mark online in cache
      await cache.sadd('online_users', currentUserId);

      // Update User in DB
      try {
        await User.findByIdAndUpdate(currentUserId, {
          isOnline: true,
          lastSeen: new Date(),
        });
      } catch (err) {
        console.error('Error updating user online state:', err.message);
      }

      // Broadcast presence
      socket.broadcast.emit('user_status', {
        userId: currentUserId,
        isOnline: true,
      });

      // Send currently online users list to connecting user
      const onlineList = Array.from(onlineUserSockets.keys());
      socket.emit('all_online_users', onlineList);
    });

    /**
     * Join / Leave Chat Room & QR Session
     */
    socket.on('join_qr_session', ({ qrSessionId }) => {
      if (qrSessionId) {
        socket.join(`qr_${qrSessionId}`);
      }
    });

    socket.on('join_chat', (room) => {
      if (room) {
        socket.join(room);
      }
    });

    socket.on('leave_chat', (room) => {
      if (room) {
        socket.leave(room);
      }
    });

    /**
     * Real-time Messaging
     */
    socket.on('send_message', async (newMessageReceived) => {
      const chat = newMessageReceived.chat;
      if (!chat || !chat.users) return;

      chat.users.forEach((user) => {
        const userId = typeof user === 'string' ? user : user._id?.toString();
        if (userId === newMessageReceived.sender._id?.toString()) return;

        // Emit to user's personal room
        socket.to(userId).emit('message_received', newMessageReceived);
      });
    });

    /**
     * Typing Indicators
     */
    socket.on('typing', ({ chatId, user }) => {
      socket.to(chatId).emit('typing', { chatId, user });
    });

    socket.on('stop_typing', ({ chatId, userId }) => {
      socket.to(chatId).emit('stop_typing', { chatId, userId });
    });

    socket.on('read_messages', async ({ chatId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        chat.users.forEach((userId) => {
          if (userId.toString() !== currentUserId) {
            socket.to(userId.toString()).emit('messages_read_receipt', {
              chatId,
              readByUserId: currentUserId,
              readAt: new Date(),
            });
          }
        });
      } catch (err) {
        console.error('Error emitting read_messages:', err);
      }
    });

    socket.on('message_delivered', async ({ messageId, chatId, senderId, recipientId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: {
            deliveredTo: { user: recipientId, timestamp: new Date() },
          },
        });
      } catch (err) {
        console.error('Failed to update delivered receipt in DB:', err);
      }

      socket.to(senderId).emit('message_delivered_receipt', {
        messageId,
        chatId,
        deliveredToUserId: recipientId,
        deliveredAt: new Date(),
      });
    });

    /**
     * Reactions & Message Deletion
     */
    socket.on('message_reaction', ({ chatId, messageId, reactions }) => {
      socket.to(chatId).emit('message_reaction_updated', {
        chatId,
        messageId,
        reactions,
      });
    });

    socket.on('message_deleted', ({ chatId, messageId, type, isDeletedForEveryone }) => {
      socket.to(chatId).emit('message_deleted_sync', {
        chatId,
        messageId,
        type,
        isDeletedForEveryone,
      });
    });

    /**
     * WebRTC 1-on-1 Audio/Video Call Signaling
     */
    socket.on('call_user', ({ userToCall, signalData, from, callerName, callerAvatar, callType, chatId }) => {
      const targetId = userToCall?.toString();
      console.log(`📞 [Socket] call_user from ${from} to ${targetId} (${callType})`);
      io.to(targetId).emit('incoming_call', {
        signal: signalData,
        from: from?.toString() || currentUserId,
        callerName,
        callerAvatar,
        callType,
        chatId,
        socketId: socket.id,
      });
    });

    socket.on('answer_call', ({ signal, to, from }) => {
      const targetId = to?.toString();
      console.log(`✅ [Socket] answer_call from ${from} to ${targetId}`);
      io.to(targetId).emit('call_accepted', {
        signal,
        from: from?.toString() || currentUserId,
      });
    });

    socket.on('ice_candidate', ({ candidate, to }) => {
      const targetId = to?.toString();
      if (targetId && candidate) {
        io.to(targetId).emit('ice_candidate', {
          candidate,
          from: currentUserId,
        });
      }
    });

    socket.on('reject_call', async ({ to, chatId, callType, reason }) => {
      socket.to(to).emit('call_rejected', {
        from: currentUserId,
        reason: reason || 'Call declined',
      });

      // Save declined/missed call in chat
      if (chatId) {
        try {
          const callMsg = await Message.create({
            sender: to || currentUserId,
            content: callType === 'video' ? 'Missed video call' : 'Missed voice call',
            fileType: 'call',
            chat: chatId,
            callDetails: {
              callType: callType || 'audio',
              status: 'declined',
              duration: 0,
            },
          });

          const populatedMsg = await Message.findById(callMsg._id)
            .populate('sender', 'name avatar')
            .populate('chat');

          await Chat.findByIdAndUpdate(chatId, { latestMessage: populatedMsg });

          io.to(chatId).emit('message_received', populatedMsg);
          if (to) io.to(to).emit('message_received', populatedMsg);
        } catch (err) {
          console.error('Error logging rejected call to chat:', err.message);
        }
      }
    });

    socket.on('end_call', async ({ to, chatId, callType, duration, status }) => {
      if (to) {
        socket.to(to).emit('call_ended', { from: currentUserId, chatId });
      }
      if (chatId) {
        socket.to(chatId).emit('call_ended', { from: currentUserId, chatId });

        // Save Call in Chat Message History
        try {
          const callDurationNum = Number(duration) || 0;
          const isCompleted = callDurationNum > 0 || status === 'completed';
          const callTitle = callType === 'video'
            ? (isCompleted ? 'Video call' : 'Missed video call')
            : (isCompleted ? 'Voice call' : 'Missed voice call');

          const callMsg = await Message.create({
            sender: currentUserId,
            content: callTitle,
            fileType: 'call',
            chat: chatId,
            callDetails: {
              callType: callType || 'audio',
              status: isCompleted ? 'completed' : 'missed',
              duration: callDurationNum,
            },
          });

          const populatedMsg = await Message.findById(callMsg._id)
            .populate('sender', 'name avatar')
            .populate('chat');

          await Chat.findByIdAndUpdate(chatId, { latestMessage: populatedMsg });

          io.to(chatId).emit('message_received', populatedMsg);
          if (to) io.to(to).emit('message_received', populatedMsg);
        } catch (err) {
          console.error('Error logging completed call to chat:', err.message);
        }
      }
    });

    socket.on('toggle_media', ({ to, mediaType, isMuted }) => {
      socket.to(to).emit('peer_media_toggled', {
        from: currentUserId,
        mediaType,
        isMuted,
      });
    });

    /**
     * WebRTC Group Calling Signaling
     */
    socket.on('initiate_group_call', ({ chatId, groupName, groupAvatar, callType, callerUser, memberIds }) => {
      if (Array.isArray(memberIds)) {
        memberIds.forEach((memberId) => {
          const id = typeof memberId === 'string' ? memberId : memberId?._id?.toString();
          if (id && id !== currentUserId) {
            io.to(id).emit('incoming_group_call', {
              chatId,
              groupName,
              groupAvatar,
              callType,
              caller: callerUser,
              from: currentUserId,
            });
          }
        });
      }
    });

    socket.on('join_group_call', ({ chatId, user }) => {
      socket.join(`call_${chatId}`);
      socket.to(`call_${chatId}`).emit('user_joined_group_call', {
        socketId: socket.id,
        user,
      });
    });

    socket.on('send_group_signal', ({ userToSignal, callerId, signal }) => {
      io.to(userToSignal).emit('group_user_joined', {
        signal,
        callerId,
      });
    });

    socket.on('return_group_signal', ({ callerId, signal }) => {
      io.to(callerId).emit('group_signal_received', {
        signal,
        id: socket.id,
      });
    });

    socket.on('leave_group_call', ({ chatId }) => {
      socket.leave(`call_${chatId}`);
      socket.to(`call_${chatId}`).emit('user_left_group_call', {
        socketId: socket.id,
        userId: currentUserId,
      });
    });

    /**
     * Heartbeat & Disconnection
     */
    socket.on('heartbeat', () => {
      socket.emit('heartbeat_ack');
    });

    socket.on('disconnect', async () => {
      if (!currentUserId) return;

      const userSockets = onlineUserSockets.get(currentUserId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0 && currentUserId !== 'guest_qr_login' && currentUserId.length === 24) {
          onlineUserSockets.delete(currentUserId);
          await cache.srem('online_users', currentUserId);

          const lastSeen = new Date();
          try {
            await User.findByIdAndUpdate(currentUserId, {
              isOnline: false,
              lastSeen,
            });
          } catch (e) {
            console.error('Error on socket disconnect:', e.message);
          }

          socket.broadcast.emit('user_status', {
            userId: currentUserId,
            isOnline: false,
            lastSeen,
          });
        }
      }
    });
  });
};
