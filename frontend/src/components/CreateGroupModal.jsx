import React, { useState, useEffect } from 'react';
import { X, Users, Check, Camera } from 'lucide-react';
import api from '../services/api';
import { useChatStore } from '../store/useChatStore';

export const CreateGroupModal = () => {
  const {
    isCreateGroupModalOpen,
    setIsCreateGroupModalOpen,
    fetchChats,
    selectChat,
  } = useChatStore();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isCreateGroupModalOpen) {
      const loadUsers = async () => {
        try {
          const res = await api.get('/users');
          setAvailableUsers(res.data.users || []);
        } catch (e) {
          console.error(e);
        }
      };
      loadUsers();
    }
  }, [isCreateGroupModalOpen]);

  if (!isCreateGroupModalOpen) return null;

  const toggleSelectUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateGroup = async (e) => {
    e?.preventDefault();
    if (!groupName.trim() || selectedUserIds.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', groupName.trim());
      formData.append('description', description.trim());
      formData.append('users', JSON.stringify(selectedUserIds));
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await api.post('/chats/group', formData);

      await fetchChats();
      selectChat(res.data);
      setIsCreateGroupModalOpen(false);
      setGroupName('');
      setDescription('');
      setSelectedUserIds([]);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-wa-dark-border max-h-[85vh]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-wa-dark-border">
          <h2 className="text-base font-bold text-wa-text-primary">
            Create New Group
          </h2>
          <button
            onClick={() => setIsCreateGroupModalOpen(false)}
            className="p-1 rounded-full text-wa-text-secondary hover:text-wa-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Info Form */}
        <div className="p-4 border-b border-wa-dark-border flex items-center gap-4">
          {/* Group Avatar Upload */}
          <label className="relative cursor-pointer group flex-shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input border border-wa-dark-border flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Group"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-6 h-6 text-wa-text-secondary" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>

          <div className="flex-1 flex flex-col gap-2">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group Subject / Name..."
              className="w-full px-3 py-2 text-sm rounded-xl bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary focus:outline-none focus:ring-1 focus:ring-wa-green border border-gray-200 dark:border-wa-dark-border"
              autoFocus
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Group Description (optional)..."
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary focus:outline-none border border-gray-200 dark:border-wa-dark-border"
            />
          </div>
        </div>

        {/* Members Selection List */}
        <div className="p-2 border-b border-wa-dark-border">
          <p className="text-xs font-semibold text-wa-text-secondary px-2">
            Add participants ({selectedUserIds.length} selected)
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-wa-dark-border/30">
          {availableUsers.map((u) => {
            const isSelected = selectedUserIds.includes(u._id);
            return (
              <div
                key={u._id}
                onClick={() => toggleSelectUser(u._id)}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-wa-green/10'
                    : 'hover:bg-wa-dark-hover/50 dark:hover:bg-wa-dark-hover/50 hover:bg-wa-light-hover/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={
                      u.avatar ||
                      '/default-avatar.svg'
                    }
                    alt={u.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-wa-text-primary truncate">
                      {u.name}
                    </h3>
                    <p className="text-xs text-wa-text-secondary truncate">
                      {u.about || u.phone}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-wa-green border-wa-green text-white'
                      : 'border-wa-dark-border bg-wa-dark-input'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-wa-dark-border flex justify-end">
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUserIds.length === 0 || isSubmitting}
            className="px-6 py-2 rounded-full bg-wa-green text-white text-sm font-medium hover:bg-wa-green-dark transition-colors shadow disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};
