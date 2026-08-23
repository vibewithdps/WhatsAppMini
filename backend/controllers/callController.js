import asyncHandler from 'express-async-handler';
import Call from '../models/Call.js';

/**
 * @desc   Create or start a Call Log
 * @route  POST /api/calls
 * @access Private
 */
export const createCallLog = asyncHandler(async (req, res) => {
  const { receiverId, chatId, callType, isGroupCall, participants, status, duration } = req.body;

  const call = await Call.create({
    caller: req.user._id,
    receiver: receiverId || null,
    chat: chatId || null,
    callType: callType || 'audio',
    isGroupCall: Boolean(isGroupCall),
    participants: participants || [req.user._id, receiverId].filter(Boolean),
    status: status || 'ongoing',
    duration: duration || 0,
    startedAt: new Date(),
  });

  const populatedCall = await Call.findById(call._id)
    .populate('caller', 'name avatar email phone')
    .populate('receiver', 'name avatar email phone')
    .populate('participants', 'name avatar email phone');

  res.status(201).json(populatedCall);
});

/**
 * @desc   Get Call History for logged-in user
 * @route  GET /api/calls
 * @access Private
 */
export const getCallHistory = asyncHandler(async (req, res) => {
  const calls = await Call.find({
    $or: [
      { caller: req.user._id },
      { receiver: req.user._id },
      { participants: { $in: [req.user._id] } },
    ],
  })
    .populate('caller', 'name avatar email phone')
    .populate('receiver', 'name avatar email phone')
    .populate('participants', 'name avatar email phone')
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json(calls);
});

/**
 * @desc   Update Call status and duration upon completion
 * @route  PUT /api/calls/:callId
 * @access Private
 */
export const updateCallStatus = asyncHandler(async (req, res) => {
  const { callId } = req.params;
  const { status, duration } = req.body;

  const call = await Call.findById(callId);
  if (!call) {
    res.status(404);
    throw new Error('Call log not found');
  }

  if (status) call.status = status;
  if (duration !== undefined) call.duration = duration;
  call.endedAt = new Date();

  await call.save();

  const populatedCall = await Call.findById(callId)
    .populate('caller', 'name avatar email phone')
    .populate('receiver', 'name avatar email phone');

  res.status(200).json(populatedCall);
});
