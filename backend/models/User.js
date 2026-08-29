import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
    },
    avatar: {
      type: String,
      default: '',
    },
    about: {
      type: String,
      default: 'Hey there! I am using WhatsApp Mini.',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    publicKey: {
      type: String, // For End-to-End Encryption
    },
    otp: String,
    otpExpiry: Date,
    savedContacts: { type: [String], default: [] },
    refreshToken: String,
    favoriteChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }],
    lockedChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }],
    chatLockPin: { type: String, default: null },
    pushSubscriptions: [{ type: Object }],
    pinnedChats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
      },
    ],
    archivedChats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
      },
    ],
    enterIsSend: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ['system', 'light', 'dark'],
      default: 'system',
    },
    keepChatsArchived: {
      type: Boolean,
      default: true, // true means archived chats stay archived when new messages arrive
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;
