import React, { useState, useRef } from 'react';
import { ArrowLeft, User, Info, AtSign, Phone, Camera, Check, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const EditModal = ({ isOpen, type, title, value, onClose, onSave }) => {
  const [inputValue, setInputValue] = useState(value);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setInputValue(value);
  }, [value, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-white dark:bg-wa-dark-bg animate-fade-in flex flex-col">
      <div className="flex items-center gap-4 p-4 bg-[#00a884] text-white shadow-md">
        <button onClick={onClose} disabled={loading} className="p-1 hover:bg-black/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-medium flex-1">{title}</h1>
        <button 
          onClick={async () => {
            setLoading(true);
            await onSave(inputValue);
            setLoading(false);
          }}
          disabled={loading || inputValue === value}
          className="p-2 hover:bg-black/10 rounded-full transition-colors disabled:opacity-50"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6">
        <input
          autoFocus
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full bg-transparent border-b-2 border-[#00a884] focus:outline-none py-2 text-lg text-black dark:text-white"
        />
        <p className="text-sm text-gray-500 mt-4">
          This is not your username or pin. This name will be visible to your WhatsApp contacts.
        </p>
      </div>
    </div>
  );
};

export const ProfileScreen = ({ onBack }) => {
  const user = useAuthStore((state) => state.user);
  const updateAccount = useAuthStore((state) => state.updateAccount);
  const fileInputRef = useRef(null);

  const [editModal, setEditModal] = useState({ isOpen: false, type: '', title: '', value: '' });

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    // Optimistic UI could be added here, but backend responds fast enough locally
    await updateAccount(formData);
  };

  const handleSaveEdit = async (newValue) => {
    const payload = {};
    payload[editModal.type] = newValue;
    const res = await updateAccount(payload);
    if (res.success) {
      setEditModal({ ...editModal, isOpen: false });
    } else {
      alert('Failed to update: ' + res.error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#f0f2f5] dark:bg-wa-dark-bg absolute inset-0 z-10 animate-slide-left">
      <EditModal 
        {...editModal} 
        onClose={() => setEditModal({ ...editModal, isOpen: false })} 
        onSave={handleSaveEdit}
      />
      
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#202c33] shadow-sm">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-[#54656f] dark:text-gray-300 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-normal text-[#111b21] dark:text-gray-100">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar Section */}
        <div className="flex justify-center py-8 bg-white dark:bg-[#111b21] mb-2 shadow-sm">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img 
              src={user?.avatar || '/default-avatar.svg'} 
              className="w-40 h-40 rounded-full object-cover shadow-sm group-hover:opacity-80 transition-opacity" 
              alt="Profile"
            />
            <button className="absolute bottom-1 right-1 w-12 h-12 bg-[#00a884] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#06cf9c] transition-colors border-2 border-white dark:border-[#111b21]">
              <Camera className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileSelect} 
            />
          </div>
        </div>

        {/* Info Items */}
        <div className="flex flex-col bg-white dark:bg-[#111b21] shadow-sm">
          
          <div 
            className="flex items-start gap-6 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors"
            onClick={() => setEditModal({ isOpen: true, type: 'name', title: 'Enter your name', value: user?.name || '' })}
          >
            <User className="w-6 h-6 text-[#8696a0] mt-1" />
            <div className="flex-1 border-b border-gray-100 dark:border-gray-800 pb-4">
              <p className="text-[14px] text-[#8696a0]">Name</p>
              <p className="text-[17px] text-[#111b21] dark:text-gray-100 mt-1">{user?.name || 'User'}</p>
              <p className="text-[13px] text-[#8696a0] mt-2">This is not your username or pin. This name will be visible to your WhatsApp contacts.</p>
            </div>
          </div>

          <div 
            className="flex items-start gap-6 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors"
            onClick={() => setEditModal({ isOpen: true, type: 'about', title: 'About', value: user?.about || 'Hey there! I am using WhatsApp.' })}
          >
            <Info className="w-6 h-6 text-[#8696a0] mt-1" />
            <div className="flex-1 border-b border-gray-100 dark:border-gray-800 pb-4">
              <p className="text-[14px] text-[#8696a0]">About</p>
              <p className="text-[17px] text-[#111b21] dark:text-gray-100 mt-1">{user?.about || 'Hey there! I am using WhatsApp.'}</p>
            </div>
          </div>
          
          <div 
            className="flex items-start gap-6 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors"
            onClick={() => setEditModal({ isOpen: true, type: 'username', title: 'Reserved username', value: user?.username || '' })}
          >
            <AtSign className="w-6 h-6 text-[#8696a0] mt-1" />
            <div className="flex-1 border-b border-gray-100 dark:border-gray-800 pb-4">
              <p className="text-[14px] text-[#8696a0]">Reserved username</p>
              <p className="text-[17px] text-[#111b21] dark:text-gray-100 mt-1">{user?.username ? `@${user.username}` : 'None'}</p>
            </div>
          </div>

          <div 
            className="flex items-start gap-6 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors"
            onClick={() => setEditModal({ isOpen: true, type: 'phone', title: 'Phone Number', value: user?.phone || '' })}
          >
            <Phone className="w-6 h-6 text-[#8696a0] mt-1" />
            <div className="flex-1 pb-2">
              <p className="text-[14px] text-[#8696a0]">Phone</p>
              <p className="text-[17px] text-[#111b21] dark:text-gray-100 mt-1">{user?.phone || user?.email || '+91 70377 88052'}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
