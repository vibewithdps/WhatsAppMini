import express from 'express';
import {
  requestOTP,
  verifyUserOTP,
  firebaseLogin,
  demoLogin,
  refreshAccessToken,
  getMe,
  updateProfile,
  logoutUser,
  linkDeviceByQR,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/send-otp', requestOTP);
router.post('/verify-otp', verifyUserOTP);
router.post('/firebase-login', firebaseLogin);
router.post('/demo-login', demoLogin);
router.post('/refresh', refreshAccessToken);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.post('/link-device', protect, linkDeviceByQR);
router.post('/logout', protect, logoutUser);

export default router;
