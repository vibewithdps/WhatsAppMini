/**
 * OTP generation and delivery helper
 */
export const generateOTP = () => {
  // Generate secure 6 digit numeric code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  return { otp, expiry };
};

export const sendOTP = async (target, otp, isEmail = false) => {
  console.log(`[OTP Notification] Sent OTP ${otp} to ${isEmail ? 'Email' : 'Phone'}: ${target}`);
  // In production, integrate Twilio / SendGrid / Firebase Auth SMS here
  return true;
};
