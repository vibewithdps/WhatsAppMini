import React from 'react';
import {
  MessageSquare,
  CircleDot,
  Phone,
  Settings,
  Sun,
  Moon,
  LogOut,
  Download,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
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
  const { installApp } = usePWAStore();

  const hasUnseenStatus = recentUpdates.length > 0;

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
          {/* Install App / APK Button */}
          <button
            onClick={installApp}
            title="Install WhatsApp Mini App / APK"
            className="p-2.5 rounded-xl text-cyan-400 hover:bg-cyan-500/10 transition-colors animate-pulse"
          >
            <Download className="w-5 h-5" />
          </button>

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
      <nav className="flex lg:hidden fixed bottom-0 inset-x-0 h-16 bg-wa-dark-header dark:bg-wa-dark-header bg-wa-light-header border-t border-wa-dark-border dark:border-wa-dark-border border-wa-light-border items-center justify-around px-2 z-30 select-none shadow-2xl">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'chats' ? 'text-wa-green font-bold bg-wa-green/10' : 'text-wa-text-secondary'
          }`}
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[11px] sm:text-xs">Chats</span>
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all relative ${
            activeTab === 'status' ? 'text-wa-green font-bold bg-wa-green/10' : 'text-wa-text-secondary'
          }`}
        >
          <CircleDot className="w-5 h-5 sm:w-6 sm:h-6" />
          {hasUnseenStatus && (
            <span className="absolute top-1 right-3 w-2.5 h-2.5 bg-wa-green rounded-full ring-2 ring-wa-dark-header" />
          )}
          <span className="text-[11px] sm:text-xs">Status</span>
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'calls' ? 'text-wa-green font-bold bg-wa-green/10' : 'text-wa-text-secondary'
          }`}
        >
          <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[11px] sm:text-xs">Calls</span>
        </button>

        <button
          onClick={installApp}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-cyan-400 font-bold hover:bg-cyan-500/10 transition-all"
        >
          <Download className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
          <span className="text-[11px] sm:text-xs">Install APK</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-wa-text-secondary"
        >
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[11px] sm:text-xs">Settings</span>
        </button>

        <button
          onClick={onOpenProfile}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl"
        >
          <img
            src={
              user?.avatar ||
              '/default-avatar.svg'
            }
            alt={user?.name}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover ring-2 ring-wa-green"
          />
          <span className="text-[11px] sm:text-xs text-wa-text-secondary font-medium">Profile</span>
        </button>
      </nav>
    </>
  );
};
