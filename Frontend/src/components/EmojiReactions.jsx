import React from 'react';

export const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/**
 * Floating quick emoji bar that pops in above/below message on hover or long-press
 */
export function EmojiReactionPicker({
  isOpen = false,
  onSelectReaction = () => {},
  onClose = () => {},
  isMe = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-30 -top-11 ${
        isMe ? 'right-0' : 'left-0'
      } flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-[#202C33] rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 animate-slideUp`}
      onMouseLeave={onClose}
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectReaction(emoji);
            onClose();
          }}
          className="text-base sm:text-lg hover:scale-130 active:scale-95 transition-transform duration-150 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700/60 leading-none"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

/**
 * Badge pill list displayed beneath the message bubble showing counts and user status
 */
export function ReactionBadgeList({
  reactions = {},
  currentUserId = null,
  onToggleReaction = () => {},
  className = '',
}) {
  // Normalize reactions into an array of { emoji, count, hasReacted }
  // Supports both { "👍": ["userId1", "userId2"] } and { "👍": 2 }
  const reactionEntries = Object.entries(reactions || {}).filter(([_, val]) => {
    if (Array.isArray(val)) return val.length > 0;
    return typeof val === 'number' && val > 0;
  });

  if (reactionEntries.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1 mt-1 ${className}`}>
      {reactionEntries.map(([emoji, val]) => {
        const count = Array.isArray(val) ? val.length : val;
        const hasReacted = Array.isArray(val)
          ? val.includes(currentUserId)
          : false;

        return (
          <button
            key={emoji}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleReaction(emoji);
            }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition transform active:scale-90 ${
              hasReacted
                ? 'bg-[#25D366]/20 border border-[#25D366] text-[#075E54] dark:text-[#25D366] shadow-2xs font-semibold'
                : 'bg-zinc-100 dark:bg-[#2A3942] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
            title={hasReacted ? `You reacted with ${emoji}` : `React with ${emoji}`}
          >
            <span>{emoji}</span>
            <span className="text-[10px] leading-none">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Unified EmojiReactions component
 */
export default function EmojiReactions({
  isOpen = false,
  onSelect = () => {},
  onClose = () => {},
  reactions = {},
  currentUserId = null,
  onToggleReaction = () => {},
  isMe = false,
}) {
  return (
    <>
      <EmojiReactionPicker
        isOpen={isOpen}
        onSelectReaction={onSelect}
        onClose={onClose}
        isMe={isMe}
      />
      <ReactionBadgeList
        reactions={reactions}
        currentUserId={currentUserId}
        onToggleReaction={onToggleReaction}
      />
    </>
  );
}
