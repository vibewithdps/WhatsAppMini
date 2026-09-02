import React, { useState } from 'react';
import { X, DownloadCloud, Share, PlusSquare, Smartphone, Monitor, ChevronRight, ShieldCheck, Zap, Star } from 'lucide-react';
import { usePWAStore } from '../store/usePWAStore';

export const InstallPwaModal = ({ isOpen, onClose }) => {
  const { isInstallable, promptInstall } = usePWAStore();
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);

  const handleInstallClick = async () => {
    if (isInstallable) {
      setDownloading(true);
      setTimeout(() => {
        promptInstall();
        setDownloading(false);
        onClose();
      }, 1000);
    } else {
      alert("APK / App Installation is currently managed via browser's Add to Home Screen feature for maximum security and auto-updates.");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="bg-white dark:bg-[#111b21] w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden flex flex-col transform transition-all animate-slide-up border border-gray-100 dark:border-gray-800">
        
        {/* Header Hero Area */}
        <div className="relative h-48 bg-gradient-to-br from-[#00a884] to-teal-700 p-6 flex flex-col items-center justify-center overflow-hidden">
          {/* Animated Background Patterns */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse-slow"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 w-20 h-20 bg-white rounded-2xl p-2 shadow-2xl transform hover:scale-110 transition-transform duration-300">
            <img src="/logo.png" alt="WhatsApp Mini" className="w-full h-full object-contain drop-shadow-md" />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-6 pb-8 flex flex-col items-center">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight text-center">
            WhatsApp Mini <span className="text-xs bg-wa-green/20 text-wa-green px-2 py-0.5 rounded-full ml-1 align-middle uppercase tracking-widest">Pro</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 max-w-[280px]">
            Fast, secure, and lightweight messaging for Android, iOS, and Desktop.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-3 w-full mb-8">
            <div className="flex flex-col items-center p-3 rounded-2xl bg-gray-50 dark:bg-[#1f2c34] hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-colors border border-transparent dark:border-gray-800">
              <Zap className="w-6 h-6 text-amber-500 mb-2" />
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Fast</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-2xl bg-gray-50 dark:bg-[#1f2c34] hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-colors border border-transparent dark:border-gray-800">
              <ShieldCheck className="w-6 h-6 text-emerald-500 mb-2" />
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Secure</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-2xl bg-gray-50 dark:bg-[#1f2c34] hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-colors border border-transparent dark:border-gray-800">
              <Star className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Zero Ads</span>
            </div>
          </div>

          {/* Smart Install Button Logic */}
          <div className="w-full space-y-4">
            {(isInstallable || isAndroid) && !isIOS ? (
              <button 
                onClick={handleInstallClick}
                disabled={downloading}
                className="group relative w-full h-14 rounded-2xl bg-[#00a884] overflow-hidden shadow-lg shadow-wa-green/30 hover:shadow-xl hover:shadow-wa-green/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all disabled:opacity-80 disabled:cursor-wait"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-white font-bold text-lg">
                  {downloading ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <DownloadCloud className="w-6 h-6 animate-bounce" />
                      <span>Download APK / App</span>
                    </>
                  )}
                </div>
              </button>
            ) : isIOS ? (
              <div className="w-full bg-blue-50/50 dark:bg-[#1f2c34] rounded-2xl p-5 border border-blue-100 dark:border-[#2a3942]">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="w-6 h-6 text-blue-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Install App on iPhone (iOS)</h3>
                </div>
                <ol className="space-y-3.5 text-xs text-gray-600 dark:text-gray-300 font-medium">
                  <li className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <Share className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Tap the <strong>Share</strong> button at the bottom</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                      <PlusSquare className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="w-full bg-gray-50 dark:bg-[#1f2c34] rounded-2xl p-5 border border-gray-100 dark:border-[#2a3942]">
                <div className="flex items-center gap-3 mb-3">
                  <Monitor className="w-6 h-6 text-indigo-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Install Desktop App</h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                  To install WhatsApp Mini on your PC or Mac, open this link in Google Chrome or Microsoft Edge, and click the install icon in the URL address bar.
                </p>
              </div>
            )}
            
            {!isIOS && !isInstallable && isAndroid && (
              <p className="text-[10px] text-center text-gray-400 mt-2">
                If the install button doesn't trigger, use your browser menu (⋮) and select "Install app" or "Add to home screen".
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
