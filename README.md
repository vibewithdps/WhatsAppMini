# 💬 WhatsApp_Mini — Production Real-Time Chat & Video Calling Platform

<div align="center">
  <img src="frontend/public/logo.png" alt="WhatsApp Mini Logo" width="120" />
  <h3>Modern Real-Time Messaging • WebRTC Group Calls • 24h Stories • QR Device Linking • PWA APK</h3>
  
  <p>
    <strong>Built by <a href="#-creator--developer">DIPENDRA PRATAP SINGH (DPS)</a></strong>
  </p>
</div>

---

## 🌟 Key Features

- ⚡ **Real-Time Instant Messaging**: Socket.io powered chats with typing indicators, delivered/read tick receipts, and synthesized sound effects.
- 🔒 **End-to-End Encryption (E2EE)**: Military-grade AES-GCM 256-bit client-side encryption.
- 📞 **WebRTC HD Voice & Group Video Calling**: 1-on-1 and multi-participant group calling with dynamic video grid, screen sharing, and mute controls.
- 📷 **Live QR Code Scanner Login**: WhatsApp Web-style QR linking with auto-refresh and camera scanner.
- ⏳ **24-Hour Stories / Status**: Vanishing status updates with text, images, and view count tracking.
- ☁️ **Cloudinary CDN**: High-speed cloud storage for images, voice audio notes, and attachments.
- 🚀 **Upstash Redis Caching**: Sub-millisecond presence and session caching with TLS support.
- 📱 **Progressive Web App (PWA) / Install APK**: 1-click standalone app installation on Android, iOS, macOS, and Windows.
- 🎨 **Dark & Light Mode**: High-contrast theme switching tailored for all lighting conditions.
- 🖼️ **Full Profile Photo Viewer**: Interactive image viewer with zoom, rotate, and download tools.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Real-Time**: Socket.io Client + WebRTC (RTCPeerConnection)
- **Icons & Animation**: Lucide React + Framer Motion
- **QR & Scanner**: QRCode.react + Html5-QRCode

### Backend
- **Runtime**: Node.js + Express.js (ES Modules)
- **Database**: MongoDB Atlas via Mongoose
- **Cache**: Upstash Cloud Redis via ioredis (TLS)
- **Media CDN**: Cloudinary
- **Authentication**: JWT (Access + Refresh tokens) & Phone/Email OTP
- **Security**: Helmet, CORS, Rate Limiting, AES-GCM Crypto

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd CHAT
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your MONGODB_URI, CLOUDINARY, and REDIS credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

Open [`http://localhost:5173`](http://localhost:5173) in your browser.

---

## 🧪 Testing & Verification

Run automated backend API integration tests:
```bash
cd backend
npm test
```

Build frontend for production:
```bash
cd frontend
npm run build
```

---

## 🌐 Deployment Guide

### Deploy Backend (Render / Railway / Heroku)
1. Push code to GitHub.
2. Link repository to **Render** or **Railway**.
3. Set Environment Variables from `backend/.env`.
4. Build Command: `npm install`
5. Start Command: `node server.js`

### Deploy Frontend (Vercel / Netlify)
1. Root directory: `frontend`
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variable: `VITE_API_URL=https://your-backend-url.onrender.com`

---

## 👨‍💻 Creator & Developer

**DIPENDRA PRATAP SINGH (DPS)**  
*Lead Architect & Full-Stack Engineer*

---

## 📄 License
MIT License © 2026 DIPENDRA PRATAP SINGH (DPS)
