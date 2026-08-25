import { useEffect } from 'react';
import { getSocket } from '../services/socket';
import { useCallStore } from '../store/useCallStore';
import { useAuthStore } from '../store/useAuthStore';

export const useWebRTC = () => {
  const user = useAuthStore((state) => state.user);
  const {
    setCallStatus,
    setCallType,
    setLocalStream,
    setRemoteStream,
    setCallDuration,
    incomingCallData,
    endActiveCall,
    handleIncomingCall,
    handleIncomingGroupCall,
  } = useCallStore();

  const startCall = async ({ receiverUser, callType, chatId }) => {
    try {
      const socket = getSocket();
      if (!socket) throw new Error('Socket not connected');

      useCallStore.setState({
        callStatus: 'calling',
        callType,
        receiver: receiverUser,
        chatId,
        isGroupCall: false,
      });

      // The Agora channel name will be the chatId
      socket.emit('call_user', {
        userToCall: receiverUser._id,
        from: user._id,
        callerName: user.name,
        callerAvatar: user.avatar,
        callType,
        chatId,
      });

      const handleCallAccepted = () => {
        console.log('📡 Call Accepted by receiver (Agora)');
        setCallStatus('connected');
        socket.off('call_accepted', handleCallAccepted);
      };

      socket.off('call_accepted');
      socket.on('call_accepted', handleCallAccepted);
    } catch (error) {
      console.error('Error starting Agora call:', error);
      endActiveCall();
    }
  };

  const answerCall = async () => {
    try {
      const socket = getSocket();
      if (!socket || !incomingCallData) throw new Error('Cannot answer call');

      setCallStatus('connecting'); // Transition to connecting (Agora joining)
      
      socket.emit('answer_call', {
        to: incomingCallData.from,
        from: user._id,
      });

      setCallStatus('connected');
    } catch (error) {
      console.error('Error answering call:', error);
      endActiveCall();
    }
  };

  const startGroupCall = async ({ groupChat, callType }) => {
    try {
      const socket = getSocket();
      if (!socket) throw new Error('Socket not connected');

      useCallStore.setState({
        callStatus: 'calling',
        callType,
        chatId: groupChat._id,
        isGroupCall: true,
        groupInfo: {
          chatId: groupChat._id,
          groupName: groupChat.chatName,
          groupAvatar: groupChat.groupAdmin?.avatar,
        },
      });

      socket.emit('initiate_group_call', {
        chatId: groupChat._id,
        groupName: groupChat.chatName,
        groupAvatar: groupChat.groupAdmin?.avatar,
        callType,
      });

    } catch (error) {
      console.error('Error starting group call:', error);
      endActiveCall();
    }
  };

  const answerGroupCall = async () => {
    try {
      const socket = getSocket();
      if (!socket || !incomingCallData) return;
      
      setCallStatus('connected');
      socket.emit('join_group_call', {
        chatId: incomingCallData.chatId,
      });

    } catch (error) {
      console.error('Error answering group call:', error);
      endActiveCall();
    }
  };

  const toggleScreenShare = async () => {
    console.log("Screen share is handled by Agora SDK natively now.");
  };

  const cleanupPeer = () => {
    // Agora handles cleanup in its own unmount hooks
    setLocalStream(null);
    setRemoteStream(null);
  };

  return {
    startCall,
    startGroupCall,
    answerCall,
    answerGroupCall,
    toggleScreenShare,
    cleanupPeer,
  };
};
