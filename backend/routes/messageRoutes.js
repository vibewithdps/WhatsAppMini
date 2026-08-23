import express from 'express';
import {
  sendMessage,
  allMessages,
  reactToMessage,
  toggleStarMessage,
  deleteMessage,
  forwardMessage,
  markChatMessagesRead,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('file'), sendMessage);
router.get('/:chatId', allMessages);
router.put('/react/:messageId', reactToMessage);
router.put('/star/:messageId', toggleStarMessage);
router.delete('/:messageId', deleteMessage);
router.post('/forward', forwardMessage);
router.put('/read/:chatId', markChatMessagesRead);

export default router;
