import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { generateOTP, sendOTP } from '../utils/otp.js';
import { uploadMedia } from '../config/cloudinary.js';

// Demo predefined users for rapid instant testing
const DEMO_USERS = {
  alice: {
    name: 'Alice Johnson',
    phone: '+1 555 0101',
    email: 'alice@whatsapp.demo',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    about: 'Available | Product Designer 🎨',
  },
  bob: {
    name: 'Bob Smith',
    phone: '+1 555 0102',
    email: 'bob@whatsapp.demo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    about: 'Busy coding real-time WebRTC 🚀',
  },
  charlie: {
    name: 'Charlie Davis',
    phone: '+1 555 0103',
    email: 'charlie@whatsapp.demo',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    about: 'At the gym 🏋️‍♂️',
  },
  diana: {
    name: 'Diana Prince',
    phone: '+1 555 0104',
    email: 'diana@whatsapp.demo',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    about: 'Exploring the world 🌍',
  },
};

/**
 * @desc   Send OTP to Phone or Email
 * @route  POST /api/auth/send-otp
 * @access Public
 */
export const requestOTP = asyncHandler(async (req, res) => {
  const { phone, email } = req.body;

  if (!phone && !email) {
    res.status(400);
    throw new Error('Please provide either phone number or email address');
  }

  const query = phone ? { phone: phone.trim() } : { email: email.trim().toLowerCase() };
  let user = await User.findOne(query);

  const { otp, expiry } = generateOTP();

  if (!user) {
    user = await User.create({
      ...query,
      name: phone ? `User ${phone.trim().slice(-4)}` : email.trim().split('@')[0],
      otp,
      otpExpiry: expiry,
    });
  } else {
    user.otp = otp;
    user.otpExpiry = expiry;
    await user.save();
  }

  await sendOTP(phone ? phone.trim() : email.trim(), otp, Boolean(email));

  res.status(200).json({
    success: true,
    message: `OTP sent successfully to ${phone || email}`,
    // In dev / demo mode, return OTP directly for effortless testing
    debugOtp: otp,
  });
});

/**
 * @desc   Verify OTP and Authenticate User
 * @route  POST /api/auth/verify-otp
 * @access Public
 */
export const verifyUserOTP = asyncHandler(async (req, res) => {
  const { phone, email, otp, name, avatar } = req.body;

  if ((!phone && !email) || !otp) {
    res.status(400);
    throw new Error('Please provide identifier (phone/email) and OTP');
  }

  const query = phone ? { phone: phone.trim() } : { email: email.trim().toLowerCase() };
  const user = await User.findOne(query).select('+otp +otpExpiry');

  if (!user) {
    res.status(404);
    throw new Error('User not found. Please request a new OTP');
  }

  if (user.otp !== otp) {
    res.status(400);
    throw new Error('Invalid OTP code. Please check and try again');
  }

  if (user.otpExpiry && new Date() > user.otpExpiry) {
    res.status(400);
    throw new Error('OTP has expired. Please request a new one');
  }

  // Clear OTP
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.isOnline = true;
  user.lastSeen = new Date();

  if (name) user.name = name;
  if (avatar) user.avatar = avatar;

  await user.save();

  const { accessToken, refreshToken } = generateTokens(user._id);

  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      about: user.about,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      publicKey: user.publicKey,
    },
    accessToken,
    refreshToken,
  });
});

/**
 * @desc   1-Click Quick Demo Login (Alice, Bob, Charlie, Diana)
 * @route  POST /api/auth/demo-login
 * @access Public
 */
export const demoLogin = asyncHandler(async (req, res) => {
  const { profile = 'alice' } = req.body;
  const demoData = DEMO_USERS[profile.toLowerCase()] || DEMO_USERS.alice;

  let user = await User.findOne({ email: demoData.email });

  if (!user) {
    user = await User.create({
      name: demoData.name,
      phone: demoData.phone,
      email: demoData.email,
      avatar: demoData.avatar,
      about: demoData.about,
      isOnline: true,
      lastSeen: new Date(),
    });
  } else {
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();
  }

  const { accessToken, refreshToken } = generateTokens(user._id);

  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      about: user.about,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      publicKey: user.publicKey,
    },
    accessToken,
    refreshToken,
  });
});

/**
 * @desc   Refresh JWT Access Token
 * @route  POST /api/auth/refresh
 * @access Public
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400);
    throw new Error('Refresh token is required');
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error('Invalid refresh token: user not found');
    }

    const tokens = generateTokens(user._id);

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(401);
    throw new Error('Invalid or expired refresh token');
  }
});

/**
 * @desc   Get Current Logged-in User Profile
 * @route  GET /api/auth/me
 * @access Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('pinnedChats')
    .populate('archivedChats');

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
 * @desc   Update Profile Details or Upload Avatar
 * @route  PUT /api/auth/profile
 * @access Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, about, publicKey } = req.body;

  if (name) user.name = name;
  if (about !== undefined) user.about = about;
  if (publicKey !== undefined) user.publicKey = publicKey;

  if (req.file) {
    const uploadResult = await uploadMedia(req.file, 'whatsapp_avatars');
    user.avatar = uploadResult.url;
  }

  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    user: updatedUser,
  });
});

/**
 * @desc   Link Device by QR Code (Called from authenticated mobile app)
 * @route  POST /api/auth/link-device
 * @access Private
 */
export const linkDeviceByQR = asyncHandler(async (req, res) => {
  const { qrSessionId } = req.body;

  if (!qrSessionId) {
    res.status(400);
    throw new Error('qrSessionId is required');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { accessToken, refreshToken } = generateTokens(user._id);

  const io = req.app.get('io');
  if (io) {
    io.to(`qr_${qrSessionId}`).emit('qr_login_success', {
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        about: user.about,
        isOnline: true,
        lastSeen: new Date(),
        publicKey: user.publicKey,
      },
      accessToken,
      refreshToken,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Device linked successfully',
  });
});

/**
 * @desc   Logout User
 * @route  POST /api/auth/logout
 * @access Private
 */
export const logoutUser = asyncHandler(async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});
