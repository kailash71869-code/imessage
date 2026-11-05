import React, { useState } from 'react';
import {
  LockShieldIcon,
  BotIcon,
  SunIcon,
  MoonIcon,
  SearchIcon,
  CloudOfflineIcon,
  SparklesIcon,
  NewspaperIcon,
  GlobeIcon,
} from './Icons';
import { t, SUPPORTED_LANGUAGES } from '../lib/i18n';

export default function Sidebar({
  conversations,
  activeRoom,
  onSelectRoom,
  currentUser,
  onSwitchUser,
  isDarkMode,
  onToggleTheme,
  isCopilotActive,
  onToggleCopilot,
  isOnline,
  onlineUserIds,
  isOpenMobile,
  onCloseMobile,
  activeTab = 'chats',
  onSelectTab,
  currentLanguage = 'en',
  onSelectLanguage,
  onOpenAuth,
  onLogout,
  isSessionAuthenticated,
  onOpenCreateChannel,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-80 md:static md:w-80 lg:w-96 flex flex-col bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#128C7E] to-[#25D366] flex items-center justify-center text-white font-bold shadow-xs">
            💬
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-zinc-900 dark:text-white text-base tracking-tight">
                {t('appTitle', currentLanguage)}
              </h1>
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-[#DCF8C6] dark:bg-emerald-950 text-[#075E54] dark:text-[#25D366] rounded-md">
                {t('pro', currentLanguage)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <LockShieldIcon className="w-3 h-3 text-emerald-500" />
              <span>{t('e2eeBadge', currentLanguage)}</span>
              {!isOnline && (
                <span className="flex items-center gap-0.5 text-amber-500 font-medium ml-1">
                  • <CloudOfflineIcon className="w-3 h-3" /> {t('offline', currentLanguage)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions Header */}
        <div className="flex items-center gap-1">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="p-2 text-zinc-500 hover:text-[#128C7E] dark:text-zinc-400 dark:hover:text-[#25D366] hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition"
              title={t('selectLanguage', currentLanguage)}
            >
              <GlobeIcon className="w-4 h-4" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-2 z-50 animate-scaleUp max-h-60 overflow-y-auto">
                <div className="px-3 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-700/50">
                  {t('language', currentLanguage)}
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      if (onSelectLanguage) onSelectLanguage(lang.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-zinc-700/60 transition ${
                      currentLanguage === lang.code
                        ? 'text-[#128C7E] dark:text-[#25D366] font-semibold'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-zinc-400 font-mono uppercase">{lang.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Copilot Mode Toggle */}
          <button
            type="button"
            onClick={onToggleCopilot}
            className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-medium ${
              isCopilotActive
                ? 'bg-[#128C7E]/15 text-[#075E54] dark:text-[#25D366] border border-[#128C7E]/30'
                : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
            title={isCopilotActive ? "AI Copilot: Enabled" : "AI Copilot: Disabled"}
          >
            <SparklesIcon className={`w-4 h-4 ${isCopilotActive ? 'text-[#128C7E] dark:text-[#25D366]' : 'text-zinc-400'}`} />
            <span className="hidden sm:inline">AI</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition"
            title="Toggle Theme"
          >
            {isDarkMode ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs: Chats, Status, Study, Bot, Settings */}
      <div className="p-2 bg-zinc-100/80 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('chats')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition shrink-0 ${
            activeTab === 'chats'
              ? 'bg-white dark:bg-zinc-700 text-[#075E54] dark:text-[#25D366] shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-700/50'
          }`}
        >
          <span>💬</span>
          <span>Chats</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('status')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition shrink-0 ${
            activeTab === 'status'
              ? 'bg-[#128C7E] text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-700/50'
          }`}
        >
          <span>⭕</span>
          <span>Status</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('study')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition shrink-0 ${
            activeTab === 'study'
              ? 'bg-[#075E54] text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-700/50'
          }`}
        >
          <span>🎓</span>
          <span>Study</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('news')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition shrink-0 ${
            activeTab === 'news'
              ? 'bg-[#075E54] text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-700/50'
          }`}
        >
          <NewspaperIcon className={`w-3.5 h-3.5 ${activeTab === 'news' ? 'text-white' : 'text-zinc-400'}`} />
          <span>News</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('settings')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition shrink-0 ${
            activeTab === 'settings'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-700/50'
          }`}
        >
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </div>

      {/* User Switcher / Current Identity Banner */}
      <div className="px-4 py-2.5 bg-zinc-100/70 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 truncate">
          <img
            src={currentUser?.profilepic || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50"}
            alt={currentUser?.fullName}
            className="w-6 h-6 rounded-full object-cover border border-zinc-300 dark:border-zinc-700"
          />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {currentUser?.fullName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {onOpenAuth && !isSessionAuthenticated && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="text-xs px-2 py-0.5 rounded-md bg-[#128C7E] text-white hover:bg-[#075E54] font-medium transition"
            >
              Sign In
            </button>
          )}
          {onLogout && isSessionAuthenticated && (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-red-500 hover:underline font-medium"
            >
              Logout
            </button>
          )}
          <button
            type="button"
            onClick={onSwitchUser}
            className="text-[#128C7E] dark:text-[#25D366] hover:underline font-semibold"
          >
            {t('switchUser', currentLanguage)} ⇄
          </button>
        </div>
      </div>

      {/* Search Bar & New Group/Channel Button */}
      <div className="p-3 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t('search', currentLanguage)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-200/60 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#128C7E]"
          />
        </div>
        {onOpenCreateChannel && (
          <button
            type="button"
            onClick={onOpenCreateChannel}
            className="w-8 h-8 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center font-bold text-lg shadow-xs transition shrink-0"
            title="Create New Group / Channel"
          >
            +
          </button>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
        {/* Pinned AI Bot Helper Contact */}
        <button
          type="button"
          onClick={() => {
            if (onSelectTab) onSelectTab('bot');
            if (onCloseMobile) onCloseMobile();
          }}
          className={`w-full p-3.5 text-left flex items-start gap-3 transition ${
            activeTab === 'bot'
              ? 'bg-[#DCF8C6]/60 dark:bg-emerald-950/40 border-l-4 border-[#128C7E]'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
          }`}
        >
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#075E54] to-[#25D366] flex items-center justify-center text-white shadow-2xs">
              <BotIcon className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#25D366] border-2 border-white dark:border-zinc-900" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                <span>{t('aiHelper', currentLanguage)}</span>
                <span className="text-[10px] text-[#128C7E] dark:text-[#25D366]">✓</span>
              </h3>
              <span className="text-[11px] text-zinc-400 shrink-0 ml-2">24/7</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              RAG Knowledge Base & Instant Translation
            </p>
          </div>
        </button>

        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-400">
            {t('noChatsFound', currentLanguage)} "{searchQuery}"
          </div>
        ) : (
          filteredConversations.map((room) => {
            const isActive = activeTab === 'chats' && activeRoom?.id === room.id;
            const isUserOnline = room.participantId && onlineUserIds.includes(room.participantId);

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  if (onSelectTab) onSelectTab('chats');
                  onSelectRoom(room);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full p-3.5 text-left flex items-start gap-3 transition ${
                  isActive
                    ? 'bg-[#DCF8C6]/50 dark:bg-emerald-950/30 border-l-4 border-[#128C7E]'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                {/* Avatar with Online indicator */}
                <div className="relative shrink-0">
                  <img
                    src={room.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50"}
                    alt={room.name}
                    className="w-11 h-11 rounded-2xl object-cover border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                  />
                  {(isUserOnline || room.isChannel) && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {room.name}
                    </h3>
                    <span className="text-[11px] text-zinc-400 shrink-0 ml-2">
                      {room.lastTime || 'now'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                    {room.isEncrypted && <LockShieldIcon className="w-3 h-3 text-emerald-500 shrink-0" />}
                    <span>{room.lastMessage || 'End-to-End encrypted chat'}</span>
                  </p>
                </div>

                {/* Unread badge */}
                {room.unreadCount > 0 && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-[#25D366] text-white rounded-full">
                    {room.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Redis Pub/Sub Active
        </span>
        <span>IndexedDB Cache</span>
      </div>
    </aside>
  );
}
