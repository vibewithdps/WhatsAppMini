import React, { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, RotateCcw } from 'lucide-react';

export const CropModal = ({ isOpen, imageSrc, onComplete, onCancel }) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setCrop(undefined);
      setCompletedCrop(null);
    }
  }, [isOpen]);

  if (!isOpen || !imageSrc) return null;

  const handleApply = async () => {
    if (completedCrop && imgRef.current) {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return;
        blob.name = 'cropped.jpg';
        const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
        onComplete(file);
      }, 'image/jpeg');
    } else {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-4 bg-black/50 absolute top-0 inset-x-0 z-10">
        <button onClick={onCancel} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          <button onClick={() => setCrop(undefined)} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors" title="Reset">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={handleApply} className="p-2 text-wa-green hover:bg-white/10 rounded-full transition-colors font-medium">
            Done
          </button>
        </div>
      </div>
      
      {/* Crop Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden pt-16 pb-20">
        <ReactCrop 
          crop={crop} 
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          className="max-h-full max-w-full"
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop preview"
            className="max-h-[80vh] w-auto object-contain"
            onLoad={(e) => {
              const { width, height } = e.currentTarget;
              if (!crop) {
                setCrop({ unit: '%', width: 80, height: 80, x: 10, y: 10 });
              }
            }}
          />
        </ReactCrop>
      </div>

      {/* Bottom Bar for balance */}
      <div className="h-20 bg-black/50 absolute bottom-0 inset-x-0 flex items-center justify-center text-white/50 text-sm">
        Drag handles to crop image
      </div>
    </div>
  );
};
