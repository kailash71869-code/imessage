import React, { useState } from 'react';
import {
  LockShieldIcon,
  BotIcon,
  SunIcon,
  MoonIcon,
  SearchIcon,
  CloudOfflineIcon,
  SparklesIcon
} from './Icons';

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
}) {
  const [searchQuery, setSearchQuery] = useState('');

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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
            💬
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-zinc-900 dark:text-white text-base tracking-tight">iMessage</h1>
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-md">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <LockShieldIcon className="w-3 h-3 text-emerald-500" />
              <span>E2EE Active</span>
              {!isOnline && (
                <span className="flex items-center gap-0.5 text-amber-500 font-medium ml-1">
                  • <CloudOfflineIcon className="w-3 h-3" /> Offline
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions Header */}
        <div className="flex items-center gap-1">
          {/* AI Copilot Mode Toggle Button */}
          <button
            type="button"
            onClick={onToggleCopilot}
            className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-medium ${
              isCopilotActive
                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
            title={isCopilotActive ? "AI Copilot: Enabled" : "AI Copilot: Disabled"}
          >
            <SparklesIcon className={`w-4 h-4 ${isCopilotActive ? 'text-indigo-500' : 'text-zinc-400'}`} />
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
        <button
          type="button"
          onClick={onSwitchUser}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium shrink-0 ml-2"
        >
          Switch User ⇄
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-200/60 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-400">
            No chats matching "{searchQuery}"
          </div>
        ) : (
          filteredConversations.map((room) => {
            const isActive = activeRoom?.id === room.id;
            const isUserOnline = room.participantId && onlineUserIds.includes(room.participantId);

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  onSelectRoom(room);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full p-3.5 text-left flex items-start gap-3 transition ${
                  isActive
                    ? 'bg-blue-50/80 dark:bg-blue-950/30 border-l-4 border-blue-600'
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
                  <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
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

