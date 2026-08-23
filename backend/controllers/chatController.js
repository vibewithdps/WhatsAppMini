import asyncHandler from 'express-async-handler';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { uploadMedia } from '../config/cloudinary.js';

/**
 * @desc   Access or create 1-on-1 chat
 * @route  POST /api/chats
 * @access Private
 */
export const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400);
    throw new Error('UserId param not sent with request');
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate('users', '-password')
    .populate({
      path: 'latestMessage',
      populate: {
        path: 'sender',
        select: 'name avatar email phone',
      },
    });

  if (isChat.length > 0) {
    res.status(200).json(isChat[0]);
  } else {
    const chatData = {
      chatName: 'sender',
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      'users',
      '-password'
    );
    res.status(201).json(fullChat);
  }
});

/**
 * @desc   Fetch all chats for logged-in user
 * @route  GET /api/chats
 * @access Private
 */
export const fetchChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: req.user._id } },
  })
    .populate('users', '-password')
    .populate('groupAdmin', '-password')
    .populate({
      path: 'latestMessage',
      populate: {
        path: 'sender',
        select: 'name avatar email phone',
      },
    })
    .sort({ updatedAt: -1 });

  res.status(200).json(chats);
});

/**
 * @desc   Create new Group Chat
 * @route  POST /api/chats/group
 * @access Private
 */
export const createGroupChat = asyncHandler(async (req, res) => {
  let { users, name, description } = req.body;

  if (!users || !name) {
    res.status(400);
    throw new Error('Please provide group name and select at least 2 users');
  }

  if (typeof users === 'string') {
    users = JSON.parse(users);
  }

  if (users.length < 1) {
    res.status(400);
    throw new Error('More than 2 users are required to form a group chat');
  }

  // Add logged in user to the group
  if (!users.includes(req.user._id.toString())) {
    users.push(req.user._id);
  }

  let chatAvatar = 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80';
  if (req.file) {
    const uploaded = await uploadMedia(req.file, 'whatsapp_group_avatars');
    chatAvatar = uploaded.url;
  }

  const groupChat = await Chat.create({
    chatName: name,
    users,
    isGroupChat: true,
    groupAdmin: [req.user._id],
    chatAvatar,
    description: description || '',
  });

  const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  res.status(201).json(fullGroupChat);
});

/**
 * @desc   Rename Group
 * @route  PUT /api/chats/group/rename
 * @access Private
 */
export const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (!updatedChat) {
    res.status(404);
    throw new Error('Chat Not Found');
  }

  res.status(200).json(updatedChat);
});

/**
 * @desc   Add member to Group
 * @route  PUT /api/chats/group/add
 * @access Private
 */
export const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    { $addToSet: { users: userId } },
    { new: true }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (!added) {
    res.status(404);
    throw new Error('Chat Not Found');
  }

  res.status(200).json(added);
});

/**
 * @desc   Remove member from Group / Leave Group
 * @route  PUT /api/chats/group/remove
 * @access Private
 */
export const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (!removed) {
    res.status(404);
    throw new Error('Chat Not Found');
  }

  res.status(200).json(removed);
});

/**
 * @desc   Update Group Avatar or Info
 * @route  PUT /api/chats/group/info/:chatId
 * @access Private
 */
export const updateGroupInfo = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { chatName, description } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  if (chatName) chat.chatName = chatName;
  if (description !== undefined) chat.description = description;

  if (req.file) {
    const uploaded = await uploadMedia(req.file, 'whatsapp_group_avatars');
    chat.chatAvatar = uploaded.url;
  }

  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  res.status(200).json(updatedChat);
});

/**
 * @desc   Set Disappearing Messages Timer
 * @route  PUT /api/chats/disappearing/:chatId
 * @access Private
 */
export const setDisappearingMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { timer } = req.body; // seconds: 0, 86400, 604800, 7776000

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { disappearingMessagesTimer: Number(timer) || 0 },
    { new: true }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  res.status(200).json(chat);
});
