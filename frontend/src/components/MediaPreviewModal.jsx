import React, { useState } from 'react';
import { X, Send, FileText } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

export const MediaPreviewModal = () => {
  const { isMediaPreviewOpen, pendingMediaFile, setPendingMedia, sendMessage, quotedMessage } =
    useChatStore();
  const [caption, setCaption] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isMediaPreviewOpen || !pendingMediaFile) return null;

  const isImage = pendingMediaFile.type.startsWith('image/');
  const isVideo = pendingMediaFile.type.startsWith('video/');
  const previewUrl = URL.createObjectURL(pendingMediaFile);

  const handleSend = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      await sendMessage({
        content: caption,
        file: pendingMediaFile,
        replyToId: quotedMessage?._id,
      });
      setCaption('');
      setPendingMedia(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-wa-dark-border">
          <h3 className="text-sm font-semibold text-wa-text-primary">
            Preview Media
          </h3>
          <button
            onClick={() => setPendingMedia(null)}
            className="p-1 rounded-full text-wa-text-secondary hover:text-wa-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Preview Container */}
        <div className="p-6 flex-1 flex items-center justify-center bg-black/40 overflow-hidden min-h-[250px]">
          {isImage && (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-80 w-auto object-contain rounded-lg shadow"
            />
          )}

          {isVideo && (
            <video
              src={previewUrl}
              controls
              className="max-h-80 w-full rounded-lg"
            />
          )}

          {!isImage && !isVideo && (
            <div className="flex flex-col items-center gap-3 text-wa-text-secondary">
              <FileText className="w-16 h-16 text-wa-green" />
              <p className="text-sm font-medium text-wa-text-primary">
                {pendingMediaFile.name}
              </p>
              <p className="text-xs">
                {(pendingMediaFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}
        </div>

        {/* Caption Input & Send */}
        <div className="p-4 border-t border-wa-dark-border flex items-center gap-3">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Add a caption..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary text-sm focus:outline-none focus:ring-1 focus:ring-wa-green border border-gray-200 dark:border-wa-dark-border"
          />
          <button
            onClick={handleSend}
            disabled={isSending}
            className="w-11 h-11 rounded-full bg-wa-green text-white flex items-center justify-center hover:bg-wa-green-dark transition-colors flex-shrink-0 shadow disabled:opacity-50"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
