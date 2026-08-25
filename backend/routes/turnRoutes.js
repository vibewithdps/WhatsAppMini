import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/credentials', protect, async (req, res) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured in environment');
    }
    
    const auth = Buffer.from(accountSid + ':' + authToken).toString('base64');
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Tokens.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data.ice_servers);
  } catch (error) {
    console.error('Error fetching TURN credentials:', error);
    res.status(500).json({ message: 'Failed to generate TURN credentials' });
  }
});

export default router;
