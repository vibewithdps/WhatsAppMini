import React, { useState, useEffect } from 'react';
import { X, Send, FileText, Crop, Clock } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { CropModal } from './CropModal';

export const MediaPreviewModal = () => {
  const { isMediaPreviewOpen, pendingMediaFile, setPendingMedia, sendMessage, quotedMessage } =
    useChatStore();
  const [caption, setCaption] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Cropping state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [croppedFile, setCroppedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // View Once state
  const [isViewOnce, setIsViewOnce] = useState(false);

  useEffect(() => {
    if (pendingMediaFile && !croppedFile) {
      const url = URL.createObjectURL(pendingMediaFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pendingMediaFile, croppedFile]);

  useEffect(() => {
    if (croppedFile) {
      const url = URL.createObjectURL(croppedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [croppedFile]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isMediaPreviewOpen) {
      setCaption('');
      setCroppedFile(null);
      setIsViewOnce(false);
    }
  }, [isMediaPreviewOpen]);

  if (!isMediaPreviewOpen || !pendingMediaFile) return null;

  const isImage = pendingMediaFile.type.startsWith('image/');
  const isVideo = pendingMediaFile.type.startsWith('video/');

  const handleSend = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      const finalFile = croppedFile || pendingMediaFile;
      
      await sendMessage({
        content: caption,
        file: finalFile,
        replyToId: quotedMessage?._id,
        isViewOnce,
      });
      setCaption('');
      setPendingMedia(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleCropComplete = (newFile) => {
    setCroppedFile(newFile);
    setIsCropModalOpen(false);
  };

  return (
    <>
      <CropModal 
        isOpen={isCropModalOpen}
        imageSrc={previewUrl}
        onComplete={handleCropComplete}
        onCancel={() => setIsCropModalOpen(false)}
      />

      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 ${isCropModalOpen ? 'hidden' : ''}`}>
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
          <div className="p-6 flex-1 flex items-center justify-center bg-black/40 overflow-hidden min-h-[250px] relative">
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

          {/* Controls */}
          <div className="px-4 pt-3 flex justify-between items-center">
             <div className="flex gap-2">
               {isImage && (
                 <button 
                   onClick={() => setIsViewOnce(!isViewOnce)}
                   className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-medium transition-colors border \${isViewOnce ? 'bg-wa-green text-white border-wa-green' : 'bg-transparent text-wa-text-primary border-gray-300 dark:border-gray-600'}`}
                   title="View Once"
                 >
                   <span className="font-bold border border-current rounded-full w-4 h-4 flex items-center justify-center text-[10px]">1</span>
                   View Once
                 </button>
               )}
             </div>
             
             <div className="flex gap-2">
               {isImage && (
                 <button 
                   onClick={() => setIsCropModalOpen(true)}
                   className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-wa-text-primary hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                   title="Crop Image"
                 >
                   <Crop className="w-5 h-5" />
                 </button>
               )}
             </div>
          </div>

          {/* Caption Input & Send */}
          <div className="p-4 border-t border-wa-dark-border flex items-center gap-3 mt-2">
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
    </>
  );
};
