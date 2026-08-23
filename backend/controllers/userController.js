import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

/**
 * @desc   Search users by name, phone, or email
 * @route  GET /api/users/search?search=
 * @access Private
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
          { phone: { $regex: req.query.search, $options: 'i' } },
        ],
      }
    : {};

  const users = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .select('name email phone avatar about isOnline lastSeen publicKey');

  res.status(200).json({
    success: true,
    users,
  });
});

/**
 * @desc   Get All Available Users / Directory
 * @route  GET /api/users
 * @access Private
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } })
    .select('name email phone avatar about isOnline lastSeen publicKey')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    users,
  });
});

/**
 * @desc   Get User By ID
 * @route  GET /api/users/:id
 * @access Private
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    'name email phone avatar about isOnline lastSeen publicKey'
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    user,
  });
});

/**
 * @desc   Toggle Pin Chat
 * @route  PUT /api/users/pin-chat/:chatId
 * @access Private
 */
export const togglePinChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const user = await User.findById(req.user._id);

  const isPinned = user.pinnedChats.includes(chatId);

  if (isPinned) {
    user.pinnedChats = user.pinnedChats.filter(
      (id) => id.toString() !== chatId
    );
  } else {
    user.pinnedChats.push(chatId);
  }

  await user.save();

  res.status(200).json({
    success: true,
    pinnedChats: user.pinnedChats,
    isPinned: !isPinned,
  });
});

/**
 * @desc   Toggle Archive Chat
 * @route  PUT /api/users/archive-chat/:chatId
 * @access Private
 */
export const toggleArchiveChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const user = await User.findById(req.user._id);

  const isArchived = user.archivedChats.includes(chatId);

  if (isArchived) {
    user.archivedChats = user.archivedChats.filter(
      (id) => id.toString() !== chatId
    );
  } else {
    user.archivedChats.push(chatId);
  }

  await user.save();

  res.status(200).json({
    success: true,
    archivedChats: user.archivedChats,
    isArchived: !isArchived,
  });
});

/**
 * @desc   Block or Unblock a User
 * @route  PUT /api/users/block/:targetUserId
 * @access Private
 */
export const toggleBlockUser = asyncHandler(async (req, res) => {
  const { targetUserId } = req.params;
  const user = await User.findById(req.user._id);

  const isBlocked = user.blockedUsers.includes(targetUserId);

  if (isBlocked) {
    user.blockedUsers = user.blockedUsers.filter(
      (id) => id.toString() !== targetUserId
    );
  } else {
    user.blockedUsers.push(targetUserId);
  }

  await user.save();

  res.status(200).json({
    success: true,
    blockedUsers: user.blockedUsers,
    isBlocked: !isBlocked,
  });
});
