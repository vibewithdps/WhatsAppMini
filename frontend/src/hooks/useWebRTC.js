import { useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { useCallStore } from '../store/useCallStore';
import { useAuthStore } from '../store/useAuthStore';
import { stopIncomingRingtone } from '../services/audio';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export const useWebRTC = () => {
  const peerConnectionRef = useRef(null);
  const candidateQueueRef = useRef([]);
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
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    candidateQueueRef.current = [];
  }, []);

  const createPeerConnection = (targetUserId) => {
    const socket = getSocket();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', {
          candidate: event.candidate,
          to: targetUserId,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
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
          video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
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

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video',
      });
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

      // Socket Listeners
      const handleCallAccepted = async ({ signal }) => {
        if (pc && pc.signalingState !== 'closed') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            setCallStatus('connected');

            while (candidateQueueRef.current.length > 0) {
              const candidate = candidateQueueRef.current.shift();
              await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
            }
          } catch (e) {
            console.error('Error on setRemoteDescription in caller:', e);
          }
        }
      };

      const handleIceCandidate = async ({ candidate }) => {
        if (!pc || pc.signalingState === 'closed') return;

        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {}
        } else {
          candidateQueueRef.current.push(candidate);
        }
      };

      socket.once('call_accepted', handleCallAccepted);
      socket.on('ice_candidate', handleIceCandidate);
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
          video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
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
          video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
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
        setCallStatus('connected');
        return;
      }

      const pc = createPeerConnection(incomingCallData.from);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.signal));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      while (candidateQueueRef.current.length > 0) {
        const candidate = candidateQueueRef.current.shift();
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }

      socket.emit('answer_call', {
        signal: answer,
        to: incomingCallData.from,
        from: user._id,
      });

      setCallStatus('connected');

      const handleIceCandidate = async ({ candidate }) => {
        if (!pc || pc.signalingState === 'closed') return;
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {}
        } else {
          candidateQueueRef.current.push(candidate);
        }
      };

      socket.on('ice_candidate', handleIceCandidate);
    } catch (err) {
      console.error('Failed to answer call:', err);
      alert('Could not access microphone/camera. Please allow browser permissions.');
      cleanupPeer();
      endActiveCall(true);
    }
  };

  /**
   * Screen Share Toggle
   */
  const toggleScreenShare = async () => {
    const { isScreenSharing, localStream } = useCallStore.getState();
    const pc = peerConnectionRef.current;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (pc) {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          if (localStream) {
            const camTrack = localStream.getVideoTracks()[0];
            if (pc && camTrack) {
              const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
              if (sender) sender.replaceTrack(camTrack);
            }
          }
          useCallStore.setState({ isScreenSharing: false });
        };

        useCallStore.setState({ isScreenSharing: true });
      } catch (e) {}
    } else {
      if (localStream && pc) {
        const camTrack = localStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && camTrack) {
          sender.replaceTrack(camTrack);
        }
      }
      useCallStore.setState({ isScreenSharing: false });
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
