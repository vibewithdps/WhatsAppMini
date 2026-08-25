import { useCallback, useEffect } from 'react';
import { getSocket } from '../services/socket';
import { useCallStore } from '../store/useCallStore';
import { useAuthStore } from '../store/useAuthStore';
import { stopIncomingRingtone } from '../services/audio';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: 'd7e3ad3d6e00da2fda92f5f9',
      credential: 's224R/i7rztN5wvF',
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: 'd7e3ad3d6e00da2fda92f5f9',
      credential: 's224R/i7rztN5wvF',
    },
    {
      urls: 'turn:global.relay.metered.ca:443?transport=tcp',
      username: 'd7e3ad3d6e00da2fda92f5f9',
      credential: 's224R/i7rztN5wvF',
    },
  ],
};

// Use module-level singletons so multiple components calling useWebRTC share the same state
let globalPeerConnection = null;
let globalCandidateQueue = [];

export const useWebRTC = () => {
  const user = useAuthStore((state) => state.user);

  const {
    callStatus,
    setCallStatus,
    setLocalStream,
    setRemoteStream,
    incomingCallData,
    endActiveCall,
  } = useCallStore();

  const cleanupPeer = useCallback(() => {
    stopIncomingRingtone();
    const socket = getSocket();
    if (socket) {
      socket.off('call_accepted');
    }
    if (globalPeerConnection) {
      globalPeerConnection.onicecandidate = null;
      globalPeerConnection.ontrack = null;
      globalPeerConnection.oniceconnectionstatechange = null;
      globalPeerConnection.onconnectionstatechange = null;
      globalPeerConnection.close();
      globalPeerConnection = null;
    }
    globalCandidateQueue = [];
  }, []);

  const createPeerConnection = (targetUserId) => {
    const socket = getSocket();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    globalPeerConnection = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', {
          candidate: event.candidate,
          to: targetUserId,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('🎥 WebRTC Remote track received:', event.track.kind, event.track.id);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        setRemoteStream((prev) => {
          const s = prev || new MediaStream();
          s.addTrack(event.track);
          return s;
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('📡 ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setCallStatus('connected');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
      } else if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        cleanupPeer();
        endActiveCall(false);
      }
    };

    return pc;
  };

export const processIceCandidate = async (candidate) => {
  const pc = globalPeerConnection;
  if (!candidate) return;
  
  if (!pc || pc.signalingState === 'closed' || !pc.remoteDescription) {
    globalCandidateQueue.push(candidate);
  } else {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('addIceCandidate error:', e);
    }
  }
};

  /**
   * Start 1-on-1 Outgoing Call
   */
  const startCall = async ({ receiverUser, callType, chatId }) => {
    try {
      const socket = getSocket();
      if (!socket || !user) return;

      useCallStore.setState({
        callStatus: 'calling',
        callType,
        isGroupCall: false,
        receiver: receiverUser,
        chatId,
        callDuration: 0,
      });

      // Get user media
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        });
      } catch (mediaErr) {
        if (callType === 'video') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } else {
          throw mediaErr;
        }
      }

      setLocalStream(stream);

      const pc = createPeerConnection(receiverUser._id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call_user', {
        userToCall: receiverUser._id,
        signalData: offer,
        from: user._id,
        callerName: user.name,
        callerAvatar: user.avatar,
        callType,
        chatId,
      });

      // Handle Call Accepted Response
      const handleCallAccepted = async ({ signal }) => {
        console.log('📡 Call Accepted by receiver, setting remote description...');
        setCallStatus('connecting');
        if (pc && pc.signalingState !== 'closed') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            while (globalCandidateQueue.length > 0) {
              const candidate = globalCandidateQueue.shift();
              await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
            }
          } catch (e) {
            console.error('Error on setRemoteDescription in caller:', e);
          }
        }
      };

      socket.off('call_accepted');
      socket.on('call_accepted', handleCallAccepted);
    } catch (err) {
      console.error('Failed to start WebRTC call:', err);
      alert('Unable to access microphone or camera. Please check browser permissions.');
      cleanupPeer();
      endActiveCall(true);
    }
  };

  /**
   * Start Group Video or Voice Call
   */
  const startGroupCall = async ({ chat, callType }) => {
    try {
      const socket = getSocket();
      if (!socket || !user || !chat) return;

      useCallStore.setState({
        callStatus: 'connected',
        callType,
        isGroupCall: true,
        groupInfo: {
          chatId: chat._id,
          groupName: chat.chatName,
          groupAvatar: chat.chatAvatar,
        },
        caller: {
          _id: user._id,
          name: chat.chatName,
          avatar: chat.chatAvatar,
        },
        chatId: chat._id,
        callDuration: 0,
        groupPeers: [],
      });

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }

      setLocalStream(stream);

      // Join group call room
      socket.emit('join_group_call', {
        chatId: chat._id,
        user: { _id: user._id, name: user.name, avatar: user.avatar },
      });

      // Send incoming group call invitation to members
      const memberIds = (chat.users || []).map((u) => (typeof u === 'string' ? u : u._id));
      socket.emit('initiate_group_call', {
        chatId: chat._id,
        groupName: chat.chatName,
        groupAvatar: chat.chatAvatar,
        callType,
        callerUser: { _id: user._id, name: user.name, avatar: user.avatar },
        memberIds,
      });
    } catch (err) {
      console.error('Failed to start group call:', err);
      alert('Unable to access microphone/camera for group call.');
      cleanupPeer();
      endActiveCall(true);
    }
  };

  /**
   * Answer Incoming Call (1-on-1 or Group)
   */
  const answerCall = async () => {
    try {
      stopIncomingRingtone();
      const socket = getSocket();
      if (!socket || !incomingCallData || !user) return;

      const callType = incomingCallData.callType || 'audio';
      const isGroup = Boolean(incomingCallData.groupName);

      // Get user media
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        });
      } catch (mediaErr) {
        if (callType === 'video') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } else {
          throw mediaErr;
        }
      }

      setLocalStream(stream);

      if (isGroup) {
        useCallStore.setState({
          isGroupCall: true,
          callStatus: 'connecting',
          callType,
          groupInfo: {
            chatId: incomingCallData.chatId,
            groupName: incomingCallData.groupName,
            groupAvatar: incomingCallData.groupAvatar,
          },
        });
        socket.emit('join_group_call', {
          chatId: incomingCallData.chatId,
          user: { _id: user._id, name: user.name, avatar: user.avatar },
        });
        return;
      }

      useCallStore.setState({
        callStatus: 'connecting',
        callType,
        caller: {
          _id: incomingCallData.from,
          name: incomingCallData.callerName,
          avatar: incomingCallData.callerAvatar,
        },
      });

      const pc = createPeerConnection(incomingCallData.from);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.signal));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      while (globalCandidateQueue.length > 0) {
        const candidate = globalCandidateQueue.shift();
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }

      socket.emit('answer_call', {
        signal: answer,
        to: incomingCallData.from,
        from: user._id,
      });
    } catch (err) {
      console.error('Failed to answer call:', err);
      alert('Could not access microphone/camera. Please allow browser permissions.');
      cleanupPeer();
      endActiveCall(true);
    }
  };

  /**
   * Toggle Screen Sharing
   */
  const toggleScreenShare = async () => {
    const isSharing = useCallStore.getState().isScreenSharing;
    const pc = globalPeerConnection;

    if (!isSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const videoTrack = screenStream.getVideoTracks()[0];
        if (pc) {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }

        setLocalStream(screenStream);
        useCallStore.setState({ isScreenSharing: true });

        videoTrack.onended = () => {
          stopScreenSharing();
        };
      } catch (err) {
        console.error('Screen sharing error:', err);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = async () => {
    const pc = globalPeerConnection;
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const videoTrack = cameraStream.getVideoTracks()[0];
      if (pc) {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }

      setLocalStream(cameraStream);
      useCallStore.setState({ isScreenSharing: false });
    } catch (err) {
      console.error('Revert camera stream error:', err);
    }
  };

  return {
    startCall,
    startGroupCall,
    answerCall,
    toggleScreenShare,
    cleanupPeer,
  };
};
