import React, { useState, useEffect, useRef } from 'react';
import { t, SUPPORTED_LANGUAGES } from '../lib/i18n';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:5000'
    : (typeof window !== 'undefined' ? window.location.origin : '')
);

export default function BotChat({
  currentUser,
  onClose,
  initialLanguage = 'en',
  onShareToChat,
}) {
  const [language, setLanguage] = useState(initialLanguage);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: t('botWelcome', initialLanguage),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: ['App Help', 'Translate to Spanish', 'Latest News', 'Study Tips'],
      sources: ['iMessage Assistant'],
    },
  ]);

  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when messages or thinking state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Quick Action presets
  const quickActions = [
    { label: t('appHelp', language), query: 'How do I use End-to-End Encryption and share code snippets?' },
    { label: t('translateAction', language), query: 'How does multi-language translation work in iMessage?' },
    { label: t('newsAction', language), query: 'Give me a summary of current tech and science news headlines.' },
    { label: t('studyAction', language), query: 'What are key study tips for distributed WebSocket systems and E2EE?' },
  ];

  // Send message to Bot API
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isThinking) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/bot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userId: currentUser?.clerkId || 'guest_user',
          language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMsg = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.reply || "I'm here to help with all iMessage features!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: data.suggestions || ['Ask another question', 'App Help', 'News Feed'],
          sources: data.sources || ['iMessage Engine'],
          poweredBy: data.poweredBy,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('Bot API error');
      }
    } catch (err) {
      // Offline / network fallback with rich documentation response
      let fallbackReply = "I'm operating in offline resilience mode. Here is what you need to know:\n\n" +
        "• Security: End-to-End Encryption with Web Crypto ECDH & AES-GCM 256 is fully active.\n" +
        "• Offline Queue: Messages sent while disconnected are stored safely in IndexedDB and flush automatically.\n" +
        "• Features: Code sharing, voice notes, curated news, and translation are available across all channels.";

      const lower = text.toLowerCase();
      if (lower.includes('news')) {
        fallbackReply = "The News Feed features 8 curated categories: World, Sports, Technology, Science, Business, Health, Education, and Entertainment. Tap 'News Feed' in the navigation bar to read and share!";
      } else if (lower.includes('translate')) {
        fallbackReply = "iMessage supports 15 languages including English, Hindi, Spanish, French, Arabic, Chinese, Japanese, German, and Portuguese with automatic script detection!";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-fallback-${Date.now()}`,
          sender: 'bot',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: ['App Help', 'News', 'Study Tips'],
          sources: ['Offline RAG Cache'],
          poweredBy: 'iMessage Resilient Bot',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: t('botWelcome', language),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: ['App Help', 'Translate to Spanish', 'Latest News', 'Study Tips'],
        sources: ['iMessage Assistant'],
      },
    ]);
  };

  // Helper to render rich markdown-like bot text (bullet lists, bold)
  const renderRichText = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bullet point line
      if (line.trim().startsWith('•') || line.trim().startsWith('- ') || /^\d+\./.test(line.trim())) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1">
            <span className="text-[#128C7E] dark:text-[#25D366] font-bold mt-0.5">•</span>
            <span className="flex-1">{formatInline(line.replace(/^[•\-\d.]\s*/, ''))}</span>
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="my-0.5 leading-relaxed">
          {formatInline(line)}
        </p>
      );
    });
  };

  const formatInline = (str) => {
    // Bold **text**
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-zinc-900 dark:text-zinc-100">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#E5DDD5]/40 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative overflow-hidden font-sans">
      {/* WhatsApp Business Bot Header */}
      <header className="px-4 py-3 bg-[#075E54] dark:bg-zinc-900 text-white flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-white/15 rounded-lg transition"
              title={t('close', language)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Bot Avatar with Verified Badge */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#128C7E] to-[#25D366] flex items-center justify-center text-white shadow-inner border border-white/20">
              {/* Robot SVG Icon */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" />
                <line x1="8" y1="16" x2="8" y2="16.01" />
                <line x1="16" y1="16" x2="16" y2="16.01" />
              </svg>
            </div>
            {/* Green Verified Tick */}
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#25D366] text-white flex items-center justify-center border-2 border-[#075E54] text-[9px] font-bold">
              ✓
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-sm sm:text-base leading-tight tracking-tight">
                {t('aiHelper', language)}
              </h2>
              <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-[#25D366]/20 border border-[#25D366]/40 text-[#DCF8C6] rounded-md">
                Verified
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/80">
              {isThinking ? t('thinking', language) : 'Official Assistant • End-to-End Encrypted'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-2 py-1 text-xs bg-[#128C7E]/70 dark:bg-zinc-800 border border-white/20 text-white rounded-lg focus:outline-hidden cursor-pointer"
            title={t('selectLanguage', language)}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-zinc-800 text-white">
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>

          {/* Clear History */}
          <button
            type="button"
            onClick={handleClearChat}
            className="p-1.5 hover:bg-white/15 text-emerald-100 rounded-lg text-xs transition"
            title="Clear Chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Top Quick Actions Bar */}
      <div className="px-4 py-2.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto shadow-2xs">
        <span className="text-[11px] font-semibold text-[#075E54] dark:text-[#25D366] shrink-0 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
          </svg>
          {t('quickHelp', language)}:
        </span>
        <div className="flex items-center gap-2">
          {quickActions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(action.query)}
              className="px-3 py-1 bg-emerald-50 dark:bg-zinc-800 hover:bg-[#128C7E] hover:text-white dark:hover:bg-[#128C7E] text-[#075E54] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-full text-xs font-medium shrink-0 transition shadow-2xs hover:scale-102 active:scale-98"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Verification banner */}
        <div className="max-w-md mx-auto p-2.5 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-center">
          <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
            🤖 iMessage AI is powered by on-device RAG document retrieval & local Ollama models. Your queries stay private.
          </p>
        </div>

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-sm transition-all text-xs sm:text-sm ${
                  isUser
                    ? 'bg-[#DCF8C6] dark:bg-[#005c4b] text-zinc-900 dark:text-zinc-100 rounded-tr-xs'
                    : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-tl-xs border border-zinc-200/80 dark:border-zinc-800'
                }`}
              >
                {/* Bot Label */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-zinc-100 dark:border-zinc-800/60 text-[10px] text-[#128C7E] dark:text-[#25D366] font-semibold">
                    <span className="flex items-center gap-1">
                      <span>🤖 iMessage Bot</span>
                      {msg.poweredBy && (
                        <span className="text-zinc-400 dark:text-zinc-500 font-normal">
                          • {msg.poweredBy}
                        </span>
                      )}
                    </span>
                    {onShareToChat && (
                      <button
                        type="button"
                        onClick={() => onShareToChat(msg.text)}
                        className="hover:underline flex items-center gap-1 text-zinc-500 dark:text-zinc-400"
                        title="Share response to chat"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                      </button>
                    )}
                  </div>
                )}

                {/* Message Content */}
                <div className="break-words">
                  {isUser ? <p className="whitespace-pre-wrap">{msg.text}</p> : renderRichText(msg.text)}
                </div>

                {/* Sources if present */}
                {!isUser && msg.sources?.length > 0 && (
                  <div className="mt-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-zinc-400">Sources:</span>
                    {msg.sources.map((src, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-400 rounded-md"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div
                  className={`flex items-center justify-end text-[10px] mt-1 ${
                    isUser ? 'text-emerald-900/60 dark:text-emerald-200/60' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {isUser && <span className="ml-1 text-[#128C7E] dark:text-[#25D366]">✓✓</span>}
                </div>
              </div>

              {/* Follow-up suggestions pills */}
              {!isUser && msg.suggestions?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-1 max-w-[85%]">
                  {msg.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(sug)}
                      className="px-2.5 py-1 bg-white dark:bg-zinc-800/90 hover:bg-[#DCF8C6] dark:hover:bg-[#005c4b] border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-[11px] font-medium transition shadow-2xs hover:scale-102"
                    >
                      {sug} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isThinking && (
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-max shadow-2xs">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#128C7E] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#128C7E] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {t('thinking', language)}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <footer className="p-3 sm:p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={t('askAnything', language)}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isThinking}
            className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#128C7E] transition disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className={`p-3 rounded-full transition shadow-md flex items-center justify-center ${
              inputText.trim() && !isThinking
                ? 'bg-[#128C7E] hover:bg-[#075E54] text-white transform hover:scale-105 active:scale-95'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            }`}
            title={t('send', language)}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
