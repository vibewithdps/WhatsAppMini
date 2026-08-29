import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// You must provide FIREBASE_SERVICE_ACCOUNT_BASE64 in your environment variables for production
// Or FIREBASE_SERVICE_ACCOUNT_PATH if using a local JSON file
let app;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
    );
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Attempt default initialization (works in some hosted environments like GCP)
    app = admin.initializeApp();
  }
  console.log('Firebase Admin Initialized successfully.');
} catch (error) {
  console.error('Firebase Admin Initialization Error:', error.message);
}

export const db = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
