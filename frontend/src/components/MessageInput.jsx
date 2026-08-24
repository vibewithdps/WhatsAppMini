import React, { useState, useRef, useEffect } from 'react';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  Trash2,
  Image as ImageIcon,
  FileText,
  Music,
  Lock,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { getSocket } from '../services/socket';
import { encryptMessage } from '../services/crypto';

export const MessageInput = () => {
  const user = useAuthStore((state) => state.user);
  const { activeChat, sendMessage, setPendingMedia, quotedMessage } = useChatStore();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isEncryptedMode, setIsEncryptedMode] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const {
    isRecording,
    recordingDuration,
    audioLevels,
    startRecording,
    stopRecording,
    cancelRecording,
    audioBlob,
    setAudioBlob,
  } = useAudioRecorder();

  // Socket typing notification
  const handleTextChange = (e) => {
    setText(e.target.value);
    const socket = getSocket();
    if (socket && activeChat && user) {
      socket.emit('typing', {
        chatId: activeChat._id,
        user: { userId: user._id, userName: user.name },
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          chatId: activeChat._id,
          userId: user._id,
        });
      }, 2000);
    }
  };

  // Handle Send Text Message
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !activeChat) return;

    let contentToSend = text.trim();
    if (isEncryptedMode) {
      contentToSend = await encryptMessage(contentToSend, activeChat._id);
    }

    try {
      await sendMessage({
        content: contentToSend,
        replyToId: quotedMessage?._id,
        encrypted: isEncryptedMode,
      });
      setText('');
      setShowEmojiPicker(false);
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  // Handle Voice Note Send
  useEffect(() => {
    if (audioBlob && !isRecording) {
      const sendVoiceNote = async () => {
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        await sendMessage({
          file: audioFile,
          fileType: 'voice',
          replyToId: quotedMessage?._id,
        });
        setAudioBlob(null);
      };
      sendVoiceNote();
    }
  }, [audioBlob, isRecording, sendMessage, quotedMessage, setAudioBlob]);

  // Handle File Pick
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingMedia(file);
      setShowAttachMenu(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full px-2 sm:px-4 pt-2 pb-4 sm:py-3 bg-wa-dark-header dark:bg-wa-dark-header bg-wa-light-header border-t border-wa-dark-border dark:border-wa-dark-border border-wa-light-border relative z-30 shadow-lg flex-shrink-0">
      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-3 left-2 sm:left-4 z-50 shadow-2xl max-w-[calc(100vw-16px)]">
          <EmojiPicker
            theme="dark"
            onEmojiClick={(emojiData) => setText((prev) => prev + emojiData.emoji)}
            searchPlaceHolder="Search emoji..."
            width={Math.min(340, window.innerWidth - 32)}
            height={380}
          />
        </div>
      )}

      {/* Attachment Menu Popup */}
      {showAttachMenu && (
        <div className="absolute bottom-full mb-3 left-10 sm:left-14 bg-wa-dark-panel dark:bg-wa-dark-panel bg-white p-3 rounded-2xl shadow-2xl border border-wa-dark-border flex flex-col gap-2 z-50 animate-fade-in">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-wa-dark-hover text-xs font-semibold text-wa-text-primary"
          >
            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span>Photos & Videos</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-wa-dark-hover text-xs font-semibold text-wa-text-primary"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span>Document</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-wa-dark-hover text-xs font-semibold text-wa-text-primary"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <span>Audio File</span>
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
      />

      {/* Recording State UI */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-3 animate-fade-in py-1">
          {/* Delete Recording */}
          <button
            onClick={cancelRecording}
            className="p-2 rounded-full text-red-400 hover:bg-red-500/10 transition-colors"
            title="Cancel"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          {/* Pulse Waves & Duration */}
          <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-wa-dark-panel dark:bg-wa-dark-panel bg-white rounded-2xl border border-red-500/30">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-red-400">
              {formatDuration(recordingDuration)}
            </span>

            <div className="flex-1 flex items-center gap-1 h-4">
              <div className="w-1 bg-red-400 rounded-full h-2 animate-wave-1" />
              <div className="w-1 bg-red-400 rounded-full h-4 animate-wave-2" />
              <div className="w-1 bg-red-400 rounded-full h-3 animate-wave-3" />
              <div className="w-1 bg-red-400 rounded-full h-4 animate-wave-4" />
              <div className="w-1 bg-red-400 rounded-full h-2 animate-wave-5" />
            </div>
          </div>

          {/* Finish & Send */}
          <button
            onClick={stopRecording}
            className="w-10 h-10 rounded-full bg-wa-green text-white flex items-center justify-center hover:bg-wa-green-dark transition-transform active:scale-95 flex-shrink-0"
            title="Send Voice Note"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      ) : (
        /* Normal Input Bar */
        <div className="flex items-center gap-1 sm:gap-2.5">
          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 sm:p-2 text-wa-text-secondary hover:text-wa-text-primary transition-colors flex-shrink-0"
            title="Emoji"
          >
            <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Attachment Button */}
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-1.5 sm:p-2 text-wa-text-secondary hover:text-wa-text-primary transition-colors flex-shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Encryption Toggle */}
          <button
            onClick={() => setIsEncryptedMode(!isEncryptedMode)}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
              isEncryptedMode
                ? 'text-wa-green bg-wa-green/10'
                : 'text-wa-text-secondary hover:text-wa-text-primary'
            }`}
            title={isEncryptedMode ? 'End-to-End Encrypted (AES-GCM ON)' : 'Standard Delivery (Click for E2E)'}
          >
            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Text Input */}
          <form onSubmit={handleSend} className="flex-1 min-w-0">
            <input
              type="text"
              value={text}
              onChange={handleTextChange}
              placeholder={
                isEncryptedMode
                  ? '🔒 Encrypted message...'
                  : 'Type a message...'
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-wa-green shadow-inner"
            />
          </form>

          {/* Send or Mic Button */}
          {text.trim() ? (
            <button
              onClick={handleSend}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-wa-green text-white flex items-center justify-center hover:bg-wa-green-dark transition-transform active:scale-95 flex-shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input text-wa-text-secondary hover:text-wa-green hover:bg-wa-green/10 flex items-center justify-center transition-colors flex-shrink-0"
              title="Record Voice Note"
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
