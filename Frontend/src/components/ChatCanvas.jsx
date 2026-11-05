import React, { useState, useEffect, useRef } from 'react';
import {
  SendIcon,
  LockShieldIcon,
  BotIcon,
  CodeIcon,
  MicIcon,
  PaperclipIcon,
  SparklesIcon,
} from './Icons';
import VoiceRecorder from './VoiceRecorder';
import MessageBubble from './MessageBubble';
import ThreadView from './ThreadView';

export default function ChatCanvas({
  room,
  messages,
  currentUser,
  onSendMessage,
  onOpenCodeModal,
  onOpenSummaryModal,
  isCopilotActive,
  smartReplies,
  typingUsers,
  onTyping,
  onStopTyping,
  isOnline,
  onOpenMobileSidebar,
}) {
  const [inputText, setInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [activeThreadParent, setActiveThreadParent] = useState(null);
  const [threadRepliesMap, setThreadRepliesMap] = useState({});
  const [messageReactionsMap, setMessageReactionsMap] = useState({});
  const [starredMessageIds, setStarredMessageIds] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (e.target.value.trim()) {
      onTyping();
    } else {
      onStopTyping();
    }
  };

  const handleSendText = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const payload = {
      text: inputText.trim(),
      messageType: 'text',
      replyTo: replyingToMessage
        ? {
            senderName: replyingToMessage.senderName || 'Original',
            text: replyingToMessage.text || 'Media attachment',
          }
        : undefined,
    };

    onSendMessage(payload);
    setInputText('');
    setReplyingToMessage(null);
    onStopTyping();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();

    reader.onload = () => {
      onSendMessage({
        text: `Uploaded: ${file.name}`,
        messageType: isImage ? 'image' : isVideo ? 'video' : 'document',
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        mediaUrl: reader.result,
        fileObj: file,
        replyTo: replyingToMessage
          ? {
              senderName: replyingToMessage.senderName || 'Original',
              text: replyingToMessage.text || 'Media attachment',
            }
          : undefined,
      });
      setReplyingToMessage(null);
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFinishVoiceRecording = (audioBlob, duration) => {
    setIsRecordingVoice(false);
    const audioUrl = URL.createObjectURL(audioBlob);
    onSendMessage({
      text: `Voice note (${duration}s)`,
      messageType: 'voice',
      voiceNote: {
        audioUrl,
        duration,
        transcriptionStatus: 'pending',
      },
      fileObj: audioBlob,
    });
  };

  // Toggle reaction on a message
  const handleToggleReaction = (msgId, emoji) => {
    setMessageReactionsMap((prev) => {
      const currentMsgReactions = { ...(prev[msgId] || {}) };
      const currentUsers = Array.isArray(currentMsgReactions[emoji])
        ? currentMsgReactions[emoji]
        : [];
      const myId = currentUser?.clerkId || 'me';

      if (currentUsers.includes(myId)) {
        currentMsgReactions[emoji] = currentUsers.filter((id) => id !== myId);
        if (currentMsgReactions[emoji].length === 0) {
          delete currentMsgReactions[emoji];
        }
      } else {
        currentMsgReactions[emoji] = [...currentUsers, myId];
      }

      return {
        ...prev,
        [msgId]: currentMsgReactions,
      };
    });
  };

  // Toggle starred message
  const handleToggleStar = (msgId) => {
    setStarredMessageIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  // Send reply in Thread
  const handleSendThreadReply = ({ text, parentId }) => {
    const newReply = {
      id: `th-${Date.now()}`,
      parentId,
      text,
      senderId: currentUser?.clerkId || 'me',
      senderName: currentUser?.fullName || 'You',
      avatar: currentUser?.profilepic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60',
      createdAt: new Date().toISOString(),
    };

    setThreadRepliesMap((prev) => ({
      ...prev,
      [parentId]: [...(prev[parentId] || []), newReply],
    }));
  };

  return (
    <main className="flex-1 flex flex-row h-full bg-[#ECE5DD] dark:bg-[#0B141A] overflow-hidden relative">
      {/* Primary Chat Stream Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Room Header */}
        <header className="px-4 py-3 bg-[#075E54] dark:bg-[#1F2C34] text-white flex items-center justify-between z-10 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="md:hidden p-1.5 text-white/80 hover:text-white rounded-xl"
              aria-label="Open menu"
            >
              ☰
            </button>

            {/* Contact Avatar */}
            <div className="relative">
              <img
                src={room?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50"}
                alt={room?.name}
                className="w-10 h-10 rounded-full object-cover border border-white/40 shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-[#075E54] dark:border-[#1F2C34]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-white text-sm sm:text-base leading-tight">
                  {room?.name || 'Select a chat'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-[#25D366]/20 text-[#25D366] rounded-full border border-[#25D366]/40">
                  <LockShieldIcon className="w-3 h-3 text-[#25D366]" />
                  E2EE AES-GCM
                </span>
              </div>
              <p className="text-xs text-white/80">
                {typingUsers?.length > 0
                  ? `${typingUsers.join(', ')} typing...`
                  : isOnline
                  ? 'online • multi-container Redis cluster'
                  : 'offline • IndexedDB queued'}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* "Catch Me Up" AI Thread Summarizer Button */}
            <button
              type="button"
              onClick={onOpenSummaryModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-zinc-950 font-bold rounded-xl text-xs shadow-xs transition transform active:scale-95"
              title="Catch Me Up: AI Thread Summarization"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-zinc-950" />
              <span className="hidden sm:inline">Catch Me Up</span>
            </button>
          </div>
        </header>

        {/* Messages Canvas */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2">
          {/* Security & Encryption Verification Notice */}
          <div className="max-w-md mx-auto my-2 p-2.5 bg-white/70 dark:bg-[#1F2C34]/80 backdrop-blur-xs border border-zinc-200/80 dark:border-zinc-800 rounded-xl text-center shadow-2xs">
            <div className="flex items-center justify-center gap-1.5 text-[#075E54] dark:text-[#25D366] text-xs font-semibold mb-0.5">
              <LockShieldIcon className="w-3.5 h-3.5 text-[#25D366]" />
              End-to-End Encrypted Session
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
              Messages and calls are end-to-end encrypted with Web Crypto ECDH (P-256) & AES-GCM. No one outside of this chat can read them.
            </p>
          </div>

          {/* Message Items using redesigned WhatsApp MessageBubble */}
          {messages.map((msg) => {
            const msgId = msg._id || msg.id;
            const threadReplies = threadRepliesMap[msgId] || [];

            return (
              <MessageBubble
                key={msgId}
                message={{
                  ...msg,
                  reactions: messageReactionsMap[msgId] || msg.reactions,
                  isStarred: starredMessageIds.includes(msgId),
                  threadRepliesCount: threadReplies.length || msg.threadRepliesCount,
                }}
                currentUser={currentUser}
                isGroup={room?.isChannel || room?.isGroup}
                onReply={(m) => setReplyingToMessage(m)}
                onOpenThread={(m) => setActiveThreadParent(m)}
                onReact={handleToggleReaction}
                onToggleStar={handleToggleStar}
                onDelete={() => {}}
                onForward={() => {}}
              />
            );
          })}

          {/* Typing Indicator */}
          {typingUsers?.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 p-2 bg-white/80 dark:bg-[#1F2C34] rounded-2xl w-max animate-pulse shadow-2xs ml-2">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
              <span>{typingUsers.join(', ')} typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* AI Copilot Contextual Smart Replies Pills */}
        {isCopilotActive && smartReplies?.length > 0 && (
          <div className="px-4 py-2 bg-white/80 dark:bg-[#1F2C34]/80 backdrop-blur-xs border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#075E54] dark:text-[#25D366] shrink-0">
              <BotIcon className="w-3.5 h-3.5" />
              Smart Replies:
            </span>
            <div className="flex items-center gap-2">
              {smartReplies.map((reply, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSendMessage({
                      text: reply,
                      messageType: 'text',
                    });
                  }}
                  className="px-3 py-1 bg-white dark:bg-[#2A3942] hover:bg-[#DCF8C6] dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-full text-xs font-medium text-zinc-800 dark:text-zinc-200 shrink-0 shadow-2xs transition"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quote Replying-To Banner */}
        {replyingToMessage && (
          <div className="px-4 py-2 bg-white dark:bg-[#1F2C34] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="border-l-4 border-[#25D366] pl-2.5">
              <div className="text-[11px] font-bold text-[#075E54] dark:text-[#25D366]">
                Replying to {replyingToMessage.senderName || 'User'}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-md">
                {replyingToMessage.text || 'Attachment'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReplyingToMessage(null)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Voice Recorder Bar (if active) */}
        {isRecordingVoice ? (
          <div className="p-3 bg-white dark:bg-[#1F2C34] border-t border-zinc-200 dark:border-zinc-800">
            <VoiceRecorder
              isRecording={isRecordingVoice}
              onCancel={() => setIsRecordingVoice(false)}
              onFinishRecording={handleFinishVoiceRecording}
            />
          </div>
        ) : (
          /* Standard Message Input Bar (WhatsApp style) */
          <footer className="p-2 sm:p-3 bg-white dark:bg-[#1F2C34] border-t border-zinc-200 dark:border-zinc-800">
            <form onSubmit={handleSendText} className="flex items-center gap-1.5 sm:gap-2">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Code Share Modal Button */}
              <button
                type="button"
                onClick={onOpenCodeModal}
                className="p-2 text-zinc-500 hover:text-[#075E54] dark:text-zinc-400 dark:hover:text-[#25D366] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"
                title="Share Code Snippet"
              >
                <CodeIcon className="w-5 h-5" />
              </button>

              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-zinc-500 hover:text-[#075E54] dark:text-zinc-400 dark:hover:text-[#25D366] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"
                title="Attach Media / File"
              >
                <PaperclipIcon className="w-5 h-5" />
              </button>

              {/* Voice Note Button */}
              <button
                type="button"
                onClick={() => setIsRecordingVoice(true)}
                className="p-2 text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"
                title="Record Voice Note"
              >
                <MicIcon className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                placeholder={isOnline ? "Type a message..." : "Offline: message will auto-queue in IndexedDB..."}
                value={inputText}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-[#2A3942] text-sm text-zinc-900 dark:text-white placeholder-zinc-400 rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#25D366] transition"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`w-10 h-10 rounded-full transition shadow-xs flex items-center justify-center shrink-0 ${
                  inputText.trim()
                    ? 'bg-[#25D366] hover:bg-[#20ba59] text-white transform hover:scale-105 active:scale-95'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                }`}
                title="Send Message"
              >
                <SendIcon className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </footer>
        )}
      </div>

      {/* Slack-style Threaded Reply View Panel */}
      <ThreadView
        isOpen={!!activeThreadParent}
        parentMessage={activeThreadParent}
        replies={activeThreadParent ? threadRepliesMap[activeThreadParent._id || activeThreadParent.id] || [] : []}
        onSendReply={handleSendThreadReply}
        currentUser={currentUser}
        onClose={() => setActiveThreadParent(null)}
      />
    </main>
  );
}
