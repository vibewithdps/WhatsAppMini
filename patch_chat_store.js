const fs = require('fs');
let content = fs.readFileSync('frontend/src/store/useChatStore.js', 'utf8');

// Import decryptMessage
content = content.replace(
  "import { useAuthStore } from './useAuthStore';",
  "import { useAuthStore } from './useAuthStore';\nimport { decryptMessage } from '../services/crypto';"
);

// Decrypt on fetchChats
content = content.replace(
  "set({ chats: res.data, isLoadingChats: false });",
  `const decryptedChats = await Promise.all(res.data.map(async (chat) => {
        if (chat.latestMessage?.encrypted && chat.latestMessage?.content?.startsWith('enc:')) {
          chat.latestMessage.content = await decryptMessage(chat.latestMessage.content, chat._id);
        }
        return chat;
      }));
      set({ chats: decryptedChats, isLoadingChats: false });`
);

// Decrypt on fetchMessages
content = content.replace(
  "set({ messages: res.data, isLoadingMessages: false });",
  `const decryptedMessages = await Promise.all(res.data.map(async (msg) => {
        if (msg.encrypted && msg.content?.startsWith('enc:')) {
          msg.content = await decryptMessage(msg.content, chatId);
        }
        return msg;
      }));
      set({ messages: decryptedMessages, isLoadingMessages: false });`
);

// Decrypt on receiveMessage
content = content.replace(
  "receiveMessage: (message) => {",
  `receiveMessage: async (message) => {
    if (message.encrypted && message.content?.startsWith('enc:')) {
      const chatId = typeof message.chat === 'object' ? message.chat?._id : message.chat;
      message.content = await decryptMessage(message.content, chatId);
    }`
);

fs.writeFileSync('frontend/src/store/useChatStore.js', content);
