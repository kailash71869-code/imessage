import React, { useState, useRef } from 'react';
import EmojiReactions, { EmojiReactionPicker, ReactionBadgeList } from './EmojiReactions';

// Distinct sender colors for group chats (WhatsApp style)
const SENDER_COLORS = [
  '#027EB5', // blue
  '#1F8A70', // teal
  '#D9534F', // red
  '#8E44AD', // purple
  '#D35400', // orange
  '#16A085', // sea green
  '#C0392B', // crimson
  '#27AE60', // emerald
];

function getSenderColor(senderId = '') {
  let hash = 0;
  for (let i = 0; i < senderId.length; i++) {
    hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SENDER_COLORS.length;
  return SENDER_COLORS[index];
}

/**
 * WhatsApp-style Delivery Status Tick
 * - queued: clock
 * - sent: single grey tick
 * - delivered: double grey tick
 * - read: double blue tick (#53BDEB)
 */
export function WhatsAppTick({ status = 'sent' }) {
  if (status === 'queued') {
    return (
      <svg className="w-3.5 h-3.5 text-zinc-400 inline-block ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }

  if (status === 'sent') {
    return (
      <svg className="w-3.5 h-3.5 text-[#8696A0] inline-block ml-1" viewBox="0 0 16 15" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12.5 3.5L5.5 10.5L2.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (status === 'delivered') {
    return (
      <svg className="w-4 h-3.5 text-[#8696A0] inline-block ml-1" viewBox="0 0 20 15" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M11 3.5L4 10.5L1 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 3.5L9 10.5L7.5 9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // read status (WhatsApp cyan-blue double check)
  return (
    <svg className="w-4 h-3.5 text-[#53BDEB] inline-block ml-1" viewBox="0 0 20 15" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M11 3.5L4 10.5L1 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3.5L9 10.5L7.5 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MessageBubble({
  message,
  currentUser,
  isGroup = false,
  onReply = () => {},
  onForward = () => {},
  onDelete = () => {},
  onToggleStar = () => {},
  onReact = () => {},
  onOpenThread = () => {},
}) {
  const isMe = message.senderId === currentUser?.clerkId;
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const audioRef = useRef(null);
  const longPressTimer = useRef(null);

  // Swipe-to-reply gesture handlers
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
    }, 600);
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null) return;
    const diff = e.touches[0].clientX - touchStartX;
    if (diff > 15) {
      clearTimeout(longPressTimer.current);
      setSwipeOffset(Math.min(diff, 60));
    }
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    if (swipeOffset >= 45) {
      onReply(message);
    }
    setSwipeOffset(0);
    setTouchStartX(null);
  };

  const handlePlayVoice = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(
        message.voiceNote?.audioUrl || message.mediaUrl || 'https://actions.google.com/sounds/v1/water/water_bubble.ogg'
      );
      audioRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  const handleCopyText = () => {
    const textToCopy = message.codeSnippet?.code || message.text || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
    setShowMenu(false);
  };

  const formattedTime = (dateStr) => {
    if (!dateStr) return 'just now';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`relative group flex flex-col ${
        isMe ? 'items-end' : 'items-start'
      } my-1 px-2 select-text transition-transform duration-150`}
      style={{ transform: `translateX(${swipeOffset}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(true);
      }}
    >
      {/* Swipe to reply icon indicator */}
      {swipeOffset > 20 && (
        <div className="absolute left-[-28px] top-1/2 -translate-y-1/2 text-zinc-400">
          <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 10 4 15 9 20" />
            <path d="M20 4v7a4 4 0 0 1-4 4H4" />
          </svg>
        </div>
      )}

      {/* Floating Reaction Picker */}
      <EmojiReactionPicker
        isOpen={showEmojiPicker}
        onSelectReaction={(emoji) => {
          onReact(message._id || message.id, emoji);
          setShowEmojiPicker(false);
        }}
        onClose={() => setShowEmojiPicker(false)}
        isMe={isMe}
      />

      {/* WhatsApp Message Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] px-3.5 py-2 rounded-2xl shadow-xs transition-shadow ${
          isMe
            ? 'bg-[#DCF8C6] dark:bg-[#005C4B] text-zinc-900 dark:text-zinc-100 rounded-tr-xs'
            : 'bg-white dark:bg-[#202C33] text-zinc-900 dark:text-zinc-100 rounded-tl-xs border border-zinc-200/60 dark:border-zinc-800'
        }`}
      >
        {/* Forwarded Header */}
        {message.isForwarded && (
          <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 italic mb-1">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 14 20 9 15 4" />
              <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
            </svg>
            <span>Forwarded</span>
          </div>
        )}

        {/* Sender Name for Group Chats (Incoming) */}
        {!isMe && isGroup && (
          <div
            className="text-[11px] font-bold mb-1 tracking-tight"
            style={{ color: getSenderColor(message.senderId || message.senderName) }}
          >
            {message.senderName || 'Team Member'}
          </div>
        )}

        {/* Replying-to Preview Quote (if replying) */}
        {message.replyTo && (
          <div
            className={`mb-2 p-2 rounded-lg border-l-4 text-xs ${
              isMe
                ? 'bg-[#c5eeb0] dark:bg-[#004d3f] border-[#25D366]'
                : 'bg-zinc-100 dark:bg-[#2A3942] border-[#128C7E]'
            }`}
          >
            <div className="font-semibold text-[11px] text-[#075E54] dark:text-[#25D366]">
              {message.replyTo.senderName || 'Original Message'}
            </div>
            <p className="line-clamp-2 text-zinc-600 dark:text-zinc-300 text-[11px]">
              {message.replyTo.text || 'Media attachment'}
            </p>
          </div>
        )}

        {/* 1. CODE Snippet Type */}
        {message.messageType === 'code' && message.codeSnippet && (
          <div className="rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 my-1 text-left">
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[11px]">
                <svg className="w-3.5 h-3.5 text-[#25D366]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <span>{message.codeSnippet.title || message.codeSnippet.language}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-medium transition"
              >
                {copiedCode ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
              <code>{message.codeSnippet.code}</code>
            </pre>
          </div>
        )}

        {/* 2. IMAGE Message Type */}
        {message.messageType === 'image' && message.mediaUrl && (
          <div className="my-1 rounded-xl overflow-hidden max-w-sm">
            <img
              src={message.mediaUrl}
              alt="Media"
              onClick={() => setIsExpanded(true)}
              className="w-full max-h-72 object-cover rounded-xl cursor-pointer hover:opacity-95 transition"
            />
          </div>
        )}

        {/* 3. VIDEO Message Type */}
        {message.messageType === 'video' && message.mediaUrl && (
          <div className="relative my-1 rounded-xl overflow-hidden max-w-sm bg-black group/video cursor-pointer">
            <video
              src={message.mediaUrl}
              className="w-full max-h-72 object-cover rounded-xl"
              controls
            />
          </div>
        )}

        {/* 4. DOCUMENT / FILE Message Type */}
        {(message.messageType === 'file' || message.messageType === 'document') && (
          <div className="my-1.5 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#075E54] dark:bg-[#128C7E] text-white flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate text-zinc-900 dark:text-white">
                  {message.fileName || message.text || 'Document.pdf'}
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {message.fileSize || '1.8 MB'} • Document
                </div>
              </div>
            </div>
            {message.mediaUrl && (
              <a
                href={message.mediaUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-[#25D366] hover:text-white transition shrink-0"
                title="Download Document"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* 5. VOICE NOTE Message Type */}
        {message.messageType === 'voice' && (
          <div className="my-1 space-y-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayVoice}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-2xs ${
                  isMe
                    ? 'bg-[#075E54] text-white hover:bg-[#128C7E]'
                    : 'bg-[#25D366] text-white hover:bg-[#20ba59]'
                }`}
              >
                {isPlayingAudio ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>

              {/* Waveform graphic */}
              <div className="flex-1 flex items-center gap-1 h-8">
                {[40, 75, 45, 90, 60, 85, 35, 70, 95, 50, 80, 60, 40, 65].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      isPlayingAudio && i % 3 === 0
                        ? 'bg-[#25D366] animate-pulse'
                        : isMe
                        ? 'bg-zinc-700/60 dark:bg-zinc-300/70'
                        : 'bg-zinc-400 dark:bg-zinc-600'
                    }`}
                    style={{ height: `${h * 0.28}px` }}
                  />
                ))}
              </div>

              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                {message.voiceNote?.duration ? `${message.voiceNote.duration}s` : '0:15'}
              </span>
            </div>

            {/* BullMQ Transcription Result */}
            {message.voiceNote?.transcription && (
              <div className="p-2 rounded-xl text-xs bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <span className="font-semibold text-[10px] uppercase tracking-wider block opacity-75">
                  🎙️ AI Transcription:
                </span>
                "{message.voiceNote.transcription}"
              </div>
            )}
          </div>
        )}

        {/* 6. LOCATION Message Type */}
        {message.messageType === 'location' && (
          <div className="my-1 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
            <div className="h-32 bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center relative">
              <svg className="w-10 h-10 text-red-500 animate-bounce" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
            <div className="p-2.5 bg-white dark:bg-[#1F2C34]">
              <div className="text-xs font-semibold text-zinc-900 dark:text-white">
                {message.locationName || 'Shared Location'}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {message.locationAddress || 'Tap to view live coordinate map'}
              </p>
            </div>
          </div>
        )}

        {/* 7. TEXT Message Type */}
        {message.text && message.messageType !== 'code' && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
            {message.text}
          </p>
        )}

        {/* Meta Bar: Star, Timestamp & WhatsApp Delivery Tick */}
        <div className="flex items-center justify-end gap-1 text-[10px] mt-1 text-zinc-500 dark:text-zinc-400">
          {message.isStarred && (
            <span className="text-amber-500 font-bold" title="Starred message">
              ★
            </span>
          )}
          <span>{formattedTime(message.createdAt)}</span>
          {isMe && <WhatsAppTick status={message.status || 'sent'} />}
        </div>
      </div>

      {/* Slack-style "X replies" Thread Trigger */}
      {(message.threadRepliesCount > 0 || message.hasThread) && (
        <button
          type="button"
          onClick={() => onOpenThread(message)}
          className={`flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-[#075E54] dark:text-[#25D366] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
            isMe ? 'mr-1' : 'ml-1'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>
            {message.threadRepliesCount || 1} {message.threadRepliesCount === 1 ? 'reply' : 'replies'}
          </span>
        </button>
      )}

      {/* Emoji Reactions Badge Pills */}
      <ReactionBadgeList
        reactions={message.reactions}
        currentUserId={currentUser?.clerkId}
        onToggleReaction={(emoji) => onReact(message._id || message.id, emoji)}
        className={isMe ? 'justify-end mr-1' : 'justify-start ml-1'}
      />

      {/* Hover Action Bar */}
      <div
        className={`opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity absolute -top-3 ${
          isMe ? 'right-2' : 'left-2'
        } flex items-center bg-white dark:bg-[#202C33] border border-zinc-200 dark:border-zinc-700 rounded-full shadow-md px-1.5 py-0.5 z-20`}
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1 text-zinc-500 hover:text-amber-500 transition"
          title="React with emoji"
        >
          😊
        </button>
        <button
          type="button"
          onClick={() => onReply(message)}
          className="p-1 text-zinc-500 hover:text-[#25D366] transition"
          title="Reply"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 10 4 15 9 20" />
            <path d="M20 4v7a4 4 0 0 1-4 4H4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onOpenThread(message)}
          className="p-1 text-zinc-500 hover:text-[#007AFF] transition"
          title="Reply in Thread"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition"
          title="More options"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Context Action Menu (Long-press / right-click modal) */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setShowMenu(false)}
          />
          <div
            className={`absolute z-50 top-6 ${
              isMe ? 'right-0' : 'left-0'
            } w-44 bg-white dark:bg-[#1F2C34] rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-1.5 animate-fadeIn`}
          >
            <button
              type="button"
              onClick={() => {
                onReply(message);
                setShowMenu(false);
              }}
              className="w-full px-3.5 py-2 text-left text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
            >
              <span>↩️</span> Reply
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenThread(message);
                setShowMenu(false);
              }}
              className="w-full px-3.5 py-2 text-left text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
            >
              <span>🧵</span> Reply in Thread
            </button>
            <button
              type="button"
              onClick={() => {
                onForward(message);
                setShowMenu(false);
              }}
              className="w-full px-3.5 py-2 text-left text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
            >
              <span>↪️</span> Forward
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="w-full px-3.5 py-2 text-left text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
            >
              <span>📋</span> Copy
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleStar(message._id || message.id);
                setShowMenu(false);
              }}
              className="w-full px-3.5 py-2 text-left text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
            >
              <span>{message.isStarred ? '⭐ Unstar' : '☆ Star'}</span>
            </button>
            {isMe && (
              <button
                type="button"
                onClick={() => {
                  onDelete(message._id || message.id);
                  setShowMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
              >
                <span>🗑️</span> Delete
              </button>
            )}
          </div>
        </>
      )}

      {/* Expanded Lightbox View for Media */}
      {isExpanded && message.mediaUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsExpanded(false)}
        >
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 text-xl"
          >
            ✕
          </button>
          <img
            src={message.mediaUrl}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
