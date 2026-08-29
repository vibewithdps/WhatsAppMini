import React, { useState, useEffect } from 'react';
import { X, Search, User as UserIcon } from 'lucide-react';
import api from '../services/api';
import { useChatStore } from '../store/useChatStore';

export const NewChatModal = () => {
  const { isNewChatModalOpen, setIsNewChatModalOpen, selectChat, fetchChats } =
    useChatStore();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newContact, setNewContact] = useState('');
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

  const handlePickContact = async () => {
    const supported = ('contacts' in navigator);
    if (!supported) {
      alert("Your browser/device (like iPhone) does not support picking contacts directly from the web.");
      return;
    }
    try {
      const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
      if (contacts && contacts.length > 0 && contacts[0].tel && contacts[0].tel.length > 0) {
        let pickedNumber = contacts[0].tel[0];
        pickedNumber = pickedNumber.replace(/[^\d+]/g, '');
        if (pickedNumber.startsWith('+91') && pickedNumber.length === 13 && !pickedNumber.includes(' ')) {
          pickedNumber = '+91 ' + pickedNumber.substring(3);
        } else if (/^\d{10}$/.test(pickedNumber)) {
          pickedNumber = '+91 ' + pickedNumber;
        }
        setNewContact(pickedNumber);
        
        // Auto-save the contact
        try {
          await api.post('/users/contacts', { identifier: pickedNumber });
          setNewContact('');
          alert('Contact ' + contacts[0].name + ' saved! If they are registered on WhatsApp Mini, they will appear in your list.');
          const res = await api.get('/users');
          setUsers(res.data.users || []);
        } catch (err) {
          alert('Failed to save contact');
        }
      }
    } catch (ex) {
      console.error("Error picking contact:", ex);
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
        <div className="p-4 border-b border-wa-dark-border space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-wa-text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search saved contacts..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary focus:outline-none focus:ring-1 focus:ring-wa-green border border-gray-200 dark:border-wa-dark-border"
              autoFocus
            />
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newContact.trim()) return;
              let identifier = newContact.trim();
              if (/^\d{10}$/.test(identifier)) {
                identifier = '+91 ' + identifier;
              } else if (/^\d{12}$/.test(identifier) && identifier.startsWith('91')) {
                identifier = '+' + identifier.slice(0,2) + ' ' + identifier.slice(2);
              }
              try {
                await api.post('/users/contacts', { identifier });
                setNewContact('');
                alert('Contact saved! If they are registered, they will appear in your list.');
                // Refresh list
                const res = await api.get('/users');
                setUsers(res.data.users || []);
              } catch (err) {
                alert('Failed to save contact');
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              placeholder="Save a new phone or email..."
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary focus:outline-none focus:ring-1 focus:ring-wa-green border border-gray-200 dark:border-wa-dark-border"
            />
            <button
              type="submit"
              disabled={!newContact.trim()}
              className="px-4 py-2 bg-wa-green text-white text-sm font-semibold rounded-lg hover:bg-wa-green-dark disabled:opacity-50"
            >
              Add
            </button>
          </form>
          {('contacts' in navigator) ? (
            <button
              onClick={handlePickContact}
              className="w-full mt-2 py-2 text-xs font-semibold text-cyan-500 hover:text-cyan-400 border border-cyan-500/30 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
            >
              + Pick from Phone Contacts (Android)
            </button>
          ) : (
            <button
              onClick={() => alert("Ye feature sirf Android Chrome par kaam karta hai kyunki Apple aur dusre browsers contacts padhne ki permission nahi dete. Kripya number type karke Add karein.")}
              className="w-full mt-2 py-2 text-xs font-semibold text-gray-500 border border-gray-500/30 rounded-lg bg-gray-500/10 cursor-not-allowed"
            >
              + Phone Contacts (Blocked by Browser)
            </button>
          )}
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto divide-y divide-wa-dark-border/40">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-wa-text-secondary">
              Loading saved contacts...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-wa-text-secondary">
              No saved contacts found.<br/><br/>
              They will appear here once you save their registered phone number.
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
                    '/default-avatar.svg'
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
