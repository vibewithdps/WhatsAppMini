import React from 'react';
import { X, DownloadCloud, Share, PlusSquare } from 'lucide-react';
import { usePWAStore } from '../store/usePWAStore';

export const InstallPwaModal = ({ isOpen, onClose }) => {
  const { isInstallable, promptInstall } = usePWAStore();

  if (!isOpen) return null;

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-wa-dark-panel p-6 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden">
        {/* Top Decorative gradient */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-wa-green/20 to-teal-500/20" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-full text-gray-500 dark:text-gray-300 hover:text-gray-900 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 flex flex-col items-center mt-6">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-wa-dark-bg shadow-xl flex items-center justify-center p-4 mb-6 border border-gray-100 dark:border-gray-800">
            <img src="/logo.png" alt="App Logo" className="w-full h-full object-contain" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            Install WhatsApp Mini
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8 px-4">
            Install our app for a faster, full-screen experience with push notifications!
          </p>

          {isInstallable && !isIOS ? (
            <button 
              onClick={() => {
                promptInstall();
                onClose();
              }}
              className="w-full py-3.5 rounded-2xl bg-wa-green text-white font-bold shadow-lg shadow-wa-green/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <DownloadCloud className="w-5 h-5" />
              Install Now
            </button>
          ) : isIOS ? (
            <div className="w-full bg-gray-50 dark:bg-wa-dark-bg rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">How to install on iOS:</h3>
              <ol className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Share className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Tap the <strong>Share</strong> button at the bottom of Safari</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <PlusSquare className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
                </li>
              </ol>
              <button 
                onClick={onClose}
                className="w-full mt-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white font-semibold hover:bg-gray-300 transition-colors"
              >
                Got it
              </button>
            </div>
          ) : (
            <div className="w-full bg-gray-50 dark:bg-wa-dark-bg rounded-2xl p-4 border border-gray-100 dark:border-gray-800 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                To install the app, open this website in Chrome, Safari, or Edge and look for the install prompt.
              </p>
              <button 
                onClick={onClose}
                className="w-full mt-4 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white font-semibold hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
