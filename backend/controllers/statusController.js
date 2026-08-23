import asyncHandler from 'express-async-handler';
import Status from '../models/Status.js';
import { uploadMedia } from '../config/cloudinary.js';

/**
 * @desc   Create a 24-hour Status / Story
 * @route  POST /api/status
 * @access Private
 */
export const createStatus = asyncHandler(async (req, res) => {
  const { mediaType = 'text', text, caption, bgColor, font } = req.body;

  let mediaUrl = null;
  let detectedType = mediaType;

  if (req.file) {
    const uploaded = await uploadMedia(req.file, 'whatsapp_status');
    mediaUrl = uploaded.url;
    detectedType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  }

  if (detectedType === 'text' && !text) {
    res.status(400);
    throw new Error('Text status must have text content');
  }

  const status = await Status.create({
    user: req.user._id,
    mediaType: detectedType,
    mediaUrl,
    text: text || '',
    caption: caption || '',
    bgColor: bgColor || '#128C7E',
    font: font || 'sans-serif',
    viewers: [],
  });

  const populated = await Status.findById(status._id).populate(
    'user',
    'name avatar email phone'
  );

  res.status(201).json(populated);
});

/**
 * @desc   Get All 24-Hour Statuses grouped by user
 * @route  GET /api/status
 * @access Private
 */
export const getStatusFeed = asyncHandler(async (req, res) => {
  // Find all statuses created in the last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const statuses = await Status.find({
    createdAt: { $gte: twentyFourHoursAgo },
  })
    .populate('user', 'name avatar email phone')
    .populate('viewers.user', 'name avatar')
    .sort({ createdAt: 1 });

  // Group by user
  const myStatuses = [];
  const otherUsersMap = new Map();

  for (const item of statuses) {
    if (item.user._id.toString() === req.user._id.toString()) {
      myStatuses.push(item);
    } else {
      const userId = item.user._id.toString();
      if (!otherUsersMap.has(userId)) {
        otherUsersMap.set(userId, {
          user: item.user,
          stories: [],
          allViewed: true,
          latestStoryTime: item.createdAt,
        });
      }
      const group = otherUsersMap.get(userId);
      group.stories.push(item);
      group.latestStoryTime = item.createdAt;

      const hasViewed = item.viewers.some(
        (v) => v.user._id.toString() === req.user._id.toString()
      );
      if (!hasViewed) {
        group.allViewed = false;
      }
    }
  }

  const recentUpdates = [];
  const viewedUpdates = [];

  for (const group of otherUsersMap.values()) {
    if (group.allViewed) {
      viewedUpdates.push(group);
    } else {
      recentUpdates.push(group);
    }
  }

  // Sort recent updates by latest story time descending
  recentUpdates.sort((a, b) => new Date(b.latestStoryTime) - new Date(a.latestStoryTime));
  viewedUpdates.sort((a, b) => new Date(b.latestStoryTime) - new Date(a.latestStoryTime));

  res.status(200).json({
    myStatus: {
      user: req.user,
      stories: myStatuses,
    },
    recentUpdates,
    viewedUpdates,
  });
});

/**
 * @desc   Mark a Status as viewed
 * @route  PUT /api/status/view/:statusId
 * @access Private
 */
export const markStatusAsViewed = asyncHandler(async (req, res) => {
  const { statusId } = req.params;

  const status = await Status.findById(statusId);
  if (!status) {
    res.status(404);
    throw new Error('Status not found or expired');
  }

  const alreadyViewed = status.viewers.some(
    (v) => v.user.toString() === req.user._id.toString()
  );

  if (!alreadyViewed && status.user.toString() !== req.user._id.toString()) {
    status.viewers.push({
      user: req.user._id,
      viewedAt: new Date(),
    });
    await status.save();
  }

  res.status(200).json({ success: true, statusId });
});

/**
 * @desc   Delete a Status
 * @route  DELETE /api/status/:statusId
 * @access Private
 */
export const deleteStatus = asyncHandler(async (req, res) => {
  const { statusId } = req.params;

  const status = await Status.findById(statusId);
  if (!status) {
    res.status(404);
    throw new Error('Status not found');
  }

  if (status.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only delete your own status');
  }

  await Status.findByIdAndDelete(statusId);

  res.status(200).json({ success: true, message: 'Status deleted successfully' });
});
