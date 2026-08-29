import express from 'express';
import asyncHandler from 'express-async-handler';
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
router.get('/', getCallHistory);
router.post('/', createCallLog);
router.put('/:callId', updateCallStatus);
router.delete('/:callId', asyncHandler(async (req, res) => {
  const Call = (await import('../models/Call.js')).default;
  const call = await Call.findById(req.params.callId);
  if (!call) { res.status(404); throw new Error('Call not found'); }
  await call.deleteOne();
  res.status(200).json({ success: true });
}));

export default router;
