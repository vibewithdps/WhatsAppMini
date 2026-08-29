import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { uploadMedia } from '../config/cloudinary.js';

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
 * @desc   Get All Available Users / Directory (Mutual Contacts Only)
 * @route  GET /api/users
 * @access Private
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id);
  const mySavedContacts = currentUser.savedContacts || [];
  const myIdentifiers = [currentUser.phone, currentUser.email].filter(Boolean);

  // WhatsApp logic: Anyone I have saved in my contacts who is registered on the app
  const query = {
    _id: { $ne: req.user._id },
    $or: [
      { phone: { $in: mySavedContacts } },
      { email: { $in: mySavedContacts } }
    ]
  };

  const users = await User.find(query)
    .select('name email phone avatar about isOnline lastSeen publicKey')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    users,
  });
});

/**
 * @desc   Save a contact identifier (phone or email)
 * @route  POST /api/users/contacts
 * @access Private
 */
export const saveContact = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    res.status(400);
    throw new Error('Please provide a phone number or email');
  }

  const user = await User.findById(req.user._id);
  if (!user.savedContacts.includes(identifier)) {
    user.savedContacts.push(identifier);
    await user.save();
  }

  res.status(200).json({
    success: true,
    savedContacts: user.savedContacts,
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

export const updateAccountSettings = async (req, res) => {
  try {
    const { username, email, password, twoStepPin, readReceipts, enterIsSend, keepChatsArchived, conversationTones, name, about, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username !== undefined) {
      // Check if username is taken
      if (username !== '') {
        const existing = await User.findOne({ username });
        if (existing && existing._id.toString() !== user._id.toString()) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
      }
      user.username = username;
    }

    if (email !== undefined) {
      if (email !== '') {
        const existing = await User.findOne({ email });
        if (existing && existing._id.toString() !== user._id.toString()) {
          return res.status(400).json({ message: 'Email is already taken' });
        }
      }
      user.email = email;
    }

    if (password !== undefined && password !== '') {
      user.password = password; // Will be hashed by pre-save hook
    }

    if (name !== undefined) user.name = name;
    if (about !== undefined) user.about = about;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    if (req.file) {
      const uploaded = await uploadMedia(req.file, 'whatsapp_avatars');
      user.avatar = uploaded.url;
    }
    
    if (conversationTones !== undefined) {
      user.conversationTones = conversationTones;
    }

    if (enterIsSend !== undefined) {
      user.enterIsSend = enterIsSend;
    }

    if (keepChatsArchived !== undefined) {
      user.keepChatsArchived = keepChatsArchived;
    }

    if (readReceipts !== undefined) {
      user.readReceipts = readReceipts;
    }

    if (twoStepPin !== undefined) {
      user.twoStepPin = twoStepPin;
    }

    await user.save();

    // Return updated user (without sensitive fields)
    const updatedUser = await User.findById(req.user._id);
    res.json(updatedUser);
  } catch (error) {
    console.error('Update account settings error:', error);
    res.status(500).json({ message: 'Server error while updating account' });
  }
};

export const toggleFavoriteChat = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { chatId } = req.params;

  const isFav = user.favoriteChats.includes(chatId);
  if (isFav) {
    user.favoriteChats = user.favoriteChats.filter((id) => id.toString() !== chatId);
  } else {
    user.favoriteChats.push(chatId);
  }
  await user.save();

  res.status(200).json({ success: true, favoriteChats: user.favoriteChats });
});

export const subscribePush = asyncHandler(async (req, res) => {
  const { subscription } = req.body;
  if (!subscription) {
    res.status(400); throw new Error('Missing subscription');
  }

  const user = await User.findById(req.user._id);
  // Check if subscription already exists
  const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
  
  if (!exists) {
    user.pushSubscriptions.push(subscription);
    await user.save();
  }

  res.status(200).json({ success: true });
});

export const toggleLockChat = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { chatId } = req.params;

  const isLocked = user.lockedChats.includes(chatId);
  if (isLocked) {
    user.lockedChats = user.lockedChats.filter((id) => id.toString() !== chatId);
  } else {
    user.lockedChats.push(chatId);
  }
  await user.save();

  res.status(200).json({ success: true, lockedChats: user.lockedChats });
});

export const verifyLockPin = asyncHandler(async (req, res) => {
  const { pin } = req.body;
  const user = await User.findById(req.user._id);
  
  if (!user.chatLockPin) {
    // If no PIN is set, set it now
    user.chatLockPin = pin;
    await user.save();
    res.status(200).json({ success: true, message: 'PIN set successfully' });
  } else {
    if (user.chatLockPin === pin) {
      res.status(200).json({ success: true, message: 'PIN verified' });
    } else {
      res.status(401);
      throw new Error('Incorrect PIN');
    }
  }
});
