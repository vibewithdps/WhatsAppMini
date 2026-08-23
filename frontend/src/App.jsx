import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';
import { useThemeStore } from './store/useThemeStore';
import { usePWAStore } from './store/usePWAStore';
import { useSocket } from './hooks/useSocket';
import { initSocket } from './services/socket';
import api from './services/api';

import { SplashScreen } from './components/SplashScreen';
import { Login } from './pages/Login';
import { OTPVerify } from './pages/OTPVerify';
import { NavigationRail } from './components/NavigationRail';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { CallsTab } from './components/CallsTab';
import { StatusTab } from './components/StatusTab';
import { IncomingCallModal } from './components/IncomingCallModal';
import { CallScreen } from './components/CallScreen';
import { StatusViewerModal } from './components/StatusViewerModal';
import { CreateStatusModal } from './components/CreateStatusModal';
import { NewChatModal } from './components/NewChatModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { GroupInfoModal } from './components/GroupInfoModal';
import { ForwardModal } from './components/ForwardModal';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { LinkedDevicesModal } from './components/LinkedDevicesModal';
import { ProfileImageViewerModal } from './components/ProfileImageViewerModal';

export default function App() {
  const user = useAuthStore((state) => state.user);
  const { activeChat, selectChat, fetchChats } = useChatStore();
  const { initTheme } = useThemeStore();
  const setDeferredPrompt = usePWAStore((state) => state.setDeferredPrompt);

  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'status' | 'calls'
  const [authStep, setAuthStep] = useState('login'); // 'login' | 'otp'
  const [otpTarget, setOtpTarget] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLinkedDevicesOpen, setIsLinkedDevicesOpen] = useState(false);

  // Initialize Theme
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // PWA beforeinstallprompt listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [setDeferredPrompt]);

  // Connect socket and fetch chats on login
  useEffect(() => {
    if (user) {
      initSocket(user);
      fetchChats();

      // Check if opened from native phone camera QR scan with ?linkSession=...
      const params = new URLSearchParams(window.location.search);
      const linkSession = params.get('linkSession') || params.get('sessionId') || params.get('qrSessionId');
      if (linkSession) {
        if (window.confirm('Link your desktop computer to WhatsApp_Mini?')) {
          api.post('/auth/link-device', { qrSessionId: linkSession })
            .then(() => {
              alert('🎉 Desktop Linked Successfully!');
              window.history.replaceState({}, document.title, window.location.pathname);
            })
            .catch(() => {
              alert('Failed to link device. Please refresh QR code and try again.');
            });
        }
      }
    }
  }, [user, fetchChats]);

  // Listen to global socket events
  useSocket();

  // Show Splash Screen on initial application start for 3.5 seconds
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // If not logged in, render Auth pages
  if (!user) {
    if (authStep === 'otp') {
      return (
        <OTPVerify
          identifier={otpTarget}
          initialOtp={debugOtp}
          onBack={() => setAuthStep('login')}
        />
      );
    }
    return (
      <Login
        onNavigateToOTP={(target, otp) => {
          setOtpTarget(target);
          setDebugOtp(otp || '');
          setAuthStep('otp');
        }}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex bg-wa-dark-bg text-wa-text-primary overflow-hidden font-sans select-none relative">
      {/* Leftmost Navigation Rail on Desktop / Bottom bar on Mobile (hidden when chatting on mobile) */}
      <div className={`${activeChat ? 'hidden lg:flex' : 'flex'}`}>
        <NavigationRail
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Main Tab Panel: on mobile takes 100% width and hides when chat is open; on desktop fixed width */}
      <div
        className={`${
          activeChat ? 'hidden lg:flex' : 'flex'
        } flex-shrink-0 h-full w-full lg:w-[380px] xl:w-[420px] overflow-hidden`}
      >
        {activeTab === 'chats' && <ChatList />}
        {activeTab === 'status' && <StatusTab />}
        {activeTab === 'calls' && <CallsTab />}
      </div>

      {/* Main Chat Window: on mobile takes 100% width and hides when no chat is open */}
      <div
        className={`${
          activeChat ? 'flex' : 'hidden lg:flex'
        } flex-1 h-full min-w-0 overflow-hidden`}
      >
        <ChatWindow onBack={() => selectChat(null)} />
      </div>

      {/* Global Overlays & Modals */}
      <IncomingCallModal />
      <CallScreen />
      <StatusViewerModal />
      <CreateStatusModal />
      <NewChatModal />
      <CreateGroupModal />
      <GroupInfoModal />
      <ForwardModal />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenLinkedDevices={() => setIsLinkedDevicesOpen(true)}
      />
      <LinkedDevicesModal
        isOpen={isLinkedDevicesOpen}
        onClose={() => setIsLinkedDevicesOpen(false)}
      />
      <ProfileImageViewerModal />
    </div>
  );
}
