import express from 'express';
import {
  searchUsers,
  getAllUsers,
  getUserById,
  togglePinChat,
  toggleArchiveChat,
  toggleBlockUser,
  saveContact,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/', getAllUsers);
router.post('/contacts', saveContact);
router.get('/:id', getUserById);
router.put('/pin-chat/:chatId', togglePinChat);
router.put('/archive-chat/:chatId', toggleArchiveChat);
router.put('/block/:targetUserId', toggleBlockUser);

export default router;
