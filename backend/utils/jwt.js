import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_access_key_whatsapp_2026_x89!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_key_whatsapp_2026_z12@';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};
