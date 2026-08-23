import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  X,
  Smartphone,
  Laptop,
  Plus,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import api from '../services/api';

export const LinkedDevicesModal = ({ isOpen, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'info' | 'success' | 'error'
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const startCamera = async () => {
    setIsScanning(true);
    setStatusMessage('Position the QR code on your screen inside the frame');
    setStatusType('info');

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-viewport');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          try {
            let qrSessionId = decodedText;
            try {
              if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
                const url = new URL(decodedText);
                qrSessionId =
                  url.searchParams.get('linkSession') ||
                  url.searchParams.get('sessionId') ||
                  url.searchParams.get('qrSessionId') ||
                  decodedText;
              } else {
                const parsed = JSON.parse(decodedText);
                if (parsed.qrSessionId) {
                  qrSessionId = parsed.qrSessionId;
                }
              }
            } catch (e) {}

            setStatusMessage('Linking device...');
            setStatusType('info');
            await stopCamera();

            // Send link device request
            const res = await api.post('/auth/link-device', { qrSessionId });
            if (res.status === 200) {
              setStatusMessage('Device linked successfully! Your desktop is now logged in.');
              setStatusType('success');
            }
          } catch (err) {
            setStatusMessage('Failed to link device. Please refresh QR code and try again.');
            setStatusType('error');
          }
        },
        () => {}
      );
    } catch (err) {
      console.error('Camera start error:', err);
      setStatusMessage('Unable to access camera. Please allow camera permissions.');
      setStatusType('error');
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-wa-dark-border max-h-[90vh]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-wa-dark-border">
          <div className="flex items-center gap-2.5">
            <Laptop className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-wa-text-primary">
              Linked Devices
            </h2>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-6 overflow-y-auto">
          {/* Top Illustration or Camera Viewport */}
          {isScanning ? (
            <div className="w-full flex flex-col items-center">
              <div
                id="qr-reader-viewport"
                className="w-full max-w-[300px] h-[300px] rounded-3xl overflow-hidden border-2 border-cyan-400 shadow-2xl bg-black"
              />
              <button
                onClick={stopCamera}
                className="mt-4 px-4 py-2 rounded-xl bg-gray-700 text-white text-xs font-semibold hover:bg-gray-600"
              >
                Cancel Scanner
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                <Laptop className="w-14 h-14 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-wa-text-primary">
                Use WhatsApp_Mini on other devices
              </h3>
              <p className="text-xs text-wa-text-secondary mt-1 max-w-xs leading-relaxed">
                Scan the QR code displayed on your desktop computer to link and sync all chats instantly.
              </p>
            </div>
          )}

          {/* Status Message Alert */}
          {statusMessage && (
            <div
              className={`w-full p-3 rounded-2xl text-xs flex items-center gap-2.5 ${
                statusType === 'success'
                  ? 'bg-wa-green/10 text-wa-green border border-wa-green/30'
                  : statusType === 'error'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {statusType === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : statusType === 'error' ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Camera className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-left font-medium">{statusMessage}</span>
            </div>
          )}

          {/* Action Button */}
          {!isScanning && (
            <button
              onClick={startCamera}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-wa-green text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl hover:opacity-95 transition-all active:scale-95"
            >
              <Camera className="w-5 h-5" />
              <span>Link a Device (Scan QR)</span>
            </button>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-[11px] text-wa-text-secondary pt-2">
            <ShieldCheck className="w-4 h-4 text-wa-green flex-shrink-0" />
            <span>Your personal chats remain end-to-end encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
