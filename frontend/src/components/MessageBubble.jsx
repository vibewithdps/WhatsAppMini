import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  CheckCheck,
  Star,
  CornerUpLeft,
  Share2,
  Trash2,
  Smile,
  Play,
  Pause,
  FileText,
  Download,
  Lock,
  Phone,
  Video,
  Maximize2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useImageViewerStore } from '../store/useImageViewerStore';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessageBubble = ({ message, onReply, onForward }) => {
  const user = useAuthStore((state) => state.user);
  const { reactToMessage, toggleStarMessage, deleteMessage } = useChatStore();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const audioRef = useRef(null);

  const isSentByMe = message.sender?._id === user?._id;
  const isDeleted = message.isDeletedForEveryone;
  const isStarred = message.isStarred?.includes(user?._id);
  const isEncrypted = message.encrypted;

  const [decryptedContent, setDecryptedContent] = useState(message.content);

  useEffect(() => {
    let isMounted = true;
    if (isEncrypted && message.content?.startsWith('enc:')) {
      import('../services/crypto').then(({ decryptMessage }) => {
        const chatId = typeof message.chat === 'object' ? message.chat?._id : message.chat;
        decryptMessage(message.content, chatId).then((res) => {
          if (isMounted) setDecryptedContent(res);
        });
      });
    } else {
      setDecryptedContent(message.content);
    }
    return () => { isMounted = false; };
  }, [message.content, isEncrypted, message.chat]);

  // Read receipts
  const isReadByRecipient =
    isSentByMe && message.readBy && message.readBy.length > 1;
  const isDelivered =
    isSentByMe && message.deliveredTo && message.deliveredTo.length > 1;

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  return (
    <div
      className={`flex flex-col group relative my-1 ${
        isSentByMe ? 'items-end' : 'items-start'
      }`}
      onMouseLeave={() => {
        setShowContextMenu(false);
        setShowReactionsMenu(false);
      }}
    >
      <div
        className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-3.5 py-2 shadow-sm relative transition-all ${
          isSentByMe
            ? 'bg-wa-dark-bubble-out dark:bg-wa-dark-bubble-out bg-wa-light-bubble-out rounded-tr-none text-wa-text-primary'
            : 'bg-wa-dark-bubble-in dark:bg-wa-dark-bubble-in bg-wa-light-bubble-in rounded-tl-none text-wa-text-primary'
        }`}
      >
        {/* Sender Name in Group Chat */}
        {!isSentByMe && message.chat?.isGroupChat && (
          <p className="text-xs font-semibold text-wa-green mb-1">
            {message.sender?.name || 'Group Member'}
          </p>
        )}

        {/* Quoted / Reply Preview */}
        {message.replyTo && (
          <div className="mb-2 p-2 bg-black/20 dark:bg-black/20 bg-white/40 border-l-4 border-wa-green rounded text-xs">
            <span className="font-semibold text-wa-green block">
              {message.replyTo.sender?.name || 'Reply to message'}
            </span>
            <p className="truncate text-wa-text-secondary">
              {message.replyTo.content || message.replyTo.fileName || 'Attachment'}
            </p>
          </div>
        )}

        {/* Media Attachments */}
        {message.fileUrl && !isDeleted && (
          <div className="mb-2 rounded-lg overflow-hidden">
            {message.fileType === 'image' && (
              <div className="relative group">
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    openImageViewer({
                      imageUrl: message.fileUrl,
                      title: message.fileName || 'Photo',
                      mediaType: 'image'
                    });
                  }}
                  href={message.fileUrl}
                  className="block cursor-pointer"
                >
                  <img
                    src={message.fileUrl}
                    alt={message.fileName || 'Photo'}
                    className="max-h-72 w-full object-cover rounded-lg hover:opacity-95 transition-opacity"
                  />
                </a>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = message.fileUrl;
                    link.download = message.fileName || `WhatsApp_Image_${Date.now()}.jpg`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  title="Download"
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 md:opacity-0 opacity-100"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}

            {message.fileType === 'video' && (
              <div className="relative group">
                <video
                  src={message.fileUrl}
                  controls
                  onClick={(e) => {
                    // Only open viewer if they didn't click the controls
                    // Native controls are hard to detect, but we can just let them use controls
                    // Or we can add an expand icon!
                  }}
                  className="max-h-72 w-full rounded-lg bg-black"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageViewer({
                      imageUrl: message.fileUrl,
                      title: message.fileName || 'Video',
                      mediaType: 'video'
                    });
                  }}
                  className="absolute bottom-2 left-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                  title="Full Screen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = message.fileUrl;
                    link.download = message.fileName || `WhatsApp_Video_${Date.now()}.mp4`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  title="Download"
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 md:opacity-0 opacity-100 z-10"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}

            {(message.fileType === 'audio' || message.fileType === 'voice') && (
              <div className="flex items-center gap-3 p-2 bg-black/10 dark:bg-black/20 rounded-xl">
                <button
                  onClick={toggleAudioPlayback}
                  className="w-10 h-10 flex-shrink-0 bg-wa-green text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlayingAudio ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>
                <audio
                  ref={audioRef}
                  src={message.fileUrl}
                  onEnded={() => setIsPlayingAudio(false)}
                  className="hidden"
                />
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-1 h-6">
                    {[35, 60, 90, 45, 75, 30, 85, 55, 40, 70, 95, 60, 40, 80, 50].map(
                      (height, idx) => (
                        <div
                          key={idx}
                          className={`w-1 rounded-full ${
                            isPlayingAudio ? 'bg-wa-green' : 'bg-wa-text-secondary/50'
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      )
                    )}
                  </div>
                  <span className="text-[10px] text-wa-text-secondary">
                    {message.fileType === 'voice' ? 'Voice Message' : 'Audio Track'}
                  </span>
                </div>
              </div>
            )}

            {message.fileType === 'document' && (
              <div className="flex items-center gap-3 p-3 bg-black/10 dark:bg-black/20 rounded-xl">
                <FileText className="w-8 h-8 text-wa-green flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-wa-text-primary">
                    {message.fileName || 'Document'}
                  </p>
                  <p className="text-[10px] text-wa-text-secondary">
                    {message.fileSize
                      ? `${(message.fileSize / 1024).toFixed(1)} KB`
                      : 'File attachment'}
                  </p>
                </div>
                <a
                  href={message.fileUrl}
                  download={message.fileName || 'download'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-wa-text-secondary hover:text-wa-green transition-colors"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Real WhatsApp Call Log Bubble */}
        {message.fileType === 'call' && (
          <div className="flex items-center gap-3 py-1 min-w-[200px]">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.callDetails?.status === 'missed' || message.callDetails?.status === 'declined'
                  ? 'bg-red-500/15 text-red-500'
                  : 'bg-wa-green/15 text-wa-green'
              }`}
            >
              {message.callDetails?.callType === 'video' ? (
                <Video className="w-5 h-5" />
              ) : (
                <Phone className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span
                className={`text-sm font-semibold block ${
                  message.callDetails?.status === 'missed' || message.callDetails?.status === 'declined'
                    ? 'text-red-400'
                    : 'text-wa-text-primary'
                }`}
              >
                {decryptedContent}
              </span>
              <p className="text-xs text-wa-text-secondary mt-0.5">
                {message.callDetails?.status === 'completed' && message.callDetails?.duration > 0
                  ? `${Math.floor(message.callDetails.duration / 60)}m ${message.callDetails.duration % 60}s`
                  : message.callDetails?.status === 'declined'
                  ? 'Call declined'
                  : 'No answer'}
              </p>
            </div>
          </div>
        )}

        {/* Message Text */}
        {message.fileType !== 'call' && (
          <div className="break-words text-sm whitespace-pre-wrap leading-relaxed">
            {isDeleted ? (
              <span className="italic text-wa-text-secondary text-xs">
                🚫 {decryptedContent}
              </span>
            ) : (
              <>
                {isEncrypted && (
                  <Lock className="w-3.5 h-3.5 inline mr-1.5 text-wa-green" />
                )}
                {decryptedContent && decryptedContent.startsWith('📍 Live Location:') ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <a
                      href={decryptedContent.split('📍 Live Location: ')[1]}
                      target="_blank"
                      rel="noreferrer"
                      className="block relative overflow-hidden rounded-xl bg-wa-dark-bg/50 border border-wa-dark-border group"
                    >
                      <img
                        src={`https://staticmap.openstreetmap.de/staticmap.php?center=${decryptedContent.match(/q=(-?[\d.]+),(-?[\d.]+)/)?.[1]},${decryptedContent.match(/q=(-?[\d.]+),(-?[\d.]+)/)?.[2]}&zoom=15&size=400x200&markers=${decryptedContent.match(/q=(-?[\d.]+),(-?[\d.]+)/)?.[1]},${decryptedContent.match(/q=(-?[\d.]+),(-?[\d.]+)/)?.[2]}`}
                        alt="Map Preview"
                        className="w-full h-32 md:h-40 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=200&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-4 py-1.5 bg-wa-green text-white text-xs font-bold rounded-full shadow-lg">
                          Open Map
                        </span>
                      </div>
                    </a>
                    <a
                      href={decryptedContent.split('📍 Live Location: ')[1]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-wa-blue-tick hover:underline text-xs"
                    >
                      {decryptedContent.split('📍 Live Location: ')[1]}
                    </a>
                  </div>
                ) : (
                  decryptedContent
                )}
              </>
            )}
          </div>
        )}

        {/* Metadata Footer: Timestamp, Star, Status ticks */}
        <div className="flex items-center justify-end gap-1.5 mt-1 select-none text-[11px] text-wa-text-secondary">
          {isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
          <span>{format(new Date(message.createdAt), 'p')}</span>

          {isSentByMe && (
            <span>
              {isReadByRecipient ? (
                <CheckCheck className="w-4 h-4 text-wa-blue-tick" />
              ) : isDelivered ? (
                <CheckCheck className="w-4 h-4 text-wa-text-secondary" />
              ) : (
                <Check className="w-4 h-4 text-wa-text-secondary" />
              )}
            </span>
          )}
        </div>

        {/* Reactions Display Pill */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-3 right-2 bg-wa-dark-panel dark:bg-wa-dark-panel bg-white border border-wa-dark-border dark:border-wa-dark-border border-wa-light-border px-2 py-0.5 rounded-full shadow flex items-center gap-1">
            {message.reactions.slice(0, 3).map((r, idx) => (
              <span key={idx} className="text-xs">
                {r.emoji}
              </span>
            ))}
            {message.reactions.length > 1 && (
              <span className="text-[10px] text-wa-text-secondary">
                {message.reactions.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover Action Triggers */}
      <div
        className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10 ${
          isSentByMe ? 'right-[76%] md:right-[66%]' : 'left-[76%] md:left-[66%]'
        }`}
      >
        {/* Quick Emoji Reaction Pill */}
        <div className="relative">
          <button
            onClick={() => setShowReactionsMenu(!showReactionsMenu)}
            title="React"
            className="p-1.5 rounded-full bg-wa-dark-panel dark:bg-wa-dark-panel bg-white shadow hover:bg-wa-dark-hover text-wa-text-secondary hover:text-wa-text-primary"
          >
            <Smile className="w-4 h-4" />
          </button>

          {showReactionsMenu && (
            <div className="absolute bottom-full mb-1 left-0 flex items-center gap-1 bg-wa-dark-panel dark:bg-wa-dark-panel bg-white p-1 rounded-full shadow-lg border border-wa-dark-border z-20 animate-fade-in">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    reactToMessage(message._id, emoji);
                    setShowReactionsMenu(false);
                  }}
                  className="hover:scale-125 transition-transform p-1 text-base"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reply Trigger */}
        <button
          onClick={() => onReply(message)}
          title="Reply"
          className="p-1.5 rounded-full bg-wa-dark-panel dark:bg-wa-dark-panel bg-white shadow hover:bg-wa-dark-hover text-wa-text-secondary hover:text-wa-text-primary"
        >
          <CornerUpLeft className="w-4 h-4" />
        </button>

        {/* Forward Trigger */}
        <button
          onClick={() => onForward(message)}
          title="Forward"
          className="p-1.5 rounded-full bg-wa-dark-panel dark:bg-wa-dark-panel bg-white shadow hover:bg-wa-dark-hover text-wa-text-secondary hover:text-wa-text-primary"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Star Trigger */}
        <button
          onClick={() => toggleStarMessage(message._id)}
          title={isStarred ? 'Unstar' : 'Star'}
          className="p-1.5 rounded-full bg-wa-dark-panel dark:bg-wa-dark-panel bg-white shadow hover:bg-wa-dark-hover text-wa-text-secondary hover:text-wa-text-primary"
        >
          <Star
            className={`w-4 h-4 ${
              isStarred ? 'text-amber-400 fill-amber-400' : ''
            }`}
          />
        </button>

        {/* Delete Trigger */}
        <button
          onClick={() => {
            if (isSentByMe && !isDeleted) {
              if (window.confirm('Delete for everyone? (Cancel = Delete for me only)')) {
                deleteMessage(message._id, 'forEveryone');
              } else {
                deleteMessage(message._id, 'forMe');
              }
            } else {
              deleteMessage(message._id, 'forMe');
            }
          }}
          title="Delete message"
          className="p-1.5 rounded-full bg-wa-dark-panel dark:bg-wa-dark-panel bg-white shadow hover:bg-red-500 hover:text-white text-wa-text-secondary"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
