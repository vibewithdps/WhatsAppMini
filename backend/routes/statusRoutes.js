import express from 'express';
import {
  createStatus,
  getStatusFeed,
  markStatusAsViewed,
  deleteStatus,
  toggleStatusLike,
} from '../controllers/statusController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('media'), createStatus);
router.get('/', getStatusFeed);
router.put('/view/:statusId', markStatusAsViewed);
router.put('/like/:statusId', toggleStatusLike);
router.delete('/:statusId', deleteStatus);

export default router;
