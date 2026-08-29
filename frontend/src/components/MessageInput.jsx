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
  MapPin,
  Sticker,
  Lock,
  X,
  Share2,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { getSocket } from '../services/socket';
import { encryptMessage } from '../services/crypto';

// Sample WhatsApp Popular Stickers
const POPULAR_STICKERS = [
  'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif',
  'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
  'https://media.giphy.com/media/C9x8gX02SnMIoAClXA/giphy.gif',
  'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif',
  'https://media.giphy.com/media/l4KibWpBGWWRJaPUY/giphy.gif',
  'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
  'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif',
  'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif',
];

export const MessageInput = () => {
  const user = useAuthStore((state) => state.user);
  const { activeChat, sendMessage, setPendingMedia, quotedMessage } = useChatStore();

  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false); // Emoji / Sticker popup
  const [pickerTab, setPickerTab] = useState('emoji'); // 'emoji' | 'stickers'
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isEncryptedMode, setIsEncryptedMode] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);

  const fileInputRef = useRef(null);
  const audioFileInputRef = useRef(null);
  const docFileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    audioBlob,
    setAudioBlob,
  } = useAudioRecorder();

  // Socket typing indicator
  const handleTextChange = (e) => {
    // Auto resize textarea
    if (e.target.tagName === 'TEXTAREA') {
      e.target.style.height = 'auto';
      e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
    }
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
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const trimmed = text.trim();
    if (!trimmed || !activeChat) return;

    // Clear input immediately so user gets 0ms responsive feedback
    setText('');
    setShowPicker(false);

    let contentToSend = trimmed;
    if (isEncryptedMode) {
      try {
        contentToSend = await encryptMessage(contentToSend, activeChat._id);
      } catch (err) {
        console.warn('Encryption fallback to plain text:', err);
      }
    }

    try {
      await sendMessage({
        content: contentToSend,
        replyToId: quotedMessage?._id,
        encrypted: isEncryptedMode,
      });
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  // Handle Send Sticker
  const handleSendSticker = async (stickerUrl) => {
    if (!activeChat) return;
    setShowPicker(false);
    try {
      await sendMessage({
        content: 'Sticker',
        fileUrl: stickerUrl,
        fileType: 'image',
        replyToId: quotedMessage?._id,
      });
    } catch (err) {
      console.error('Sticker send error:', err);
    }
  };

  // Handle Share Current GPS Location
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsSharingLocation(true);
    setShowAttachMenu(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        try {
          await sendMessage({
            content: `📍 Live Location: ${mapsUrl}`,
            replyToId: quotedMessage?._id,
          });
        } catch (e) {
          console.error('Failed to send location:', e);
        } finally {
          setIsSharingLocation(false);
        }
      },
      (err) => {
        alert(`Location permission denied or unavailable: ${err.message}`);
        setIsSharingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
  const handleFileSelect = (e, customType = null) => {
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
    <div className="w-full bg-wa-light-header dark:bg-wa-dark-header border-t border-wa-light-border dark:border-wa-dark-border relative z-30 shadow-2xl px-2 sm:px-4 py-2 sm:py-2.5">
      {/* Emoji & Stickers Popup Menu */}
      {showPicker && (
        <div className="absolute bottom-full mb-2 left-2 sm:left-4 z-50 shadow-2xl bg-wa-dark-panel dark:bg-wa-dark-panel bg-white rounded-3xl border border-wa-dark-border overflow-hidden max-w-[calc(100vw-16px)] sm:max-w-sm animate-fade-in">
          {/* Picker Tabs Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-wa-dark-border dark:border-wa-dark-border border-wa-light-border bg-wa-dark-header dark:bg-wa-dark-header bg-wa-light-header">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPickerTab('emoji')}
                className={`text-xs font-bold pb-1 flex items-center gap-1.5 transition-colors ${
                  pickerTab === 'emoji'
                    ? 'text-wa-green border-b-2 border-wa-green'
                    : 'text-wa-text-secondary hover:text-wa-text-primary'
                }`}
              >
                <Smile className="w-4 h-4" />
                <span>Emoji</span>
              </button>
              <button
                type="button"
                onClick={() => setPickerTab('stickers')}
                className={`text-xs font-bold pb-1 flex items-center gap-1.5 transition-colors ${
                  pickerTab === 'stickers'
                    ? 'text-wa-green border-b-2 border-wa-green'
                    : 'text-wa-text-secondary hover:text-wa-text-primary'
                }`}
              >
                <Sticker className="w-4 h-4" />
                <span>Stickers</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="text-wa-text-secondary hover:text-wa-text-primary p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Picker Content Body */}
          {pickerTab === 'emoji' ? (
            <EmojiPicker
              theme="dark"
              onEmojiClick={(emojiData) => setText((prev) => prev + emojiData.emoji)}
              searchPlaceHolder="Search emoji..."
              width={Math.min(340, window.innerWidth - 32)}
              height={360}
            />
          ) : (
            <div className="p-3 grid grid-cols-4 gap-2 h-72 overflow-y-auto">
              {POPULAR_STICKERS.map((stk, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendSticker(stk)}
                  className="rounded-xl overflow-hidden hover:scale-105 transition-transform border border-transparent hover:border-wa-green"
                >
                  <img src={stk} alt="Sticker" className="w-full h-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rich WhatsApp Attachment Popup Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-full mb-3 left-3 sm:left-12 bg-wa-dark-panel dark:bg-wa-dark-panel bg-white p-3 rounded-3xl shadow-2xl border border-wa-dark-border dark:border-wa-dark-border border-wa-light-border grid grid-cols-3 gap-3 z-50 w-72 animate-fade-in">
          {/* Photos & Videos */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-wa-dark-hover dark:hover:bg-wa-dark-hover hover:bg-wa-light-hover transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow">
              <ImageIcon className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-wa-text-primary">Photos</span>
          </button>

          {/* Document */}
          <button
            type="button"
            onClick={() => docFileInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-wa-dark-hover dark:hover:bg-wa-dark-hover hover:bg-wa-light-hover transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-wa-text-primary">Document</span>
          </button>

          {/* Audio */}
          <button
            type="button"
            onClick={() => audioFileInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-wa-dark-hover dark:hover:bg-wa-dark-hover hover:bg-wa-light-hover transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow">
              <Music className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-wa-text-primary">Audio</span>
          </button>

          {/* Location */}
          <button
            type="button"
            onClick={handleShareLocation}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-wa-dark-hover dark:hover:bg-wa-dark-hover hover:bg-wa-light-hover transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow">
              <MapPin className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-wa-text-primary">Location</span>
          </button>

          {/* Stickers */}
          <button
            type="button"
            onClick={() => {
              setPickerTab('stickers');
              setShowPicker(true);
              setShowAttachMenu(false);
            }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-wa-dark-hover dark:hover:bg-wa-dark-hover hover:bg-wa-light-hover transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow">
              <Sticker className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-wa-text-primary">Stickers</span>
          </button>

          {/* Contact */}
          <button
            type="button"
            onClick={() => {
              setText(`👤 Contact: ${user?.name || 'Contact'} (${user?.phone || user?.email})`);
              setShowAttachMenu(false);
            }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-wa-dark-hover dark:hover:bg-wa-dark-hover hover:bg-wa-light-hover transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow">
              <Share2 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-wa-text-primary">Contact</span>
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => handleFileSelect(e, 'image')}
        className="hidden"
        accept="image/*,video/*"
      />
      <input
        ref={docFileInputRef}
        type="file"
        onChange={(e) => handleFileSelect(e, 'document')}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.zip"
      />
      <input
        ref={audioFileInputRef}
        type="file"
        onChange={(e) => handleFileSelect(e, 'audio')}
        className="hidden"
        accept="audio/*"
      />

      {/* Recording State UI */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-3 animate-fade-in py-1">
          {/* Delete Recording */}
          <button
            type="button"
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

          {/* Finish & Send Voice */}
          <button
            type="button"
            onClick={stopRecording}
            className="w-11 h-11 rounded-full bg-wa-green text-white flex items-center justify-center hover:bg-wa-green-dark transition-transform active:scale-95 flex-shrink-0 shadow-lg"
            title="Send Voice Note"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      ) : (
        /* Unified Form for Complete Input Bar */
        <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2.5 w-full">
          {/* Emoji & Stickers Button */}
          <button
            type="button"
            onClick={() => {
              setPickerTab('emoji');
              setShowPicker(!showPicker);
            }}
            className={`p-2 rounded-full transition-colors flex-shrink-0 ${
              showPicker ? 'text-wa-green bg-wa-green/10' : 'text-wa-text-secondary hover:text-wa-text-primary'
            }`}
            title="Emoji & Stickers"
          >
            <Smile className="w-6 h-6" />
          </button>

          {/* Attachment Paperclip Button */}
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-2 rounded-full transition-colors flex-shrink-0 ${
              showAttachMenu ? 'text-wa-green bg-wa-green/10 rotate-45' : 'text-wa-text-secondary hover:text-wa-text-primary'
            }`}
            title="Attach Media, Doc, Location"
          >
            <Paperclip className="w-6 h-6 transition-transform" />
          </button>

          {/* End-to-End Encryption Toggle */}
          <button
            type="button"
            onClick={() => setIsEncryptedMode(!isEncryptedMode)}
            className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
              isEncryptedMode
                ? 'text-wa-green bg-wa-green/15 ring-1 ring-wa-green'
                : 'text-wa-text-secondary hover:text-wa-text-primary'
            }`}
            title={isEncryptedMode ? 'End-to-End Encrypted (AES-GCM ON)' : 'Standard Delivery (Click for E2E)'}
          >
            <Lock className="w-5 h-5" />
          </button>

          {/* Main Message Text Input Box */}
          <div className="flex-1 min-w-0">
            <textarea
              value={text}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const enterSends = user?.enterIsSend === true;
                  if (enterSends && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  } else if (!enterSends && !e.shiftKey) {
                    // let it add a new line
                  }
                }
              }}
              rows={1}
              placeholder={
                isSharingLocation
                  ? '📍 Getting GPS Location...'
                  : isEncryptedMode
                  ? '🔒 Encrypted message...'
                  : 'Message'
              }
              className="w-full px-4 py-2.5 sm:py-3 rounded-[20px] bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-wa-green shadow-inner resize-none min-h-[44px] max-h-[120px] overflow-y-auto"
            />
          </div>

          {/* Send Button or Voice Note Mic */}
          {text.trim() ? (
            <button
              type="submit"
              className="w-11 h-11 rounded-full bg-wa-green text-white flex items-center justify-center hover:bg-wa-green-dark transition-transform active:scale-95 flex-shrink-0 shadow-lg cursor-pointer"
              title="Send message"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="w-11 h-11 rounded-full bg-wa-green/15 text-wa-green hover:bg-wa-green hover:text-white flex items-center justify-center transition-all flex-shrink-0 shadow active:scale-95 cursor-pointer"
              title="Hold to Record Voice Note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
      )}
    </div>
  );
};
