import mongoose from 'mongoose';

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
    },
    callType: {
      type: String,
      enum: ['audio', 'video'],
      default: 'audio',
      required: true,
    },
    isGroupCall: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['missed', 'completed', 'rejected', 'busy', 'ongoing', 'cancelled'],
      default: 'ongoing',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0, // seconds
    },
  },
  {
    timestamps: true,
  }
);

const Call = mongoose.model('Call', callSchema);
export default Call;
