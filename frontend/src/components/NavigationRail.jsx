import React from 'react';
import {
  MessageSquare,
  CircleDot,
  Phone,
  Settings,
  Sun,
  Moon,
  LogOut,
  Users,
  Download,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useThemeStore } from '../store/useThemeStore';
import { useStatusStore } from '../store/useStatusStore';
import { usePWAStore } from '../store/usePWAStore';

export const NavigationRail = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenSettings,
}) => {
  const user = useAuthStore((state) => state.user);

  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeStore();
  const recentUpdates = useStatusStore((state) => state.recentUpdates);
  const chats = useChatStore((state) => state.chats);
  const { installApp, isInstallable } = usePWAStore();

  const hasUnseenStatus = recentUpdates.length > 0;
  
  const unreadCount = chats.filter(c => {
    // If the last message is from someone else and unreadCount > 0
    return c.unreadCount > 0;
  }).length;


  return (
    <>
      {/* Desktop Left Vertical Rail (Visible on Laptops & Desktops lg: 1024px+) */}
      <aside className="hidden lg:flex w-16 bg-wa-dark-header dark:bg-wa-dark-header bg-wa-light-header border-r border-wa-dark-border dark:border-wa-dark-border border-wa-light-border flex-col justify-between items-center py-4 select-none z-20 flex-shrink-0">
        {/* Top Icons */}
        <div className="flex flex-col items-center gap-5">
          {/* WhatsApp Mini Brand Logo */}
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20">
            <img
              src="/logo.png"
              alt="WhatsApp Mini"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Profile Avatar */}
          <button
            onClick={onOpenProfile}
            title="Profile"
            className="relative group transition-transform active:scale-95"
          >
            <img
              src={
                user?.avatar ||
                '/default-avatar.svg'
              }
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-wa-green transition-all"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-wa-green rounded-full border-2 border-wa-dark-header" />
          </button>

          {/* Navigation Tabs */}
          <div className="flex flex-col items-center gap-2.5">
            {/* Chats Tab */}
            <button
              onClick={() => setActiveTab('chats')}
              title="Chats"
              className={`p-3 rounded-xl transition-all relative ${
                activeTab === 'chats'
                  ? 'bg-wa-dark-hover dark:bg-wa-dark-hover bg-wa-light-hover text-wa-green'
                  : 'text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-hover/50'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Status / Stories Tab */}
            <button
              onClick={() => setActiveTab('status')}
              title="Status"
              className={`p-3 rounded-xl transition-all relative ${
                activeTab === 'status'
                  ? 'bg-wa-dark-hover dark:bg-wa-dark-hover bg-wa-light-hover text-wa-green'
                  : 'text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-hover/50'
              }`}
            >
              <CircleDot className="w-5 h-5" />
              {hasUnseenStatus && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-wa-green rounded-full ring-2 ring-wa-dark-header" />
              )}
            </button>

            {/* Calls Tab */}
            <button
              onClick={() => setActiveTab('calls')}
              title="Calls"
              className={`p-3 rounded-xl transition-all relative ${
                activeTab === 'calls'
                  ? 'bg-wa-dark-hover dark:bg-wa-dark-hover bg-wa-light-hover text-wa-green'
                  : 'text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-hover/50'
              }`}
            >
              <Phone className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-3">


          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-2.5 rounded-xl text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-hover/50 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-400" />
            )}
          </button>




          {/* Settings Modal */}

          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-2.5 rounded-xl text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-hover/50 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            title="Log Out"
            className="p-2.5 rounded-xl text-wa-text-secondary hover:text-red-400 hover:bg-wa-dark-hover/50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Visible on Mobile Phones & Tablets < lg) */}
      <nav className="flex lg:hidden fixed bottom-0 inset-x-0 h-[68px] bg-white dark:bg-wa-dark-panel border-t border-gray-100 dark:border-wa-dark-border items-center justify-around px-1 z-30 select-none pb-safe">
        
        {/* Chats */}
        <button
          onClick={() => setActiveTab('chats')}
          className="flex flex-col items-center justify-center w-full h-full gap-1 pt-2 pb-1"
        >
          <div className={`flex items-center justify-center w-16 h-8 rounded-full transition-colors relative ${activeTab === 'chats' ? 'bg-[#d9fdd3] dark:bg-[#005c4b]' : 'bg-transparent'}`}>
            <MessageSquare className={`w-6 h-6 ${activeTab === 'chats' ? 'text-[#111b21] dark:text-white' : 'text-[#54656f] dark:text-gray-400'}`} fill={activeTab === 'chats' ? 'currentColor' : 'none'} />
            {/* Badge example */}
            {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#25d366] rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-wa-dark-panel px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
            )}
          </div>
          <span className={`text-[11px] ${activeTab === 'chats' ? 'text-[#111b21] dark:text-white font-bold' : 'text-[#54656f] dark:text-gray-400 font-medium'}`}>Chats</span>
        </button>

        {/* Updates */}
        <button
          onClick={() => setActiveTab('status')}
          className="flex flex-col items-center justify-center w-full h-full gap-1 pt-2 pb-1"
        >
          <div className={`flex items-center justify-center w-16 h-8 rounded-full transition-colors relative ${activeTab === 'status' ? 'bg-[#d9fdd3] dark:bg-[#005c4b]' : 'bg-transparent'}`}>
            <CircleDot className={`w-6 h-6 ${activeTab === 'status' ? 'text-[#111b21] dark:text-white' : 'text-[#54656f] dark:text-gray-400'}`} fill={activeTab === 'status' ? 'currentColor' : 'none'} />
            {hasUnseenStatus && (
              <span className="absolute top-2 right-4 w-2 h-2 bg-[#25d366] rounded-full border border-white dark:border-wa-dark-panel" />
            )}
          </div>
          <span className={`text-[11px] ${activeTab === 'status' ? 'text-[#111b21] dark:text-white font-bold' : 'text-[#54656f] dark:text-gray-400 font-medium'}`}>Updates</span>
        </button>

        

        {/* Calls */}
        <button
          onClick={() => setActiveTab('calls')}
          className="flex flex-col items-center justify-center w-full h-full gap-1 pt-2 pb-1"
        >
          <div className={`flex items-center justify-center w-16 h-8 rounded-full transition-colors ${activeTab === 'calls' ? 'bg-[#d9fdd3] dark:bg-[#005c4b]' : 'bg-transparent'}`}>
            <Phone className={`w-6 h-6 ${activeTab === 'calls' ? 'text-[#111b21] dark:text-white' : 'text-[#54656f] dark:text-gray-400'}`} fill={activeTab === 'calls' ? 'currentColor' : 'none'} />
          </div>
          <span className={`text-[11px] ${activeTab === 'calls' ? 'text-[#111b21] dark:text-white font-bold' : 'text-[#54656f] dark:text-gray-400 font-medium'}`}>Calls</span>
        </button>

      </nav>
    </>
  );
};
