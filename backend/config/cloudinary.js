import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[Storage] Cloudinary configured successfully.');
} else {
  console.log('[Storage] Cloudinary not configured. Using local disk storage (/uploads).');
}

/**
 * Uploads a file buffer or path to Cloudinary or saves locally.
 * Returns the public URL of the uploaded asset.
 */
export const uploadMedia = async (file, folder = 'whatsapp_media') => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: file.mimetype.startsWith('video/') ? 'video' : 'auto',
          ...(file.mimetype.startsWith('video/') && { format: 'mp4' })
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
            resourceType: result.resource_type,
          });
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  // Local storage fallback
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileExt = path.extname(file.originalname) || '';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}${fileExt}`;
  const filePath = path.join(uploadsDir, fileName);

  fs.writeFileSync(filePath, file.buffer);

  return {
    url: `/uploads/${fileName}`,
    publicId: fileName,
    format: fileExt.replace('.', ''),
    bytes: file.size,
    resourceType: file.mimetype.startsWith('image/')
      ? 'image'
      : file.mimetype.startsWith('video/')
      ? 'video'
      : file.mimetype.startsWith('audio/')
      ? 'audio'
      : 'raw',
  };
};

export { cloudinary, isCloudinaryConfigured };
