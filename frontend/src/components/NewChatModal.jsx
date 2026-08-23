import React, { useState, useEffect } from 'react';
import { X, Search, User as UserIcon } from 'lucide-react';
import api from '../services/api';
import { useChatStore } from '../store/useChatStore';

export const NewChatModal = () => {
  const { isNewChatModalOpen, setIsNewChatModalOpen, selectChat, fetchChats } =
    useChatStore();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isNewChatModalOpen) {
      const loadUsers = async () => {
        setIsLoading(true);
        try {
          const res = await api.get('/users');
          setUsers(res.data.users || []);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      loadUsers();
    }
  }, [isNewChatModalOpen]);

  if (!isNewChatModalOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartChat = async (targetUser) => {
    try {
      const res = await api.post('/chats', { userId: targetUser._id });
      await fetchChats();
      selectChat(res.data);
      setIsNewChatModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-wa-dark-border max-h-[85vh]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-wa-dark-border">
          <h2 className="text-base font-bold text-wa-text-primary">
            New Conversation
          </h2>
          <button
            onClick={() => setIsNewChatModalOpen(false)}
            className="p-1 rounded-full text-wa-text-secondary hover:text-wa-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-wa-dark-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-wa-text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contacts by name or phone..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary focus:outline-none focus:ring-1 focus:ring-wa-green border border-gray-200 dark:border-wa-dark-border"
              autoFocus
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto divide-y divide-wa-dark-border/40">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-wa-text-secondary">
              Loading contacts...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-wa-text-secondary">
              No contacts found.
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u._id}
                onClick={() => handleStartChat(u)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-wa-dark-hover/50 dark:hover:bg-wa-dark-hover/50 hover:bg-wa-light-hover/50 cursor-pointer transition-colors"
              >
                <img
                  src={
                    u.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                  }
                  alt={u.name}
                  className="w-11 h-11 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-wa-text-primary truncate">
                    {u.name}
                  </h3>
                  <p className="text-xs text-wa-text-secondary truncate mt-0.5">
                    {u.about || u.phone || u.email}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
