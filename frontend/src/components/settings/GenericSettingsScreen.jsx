import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Save, X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';

export const GenericSettingsScreen = ({ config, onBack }) => {
  const [toggles, setToggles] = useState({});
  const [radioValue, setRadioValue] = useState('English');
  const { theme, toggleTheme } = useThemeStore();
  
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateAccount = useAuthStore((state) => state.updateAccount);

  // Edit Modal State
  const [editModal, setEditModal] = useState({ isOpen: false, type: '', title: '', value: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setToggles(prev => ({
      ...prev,
      'App theme': theme === 'dark'
    }));
  }, [theme]);

  const handleToggle = async (title) => {
    if (title === 'App theme') toggleTheme();
    
    let currentState = false;
    setToggles(prev => {
      if (title === 'Read receipts') currentState = user?.readReceipts !== false;
      else if (title === 'Enter is send') currentState = user?.enterIsSend === true;
      else if (title === 'Keep chats archived') currentState = user?.keepChatsArchived !== false;
      else if (title === 'Conversation tones') currentState = user?.conversationTones !== false;
      else currentState = false;
      if (prev[title] !== undefined) currentState = prev[title];
      return {
        ...prev,
        [title]: !currentState
      };
    });

    if (title === 'Read receipts') {
      await updateAccount({ readReceipts: !currentState });
    } else if (title === 'Enter is send') {
      await updateAccount({ enterIsSend: !currentState });
    } else if (title === 'Keep chats archived') {
      await updateAccount({ keepChatsArchived: !currentState });
    } else if (title === 'Conversation tones') {
      await updateAccount({ conversationTones: !currentState });
    }
  };

  const handleClick = (item) => {
    if (item.type === 'toggle') handleToggle(item.title);
    if (item.type === 'radio') setRadioValue(item.title);
    if (item.title === 'Log out') logout();
    if (item.title === 'App theme') handleToggle(item.title);
    if (item.title === 'Help center') window.open('https://faq.whatsapp.com', '_blank');
    if (item.title === 'Contact us') window.location.href = 'mailto:support@whatsapp.com';
    if (item.title === 'Terms and Privacy Policy') window.open('https://www.whatsapp.com/legal', '_blank');
    if (item.title === 'App info') alert('WhatsApp Mini Clone\nVersion 1.0.0\nBuilt with React & Node.js');

    
    // Open Modals for real backend updates
    if (item.title === 'Username') setEditModal({ isOpen: true, type: 'username', title: 'Set Username', value: user?.username || '' });
    if (item.title === 'Email address') setEditModal({ isOpen: true, type: 'email', title: 'Update Email', value: user?.email || '' });
    if (item.title === 'Password') setEditModal({ isOpen: true, type: 'password', title: 'Set Password', value: '' });
    if (item.title === 'Change phone number') setEditModal({ isOpen: true, type: 'phone', title: 'Change Phone Number', value: user?.phone || '' });
    if (item.title === 'Blocked contacts') alert('Blocked contacts: ' + (user?.blockedUsers?.length || 0));
  };

  const getToggleState = (title, defaultVal) => {
    if (title === 'App theme') return theme === 'dark';
    if (title === 'Read receipts' && toggles[title] === undefined) return user?.readReceipts !== false;
    if (title === 'Enter is send' && toggles[title] === undefined) return user?.enterIsSend === true;
    if (title === 'Keep chats archived' && toggles[title] === undefined) return user?.keepChatsArchived !== false;
    if (title === 'Conversation tones' && toggles[title] === undefined) return user?.conversationTones !== false;
    if (toggles[title] !== undefined) return toggles[title];
    return defaultVal || false;
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    let updateData = {};
    updateData[editModal.type] = editModal.value;

    const res = await updateAccount(updateData);
    if (res.success) {
      alert(`${editModal.title} updated successfully!`);
      setEditModal({ isOpen: false, type: '', title: '', value: '' });
    } else {
      alert(`Error: ${res.error}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-wa-dark-bg absolute inset-0 z-10 animate-slide-left">
      <div className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-wa-dark-bg border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-[#111b21] dark:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-normal text-[#111b21] dark:text-white">{config.title}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {config.sections?.map((section, idx) => (
          <div key={idx} className="mb-4">
            {section.title && (
              <h2 className="px-4 py-3 text-sm font-medium text-[#54656f] dark:text-gray-400">
                {section.title}
              </h2>
            )}
            
            <div className="flex flex-col">
              {section.items?.map((item, itemIdx) => {
                const IconComponent = item.icon ? Icons[item.icon] : null;

                // Show dynamic values for real properties
                let dynamicSubtitle = item.subtitle;
                if (item.title === 'Username' && user?.username) dynamicSubtitle = `@${user.username}`;
                if (item.title === 'Email address' && user?.email) dynamicSubtitle = user.email;
                if (item.title === 'Password' && user?.password) dynamicSubtitle = '********';

                return (
                  <div 
                    key={itemIdx}
                    onClick={() => handleClick(item)}
                    className={`flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors ${item.icon ? 'gap-5' : 'gap-3'}`}
                  >
                    {item.icon && (
                      <div className="text-[#54656f] dark:text-gray-400 w-6 h-6 flex items-center justify-center">
                        {IconComponent && <IconComponent className="w-6 h-6 stroke-[1.5]" />}
                      </div>
                    )}
                    
                    {item.type === 'radio' && (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center mr-2">
                        {radioValue === item.title && <div className="w-3 h-3 bg-[#00a884] rounded-full" />}
                      </div>
                    )}

                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className={`text-[17px] font-normal truncate ${item.color === 'red' ? 'text-red-500' : 'text-[#111b21] dark:text-white'}`}>
                        {item.title}
                      </h3>
                      {dynamicSubtitle && (
                        <p className="text-sm text-[#54656f] dark:text-gray-400 leading-tight mt-0.5 whitespace-pre-wrap">
                          {dynamicSubtitle}
                        </p>
                      )}
                    </div>
                    
                    {item.type === 'toggle' && (
                      <div className={`relative inline-flex h-4 w-9 items-center rounded-full transition-colors ${getToggleState(item.title, item.default) ? 'bg-[#00a884]/40' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${getToggleState(item.title, item.default) ? 'translate-x-4 bg-[#00a884]' : 'translate-x-0'}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {idx < config.sections.length - 1 && <div className="h-[1px] bg-gray-100 dark:bg-gray-800 ml-[4.5rem] mt-2" />}
          </div>
        ))}
      </div>

      {/* Edit Modal Overlay */}
      {editModal.isOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-wa-dark-bg w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-medium text-[#111b21] dark:text-white mb-4">{editModal.title}</h2>
            <input
              type={editModal.type === 'password' ? 'password' : 'text'}
              value={editModal.value}
              onChange={(e) => setEditModal({ ...editModal, value: e.target.value })}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-wa-dark-panel text-[#111b21] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              placeholder={`Enter new ${editModal.type}`}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setEditModal({ isOpen: false, type: '', title: '', value: '' })}
                className="px-5 py-2 text-[#54656f] dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isLoading || !editModal.value.trim()}
                className="px-5 py-2 bg-[#00a884] text-white font-medium rounded-lg hover:bg-[#06cf9c] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
