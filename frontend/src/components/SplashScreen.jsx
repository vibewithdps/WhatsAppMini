import React, { useState, useEffect } from 'react';
import { Lock, Sparkles, ShieldCheck } from 'lucide-react';

export const SplashScreen = ({ onFinish }) => {
  const [progress, setProgress] = useState(10);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Smooth progress animation over 3.2 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 6;
      });
    }, 180);

    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 500); // 500ms fade-out transition
    }, 3600);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#0b141a] flex flex-col items-center justify-between py-8 px-6 select-none transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex-1" />

      {/* Center Logo & Branding */}
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        <div className="relative">
          {/* Ambient Glow */}
          <div className="absolute -inset-6 rounded-full bg-cyan-500/25 blur-3xl animate-pulse" />
          
          <img
            src="/logo.png"
            alt="WhatsApp Mini"
            className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-3xl relative z-10 shadow-2xl transition-transform hover:scale-105"
          />
        </div>

        <h1 className="text-xl md:text-2xl font-black tracking-widest text-white mt-1">
          WHATSAPP_MINI
        </h1>

        {/* Loading Progress Bar */}
        <div className="w-48 md:w-56 h-1.5 bg-gray-800 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-wa-green to-emerald-400 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Footer Branding & Creator Badge */}
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        {/* Creator Badge */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
          <div className="relative">
            <img
              src="/dps_creator.jpg"
              alt="DIPENDRA PRATAP SINGH (DPS)"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-400 shadow-md"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-wa-green rounded-full border-2 border-[#0b141a]" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                Developed & Designed by
              </span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <p className="text-xs md:text-sm font-extrabold text-white tracking-wide">
              DIPENDRA PRATAP SINGH (DPS)
            </p>
          </div>
        </div>

        {/* Security Tag */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Lock className="w-3 h-3 text-wa-green" />
          <span className="tracking-wide">End-to-End Encrypted • Real-Time WebRTC</span>
        </div>
      </div>
    </div>
  );
};
