import express from 'express';
import {
  searchUsers,
  getAllUsers,
  getUserById,
  togglePinChat,
  toggleArchiveChat,
  toggleBlockUser,
  saveContact,
  updateAccountSettings,
  toggleFavoriteChat,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/', getAllUsers);
router.post('/contacts', saveContact);
router.put('/account', upload.single('avatar'), updateAccountSettings);
router.get('/:id', getUserById);
router.put('/pin-chat/:chatId', togglePinChat);
router.put('/archive-chat/:chatId', toggleArchiveChat);
router.put('/favorite-chat/:chatId', toggleFavoriteChat);
router.put('/block/:targetUserId', toggleBlockUser);

export default router;
