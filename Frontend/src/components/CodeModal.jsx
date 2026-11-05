import React, { useState } from 'react';
import { CodeIcon, CopyIcon, CheckIcon } from './Icons';

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript / Node.js' },
  { id: 'python', name: 'Python' },
  { id: 'dockerfile', name: 'Dockerfile' },
  { id: 'yaml', name: 'Docker Compose YAML' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'html', name: 'HTML / CSS' },
  { id: 'sql', name: 'SQL' },
  { id: 'bash', name: 'Shell / Bash' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
];

const TEMPLATES = {
  dockerfile: `FROM node:22-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY src ./src\nEXPOSE 5000\nCMD ["node", "src/index.js"]`,
  yaml: `services:\n  redis:\n    image: redis:alpine\n    ports:\n      - "6379:6379"\n  backend:\n    build: .\n    environment:\n      REDIS_URL: redis://redis:6379\n    ports:\n      - "5000:5000"`,
  javascript: `import { io } from "socket.io-client";\nconst socket = io("http://localhost:5000");\nsocket.emit("join-room", "team-sync");`,
  python: `import asyncio\nimport websockets\n\nasync def connect():\n    async with websockets.connect("ws://localhost:5000") as ws:\n        await ws.send("hello team")`,
};

export default function CodeModal({ isOpen, onClose, onShareCode }) {
  const [language, setLanguage] = useState('javascript');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState(TEMPLATES.javascript);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (!code || Object.values(TEMPLATES).includes(code)) {
      setCode(TEMPLATES[newLang] || '// Write your code here...');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!code.trim()) return;
    onShareCode({
      language,
      title: title.trim() || `${LANGUAGES.find(l => l.id === language)?.name || language} Snippet`,
      code,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 rounded-lg">
              <CodeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white text-base">Share Code Snippet</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Share syntax-formatted code with one-click copy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Form Controls */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                Snippet Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. docker-compose.yml configuration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Editor and Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
              <span>Code Content</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium"
              >
                {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950">
              <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 text-xs font-mono text-zinc-400">
                <span>{language.toUpperCase()}</span>
                <span>{code.split('\n').length} lines</span>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={10}
                className="w-full p-4 bg-transparent font-mono text-xs sm:text-sm text-emerald-400 focus:outline-hidden resize-none leading-relaxed"
                placeholder="Paste code snippet here..."
                spellCheck="false"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs flex items-center gap-2"
          >
            <CodeIcon className="w-4 h-4" />
            Share Snippet
          </button>
        </div>
      </div>
    </div>
  );
}

