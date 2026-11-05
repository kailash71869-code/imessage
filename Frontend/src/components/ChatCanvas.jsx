import React, { useState, useEffect, useRef } from 'react';
import {
  SendIcon,
  LockShieldIcon,
  BotIcon,
  CodeIcon,
  MicIcon,
  PaperclipIcon,
  SparklesIcon,
  CopyIcon,
  CheckIcon,
  PlayIcon,
  PauseIcon,
  CheckStatusTick,
  CloudOfflineIcon,
} from './Icons';
import VoiceRecorder from './VoiceRecorder';

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
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRefs = useRef({});

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
    onSendMessage({
      text: inputText.trim(),
      messageType: 'text',
    });
    setInputText('');
    onStopTyping();
  };

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handlePlayVoice = (id, audioUrl) => {
    if (playingAudioId === id) {
      audioRefs.current[id]?.pause();
      setPlayingAudioId(null);
    } else {
      // Pause previous
      if (playingAudioId && audioRefs.current[playingAudioId]) {
        audioRefs.current[playingAudioId].pause();
      }
      if (!audioRefs.current[id]) {
        audioRefs.current[id] = new Audio(audioUrl || 'https://actions.google.com/sounds/v1/water/water_bubble.ogg');
        audioRefs.current[id].onended = () => setPlayingAudioId(null);
      }
      audioRefs.current[id].play().catch(() => {});
      setPlayingAudioId(id);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = () => {
      onSendMessage({
        text: `Uploaded file: ${file.name}`,
        messageType: isImage ? 'image' : 'file',
        mediaUrl: reader.result,
        fileObj: file,
      });
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

  return (
    <main className="flex-1 flex flex-col h-full bg-zinc-100/60 dark:bg-zinc-950 overflow-hidden relative">
      {/* Top Room Header */}
      <header className="px-4 py-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
          >
            ☰
          </button>

          {/* Contact Avatar */}
          <div className="relative">
            <img
              src={room?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50"}
              alt={room?.name}
              className="w-10 h-10 rounded-2xl object-cover border border-zinc-200 dark:border-zinc-700 shadow-2xs"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                {room?.name || 'Select a chat'}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-full">
                <LockShieldIcon className="w-3 h-3 text-emerald-500" />
                E2EE AES-GCM
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {typingUsers?.length > 0
                ? `${typingUsers.join(', ')} typing...`
                : isOnline
                ? 'Online • Multi-container Redis Sync'
                : 'Offline • IndexedDB Local Storage Active'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* "Catch Me Up" AI Thread Summarizer Button */}
          <button
            type="button"
            onClick={onOpenSummaryModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition transform active:scale-95"
            title="Catch Me Up: AI Thread Summarization"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Catch Me Up</span>
          </button>
        </div>
      </header>

      {/* Messages Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Security & Encryption Verification Notice */}
        <div className="max-w-md mx-auto my-2 p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-center">
          <div className="flex items-center justify-center gap-1.5 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-1">
            <LockShieldIcon className="w-3.5 h-3.5 text-emerald-500" />
            End-to-End Encrypted Session
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-tight">
            Messages, code snippets, and audio recordings are client-encrypted with Web Crypto ECDH (P-256) & AES-GCM 256. The server only sees ciphertext.
          </p>
        </div>

        {/* Message Items */}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.clerkId;

          return (
            <div
              key={msg._id || msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fadeIn`}
            >
              {/* Sender Name if received */}
              {!isMe && (
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 ml-1">
                  {msg.senderName || 'Team Member'}
                </span>
              )}

              {/* Message Bubble Container */}
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl shadow-xs p-3 transition-all ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-tl-xs border border-zinc-200/80 dark:border-zinc-800'
                }`}
              >
                {/* 1. Code Snippet Block */}
                {msg.messageType === 'code' && msg.codeSnippet && (
                  <div className="rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 my-1 text-left">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[11px]">
                        <CodeIcon className="w-3.5 h-3.5 text-blue-400" />
                        <span>{msg.codeSnippet.title || msg.codeSnippet.language}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(msg._id, msg.codeSnippet.code)}
                        className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-medium transition"
                      >
                        {copiedCodeId === msg._id ? (
                          <>
                            <CheckIcon className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                      <code>{msg.codeSnippet.code}</code>
                    </pre>
                  </div>
                )}

                {/* 2. Voice Note Player */}
                {msg.messageType === 'voice' && (
                  <div className="my-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handlePlayVoice(msg._id, msg.voiceNote?.audioUrl || msg.mediaUrl)}
                        className={`p-2.5 rounded-full transition shadow-xs ${
                          isMe
                            ? 'bg-white text-blue-600 hover:bg-zinc-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {playingAudioId === msg._id ? (
                          <PauseIcon className="w-4 h-4" />
                        ) : (
                          <PlayIcon className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex-1 flex items-center gap-1">
                        {[50, 80, 45, 95, 60, 85, 40, 70, 90, 50, 75, 60].map((h, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full ${
                              isMe ? 'bg-white/80' : 'bg-zinc-400 dark:bg-zinc-600'
                            }`}
                            style={{ height: `${h * 0.25}px` }}
                          />
                        ))}
                      </div>

                      <span className={`text-[11px] font-mono ${isMe ? 'text-white/90' : 'text-zinc-500'}`}>
                        {msg.voiceNote?.duration ? `${msg.voiceNote.duration}s` : 'Voice'}
                      </span>
                    </div>

                    {/* BullMQ Transcription Result */}
                    {msg.voiceNote?.transcription && (
                      <div
                        className={`p-2 rounded-xl text-xs leading-normal ${
                          isMe
                            ? 'bg-blue-700/60 text-blue-50 border border-blue-500/40'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span className="font-semibold text-[10px] uppercase tracking-wider block opacity-75">
                          🎙️ AI Voice Transcription
                        </span>
                        "{msg.voiceNote.transcription}"
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Image Attachment */}
                {msg.messageType === 'image' && msg.mediaUrl && (
                  <div className="my-1 rounded-xl overflow-hidden max-w-sm">
                    <img
                      src={msg.mediaUrl}
                      alt="Uploaded media"
                      className="w-full h-auto object-cover rounded-xl"
                    />
                  </div>
                )}

                {/* 4. Text Content */}
                {msg.text && msg.messageType !== 'code' && (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                    {msg.text}
                  </p>
                )}

                {/* Bubble Timestamp and Status Tick */}
                <div
                  className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                    isMe ? 'text-white/80' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  <span>
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'just now'}
                  </span>
                  {isMe && <CheckStatusTick status={msg.status || 'sent'} />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {typingUsers?.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 p-2 bg-zinc-200/50 dark:bg-zinc-900/50 rounded-xl w-max animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>{typingUsers.join(', ')} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* AI Copilot Contextual Smart Replies Pills */}
      {isCopilotActive && smartReplies?.length > 0 && (
        <div className="px-4 py-2 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 dark:from-zinc-900 dark:to-zinc-900 border-t border-indigo-100 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
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
                className="px-3 py-1 bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-700 border border-indigo-200 dark:border-zinc-700 rounded-full text-xs font-medium text-zinc-800 dark:text-zinc-200 shrink-0 shadow-2xs transition hover:scale-102"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Recorder Bar (if active) */}
      {isRecordingVoice ? (
        <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <VoiceRecorder
            isRecording={isRecordingVoice}
            onCancel={() => setIsRecordingVoice(false)}
            onFinishRecording={handleFinishVoiceRecording}
          />
        </div>
      ) : (
        /* Standard Message Input Bar */
        <footer className="p-3 sm:p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <form onSubmit={handleSendText} className="flex items-center gap-2">
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
              className="p-2.5 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              title="Share Code Snippet"
            >
              <CodeIcon className="w-5 h-5" />
            </button>

            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              title="Attach Media / File"
            >
              <PaperclipIcon className="w-5 h-5" />
            </button>

            {/* Voice Note Button */}
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="p-2.5 text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              title="Record Voice Note"
            >
              <MicIcon className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              placeholder={isOnline ? "Type an end-to-end encrypted message..." : "Offline: message will auto-queue in IndexedDB..."}
              value={inputText}
              onChange={handleInputChange}
              className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-full transition shadow-xs flex items-center justify-center ${
                inputText.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105 active:scale-95'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </form>
        </footer>
      )}
    </main>
  );
}

