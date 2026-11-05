import React from 'react';

/**
 * BottomNav - WhatsApp Mobile Navigation Bar
 * 5 Tabs: Chats, Status, News, Bot, Settings
 * Displays badges, WhatsApp green highlights, and dark mode support.
 */
export default function BottomNav({
  activeTab = 'chats',
  onTabChange = () => {},
  unreadCount = 3,
  hasStatusUpdate = true,
  className = '',
}) {
  const tabs = [
    {
      id: 'chats',
      label: 'Chats',
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null,
      icon: (isActive) => (
        <svg
          className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
          viewBox="0 0 24 24"
          fill={isActive ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={isActive ? '1.5' : '2'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      badgeDot: hasStatusUpdate,
      icon: (isActive) => (
        <div className="relative">
          <svg
            className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={isActive ? '2.4' : '2'}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" strokeDasharray="5 3" />
            <circle cx="12" cy="12" r="3" fill={isActive ? 'currentColor' : 'none'} />
          </svg>
        </div>
      ),
    },
    {
      id: 'news',
      label: 'News',
      icon: (isActive) => (
        <svg
          className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
          viewBox="0 0 24 24"
          fill={isActive ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" />
          <path d="M15 18h-5" />
          <path d="M10 6h8v4h-8V6Z" />
        </svg>
      ),
    },
    {
      id: 'bot',
      label: 'Bot',
      icon: (isActive) => (
        <svg
          className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
          viewBox="0 0 24 24"
          fill={isActive ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="10" rx="3" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
          <line x1="8" y1="16" x2="8" y2="16.01" />
          <line x1="16" y1="16" x2="16" y2="16.01" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (isActive) => (
        <svg
          className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={isActive ? '2.4' : '2'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" fill={isActive ? 'currentColor' : 'none'} />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1F2C34]/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800/80 shadow-lg px-2 py-1.5 transition-colors duration-200 ${className}`}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`group relative flex-1 flex flex-col items-center justify-center py-1 px-1 transition-all duration-200 focus:outline-hidden ${
                isActive
                  ? 'text-[#25D366] dark:text-[#25D366]'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {/* Icon Container with optional badges */}
              <div className="relative flex items-center justify-center">
                {tab.icon(isActive)}

                {/* Number Badge for chats */}
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#25D366] rounded-full flex items-center justify-center shadow-xs animate-scaleIn">
                    {tab.badge}
                  </span>
                )}

                {/* Dot Badge for status update */}
                {tab.badgeDot && !tab.badge && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-white dark:border-[#1F2C34] rounded-full" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] mt-1 tracking-tight font-medium transition-colors ${
                  isActive ? 'font-bold text-[#25D366]' : ''
                }`}
              >
                {tab.label}
              </span>

              {/* Active Indicator Underline */}
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-[#25D366] rounded-full animate-fadeIn" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
