import { stopIncomingRingtone } from '../services/audio';
import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import { useCallStore } from '../store/useCallStore';
import { useAuthStore } from '../store/useAuthStore';

// Free Metered.ca TURN server + Google STUN
// Read TURN server details from Environment Variables for Production
// If not found, it automatically falls back to the public open relay for local testing.
const TURN_URL = import.meta.env.VITE_TURN_URL || 'turn:openrelay.metered.ca:80';
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || 'openrelayproject';
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || 'openrelayproject';

// To support port 443 and TCP fallbacks automatically from the base URL provided:
const baseTurnUrl = TURN_URL.split('?')[0].replace(':80', '').replace(':443', '');
const domainOnly = baseTurnUrl ? baseTurnUrl.replace('//', '').replace('turn:', '') : 'openrelay.metered.ca';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: 'd7e3ad3d6e00da2fda92f5f9',
      credential: 's224R/i7rztN5wvF',
    },
    {
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username: 'd7e3ad3d6e00da2fda92f5f9',
      credential: 's224R/i7rztN5wvF',
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: 'd7e3ad3d6e00da2fda92f5f9',
      credential: 's224R/i7rztN5wvF',
    },
    {
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username: 'd7e3ad3d6e00da2fda92f5f9',
      credential: 's224R/i7rztN5wvF',
    }
  ]
};

let peerConnection = null;
      window.peerConnection = null;

export const useWebRTC = () => {
  const user = useAuthStore((state) => state.user);
  const {
    setCallStatus,
    setCallType,
    setLocalStream,
    setRemoteStream,
    incomingCallData,
    endActiveCall,
    callType,
  } = useCallStore();



  const cleanupPeer = () => {
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
  };

  const getMediaStream = async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get local stream', err);
      alert('Could not access camera/microphone. Please grant permissions.');
      endActiveCall();
      return null;
    }
  };

  const createPeer = (stream, socket, targetId, isInitiator) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection = pc;
    window.peerConnection = pc;

    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    pc.ontrack = (event) => {
      console.log('Received remote track', event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice_candidate', {
          target: targetId,
          candidate: event.candidate,
        });
      }
    };

    

    
    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        alert("Network connection failed.");
        endActiveCall();
      }
    };

    return pc;
  };


  const processIceQueue = async () => {
    if (window.iceCandidateQueue && window.peerConnection) {
      for (const candidate of window.iceCandidateQueue) {
        try {
          await window.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding queued ICE candidate', e);
        }
      }
      window.iceCandidateQueue = [];
    }
  };

  // Caller initiates call
  const startCall = async ({ receiverUser, callType, chatId }) => {
    const socket = getSocket();
    if (!socket) return;

    useCallStore.setState({
      callStatus: 'calling',
      callType,
      caller: user,
      receiver: receiverUser,
      chatId,
      isGroupCall: false,
    });

    const stream = await getMediaStream(callType);
    if (!stream) return;

    const pc = createPeer(stream, socket, receiverUser._id, true);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    processIceQueue();

    socket.emit('call_user', {
      userToCall: receiverUser._id,
      from: user._id,
      callerName: user.name,
      callerAvatar: user.avatar,
      callType,
      chatId,
      signalData: offer, // Send offer as signalData to match backend expectation
    });
    
    // Listen for answer
    socket.off('call_accepted');
    socket.on('call_accepted', async ({ signal }) => {
      setCallStatus('connected');
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        processIceQueue();
      }
    });
  };

  // Receiver answers call
  const answerCall = async () => {
    const socket = getSocket();
    if (!socket || !incomingCallData) return;

    stopIncomingRingtone();
    setCallStatus('connecting');
    const stream = await getMediaStream(incomingCallData.callType);
    if (!stream) return;

    const pc = createPeer(stream, socket, incomingCallData.from, false);
    
    // Set remote description from incoming offer
    if (incomingCallData.signal) {
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.signal));
      processIceQueue();
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('answer_call', {
      to: incomingCallData.from,
      from: user._id,
      signal: answer, // Send answer
    });

    setCallStatus('connected');
  };



  const startGroupCall = async () => {
    alert("Group calls currently disabled in free WebRTC mode.");
    endActiveCall();
  };

  const answerGroupCall = async () => {
    endActiveCall();
  };

  const flipCamera = async () => {
    if (!peerConnection) return;
    try {
      const currentStream = useCallStore.getState().localStream;
      if (!currentStream) return;
      
      const videoTrack = currentStream.getVideoTracks()[0];
      if (!videoTrack) return;
      
      // Some browsers don't return facingMode, so we toggle a global variable
      if (!window.currentFacingMode) window.currentFacingMode = 'user';
      const newFacingMode = window.currentFacingMode === 'user' ? 'environment' : 'user';
      window.currentFacingMode = newFacingMode;
      
      // Stop the current track first for iOS compatibility (iOS cannot open two cameras simultaneously)
      videoTrack.stop();
      currentStream.removeTrack(videoTrack);
      
      let newStream;
      try {
        // Try strict exact facingMode first
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: newFacingMode } },
          audio: false
        });
      } catch (err) {
        // Fallback to loose preference if exact fails (e.g. desktop)
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacingMode },
          audio: false
        });
      }
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      
      // Replace track in peer connection
      const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }
      
      // Update local stream
      currentStream.addTrack(newVideoTrack);
      
      // Clone the stream so React/Zustand detects the reference change
      const clonedStream = new MediaStream(currentStream.getTracks());
      useCallStore.setState({ localStream: clonedStream });
      
    } catch (e) {
      console.error("Flip camera failed:", e);
    }
  };

  const toggleScreenShare = async () => {
    if (!peerConnection) return;
    try {
      const currentStream = useCallStore.getState().localStream;
      const isScreenSharing = useCallStore.getState().isScreenSharing;
      if (!currentStream) return;
      
      const videoTrack = currentStream.getVideoTracks()[0];
      if (!videoTrack) return;
      
      let newVideoTrack;
      
      if (!isScreenSharing) {
        // Start screen sharing
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        newVideoTrack = displayStream.getVideoTracks()[0];
        
        // Listen for user stopping screen share via browser UI
        newVideoTrack.onended = () => {
          toggleScreenShare(); // Revert back to camera
        };
        
        useCallStore.setState({ isScreenSharing: true });
      } else {
        // Revert to camera
        const newFacingMode = window.currentFacingMode || 'user';
        let camStream;
        try {
          camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: newFacingMode } } });
        } catch(e) {
          camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        newVideoTrack = camStream.getVideoTracks()[0];
        useCallStore.setState({ isScreenSharing: false });
      }
      
      // Replace track in peer connection
      const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }
      
      // Update local stream
      videoTrack.stop();
      currentStream.removeTrack(videoTrack);
      currentStream.addTrack(newVideoTrack);
      
      const clonedStream = new MediaStream(currentStream.getTracks());
      useCallStore.setState({ localStream: clonedStream });
      
    } catch (e) {
      console.error("Screen share failed:", e);
      useCallStore.setState({ isScreenSharing: false });
    }
  };

  return {
    startCall,
    startGroupCall,
    answerCall,
    answerGroupCall,
    toggleScreenShare,
    flipCamera,
    cleanupPeer,
  };
};
