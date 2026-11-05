import React, { useState, useRef, useEffect } from 'react';

export default function ThreadView({
  isOpen = false,
  onClose = () => {},
  parentMessage = null,
  replies = [],
  onSendReply = () => {},
  currentUser = null,
}) {
  const [replyText, setReplyText] = useState('');
  const repliesEndRef = useRef(null);

  // Auto scroll replies to bottom when new reply is added
  useEffect(() => {
    if (isOpen) {
      repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies, isOpen]);

  if (!isOpen || !parentMessage) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!replyText.trim()) return;

    onSendReply({
      text: replyText.trim(),
      parentId: parentMessage._id || parentMessage.id,
      senderId: currentUser?.clerkId || 'current_user',
      senderName: currentUser?.fullName || 'You',
      avatar: currentUser?.profilepic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60',
      createdAt: new Date().toISOString(),
    });

    setReplyText('');
  };

  const formattedTime = (dateStr) => {
    if (!dateStr) return 'just now';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside
      aria-label="Thread Replies"
      className="fixed inset-y-0 right-0 w-full sm:w-[400px] lg:w-[440px] z-40 bg-white dark:bg-[#1F2C34] border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-slideIn"
    >
      {/* Thread Header (WhatsApp / Slack hybrid style) */}
      <header className="px-4 py-3 bg-[#075E54] dark:bg-[#128C7E] text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 10 4 15 9 20" />
            <path d="M20 4v7a4 4 0 0 1-4 4H4" />
          </svg>
          <div>
            <h3 className="font-semibold text-sm leading-tight">Thread</h3>
            <p className="text-[11px] text-white/80">
              {parentMessage.senderName || 'Discussion'} • {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-black/15 text-white/80 hover:text-white transition"
          aria-label="Close thread"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      {/* Thread Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-[#0B141A]">
        {/* Parent Message Card */}
        <div className="p-3.5 bg-white dark:bg-[#1F2C34] rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-xs">
          <div className="flex items-start gap-3">
            <img
              src={parentMessage.avatar || parentMessage.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
              alt={parentMessage.senderName}
              className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-zinc-900 dark:text-white">
                  {parentMessage.senderName || 'Original Author'}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {formattedTime(parentMessage.createdAt)}
                </span>
              </div>

              {/* Message Content */}
              {parentMessage.messageType === 'code' && parentMessage.codeSnippet ? (
                <div className="mt-2 rounded-lg bg-zinc-900 text-emerald-400 p-2.5 font-mono text-xs overflow-x-auto">
                  <div className="text-[10px] text-zinc-400 mb-1">{parentMessage.codeSnippet.language}</div>
                  <code>{parentMessage.codeSnippet.code}</code>
                </div>
              ) : parentMessage.messageType === 'image' && parentMessage.mediaUrl ? (
                <div className="mt-2 rounded-lg overflow-hidden max-h-48">
                  <img src={parentMessage.mediaUrl} alt="" className="w-full object-cover" />
                </div>
              ) : (
                <p className="mt-1.5 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed break-words">
                  {parentMessage.text}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Replies Divider */}
        <div className="flex items-center gap-3 my-2">
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </span>
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        {/* Replies List */}
        {replies.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-xs">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            No replies yet. Be the first to start the thread discussion.
          </div>
        ) : (
          <div className="space-y-3">
            {replies.map((reply, idx) => {
              const isMine = reply.senderId === currentUser?.clerkId;
              return (
                <div
                  key={reply._id || reply.id || idx}
                  className="flex items-start gap-2.5 group animate-fadeIn"
                >
                  <img
                    src={reply.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60'}
                    alt={reply.senderName}
                    className="w-7 h-7 rounded-full object-cover mt-0.5 border border-zinc-200 dark:border-zinc-700 shrink-0"
                  />
                  <div
                    className={`flex-1 rounded-2xl p-2.5 shadow-2xs ${
                      isMine
                        ? 'bg-[#DCF8C6] dark:bg-[#005C4B] text-zinc-900 dark:text-white'
                        : 'bg-white dark:bg-[#202C33] text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-[#075E54] dark:text-[#25D366]">
                        {reply.senderName || 'Team Member'}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {formattedTime(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">
                      {reply.text}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={repliesEndRef} />
          </div>
        )}
      </div>

      {/* Reply Input Box */}
      <footer className="p-3 bg-white dark:bg-[#1F2C34] border-t border-zinc-200 dark:border-zinc-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply in thread..."
            className="flex-1 px-3.5 py-2 text-xs bg-zinc-100 dark:bg-[#2A3942] text-zinc-900 dark:text-white rounded-full border border-transparent focus:border-[#25D366] focus:outline-hidden transition"
          />

          <button
            type="submit"
            disabled={!replyText.trim()}
            className={`p-2 rounded-full transition shadow-xs flex items-center justify-center ${
              replyText.trim()
                ? 'bg-[#25D366] hover:bg-[#20ba59] text-white active:scale-95'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            }`}
            title="Send reply"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </footer>
    </aside>
  );
}
