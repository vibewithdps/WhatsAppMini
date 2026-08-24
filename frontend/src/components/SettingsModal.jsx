import React, { useState } from 'react';
import {
  X,
  Moon,
  Sun,
  Bell,
  Lock,
  Download,
  Laptop,
  QrCode,
  LogOut,
} from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import { usePWAStore } from '../store/usePWAStore';
import { useAuthStore } from '../store/useAuthStore';

export const SettingsModal = ({ isOpen, onClose, onOpenLinkedDevices }) => {
  const { theme, toggleTheme } = useThemeStore();
  const { installApp } = usePWAStore();
  const [soundsEnabled, setSoundsEnabled] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-wa-dark-border max-h-[85vh]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-wa-dark-border">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="WhatsApp Mini" className="w-6 h-6 rounded-lg object-contain" />
            <h2 className="text-base font-bold text-wa-text-primary">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-wa-text-secondary hover:text-wa-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 divide-y divide-wa-dark-border/40">
          {/* Appearance Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-wa-green">
              Appearance
            </h3>
            <div className="flex items-center justify-between p-3 bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input rounded-2xl">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-indigo-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <h4 className="text-sm font-medium text-wa-text-primary">
                    Dark Mode
                  </h4>
                  <p className="text-xs text-wa-text-secondary">
                    {theme === 'dark' ? 'Dark theme active' : 'Light theme active'}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  theme === 'dark' ? 'bg-wa-green' : 'bg-gray-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Linked Devices Section */}
          <div className="pt-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Linked Devices
            </h3>
            <div className="flex items-center justify-between p-3 bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input rounded-2xl border border-cyan-500/20">
              <div className="flex items-center gap-3">
                <Laptop className="w-5 h-5 text-cyan-400" />
                <div>
                  <h4 className="text-sm font-medium text-wa-text-primary">
                    Link a Device
                  </h4>
                  <p className="text-xs text-wa-text-secondary">
                    Scan QR code to login on Web / PC
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenLinkedDevices) onOpenLinkedDevices();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-wa-green hover:opacity-95 text-white text-xs font-bold transition-all shadow active:scale-95 flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan QR</span>
              </button>
            </div>
          </div>

          {/* App Installation */}
          <div className="pt-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Install Application
            </h3>
            <div className="flex items-center justify-between p-3 bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input rounded-2xl border border-cyan-500/20">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-cyan-400" />
                <div>
                  <h4 className="text-sm font-medium text-wa-text-primary">
                    Install WhatsApp Mini
                  </h4>
                  <p className="text-xs text-wa-text-secondary">
                    Install standalone app / APK on your device
                  </p>
                </div>
              </div>
              <button
                onClick={installApp}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold transition-all shadow active:scale-95"
              >
                Install
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="pt-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-wa-green">
              Notifications & Sound
            </h3>

            <div className="flex items-center justify-between p-3 bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input rounded-2xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-wa-green" />
                <div>
                  <h4 className="text-sm font-medium text-wa-text-primary">
                    Message Sound & Chimes
                  </h4>
                  <p className="text-xs text-wa-text-secondary">
                    Play synthesized audio for incoming messages
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSoundsEnabled(!soundsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  soundsEnabled ? 'bg-wa-green' : 'bg-gray-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Security & Privacy */}
          <div className="pt-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-wa-green">
              Privacy & Security
            </h3>

            <div className="p-4 bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input rounded-2xl flex items-start gap-3">
              <Lock className="w-5 h-5 text-wa-green mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-wa-text-primary">
                  End-to-End Encryption
                </h4>
                <p className="text-xs text-wa-text-secondary mt-1 leading-relaxed">
                  Your personal messages and calls are secured with AES-GCM 256-bit encryption.
                </p>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="pt-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400">
              Account Actions
            </h3>
            
            <button
              onClick={() => {
                onClose();
                useAuthStore.getState().logout();
              }}
              className="w-full p-4 bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input rounded-2xl flex items-center justify-between hover:bg-red-500/10 transition-colors group border border-transparent hover:border-red-500/30"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-500 transition-colors" />
                <div className="text-left">
                  <h4 className="text-sm font-medium text-red-400 group-hover:text-red-500 transition-colors">
                    Log Out
                  </h4>
                  <p className="text-xs text-wa-text-secondary mt-0.5">
                    Sign out of your WhatsApp Mini account
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* App & Creator Info */}
          <div className="pt-4 flex flex-col items-center text-center space-y-3">
            <div className="flex items-center gap-3 p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 w-full text-left">
              <img
                src="/dps_creator.jpg"
                alt="DIPENDRA PRATAP SINGH (DPS)"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-400 shadow"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                  Lead Architect & Developer
                </p>
                <h4 className="text-xs sm:text-sm font-extrabold text-wa-text-primary truncate">
                  DIPENDRA PRATAP SINGH (DPS)
                </h4>
                <p className="text-[10px] text-wa-text-secondary">
                  Creator of WhatsApp_Mini
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-wa-text-secondary font-semibold">
                WhatsApp_Mini v1.0.0 (Production)
              </p>
              <p className="text-[11px] text-wa-text-secondary/70 mt-0.5">
                Node.js • Express • MongoDB • Redis • Cloudinary • WebRTC • React
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
