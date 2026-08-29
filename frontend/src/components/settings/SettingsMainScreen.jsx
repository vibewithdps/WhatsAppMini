import React, { useState } from 'react';
import {
  ArrowLeft, Search, QrCode, ChevronDown,
  Key, Lock, MessageSquare, Palette,
  Bell, Globe, HelpCircle, X, Share2
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { DownloadCloud } from 'lucide-react';
import { usePWAStore } from '../../store/usePWAStore';
import { InstallPwaModal } from '../InstallPwaModal';


const QrModal = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;
  const qrData = `whatsapp-clone-contact:${user?._id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&margin=10`;

  return (
    <div className="absolute inset-0 z-50 bg-white dark:bg-wa-dark-bg animate-slide-up flex flex-col">
      <div className="flex items-center gap-4 p-4 shadow-sm border-b border-gray-100 dark:border-gray-800">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-[#54656f] dark:text-gray-300 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-medium flex-1 text-[#111b21] dark:text-white">QR code</h1>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-[#54656f] dark:text-gray-300 transition-colors" title="Share (Mock)">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f0f2f5] dark:bg-[#111b21] flex flex-col items-center py-10 px-6">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm flex flex-col items-center shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-16 bg-[#00a884]"></div>
          
          <img src={user?.avatar || '/default-avatar.svg'} className="w-20 h-20 rounded-full border-4 border-white z-10 bg-white object-cover shadow-sm mb-4" alt="Avatar"/>
          
          <h2 className="text-xl font-medium text-black">{user?.name || 'User'}</h2>
          <p className="text-gray-500 mb-8">{user?.phone || user?.username ? `WhatsApp contact` : ''}</p>
          
          <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg shadow-sm" />
          
          <p className="text-center text-sm text-gray-500 mt-8">
            Your QR code is private. If you share it with someone, they can scan it to add you as a contact.
          </p>
        </div>
      </div>
    </div>
  );
};

export const SettingsMainScreen = ({ onNavigate, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const [qrOpen, setQrOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const { isInstalled } = usePWAStore();
  const [showInstallModal, setShowInstallModal] = useState(false);

  return (
    <>
      <QrModal isOpen={qrOpen} onClose={() => setQrOpen(false)} user={user} />
      <InstallPwaModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
      <div className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-wa-dark-bg border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-[#111b21] dark:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-normal text-[#111b21] dark:text-white">Settings</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Profile Section */}
        <div 
          onClick={() => onNavigate('profile')}
          className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          <div className="flex items-center gap-4">
            <img src={user?.avatar || '/default-avatar.svg'} className="w-16 h-16 rounded-full object-cover" />
            <div>
              <h2 className="text-xl font-normal text-[#111b21] dark:text-white">{user?.name || 'User'}</h2>
              <p className="text-sm text-[#54656f] dark:text-gray-400">{user?.about || 'Available'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[#00a884]">
            <button onClick={(e) => { e.stopPropagation(); setQrOpen(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <QrCode className="w-6 h-6 text-[#00a884]" />
            </button>
          </div>
        </div>

        {/* Supported Settings List */}
        <div className="flex flex-col">
          
          <SettingItem onClick={() => onNavigate('chats')} icon={<MessageSquare />} title="Chats" subtitle="Chat history, wallpaper" />
          <SettingItem onClick={() => onNavigate('appearance')} icon={<Palette />} title="Appearance" subtitle="App theme (Dark/Light)" />
          <SettingItem onClick={() => onNavigate('notifications')} icon={<Bell />} title="Notifications" subtitle="Message, group & call tones" />
                    <SettingItem onClick={() => onNavigate('help')} icon={<HelpCircle />} title="Help and feedback" subtitle="Help center, contact us" />
          
          {!isInstalled && (
            <SettingItem 
              onClick={() => setShowInstallModal(true)} 
              icon={<DownloadCloud className="text-[#00a884]" />} 
              title="Install App" 
              subtitle="Get the WhatsApp Mini desktop/mobile app" 
            />
          )}
          
          <div className="px-4 py-6 mt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={logout} className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
              Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const SettingItem = ({ icon, title, subtitle, onClick }) => (
  <div onClick={onClick} className="flex items-center gap-5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors">
    <div className="text-[#54656f] dark:text-gray-400">
      {React.cloneElement(icon, { className: 'w-6 h-6 stroke-[1.5]' })}
    </div>
    <div className="flex-1">
      <h3 className="text-[17px] font-normal text-[#111b21] dark:text-white">{title}</h3>
      {subtitle && <p className="text-sm text-[#54656f] dark:text-gray-400 leading-tight">{subtitle}</p>}
    </div>
  </div>
);
