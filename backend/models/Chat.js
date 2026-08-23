import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    chatAvatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    groupAdmin: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    disappearingMessagesTimer: {
      type: Number,
      default: 0, // 0 = off, 86400 = 24 hours, 604800 = 7 days, 7776000 = 90 days
    },
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
