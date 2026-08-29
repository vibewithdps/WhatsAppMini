import { create } from 'zustand';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { startIncomingRingtone, stopIncomingRingtone } from '../services/audio';

export const useCallStore = create((set, get) => ({
  callStatus: 'idle', // 'idle' | 'calling' | 'incoming' | 'connected' | 'ended'
  callType: 'audio', // 'audio' | 'video'
  isGroupCall: false,
  groupInfo: null, // { chatId, groupName, groupAvatar, callType, caller }
  groupPeers: [], // [ { socketId, user, stream, isMuted, isCameraOff } ]

  caller: null,
  receiver: null,
  chatId: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  callDuration: 0,
  isMinimized: false,
  incomingCallData: null,
  callHistory: [],
  isLoadingHistory: false,

  setCallStatus: (status) => set({ callStatus: status }),
  setCallType: (type) => set({ callType: type }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream, streamUpdateTs: Date.now() }),
  setCallDuration: (duration) => set({ callDuration: duration }),

  addGroupPeer: ({ socketId, user, stream }) => {
    const currentPeers = get().groupPeers;
    const existingIndex = currentPeers.findIndex((p) => p.socketId === socketId || p.user?._id === user?._id);
    if (existingIndex >= 0) {
      const updated = [...currentPeers];
      updated[existingIndex] = { ...updated[existingIndex], stream, user };
      set({ groupPeers: updated });
    } else {
      set({ groupPeers: [...currentPeers, { socketId, user, stream, isMuted: false, isCameraOff: false }] });
    }
  },

  removeGroupPeer: (socketId) => {
    set({
      groupPeers: get().groupPeers.filter((p) => p.socketId !== socketId),
    });
  },

  handleIncomingCall: (data) => {
    startIncomingRingtone();
    set({
      incomingCallData: data,
      isGroupCall: Boolean(data.isGroupCall),
      groupInfo: data.isGroupCall ? { chatId: data.chatId, groupName: data.groupName, groupAvatar: data.groupAvatar } : null,
      callStatus: 'incoming',
      callType: data.callType || 'audio',
      caller: {
        _id: data.from,
        name: data.callerName || data.groupName,
        avatar: data.callerAvatar || data.groupAvatar,
      },
      chatId: data.chatId,
    });
  },

  handleIncomingGroupCall: (data) => {
    startIncomingRingtone();
    set({
      incomingCallData: data,
      isGroupCall: true,
      groupInfo: {
        chatId: data.chatId,
        groupName: data.groupName,
        groupAvatar: data.groupAvatar,
      },
      callStatus: 'incoming',
      callType: data.callType || 'video',
      caller: {
        _id: data.from,
        name: `${data.caller?.name || 'Contact'} in ${data.groupName}`,
        avatar: data.groupAvatar || data.caller?.avatar,
      },
      chatId: data.chatId,
    });
  },

  rejectIncomingCall: () => {
    stopIncomingRingtone();
    const data = get().incomingCallData;
    const socket = getSocket();
    if (socket && data) {
      socket.emit('reject_call', {
        to: data.from,
        chatId: data.chatId,
        callType: data.callType || 'audio',
        reason: 'Declined',
      });
    }
    set({
      callStatus: 'idle',
      incomingCallData: null,
      caller: null,
      isGroupCall: false,
      groupInfo: null,
      groupPeers: [],
    });
  },

  endActiveCall: async (emitSocket = true) => {
    const useAuthStore = require('./useAuthStore').default;
    const currentUser = useAuthStore.getState().user;
    const isInitiator = get().caller?._id === currentUser?._id;

    set({ isMinimized: false });
    stopIncomingRingtone();
    const { localStream, caller, receiver, chatId, callType, callDuration, isGroupCall, groupPeers } = get();
    const socket = getSocket();

    if (localStream) {
      try {
        localStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
    }

    if (groupPeers && groupPeers.length > 0) {
      groupPeers.forEach((p) => {
        if (p.stream) {
          try {
            p.stream.getTracks().forEach((track) => track.stop());
          } catch (e) {}
        }
      });
    }

    if (isGroupCall && socket && chatId) {
      socket.emit('leave_group_call', { chatId });
    } else {
      const peerId = receiver?._id || caller?._id;
      if (emitSocket && socket && peerId) {
        socket.emit('end_call', {
          to: peerId,
          chatId,
          callType: callType || 'audio',
          duration: callDuration,
          status: callDuration > 0 ? 'completed' : 'missed',
          saveLog: isInitiator,
        });
      }

      if (peerId && isInitiator) {
        try {
          await api.post('/calls', {
            receiverId: peerId,
            chatId,
            callType,
            status: callDuration > 0 ? 'completed' : 'missed',
            duration: callDuration,
          });
        } catch (e) {}
      }
    }

    set({
      callStatus: 'idle',
      isGroupCall: false,
      groupInfo: null,
      groupPeers: [],
      localStream: null,
      remoteStream: null,
      incomingCallData: null,
      caller: null,
      receiver: null,
      callDuration: 0,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
    });
  },

  toggleMute: () => {
    const { localStream, isMuted, receiver, caller, isGroupCall, chatId } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        set({ isMuted: !isMuted });

        const socket = getSocket();
        if (socket) {
          if (isGroupCall && chatId) {
            socket.emit('toggle_media', {
              to: chatId,
              mediaType: 'audio',
              isMuted: !isMuted,
            });
          } else {
            const peerId = receiver?._id || caller?._id;
            if (peerId) {
              socket.emit('toggle_media', {
                to: peerId,
                mediaType: 'audio',
                isMuted: !isMuted,
              });
            }
          }
        }
      }
    }
  },

  toggleCamera: () => {
    const { localStream, isCameraOff, receiver, caller, isGroupCall, chatId } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isCameraOff;
        set({ isCameraOff: !isCameraOff });

        const socket = getSocket();
        if (socket) {
          if (isGroupCall && chatId) {
            socket.emit('toggle_media', {
              to: chatId,
              mediaType: 'video',
              isMuted: !isCameraOff,
            });
          } else {
            const peerId = receiver?._id || caller?._id;
            if (peerId) {
              socket.emit('toggle_media', {
                to: peerId,
                mediaType: 'video',
                isMuted: !isCameraOff,
              });
            }
          }
        }
      }
    }
  },

  fetchCallHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const res = await api.get('/calls');
      set({ callHistory: res.data, isLoadingHistory: false });
    } catch (err) {
      set({ isLoadingHistory: false });
    }
  },
  deleteCallLog: async (callId) => {
    try {
      await api.delete(`/calls/${callId}`);
      set(state => ({ callHistory: state.callHistory.filter(c => c._id !== callId) }));
    } catch(e) {}
  },
}));
