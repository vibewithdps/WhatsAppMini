import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Phone,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Smartphone,
  QrCode,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Video,
  Lock,
  Clock,
  Cloud,
  Zap,
  Download,
  Award,
  Mail,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useImageViewerStore } from '../store/useImageViewerStore';
import { getSocket, initSocket } from '../services/socket';
import { auth } from '../config/firebase';
import { RecaptchaVerifier } from 'firebase/auth';

export const Login = ({ onNavigateToOTP }) => {
  const { sendOTP, isLoading, error, setAuth } = useAuthStore();
  const openImageViewer = useImageViewerStore((state) => state.openImageViewer);

  const [identifier, setIdentifier] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [qrSessionId, setQrSessionId] = useState('');
  const [qrExpired, setQrExpired] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [qrScannedSuccess, setQrScannedSuccess] = useState(false);

  // Generate new QR session

  const generateNewQR = () => {
    const newSession = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setQrSessionId(newSession);
    setQrExpired(false);
    setCountdown(60);
    setQrScannedSuccess(false);

    // Join QR session socket room
    const socket = getSocket();
    if (socket) {
      socket.emit('join_qr_session', { qrSessionId: newSession });
    }
  };

  useEffect(() => {
    const socket = initSocket({ _id: 'guest_qr_login' });
    generateNewQR();

    const handleQRSuccess = (data) => {
      setQrScannedSuccess(true);
      setTimeout(() => {
        setAuth(data.user, data.accessToken, data.refreshToken);
      }, 800);
    };

    if (socket) {
      socket.on('qr_login_success', handleQRSuccess);
    }

    return () => {
      if (socket) {
        socket.off('qr_login_success', handleQRSuccess);
      }
    };
  }, [setAuth]);

  // Countdown timer for QR expiration (60 seconds)
  useEffect(() => {
    if (countdown <= 0) {
      setQrExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOTP = async (e) => {
    e?.preventDefault();
    
    // We added 'email' state earlier, let's make sure it's used
    if (!identifier.trim() || !email.trim()) {
      alert("Please enter both Phone Number and Email");
      return;
    }

    try {
      let phoneStr = identifier.trim();
      if (!phoneStr.startsWith('+')) {
        phoneStr = '+91 ' + phoneStr;
      }
      
      const payload = { phone: phoneStr, email: email.trim() };
      await sendOTP(payload);
      
      onNavigateToOTP(phoneStr, null);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || e.message || "Failed to send OTP");
    }
  };

  const handleViewCreatorPhoto = () => {
    openImageViewer({
      imageUrl: '/dps_creator.jpg',
      title: 'DIPENDRA PRATAP SINGH (DPS)',
      subtitle: 'Creator & Lead Architect of WhatsApp_Mini',
    });
  };

  const host = window.location.hostname === 'localhost' ? '10.136.52.23' : window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const qrPayload = `http://${host}${port}/?linkSession=${qrSessionId}`;

  const appFeatures = [
    {
      icon: MessageSquare,
      title: 'Real-Time Messaging',
      desc: 'Instant delivery, typing indicators, read receipts, and voice audio notes.',
      color: 'text-wa-green',
      bg: 'bg-wa-green/10 border-wa-green/20',
    },
    {
      icon: Video,
      title: 'HD Video & Group Calls',
      desc: 'Multi-participant WebRTC group calls with screen sharing and grid view.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      desc: 'Military-grade AES-GCM 256-bit encryption for all chats and calls.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: QrCode,
      title: 'Live QR Device Linking',
      desc: 'WhatsApp Web camera scanner for instant cross-device authentication.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      icon: Clock,
      title: '24-Hour Stories / Status',
      desc: 'Share vanishing media and text stories with active view count tracking.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: Cloud,
      title: 'Cloudinary CDN Storage',
      desc: 'High-speed cloud media delivery with instant image previews.',
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      icon: Zap,
      title: 'Upstash Redis Caching',
      desc: 'Sub-millisecond presence status and high-throughput session cache.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      icon: Download,
      title: '1-Click Install APK / PWA',
      desc: 'Install standalone progressive web app on Android, iOS, Mac, and Windows.',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="h-[100dvh] w-full bg-wa-dark-bg dark:bg-wa-dark-bg bg-[#efeae2] flex flex-col justify-between select-none overflow-y-auto">
      {/* Top Brand Banner */}
      <div className="h-24 md:h-[222px] bg-[#00a884] flex items-start pt-6 md:pt-10 px-6 md:px-24 flex-shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 md:w-13 md:h-13 rounded-2xl bg-white p-1 flex items-center justify-center shadow-xl">
            <img
              src="/logo.png"
              alt="WhatsApp Mini"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-wider text-white">
              WhatsApp Mini
            </h1>
            
          </div>
        </div>

      </div>

      {/* Main Center Card */}
      <div className="flex-1 -mt-8 md:-mt-28 z-10 flex flex-col items-center p-3 md:p-6 w-full">
        <div className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-white w-full max-w-5xl rounded-[3px] shadow-lg overflow-hidden border border-wa-dark-border grid grid-cols-1 md:grid-cols-12 min-h-[500px] mb-8">
          {/* Left Column: Phone / OTP Login & Step Instructions */}
          <div className="md:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-wa-text-primary">
                Use WhatsApp Mini on your computer
              </h2>

              {/* Step by Step Instructions */}
              <ol className="mt-4 space-y-2.5 text-xs sm:text-sm text-wa-text-secondary">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-wa-green/20 text-wa-green text-xs font-bold flex items-center justify-center mt-0.5">
                    1
                  </span>
                  <span>
                    Open <b>WhatsApp Mini</b> on your phone
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-wa-green/20 text-wa-green text-xs font-bold flex items-center justify-center mt-0.5">
                    2
                  </span>
                  <span>
                    Tap <b>Menu (⋮)</b> on Android, or <b>Settings (⚙️)</b> on iPhone
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-wa-green/20 text-wa-green text-xs font-bold flex items-center justify-center mt-0.5">
                    3
                  </span>
                  <span>Tap <b>Linked devices</b> and then <b>Link a device</b><br/><br/>Point your phone to this screen to capture the QR code</span>
                </li>
              </ol>

              

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-wa-dark-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-white px-3 text-wa-text-secondary font-semibold">
                    OR LOG IN WITH PHONE NUMBER
                  </span>
                </div>
              </div>

              {/* Phone / Email OTP Form */}
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-wa-green uppercase tracking-wider block mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-wa-text-secondary pointer-events-none" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary focus:outline-none focus:ring-2 focus:ring-wa-green border border-gray-200 dark:border-wa-dark-border"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-wa-green uppercase tracking-wider block mb-1.5 mt-4">
                    Email Address (For OTP)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-wa-text-secondary pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary focus:outline-none focus:ring-2 focus:ring-wa-green border border-gray-200 dark:border-wa-dark-border"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-400 font-medium">{error}</p>
                )}

                <div id="recaptcha-container"></div>
                <button
                  type="submit"
                  disabled={!identifier.trim() || isLoading}
                  className="w-full py-3 rounded-xl bg-[#00a884] hover:bg-[#017561] text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Sending OTP Code...' : 'Next'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Bottom Security Note */}
            <div className="mt-6 flex items-center gap-2 text-[11px] text-wa-text-secondary">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Protected by end-to-end encryption & secure JWT tokens</span>
            </div>
          </div>

          {/* Right Column: Real Dynamic QR Code Scanner */}
          <div className="md:col-span-5 bg-wa-dark-header dark:bg-wa-dark-header bg-gray-50 border-t md:border-t-0 md:border-l border-wa-dark-border p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* QR Card Container */}
            <div className="relative p-4 bg-white rounded-3xl shadow-2xl border border-gray-200">
              {/* Live QR Code */}
              <div
                className={`transition-all duration-300 ${
                  qrExpired ? 'filter blur-sm opacity-30' : 'opacity-100'
                }`}
              >
                <QRCodeSVG
                  value={qrPayload}
                  size={200}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: '/logo.png',
                    x: undefined,
                    y: undefined,
                    height: 42,
                    width: 42,
                    excavate: true,
                  }}
                />
              </div>

              {/* Animated Scanning Laser Line */}
              {!qrExpired && !qrScannedSuccess && (
                <div className="absolute inset-x-4 top-4 bottom-4 pointer-events-none overflow-hidden rounded-2xl">
                  <div className="w-full h-1 bg-cyan-400 shadow-[0_0_12px_#00d2ff] animate-bounce" />
                </div>
              )}

              {/* Success Overlay */}
              {qrScannedSuccess && (
                <div className="absolute inset-0 bg-white/95 rounded-3xl flex flex-col items-center justify-center p-4 animate-fade-in z-20">
                  <CheckCircle2 className="w-16 h-16 text-wa-green animate-bounce" />
                  <p className="text-sm font-bold text-gray-800 mt-2">
                    QR Scanned!
                  </p>
                  <p className="text-xs text-gray-500">Logging into WhatsApp Mini...</p>
                </div>
              )}

              {/* Reload Button on Expire */}
              {qrExpired && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40 rounded-3xl backdrop-blur-xs z-10">
                  <button
                    onClick={generateNewQR}
                    className="p-3 bg-wa-green hover:bg-wa-green-dark text-white rounded-full shadow-xl transition-transform active:scale-95"
                    title="Click to reload QR code"
                  >
                    <RefreshCw className="w-6 h-6 animate-spin-slow" />
                  </button>
                  <p className="text-xs text-white font-bold mt-2">
                    QR Code Expired
                  </p>
                  <p className="text-[10px] text-gray-200 mt-0.5">
                    Click to reload
                  </p>
                </div>
              )}
            </div>

            {/* QR Instructions & Countdown */}
            <div className="mt-5 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-wa-text-primary">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Scan with WhatsApp Mini Camera</span>
              </div>
              <p className="text-[11px] text-wa-text-secondary">
                {qrExpired ? (
                  <span className="text-amber-400">QR Code expired. Click reload above.</span>
                ) : (
                  <span>Code refreshes in <span className="font-semibold text-cyan-400">{countdown}s</span></span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      
      {/* Footer */}
      <div className="w-full text-center py-6 pb-8 text-sm text-[#54656f] mt-auto">
        Designed and Developed by <span className="font-bold text-[#00a884]">DPS</span>
      </div>
    </div>
  );
};

