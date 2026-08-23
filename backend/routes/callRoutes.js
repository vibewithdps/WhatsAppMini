import express from 'express';
import {
  createCallLog,
  getCallHistory,
  updateCallStatus,
} from '../controllers/callController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createCallLog);
router.get('/', getCallHistory);
router.put('/:callId', updateCallStatus);

export default router;
