import React, { useState } from 'react';

const APP_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
];

export default function SettingsPage({
  currentUser = null,
  isDarkMode = false,
  onToggleTheme = () => {},
  onClose = () => {},
  onLogout = () => {},
  onUpdateProfile = () => {},
}) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [themeMode, setThemeMode] = useState(isDarkMode ? 'dark' : 'light');

  // Privacy toggles
  const [lastSeen, setLastSeen] = useState('My contacts');
  const [profilePhotoPrivacy, setProfilePhotoPrivacy] = useState('Everyone');
  const [aboutPrivacy, setAboutPrivacy] = useState('Everyone');
  const [readReceipts, setReadReceipts] = useState(true);

  // Notification toggles
  const [conversationTones, setConversationTones] = useState(true);
  const [highPriorityAlerts, setHighPriorityAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Storage toggles
  const [autoDownloadWifi, setAutoDownloadWifi] = useState(true);
  const [autoDownloadMobile, setAutoDownloadMobile] = useState(false);

  // Profile Edit Modal
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.fullName || 'Alex Vance');
  const [profileAbout, setProfileAbout] = useState(currentUser?.role || 'Available • Building with Web Crypto');
  const [profileAvatar, setProfileAvatar] = useState(
    currentUser?.profilepic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
  );

  // FAQ Modal
  const [showFaqModal, setShowFaqModal] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    onUpdateProfile({
      fullName: profileName,
      role: profileAbout,
      profilepic: profileAvatar,
    });
    setIsEditingProfile(false);
  };

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    if (mode === 'dark' && !isDarkMode) onToggleTheme();
    if (mode === 'light' && isDarkMode) onToggleTheme();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ECE5DD] dark:bg-[#0B141A] overflow-y-auto">
      {/* WhatsApp Header */}
      <header className="px-5 py-4 bg-[#075E54] dark:bg-[#1F2C34] text-white flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="md:hidden text-white/80 hover:text-white p-1 rounded-full"
            aria-label="Back"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight">Settings</h1>
            <p className="text-xs text-white/80">Preferences, privacy & app data</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-black/10 transition"
        >
          ✕
        </button>
      </header>

      {/* Main Settings Body */}
      <main className="max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-5">
        {/* User Profile Card */}
        <section
          onClick={() => setIsEditingProfile(true)}
          className="bg-white dark:bg-[#1F2C34] rounded-2xl p-4 shadow-2xs border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#2A3942]/60 transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={profileAvatar}
                alt={profileName}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#25D366]"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#25D366] border-2 border-white dark:border-[#1F2C34]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-900 dark:text-white leading-tight">
                {profileName}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                {profileAbout}
              </p>
              <span className="text-[11px] font-mono text-[#075E54] dark:text-[#25D366]">
                @{currentUser?.username || 'user'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
          </div>
        </section>

        {/* 1. Theme Preferences */}
        <section className="bg-white dark:bg-[#1F2C34] rounded-2xl shadow-2xs border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
            </svg>
            <h3 className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Display & Theme
            </h3>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: '☀️' },
              { id: 'dark', label: 'Dark', icon: '🌙' },
              { id: 'system', label: 'System', icon: '💻' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeChange(t.id)}
                className={`py-3 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 border transition ${
                  themeMode === t.id
                    ? 'border-[#25D366] bg-[#25D366]/10 text-[#075E54] dark:text-[#25D366]'
                    : 'border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="text-xl">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 2. Language Selector (15 languages) */}
        <section className="bg-white dark:bg-[#1F2C34] rounded-2xl shadow-2xs border border-zinc-200/80 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">App Language</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Choose from 15 supported locales
                </p>
              </div>
            </div>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-1.5 bg-zinc-100 dark:bg-[#2A3942] text-xs font-semibold text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-hidden"
            >
              {APP_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.native})
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* 3. Privacy Settings */}
        <section className="bg-white dark:bg-[#1F2C34] rounded-2xl shadow-2xs border border-zinc-200/80 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          <div className="px-4 py-3 bg-zinc-50/50 dark:bg-[#1F2C34] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h3 className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Privacy Controls
            </h3>
          </div>

          {/* Last Seen */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">Last Seen & Online</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Who can see when you were last active</div>
            </div>
            <select
              value={lastSeen}
              onChange={(e) => setLastSeen(e.target.value)}
              className="px-2.5 py-1 bg-zinc-100 dark:bg-[#2A3942] text-xs rounded-lg text-zinc-800 dark:text-zinc-200"
            >
              <option>Everyone</option>
              <option>My contacts</option>
              <option>Nobody</option>
            </select>
          </div>

          {/* Read Receipts */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">Read Receipts (Blue Ticks)</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">If turned off, you won't send or receive read receipts</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={readReceipts}
                onChange={(e) => setReadReceipts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-hidden rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]" />
            </label>
          </div>

          {/* Profile Photo Privacy */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">Profile Photo</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Who can view your profile picture</div>
            </div>
            <select
              value={profilePhotoPrivacy}
              onChange={(e) => setProfilePhotoPrivacy(e.target.value)}
              className="px-2.5 py-1 bg-zinc-100 dark:bg-[#2A3942] text-xs rounded-lg text-zinc-800 dark:text-zinc-200"
            >
              <option>Everyone</option>
              <option>My contacts</option>
              <option>Nobody</option>
            </select>
          </div>
        </section>

        {/* 4. Notification Settings */}
        <section className="bg-white dark:bg-[#1F2C34] rounded-2xl shadow-2xs border border-zinc-200/80 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          <div className="px-4 py-3 bg-zinc-50/50 dark:bg-[#1F2C34] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <h3 className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Notifications & Sounds
            </h3>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">Conversation Tones</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Play sounds for incoming and outgoing messages</div>
            </div>
            <input
              type="checkbox"
              checked={conversationTones}
              onChange={(e) => setConversationTones(e.target.checked)}
              className="w-4 h-4 accent-[#25D366]"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">High Priority Notifications</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Show previews at the top of the screen</div>
            </div>
            <input
              type="checkbox"
              checked={highPriorityAlerts}
              onChange={(e) => setHighPriorityAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#25D366]"
            />
          </div>
        </section>

        {/* 5. Storage & Data */}
        <section className="bg-white dark:bg-[#1F2C34] rounded-2xl shadow-2xs border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">Storage & Data</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">IndexedDB Cache: 42.8 MB • Offline queue: 0</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[#075E54] dark:text-[#25D366]">OPTIMIZED</span>
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span>Auto-download on Wi-Fi</span>
            <input
              type="checkbox"
              checked={autoDownloadWifi}
              onChange={(e) => setAutoDownloadWifi(e.target.checked)}
              className="accent-[#25D366]"
            />
          </div>
        </section>

        {/* 6. Help, FAQ & App Info */}
        <section className="bg-white dark:bg-[#1F2C34] rounded-2xl shadow-2xs border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowFaqModal(true)}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-[#2A3942]/60 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">❓</span>
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-white">Help & FAQ</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Security architecture, ECDH & BullMQ</div>
              </div>
            </div>
            <span className="text-zinc-400">›</span>
          </button>

          <div className="p-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">WhatsApp / Slack Fusion Pro</div>
              <div>Version 3.4.12 • Enterprise Edition</div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
              E2EE ECDH P-256
            </span>
          </div>
        </section>

        {/* 7. Logout Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3.5 px-4 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl font-semibold text-sm transition flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/40"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Log Out of Workspace</span>
          </button>
        </div>
      </main>

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white dark:bg-[#1F2C34] rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-fadeIn"
          >
            <div className="px-5 py-4 bg-[#075E54] dark:bg-[#128C7E] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center">
                <img
                  src={profileAvatar}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#25D366] shadow-md"
                />
                <input
                  type="text"
                  placeholder="Avatar image URL"
                  value={profileAvatar}
                  onChange={(e) => setProfileAvatar(e.target.value)}
                  className="mt-2 text-xs text-center w-full px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#2A3942] text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-[#2A3942] rounded-xl text-zinc-900 dark:text-white border focus:border-[#25D366] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  About / Bio
                </label>
                <input
                  type="text"
                  value={profileAbout}
                  onChange={(e) => setProfileAbout(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-[#2A3942] rounded-xl text-zinc-900 dark:text-white border focus:border-[#25D366] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-[#1F2C34] border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold shadow-md"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQ MODAL */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1F2C34] rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 bg-[#075E54] dark:bg-[#128C7E] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Frequently Asked Questions</h3>
              <button type="button" onClick={() => setShowFaqModal(false)}>✕</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-zinc-700 dark:text-zinc-300">
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">How does End-to-End Encryption work?</h4>
                <p>Every client automatically generates a Web Crypto ECDH (P-256) keypair. Messages are encrypted locally using AES-GCM 256 before being sent over WebSockets or stored on the server.</p>
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Does the app work offline?</h4>
                <p>Yes! Messages and crypto keys are cached in IndexedDB. If you lose network connection, messages are queued in an offline outbox and will automatically flush upon reconnecting.</p>
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">What are the BullMQ background queues for?</h4>
                <p>Audio voice notes and uploaded documents are asynchronously processed by background worker queues for AI transcription, waveform generation, and compression.</p>
              </div>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-[#1F2C34] border-t border-zinc-200 dark:border-zinc-800 text-right">
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                className="px-4 py-1.5 bg-[#25D366] text-white rounded-xl font-semibold text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
