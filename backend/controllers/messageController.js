import asyncHandler from 'express-async-handler';
import Message from '../models/Message.js';
import User from '../models/User.js';
import webpush from '../config/webpush.js';
import Chat from '../models/Chat.js';
import { uploadMedia } from '../config/cloudinary.js';

/**
 * @desc   Send a new message (Text, Image, Video, Audio, Voice Note, Document)
 * @route  POST /api/messages
 * @access Private
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, replyToId, encrypted, fileType: customFileType, fileUrl: customFileUrl } = req.body;

  if (!chatId) {
    res.status(400);
    throw new Error('Chat ID is required');
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  let fileUrl = customFileUrl || null;
  let fileType = customFileType || null;
  let fileName = null;
  let fileSize = null;

  if (req.file) {
    const uploaded = await uploadMedia(req.file, 'whatsapp_messages');
    fileUrl = uploaded.url;
    fileName = req.file.originalname;
    fileSize = req.file.size;

    if (!fileType) {
      if (req.file.mimetype.startsWith('image/')) fileType = 'image';
      else if (req.file.mimetype.startsWith('video/')) fileType = 'video';
      else if (req.file.mimetype.startsWith('audio/')) fileType = 'audio';
      else fileType = 'document';
    }
  }

  if (!content && !fileUrl) {
    res.status(400);
    throw new Error('Message must have text content or a media attachment');
  }

  let expiresAt = null;
  if (chat.disappearingMessagesTimer && chat.disappearingMessagesTimer > 0) {
    expiresAt = new Date(Date.now() + chat.disappearingMessagesTimer * 1000);
  }

  const newMessageData = {
    sender: req.user._id,
    content: content || '',
    fileUrl,
    fileType,
    fileName,
    fileSize,
    chat: chatId,
    readBy: [{ user: req.user._id, timestamp: new Date() }],
    deliveredTo: [{ user: req.user._id, timestamp: new Date() }],
    replyTo: replyToId || null,
    encrypted: encrypted === 'true' || encrypted === true,
    expiresAt,
    isViewOnce: isViewOnce === 'true' || isViewOnce === true,
  };

  let message = await Message.create(newMessageData);

  message = await message.populate('sender', 'name avatar email phone');
  message = await message.populate('chat');
  message = await message.populate({
    path: 'replyTo',
    populate: {
      path: 'sender',
      select: 'name avatar',
    },
  });
  message = await User.populate(message, {
    path: 'chat.users',
    select: 'name avatar email phone isOnline lastSeen',
  });

  await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

  // Real-time broadcast via Socket.io to chat room and individual users
  const io = req.app.get('io');
  if (io && message.chat) {
    io.to(chatId.toString()).emit('message_received', message);

    if (Array.isArray(message.chat.users)) {
      message.chat.users.forEach(async (u) => {
        const uId = (u._id || u).toString();
        if (uId !== req.user._id.toString()) {
          io.to(uId).emit('message_received', message);
          
          // Apply Keep Chats Archived logic
          try {
            const recipient = await User.findById(uId);
            if (recipient && recipient.keepChatsArchived === false) {
               if (recipient.archivedChats && recipient.archivedChats.some(id => id.toString() === chatId.toString())) {
                  recipient.archivedChats = recipient.archivedChats.filter(id => id.toString() !== chatId.toString());
                  await recipient.save();
               }
            }
          } catch(err) {
            console.error('Error unarchiving chat:', err);
          }
        }
      });
    }
  }

  res.status(201).json(message);
});

/**
 * @desc   Fetch all messages in a Chat
 * @route  GET /api/messages/:chatId
 * @access Private
 */
export const allMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const messages = await Message.find({
    chat: chatId,
    deletedFor: { $ne: req.user._id },
  })
    .populate('sender', 'name avatar email phone')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'name avatar',
      },
    })
    .populate('reactions.user', 'name avatar')
    .sort({ createdAt: 1 });

  res.status(200).json(messages);
});

/**
 * @desc   React to a message with emoji
 * @route  PUT /api/messages/react/:messageId
 * @access Private
 */
export const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  const existingReactionIndex = message.reactions.findIndex(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (existingReactionIndex > -1) {
    if (message.reactions[existingReactionIndex].emoji === emoji) {
      // Toggle off reaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Update reaction
      message.reactions[existingReactionIndex].emoji = emoji;
    }
  } else {
    // Add new reaction
    message.reactions.push({
      user: req.user._id,
      emoji,
    });
  }

  await message.save();

  const updatedMessage = await Message.findById(messageId)
    .populate('sender', 'name avatar email phone')
    .populate('reactions.user', 'name avatar');

  res.status(200).json(updatedMessage);
});

/**
 * @desc   Toggle Star message
 * @route  PUT /api/messages/star/:messageId
 * @access Private
 */
export const toggleStarMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const message = await Message.findById(messageId);

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  const isStarred = message.isStarred.includes(req.user._id);

  if (isStarred) {
    message.isStarred = message.isStarred.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
  } else {
    message.isStarred.push(req.user._id);
  }

  await message.save();

  res.status(200).json({
    success: true,
    isStarred: !isStarred,
    messageId: message._id,
  });
});

/**
 * @desc   Delete message (For Me or For Everyone)
 * @route  DELETE /api/messages/:messageId
 * @access Private
 */
export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { type = 'forMe' } = req.body; // 'forMe' | 'forEveryone'

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  if (type === 'forEveryone') {
    if (message.sender.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You can only delete your own messages for everyone');
    }
    message.isDeletedForEveryone = true;
    message.content = 'This message was deleted';
    message.fileUrl = null;
    message.fileName = null;
    await message.save();
  } else {
    if (!message.deletedFor.includes(req.user._id)) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }
  }

  res.status(200).json({
    success: true,
    messageId,
    type,
    isDeletedForEveryone: message.isDeletedForEveryone,
  });
});

/**
 * @desc   Forward message to target chat(s)
 * @route  POST /api/messages/forward
 * @access Private
 */
export const forwardMessage = asyncHandler(async (req, res) => {
  const { messageId, targetChatIds } = req.body;

  if (!messageId || !targetChatIds || !targetChatIds.length) {
    res.status(400);
    throw new Error('Message ID and target chat IDs are required');
  }

  const originalMessage = await Message.findById(messageId);
  if (!originalMessage) {
    res.status(404);
    throw new Error('Original message not found');
  }

  const forwardedMessages = [];

  for (const chatId of targetChatIds) {
    const newMsg = await Message.create({
      sender: req.user._id,
      content: originalMessage.content,
      fileUrl: originalMessage.fileUrl,
      fileType: originalMessage.fileType,
      fileName: originalMessage.fileName,
      fileSize: originalMessage.fileSize,
      chat: chatId,
      isForwarded: true,
      readBy: [{ user: req.user._id, timestamp: new Date() }],
      deliveredTo: [{ user: req.user._id, timestamp: new Date() }],
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: newMsg._id });
    const populated = await Message.findById(newMsg._id)
      .populate('sender', 'name avatar email phone')
      .populate('chat');
    forwardedMessages.push(populated);
  }

  res.status(201).json({
    success: true,
    forwardedMessages,
  });
});

/**
 * @desc   Mark messages as read
 * @route  PUT /api/messages/read/:chatId
 * @access Private
 */
export const markChatMessagesRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  await Message.updateMany(
    {
      chat: chatId,
      'readBy.user': { $ne: req.user._id },
    },
    {
      $addToSet: {
        readBy: { user: req.user._id, timestamp: new Date() },
        deliveredTo: { user: req.user._id, timestamp: new Date() },
      },
    }
  );

  res.status(200).json({ success: true, message: 'Messages marked as read' });
});

export const openViewOnceMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }
  if (!message.isViewOnce) {
    res.status(400);
    throw new Error('Not a view once message');
  }
  
  message.isOpened = true;
  message.fileUrl = null; // Permanently delete URL from DB
  await message.save();

  const io = req.app.get('io');
  if (io) {
    io.to(message.chat.toString()).emit('message updated', message);
  }
  
  res.json(message);
});
