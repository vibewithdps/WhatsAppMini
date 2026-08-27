import React, { useState } from 'react';
import { X, Send, Check } from 'lucide-react';
import api from '../services/api';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';

export const ForwardModal = () => {
  const user = useAuthStore((state) => state.user);
  const {
    isForwardModalOpen,
    messageToForward,
    setIsForwardModalOpen,
    chats,
    fetchChats,
  } = useChatStore();

  const [selectedChatIds, setSelectedChatIds] = useState([]);
  const [isForwarding, setIsForwarding] = useState(false);

  if (!isForwardModalOpen || !messageToForward) return null;

  const toggleSelectChat = (chatId) => {
    setSelectedChatIds((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = async () => {
    if (selectedChatIds.length === 0 || isForwarding) return;

    setIsForwarding(true);
    try {
      await api.post('/messages/forward', {
        messageId: messageToForward._id,
        targetChatIds: selectedChatIds,
      });

      await fetchChats();
      setIsForwardModalOpen(false, null);
      setSelectedChatIds([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-wa-dark-border max-h-[85vh]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-wa-dark-border">
          <h2 className="text-base font-bold text-wa-text-primary">
            Forward Message
          </h2>
          <button
            onClick={() => setIsForwardModalOpen(false, null)}
            className="p-1 rounded-full text-wa-text-secondary hover:text-wa-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="p-3 bg-wa-dark-input dark:bg-wa-dark-input bg-wa-light-input border-b border-wa-dark-border">
          <p className="text-xs text-wa-text-secondary truncate italic">
            "{messageToForward.content || messageToForward.fileName || 'Attachment'}"
          </p>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto divide-y divide-wa-dark-border/30">
          {chats.map((chat) => {
            const isSelected = selectedChatIds.includes(chat._id);
            const chatName = chat.isGroupChat
              ? chat.chatName
              : chat.users.find((u) => u._id !== user?._id)?.name || 'WhatsApp User';
            const chatAvatar = chat.isGroupChat
              ? chat.chatAvatar
              : chat.users.find((u) => u._id !== user?._id)?.avatar;

            return (
              <div
                key={chat._id}
                onClick={() => toggleSelectChat(chat._id)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-wa-green/10'
                    : 'hover:bg-wa-dark-hover/50 dark:hover:bg-wa-dark-hover/50 hover:bg-wa-light-hover/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={
                      chatAvatar ||
                      '/default-avatar.svg'
                    }
                    alt={chatName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-wa-text-primary truncate">
                      {chatName}
                    </h4>
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
            onClick={handleForward}
            disabled={selectedChatIds.length === 0 || isForwarding}
            className="px-6 py-2 rounded-full bg-wa-green text-white text-sm font-medium flex items-center gap-2 hover:bg-wa-green-dark transition-colors shadow disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Forward ({selectedChatIds.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
