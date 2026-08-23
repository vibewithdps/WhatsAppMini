import React, { useState } from 'react';
import { X, Camera, Check, User, Info, Phone, Mail } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useImageViewerStore } from '../store/useImageViewerStore';

export const ProfileModal = ({ isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const openImageViewer = useImageViewerStore((state) => state.openImageViewer);

  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleViewFullPhoto = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openImageViewer({
      imageUrl: avatarPreview || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      title: user?.name || 'My Profile',
      subtitle: user?.phone || user?.email || '',
    });
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('about', about);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      await updateProfile(formData);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-wa-dark-border">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-wa-dark-border">
          <h2 className="text-base font-bold text-wa-text-primary">Profile</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-wa-text-secondary hover:text-wa-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <label className="relative cursor-pointer group">
              <img
                src={
                  avatarPreview ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                }
                alt={name}
                className="w-28 h-28 rounded-full object-cover shadow-lg border-2 border-wa-dark-border"
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Change Photo
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
            <button
              type="button"
              onClick={handleViewFullPhoto}
              className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              View Full Photo
            </button>
          </div>

          {/* Name Field */}
          <div>
            <label className="text-xs font-semibold text-wa-green uppercase tracking-wider block mb-1.5">
              Your Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-wa-text-secondary" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary focus:outline-none focus:ring-1 focus:ring-wa-green border border-gray-200 dark:border-wa-dark-border"
              />
            </div>
            <p className="text-[11px] text-wa-text-secondary mt-1">
              This is not your username or pin. This name will be visible to your contacts.
            </p>
          </div>

          {/* About / Status Bio */}
          <div>
            <label className="text-xs font-semibold text-wa-green uppercase tracking-wider block mb-1.5">
              About
            </label>
            <div className="relative">
              <Info className="w-4 h-4 absolute left-3 top-3 text-wa-text-secondary" />
              <input
                type="text"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Hey there! I am using WhatsApp."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary focus:outline-none focus:ring-1 focus:ring-wa-green border border-gray-200 dark:border-wa-dark-border"
              />
            </div>
          </div>

          {/* Identifier Info (Phone / Email) */}
          {user?.phone && (
            <div className="flex items-center gap-3 p-3 bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input rounded-xl text-xs text-wa-text-secondary">
              <Phone className="w-4 h-4 text-wa-green" />
              <span>{user.phone}</span>
            </div>
          )}

          {user?.email && (
            <div className="flex items-center gap-3 p-3 bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input rounded-xl text-xs text-wa-text-secondary">
              <Mail className="w-4 h-4 text-wa-green" />
              <span>{user.email}</span>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full bg-wa-green text-white text-sm font-medium flex items-center gap-2 hover:bg-wa-green-dark transition-colors shadow disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
