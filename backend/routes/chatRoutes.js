import express from 'express';
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  updateGroupInfo,
  setDisappearingMessages,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.route('/').post(accessChat).get(fetchChats);
router.post('/group', upload.single('avatar'), createGroupChat);
router.put('/group/rename', renameGroup);
router.put('/group/add', addToGroup);
router.put('/group/remove', removeFromGroup);
router.put('/group/info/:chatId', upload.single('avatar'), updateGroupInfo);
router.put('/disappearing/:chatId', setDisappearingMessages);

export default router;
