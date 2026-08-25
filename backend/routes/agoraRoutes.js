import express from 'express';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/token', protect, (req, res) => {
  const { channelName, uid } = req.query;
  
  if (!channelName) {
    return res.status(400).json({ error: 'channelName is required' });
  }

  // Use environment variables in production, fallback to hardcoded for testing/dev
  const appId = process.env.AGORA_APP_ID || 'eb9f5ea21d374767921563597696b9d2';
  const appCertificate = process.env.AGORA_APP_CERTIFICATE || 'edeb6eb3795449479f98c6625e242b28';
  
  const role = RtcRole.PUBLISHER;
  const expireTime = 3600; // 1 hour token validity
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTime;

  try {
    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      parseInt(uid) || 0, // Agora expects uid as number, 0 lets Agora assign one automatically
      role,
      privilegeExpiredTs
    );
    
    res.json({ token, uid: parseInt(uid) || 0 });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

export default router;
