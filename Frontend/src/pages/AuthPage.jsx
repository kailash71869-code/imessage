import React, { useState, useRef, useEffect } from 'react';
import { saveSession, getSession } from '../lib/session';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:5000'
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000')
);

// Top 10 countries with dial codes and flag emojis
const COUNTRIES = [
  { name: 'United States', code: '+1', flag: '🇺🇸', placeholder: '(555) 123-4567' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', placeholder: '7911 123456' },
  { name: 'India', code: '+91', flag: '🇮🇳', placeholder: '98765 43210' },
  { name: 'Canada', code: '+1', flag: '🇨🇦', placeholder: '(555) 987-6543' },
  { name: 'Germany', code: '+49', flag: '🇩🇪', placeholder: '151 12345678' },
  { name: 'France', code: '+33', flag: '🇫🇷', placeholder: '6 12 34 56 78' },
  { name: 'Australia', code: '+61', flag: '🇦🇺', placeholder: '412 345 678' },
  { name: 'Japan', code: '+81', flag: '🇯🇵', placeholder: '90 1234 5678' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷', placeholder: '11 91234-5678' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬', placeholder: '803 123 4567' },
];

// Preset avatar options
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=faces',
];

// Inline SVG Icons matching the Icons.jsx pattern
function WhatsAppIcon({ className = 'w-8 h-8' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.07 7.42C8.89 7.42 8.59 7.49 8.34 7.76C8.08 8.04 7.36 8.71 7.36 10.08C7.36 11.45 8.36 12.77 8.5 12.95C8.64 13.14 10.43 15.9 13.2 16.97C15.5 17.86 15.98 17.68 16.48 17.64C16.98 17.59 18.09 16.98 18.32 16.33C18.55 15.68 18.55 15.13 18.48 15C18.42 14.88 18.23 14.82 17.95 14.68C17.67 14.54 16.32 13.88 16.07 13.78C15.82 13.69 15.63 13.65 15.45 13.92C15.27 14.2 14.74 14.82 14.58 15C14.42 15.19 14.26 15.21 13.98 15.07C13.7 14.93 12.81 14.64 11.75 13.69C10.92 12.95 10.36 12.04 10.2 11.76C10.04 11.49 10.18 11.34 10.32 11.2C10.45 11.07 10.61 10.86 10.75 10.7C10.89 10.54 10.93 10.42 11.03 10.24C11.12 10.05 11.08 9.9 11.01 9.76C10.94 9.62 10.41 8.32 10.18 7.79C9.97 7.27 9.75 7.35 9.58 7.34C9.42 7.33 9.24 7.42 9.07 7.42Z" />
    </svg>
  );
}

function PhoneIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  );
}

function MailIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  );
}

function LockShieldIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <path d="M9 12l2 2 4-4"></path>
    </svg>
  );
}

function ArrowLeftIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  );
}

function CameraIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  );
}

function SpinnerIcon({ className = 'w-5 h-5 animate-spin' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    </svg>
  );
}

export default function AuthPage({ onAuthSuccess, onCancel }) {
  // Navigation / Wizard step: 'input' -> 'otp' -> 'profile'
  const [step, setStep] = useState('input');
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'email'

  // Input fields
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');

  // OTP State (6 distinct character boxes)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpSessionId, setOtpSessionId] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const otpInputRefs = useRef([]);

  // Profile setup state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('Hey there! I am using ChatApp');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);

  // Auth result tokens
  const [authToken, setAuthToken] = useState('');
  const [activeUser, setActiveUser] = useState(null);

  // Status and error handling
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const fileInputRef = useRef(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer = null;
    if (step === 'otp' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendCooldown]);

  // Format full international phone number
  const fullPhone = `${selectedCountry.code}${phoneNumber.replace(/\D/g, '')}`;

  // STEP 1: Send OTP
  async function handleSendOtp(e) {
    if (e) e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (authMethod === 'phone' && !phoneNumber.trim()) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }

    if (authMethod === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailAddress.trim() || !emailRegex.test(emailAddress.trim())) {
        setErrorMessage('Please enter a valid email address');
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = authMethod === 'phone'
        ? { phone: fullPhone }
        : { email: emailAddress.trim().toLowerCase() };

      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch verification code');
      }

      setOtpSessionId(data.otpId);
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
      }
      setResendCooldown(30);
      setStep('otp');
      setInfoMessage(`Verification code sent to ${authMethod === 'phone' ? fullPhone : emailAddress}`);

      // Auto-focus first digit box
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setErrorMessage(err.message || 'Error sending OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Handle single digit input
  function handleDigitChange(index, value) {
    const char = value.slice(-1).replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  // Handle backspace navigation between boxes
  function handleDigitKeyDown(index, e) {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  }

  // Handle pasting full 6-digit code
  function handleOtpPaste(e) {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pasteData.length > 0) {
      const digits = pasteData.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    }
  }

  // STEP 2: Verify OTP
  async function handleVerifyOtp(e) {
    if (e) e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        otpId: otpSessionId,
        otp: fullCode,
        ...(authMethod === 'phone' ? { phone: fullPhone } : { email: emailAddress.trim().toLowerCase() }),
      };

      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setAuthToken(data.token);
      setActiveUser(data.user);

      // Save session immediately
      saveSession(data.token, data.user);

      // If user is brand new or profile is incomplete, prompt profile setup
      if (data.isNewUser || !data.user.fullName || data.user.fullName === 'New User') {
        setFullName(data.user.fullName && data.user.fullName !== 'New User' ? data.user.fullName : '');
        setUsername(data.user.username || '');
        setStep('profile');
      } else {
        // Complete login
        if (onAuthSuccess) {
          onAuthSuccess(data.user, data.token);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  }

  // Avatar file upload handler
  function handleAvatarFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  }

  // STEP 3: Complete Profile Setup
  async function handleSaveProfile(e) {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim() || undefined,
          bio: bio.trim(),
          avatar,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update session storage
      saveSession(authToken, data.user);
      setActiveUser(data.user);

      if (onAuthSuccess) {
        onAuthSuccess(data.user, data.token || authToken);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Profile setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#075E54] via-[#0b6e63] to-[#128C7E] px-4 py-8 select-none transition-colors duration-300">
      {/* Background Decorative Accent Waves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#25D366] blur-3xl"></div>
      </div>

      {/* Main Glassmorphism Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-white/20 dark:border-zinc-800 p-6 sm:p-8 backdrop-blur-xl transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#075E54] to-[#25D366] flex items-center justify-center text-white shadow-lg shadow-[#075E54]/30 mb-3 transition-transform hover:scale-105">
            <WhatsAppIcon className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <span>WhatsApp Connect</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
            <LockShieldIcon className="w-3.5 h-3.5 text-[#25D366]" />
            <span>End-to-End Encrypted Cloud Messaging</span>
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
            <span className="font-bold shrink-0">⚠️</span>
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Global Info Banner */}
        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
            <span className="font-bold shrink-0">✓</span>
            <span className="flex-1">{infoMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 1: Phone / Email Input Screen                      */}
        {/* ======================================================== */}
        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="space-y-5 animate-in fade-in duration-200">
            {/* Tab Switcher: Phone vs Email */}
            <div className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  authMethod === 'phone'
                    ? 'bg-white dark:bg-zinc-700 text-[#075E54] dark:text-[#25D366] shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <PhoneIcon className="w-4 h-4" />
                <span>Phone Number</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  authMethod === 'email'
                    ? 'bg-white dark:bg-zinc-700 text-[#075E54] dark:text-[#25D366] shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <MailIcon className="w-4 h-4" />
                <span>Email Address</span>
              </button>
            </div>

            {/* Phone Method Input */}
            {authMethod === 'phone' && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Select Country & Phone Number
                </label>
                <div className="flex gap-2">
                  {/* Country Selector Dropdown */}
                  <div className="relative w-36 shrink-0">
                    <select
                      value={selectedCountry.code}
                      onChange={(e) => {
                        const match = COUNTRIES.find((c) => c.code === e.target.value);
                        if (match) setSelectedCountry(match);
                      }}
                      className="w-full h-11 px-3 appearance-none bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-[#128C7E]"
                    >
                      {COUNTRIES.map((c, i) => (
                        <option key={`${c.code}-${i}`} value={c.code}>
                          {c.flag} {c.code} ({c.name})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400 text-xs">
                      ▼
                    </div>
                  </div>

                  {/* Phone Input Box */}
                  <input
                    type="tel"
                    placeholder={selectedCountry.placeholder}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    autoFocus
                    className="flex-1 h-11 px-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#128C7E]"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  We will send a 6-digit confirmation code via SMS/WhatsApp.
                </p>
              </div>
            )}

            {/* Email Method Input */}
            {authMethod === 'email' && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Enter Your Email Address
                </label>
                <div className="relative">
                  <MailIcon className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    required
                    autoFocus
                    className="w-full h-11 pl-10 pr-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#128C7E]"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  A 6-digit OTP will be dispatched immediately to your email inbox.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="w-5 h-5 animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <span>Send Verification Code →</span>
              )}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-center transition"
              >
                Cancel and return to chat
              </button>
            )}
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 2: OTP 6-Box Verification Screen                   */}
        {/* ======================================================== */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in duration-200">
            {/* Back button & recipient display */}
            <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setOtpDigits(['', '', '', '', '', '']);
                  setErrorMessage('');
                  setInfoMessage('');
                }}
                className="flex items-center gap-1 text-[#128C7E] dark:text-[#25D366] font-medium hover:underline cursor-pointer"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>Edit {authMethod === 'phone' ? 'Phone' : 'Email'}</span>
              </button>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[180px]">
                {authMethod === 'phone' ? fullPhone : emailAddress}
              </span>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Enter 6-Digit Code
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Please enter the security verification code sent to your {authMethod}.
              </p>
            </div>

            {/* 6 Separate OTP Boxes */}
            <div className="flex justify-between gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(index, e)}
                  className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 focus:border-[#25D366] dark:focus:border-[#25D366] rounded-xl text-zinc-900 dark:text-white focus:outline-hidden shadow-inner transition-all"
                />
              ))}
            </div>

            {/* Local dev helper badge for simulated OTP */}
            {devOtpHint && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-700 dark:text-amber-300 flex items-center justify-between">
                <span>💡 Dev OTP: <strong>{devOtpHint}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    const digits = devOtpHint.split('');
                    setOtpDigits(digits);
                    otpInputRefs.current[5]?.focus();
                  }}
                  className="text-amber-800 dark:text-amber-200 font-bold hover:underline ml-2"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* Resend OTP countdown */}
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Didn't receive the code?</span>
              {resendCooldown > 0 ? (
                <span className="font-semibold text-zinc-400">
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isLoading}
                  className="font-bold text-[#128C7E] dark:text-[#25D366] hover:underline cursor-pointer"
                >
                  Resend Code
                </button>
              )}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading || otpDigits.join('').length !== 6}
              className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="w-5 h-5 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <span>Verify & Continue →</span>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 3: Profile Setup Form After OTP                     */}
        {/* ======================================================== */}
        {step === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Set Up Your Profile
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose how you appear to your contacts on WhatsApp.
              </p>
            </div>

            {/* Avatar Selector & Upload */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img
                  src={avatar}
                  alt="Profile Avatar"
                  className="w-20 h-20 rounded-full object-cover border-4 border-[#25D366] shadow-md transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <CameraIcon className="w-6 h-6" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  className="hidden"
                />
              </div>

              {/* Avatar Preset Options */}
              <div className="flex items-center gap-2">
                {PRESET_AVATARS.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(src)}
                    className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-transform ${
                      avatar === src ? 'border-[#25D366] scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. John Appleseed"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full h-11 px-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#128C7E]"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Username (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-sm text-zinc-400">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full h-11 pl-8 pr-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#128C7E]"
                />
              </div>
            </div>

            {/* About / Bio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                About / Status
              </label>
              <input
                type="text"
                placeholder="Hey there! I am using ChatApp"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full h-11 px-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#128C7E]"
              />
            </div>

            {/* Complete Setup Button */}
            <button
              type="submit"
              disabled={isLoading || !fullName.trim()}
              className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="w-5 h-5 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>Complete Setup & Start Chatting ✓</span>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-[11px] text-zinc-400">
          <span>Protected by Web Crypto E2EE • Powered by iMessage Pro</span>
        </div>
      </div>
    </div>
  );
}
