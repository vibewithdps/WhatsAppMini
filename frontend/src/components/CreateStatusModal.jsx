import React, { useState } from 'react';
import { X, Send, Image as ImageIcon, Type } from 'lucide-react';
import { useStatusStore } from '../store/useStatusStore';

const COLOR_PALETTES = [
  '#005c4b',
  '#128C7E',
  '#1e3a8a',
  '#4c1d95',
  '#831843',
  '#78350f',
  '#18181b',
];

export const CreateStatusModal = () => {
  const { isCreateStatusModalOpen, setIsCreateStatusModalOpen, createStatus } =
    useStatusStore();

  const [mode, setMode] = useState('text'); // 'text' | 'media'
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [bgColor, setBgColor] = useState('#005c4b');
  const [mediaFile, setMediaFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateStatusModalOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isSubmitting) return;

    if (mode === 'text' && !text.trim()) return;
    if (mode === 'media' && !mediaFile) return;

    setIsSubmitting(true);
    try {
      await createStatus({
        mediaType: mode === 'media' ? (mediaFile.type.startsWith('video/') ? 'video' : 'image') : 'text',
        text: text.trim(),
        caption: caption.trim(),
        bgColor,
        mediaFile,
      });
      setText('');
      setCaption('');
      setMediaFile(null);
      setIsCreateStatusModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-wa-dark-border">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-wa-dark-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('text')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                mode === 'text'
                  ? 'bg-wa-green text-white'
                  : 'text-wa-text-secondary hover:text-wa-text-primary'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Text Status</span>
            </button>

            <button
              onClick={() => setMode('media')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                mode === 'media'
                  ? 'bg-wa-green text-white'
                  : 'text-wa-text-secondary hover:text-wa-text-primary'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Photo / Video</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateStatusModalOpen(false)}
            className="p-1 rounded-full text-wa-text-secondary hover:text-wa-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center">
          {mode === 'text' ? (
            <div
              className="w-full h-64 rounded-2xl p-6 flex flex-col items-center justify-center transition-colors shadow-inner relative"
              style={{ backgroundColor: bgColor }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a status..."
                className="w-full bg-transparent text-white text-center text-xl font-bold placeholder-white/60 resize-none focus:outline-none"
                rows={4}
                autoFocus
              />

              {/* Palette selector */}
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2">
                {COLOR_PALETTES.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBgColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      bgColor === color ? 'scale-125 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-4">
              {mediaFile ? (
                <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                  {mediaFile.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(mediaFile)}
                      alt="Upload"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <video
                      src={URL.createObjectURL(mediaFile)}
                      controls
                      className="max-h-full max-w-full"
                    />
                  )}
                  <button
                    onClick={() => setMediaFile(null)}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-full h-56 rounded-2xl border-2 border-dashed border-wa-dark-border hover:border-wa-green flex flex-col items-center justify-center gap-3 cursor-pointer text-wa-text-secondary hover:text-wa-green transition-colors">
                  <ImageIcon className="w-12 h-12" />
                  <span className="text-sm font-medium">
                    Click to select photo or video
                  </span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  />
                </label>
              )}

              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary text-sm focus:outline-none focus:ring-1 focus:ring-wa-green border border-gray-200 dark:border-wa-dark-border"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-wa-dark-border flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-full bg-wa-green text-white font-medium flex items-center gap-2 hover:bg-wa-green-dark transition-colors shadow disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Post Status</span>
          </button>
        </div>
      </div>
    </div>
  );
};
