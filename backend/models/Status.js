import mongoose from 'mongoose';

const viewerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mediaType: {
      type: String,
      enum: ['text', 'image', 'video'],
      default: 'text',
      required: true,
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    caption: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      default: '',
    },
    bgColor: {
      type: String,
      default: '#128C7E',
    },
    font: {
      type: String,
      default: 'sans-serif',
    },
    viewers: [viewerSchema],
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // MongoDB TTL: Automatically delete document after 24 hours (86400 seconds)
    },
  },
  {
    timestamps: true,
  }
);

const Status = mongoose.model('Status', statusSchema);
export default Status;
