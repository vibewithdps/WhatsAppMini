import React, { useState } from 'react';
import { ArrowLeft, Check, ShieldCheck, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const OTPVerify = ({ identifier, initialOtp, onBack }) => {
  const { verifyOTP, sendOTP, isLoading, error } = useAuthStore();
  const [otp, setOtp] = useState(initialOtp || '');
  const [name, setName] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!otp.trim() || isLoading) return;

    try {
      await verifyOTP({
        identifier,
        otp: otp.trim(),
        name: name.trim() || undefined,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleResend = async () => {
    try {
      const data = await sendOTP({ phone: identifier, email: window.lastUsedEmail });

      setResendMessage('A new verification code has been sent!');
      setTimeout(() => setResendMessage(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen w-full bg-wa-dark-bg dark:bg-wa-dark-bg bg-[#efeae2] flex flex-col justify-between select-none">
      {/* Top Banner */}
      <div className="h-44 bg-wa-green-dark flex items-center justify-between px-8 md:px-24">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 mr-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="text-xl font-bold tracking-wider text-white">
            VERIFICATION
          </span>
        </div>
      </div>

      {/* Center Card */}
      <div className="flex-1 -mt-20 flex items-center justify-center p-4">
        <div className="bg-wa-dark-panel dark:bg-wa-dark-panel bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-wa-dark-border p-8">
          <h1 className="text-xl font-bold text-wa-text-primary">
            Enter 6-Digit Code
          </h1>
          <p className="text-xs text-wa-text-secondary mt-1">
            Verification code sent to <strong className="text-wa-green">{identifier}</strong>
          </p>

          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            {/* OTP Code Input */}
            <div>
              <label className="text-xs font-semibold text-wa-green uppercase tracking-wider block mb-1.5">
                Verification OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-xl bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-wa-green border border-gray-200 dark:border-wa-dark-border"
                autoFocus
              />
            </div>

            {/* Mandatory Name */}
            <div>
              <label className="text-xs font-semibold text-wa-text-secondary uppercase tracking-wider block mb-1.5">
                Your Display Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-wa-text-secondary" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary focus:outline-none focus:ring-1 focus:ring-wa-green border border-gray-200 dark:border-wa-dark-border"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 font-medium text-center">{error}</p>
            )}

            {resendMessage && (
              <p className="text-xs text-wa-green font-medium text-center">
                {resendMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={otp.length < 6 || !name.trim() || isLoading}
              className="w-full py-3 rounded-xl bg-wa-green text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-wa-green-dark transition-colors shadow disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying...' : 'Verify & Continue'}</span>
              <Check className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleResend}
              className="text-xs text-wa-green hover:underline font-semibold"
            >
              Didn't receive code? Resend OTP
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-wa-text-secondary">
        WhatsApp Web • Secure Authentication
      </footer>
    </div>
  );
};
