import React, { useState } from 'react';
import {
  X,
  Users,
  Clock,
  LogOut,
  UserPlus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import api from '../services/api';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useImageViewerStore } from '../store/useImageViewerStore';

export const GroupInfoModal = () => {
  const user = useAuthStore((state) => state.user);
  const openImageViewer = useImageViewerStore((state) => state.openImageViewer);
  const {
    activeChat,
    isGroupInfoModalOpen,
    setIsGroupInfoModalOpen,
    selectChat,
    fetchChats,
  } = useChatStore();

  const [disappearingTimer, setDisappearingTimer] = useState(
    activeChat?.disappearingMessagesTimer || 0
  );

  if (!isGroupInfoModalOpen || !activeChat || !activeChat.isGroupChat)
    return null;

  const isAdmin = activeChat.groupAdmin?.some(
    (admin) => (admin._id || admin) === user?._id
  );

  const handleTimerChange = async (newTimer) => {
    try {
      setDisappearingTimer(newTimer);
      const res = await api.put(`/chats/disappearing/${activeChat._id}`, {
        timer: newTimer,
      });
      selectChat(res.data);
      fetchChats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      const res = await api.put('/chats/group/remove', {
        chatId: activeChat._id,
        userId: memberId,
      });
      selectChat(res.data);
      fetchChats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.put('/chats/group/remove', {
        chatId: activeChat._id,
        userId: user._id,
      });
      setIsGroupInfoModalOpen(false);
      selectChat(null);
      fetchChats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewGroupPhoto = () => {
    openImageViewer({
      imageUrl: activeChat.chatAvatar || '/default-avatar.svg',
      title: activeChat.chatName,
      subtitle: `Group • ${activeChat.users?.length || 0} participants`,
    });
  };

  const handleViewMemberPhoto = (member) => {
    openImageViewer({
      imageUrl: member.avatar || '/default-avatar.svg',
      title: member.name,
      subtitle: member.about || member.phone || '',
      user: member,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-wa-dark-border max-h-[90vh]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-wa-dark-border">
          <h2 className="text-base font-bold text-wa-text-primary">Group Info</h2>
          <button
            onClick={() => setIsGroupInfoModalOpen(false)}
            className="p-1 rounded-full text-wa-text-secondary hover:text-wa-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Avatar & Title */}
          <div className="flex flex-col items-center text-center">
            <div
              onClick={handleViewGroupPhoto}
              title="Click to view full group photo"
              className="relative cursor-pointer group mb-3"
            >
              <img
                src={
                  activeChat.chatAvatar ||
                  '/default-avatar.svg'
                }
                alt={activeChat.chatName}
                className="w-24 h-24 rounded-full object-cover shadow-lg border-2 border-wa-dark-border ring-2 ring-transparent group-hover:ring-wa-green transition-all"
              />
            </div>
            <h3 className="text-lg font-bold text-wa-text-primary">
              {activeChat.chatName}
            </h3>
            <p className="text-xs text-wa-text-secondary mt-1">
              Group • {activeChat.users?.length || 0} participants
            </p>
            {activeChat.description && (
              <p className="text-xs text-wa-text-primary/90 mt-2 px-4 py-2 bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input rounded-xl max-w-xs">
                {activeChat.description}
              </p>
            )}
          </div>

          {/* Disappearing Messages Setting */}
          <div className="p-3 bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-wa-green" />
              <span className="text-xs font-semibold text-wa-text-primary">
                Disappearing Messages
              </span>
            </div>
            <select
              value={disappearingTimer}
              onChange={(e) => handleTimerChange(Number(e.target.value))}
              className="w-full bg-wa-dark-panel dark:bg-wa-dark-panel bg-white text-wa-text-primary text-xs py-2 px-3 rounded-lg border border-wa-dark-border focus:outline-none"
            >
              <option value={0}>Off</option>
              <option value={86400}>24 Hours</option>
              <option value={604800}>7 Days</option>
              <option value={7776000}>90 Days</option>
            </select>
          </div>

          {/* Participants List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-wa-text-secondary">
                {activeChat.users?.length || 0} Participants
              </h4>
            </div>

            <div className="divide-y divide-wa-dark-border/30">
              {activeChat.users?.map((member) => {
                const memberIsAdmin = activeChat.groupAdmin?.some(
                  (admin) => (admin._id || admin) === member._id
                );
                const isSelf = member._id === user?._id;

                return (
                  <div
                    key={member._id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        onClick={() => handleViewMemberPhoto(member)}
                        title="Click to view profile photo"
                        className="cursor-pointer group/avatar"
                      >
                        <img
                          src={
                            member.avatar ||
                            '/default-avatar.svg'
                          }
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover/avatar:ring-wa-green transition-all"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-wa-text-primary truncate">
                            {member.name} {isSelf && '(You)'}
                          </span>
                          {memberIsAdmin && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-wa-green/20 text-wa-green border border-wa-green/30">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-wa-text-secondary truncate mt-0.5">
                          {member.about || member.phone}
                        </p>
                      </div>
                    </div>

                    {isAdmin && !isSelf && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="p-1.5 text-wa-text-secondary hover:text-red-400 rounded-lg hover:bg-wa-dark-hover transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave Group Action */}
          <div className="pt-2">
            <button
              onClick={handleLeaveGroup}
              className="w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-2 border border-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Group</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
