import React, { useState, useEffect, useRef } from 'react';

const INITIAL_POLLS = [
  {
    id: 'poll-1',
    question: 'Which elliptic curve provides 128-bit security for Web Crypto ECDH key derivation?',
    options: [
      { id: 'opt-1', text: 'P-256 (secp256r1)', votes: 8, isCorrect: true },
      { id: 'opt-2', text: 'secp256k1 (Bitcoin)', votes: 2, isCorrect: false },
      { id: 'opt-3', text: 'Curve25519 (X25519)', votes: 4, isCorrect: false },
      { id: 'opt-4', text: 'BrainpoolP256r1', votes: 1, isCorrect: false },
    ],
    totalVotes: 15,
    userVotedOptionId: 'opt-1',
    isQuiz: true,
    author: 'Sarah Chen (Security Lead)',
    expiresIn: 'Active',
  },
  {
    id: 'poll-2',
    question: 'Preferred scheduled time for our Horizontally Scaled Redis load test?',
    options: [
      { id: 'opt-21', text: 'Thursday 3:00 PM EST', votes: 6 },
      { id: 'opt-22', text: 'Friday 10:00 AM EST', votes: 9 },
      { id: 'opt-23', text: 'Saturday Async Runs', votes: 1 },
    ],
    totalVotes: 16,
    userVotedOptionId: null,
    isQuiz: false,
    author: 'Alex Vance',
    expiresIn: 'Ends in 4 hours',
  },
];

const INITIAL_RESOURCES = [
  {
    id: 'res-1',
    title: 'Web Crypto ECDH & AES-GCM 256 Architecture Spec.pdf',
    subject: 'Cybersecurity',
    author: 'Sarah Chen',
    size: '2.4 MB',
    type: 'pdf',
    date: 'Today, 10:15 AM',
    url: '#',
  },
  {
    id: 'res-2',
    title: 'Redis Pub/Sub Socket.io Multi-Container Scaling Notes.md',
    subject: 'Distributed Systems',
    author: 'Alex Vance',
    size: '480 KB',
    type: 'doc',
    date: 'Yesterday',
    url: '#',
  },
  {
    id: 'res-3',
    title: 'DeepSeek LLM Integration Cheatsheet.json',
    subject: 'Machine Learning',
    author: 'Priya Patel',
    size: '120 KB',
    type: 'code',
    date: 'Oct 28',
    url: '#',
  },
];

const INITIAL_NOTES = [
  {
    id: 'note-1',
    title: 'Key Derivation Protocol',
    content: 'Client generates ECDH keypair -> exports JWK public key -> derives AES-GCM shared key using peer public JWK. Zero plain text payload transmitted.',
    tag: 'E2EE',
    timestamp: 'Today, 11:45 AM',
  },
  {
    id: 'note-2',
    title: 'Offline-First Outbox Pattern',
    content: 'Network offline: message pushed to IndexedDB outbox store -> Online event triggers auto-flush queue -> WebSockets emit + REST persist.',
    tag: 'Storage',
    timestamp: 'Yesterday',
  },
];

export default function StudyRoom({
  currentUser = null,
  onClose = () => {},
}) {
  const [activeTab, setActiveTab] = useState('pomodoro'); // 'pomodoro' | 'polls' | 'resources' | 'notes' | 'whiteboard'
  
  // Pomodoro State
  const [timerMode, setTimerMode] = useState('focus'); // 'focus' (25m) | 'short' (5m) | 'long' (15m)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(2);

  // Polls State
  const [polls, setPolls] = useState(INITIAL_POLLS);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);

  // Resources State
  const [resources, setResources] = useState(INITIAL_RESOURCES);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceSubject, setResourceSubject] = useState('Computer Science');
  const [resourceType, setResourceType] = useState('pdf');

  // Study Notes State
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('Concept');
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // Room Creation Modal
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomSubject, setRoomSubject] = useState('Distributed Systems & Cryptography');
  const [roomDesc, setRoomDesc] = useState('Weekly review of Web Crypto ECDH and horizontal container messaging');
  const [maxParticipants, setMaxParticipants] = useState(12);

  // Whiteboard Canvas Ref
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#25D366');
  const [brushSize, setBrushSize] = useState(3);

  // 1. Pomodoro Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (timerMode === 'focus') {
        setCompletedSessions((s) => s + 1);
        setTimerMode('short');
        setTimeLeft(5 * 60);
      } else {
        setTimerMode('focus');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, timerMode]);

  const handleSwitchPomodoroMode = (mode) => {
    setTimerMode(mode);
    setIsTimerRunning(false);
    if (mode === 'focus') setTimeLeft(25 * 60);
    if (mode === 'short') setTimeLeft(5 * 60);
    if (mode === 'long') setTimeLeft(15 * 60);
  };

  const formatTimerDisplay = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 2. Poll Voting Action
  const handleVote = (pollId, optionId) => {
    setPolls((prevPolls) =>
      prevPolls.map((poll) => {
        if (poll.id !== pollId) return poll;
        const alreadyVoted = poll.userVotedOptionId === optionId;
        const updatedOptions = poll.options.map((opt) => {
          if (opt.id === optionId) {
            return { ...opt, votes: alreadyVoted ? Math.max(0, opt.votes - 1) : opt.votes + 1 };
          }
          if (opt.id === poll.userVotedOptionId) {
            return { ...opt, votes: Math.max(0, opt.votes - 1) };
          }
          return opt;
        });

        const newTotal = updatedOptions.reduce((acc, curr) => acc + curr.votes, 0);

        return {
          ...poll,
          options: updatedOptions,
          totalVotes: newTotal,
          userVotedOptionId: alreadyVoted ? null : optionId,
        };
      })
    );
  };

  // 3. Create Poll Action
  const handleCreatePollSubmit = (e) => {
    e.preventDefault();
    if (!newPollQuestion.trim()) return;
    const validOptions = newPollOptions.filter((opt) => opt.trim());
    if (validOptions.length < 2) return;

    const newPoll = {
      id: `poll-${Date.now()}`,
      question: newPollQuestion.trim(),
      options: validOptions.map((text, idx) => ({
        id: `opt-${Date.now()}-${idx}`,
        text: text.trim(),
        votes: 0,
        isCorrect: isQuizMode ? idx === correctOptionIdx : undefined,
      })),
      totalVotes: 0,
      userVotedOptionId: null,
      isQuiz: isQuizMode,
      author: currentUser?.fullName || 'You',
      expiresIn: 'Active',
    };

    setPolls([newPoll, ...polls]);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
    setIsCreatingPoll(false);
  };

  // 4. Whiteboard Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ECE5DD] dark:bg-[#0B141A] overflow-y-auto">
      {/* WhatsApp / Education Room Header */}
      <header className="px-5 py-3.5 bg-[#075E54] dark:bg-[#1F2C34] text-white flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="md:hidden text-white/80 hover:text-white p-1 rounded-full"
            aria-label="Back"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎓</span>
              <h1 className="font-bold text-base leading-tight">{roomSubject}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25D366] text-zinc-950">
                LIVE
              </span>
            </div>
            <p className="text-xs text-white/80 flex items-center gap-2 mt-0.5">
              <span>👥 4 of {maxParticipants} active</span>
              <span>•</span>
              <span>🔒 E2EE Classroom</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreatingRoom(true)}
            className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold transition"
          >
            Room Settings
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-black/10 transition"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white dark:bg-[#1F2C34] border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 sticky top-[61px] z-10 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-4xl mx-auto scrollbar-none">
          {[
            { id: 'pomodoro', label: 'Pomodoro Timer', icon: '⏱️' },
            { id: 'polls', label: 'Polls & Quizzes', icon: '📊' },
            { id: 'resources', label: 'Shared Resources', icon: '📁' },
            { id: 'notes', label: 'Study Notes', icon: '📝' },
            { id: 'whiteboard', label: 'Whiteboard', icon: '🎨' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#25D366] text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* TAB 1: POMODORO TIMER */}
        {activeTab === 'pomodoro' && (
          <div className="bg-white dark:bg-[#1F2C34] rounded-3xl p-6 shadow-sm border border-zinc-200/80 dark:border-zinc-800 text-center max-w-md mx-auto space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Pomodoro Study Focus</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Synchronized study session with group participants
              </p>
            </div>

            {/* Mode Switchers */}
            <div className="flex justify-center gap-2">
              {[
                { id: 'focus', label: 'Focus (25m)' },
                { id: 'short', label: 'Short Break (5m)' },
                { id: 'long', label: 'Long Break (15m)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSwitchPomodoroMode(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    timerMode === m.id
                      ? 'bg-[#075E54] dark:bg-[#25D366] text-white dark:text-zinc-950 shadow-xs'
                      : 'bg-zinc-100 dark:bg-[#2A3942] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Big Countdown Display */}
            <div className="relative w-56 h-56 mx-auto flex flex-col items-center justify-center rounded-full border-4 border-[#25D366] bg-zinc-50 dark:bg-[#202C33] shadow-inner">
              <span className="text-5xl font-mono font-bold text-zinc-900 dark:text-white tracking-tight">
                {formatTimerDisplay(timeLeft)}
              </span>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#075E54] dark:text-[#25D366] mt-2">
                {timerMode === 'focus' ? '🎯 Stay Focused' : '☕ Relax & Recharge'}
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-8 py-2.5 rounded-2xl font-bold text-sm shadow-md transition transform active:scale-95 ${
                  isTimerRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-[#25D366] hover:bg-[#20ba59] text-white'
                }`}
              >
                {isTimerRunning ? 'Pause Session' : 'Start Focus'}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPomodoroMode(timerMode)}
                className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-[#2A3942] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                title="Reset Timer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            </div>

            {/* Completed Pomodoro Counter */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span>Completed today:</span>
              {Array.from({ length: completedSessions }).map((_, i) => (
                <span key={i} className="text-base" title="Completed session">🍅</span>
              ))}
              <span className="font-bold text-zinc-800 dark:text-zinc-200">({completedSessions})</span>
            </div>
          </div>
        )}

        {/* TAB 2: POLLS & QUIZZES */}
        {activeTab === 'polls' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Classroom Polls & Quizzes</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Vote on topics and test conceptual understanding
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingPoll(true)}
                className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <span>+</span> Create New Poll
              </button>
            </div>

            {/* Poll Cards List */}
            <div className="grid gap-4">
              {polls.map((poll) => (
                <div
                  key={poll.id}
                  className="bg-white dark:bg-[#1F2C34] rounded-2xl p-5 shadow-2xs border border-zinc-200/80 dark:border-zinc-800 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            poll.isQuiz
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {poll.isQuiz ? '💡 Knowledge Quiz' : '📊 Team Poll'}
                        </span>
                        <span className="text-[11px] text-zinc-400">• {poll.expiresIn}</span>
                      </div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                        {poll.question}
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        By {poll.author} • {poll.totalVotes} total responses
                      </p>
                    </div>
                  </div>

                  {/* Poll Options with Live Bar Charts */}
                  <div className="space-y-2.5">
                    {poll.options.map((option) => {
                      const percentage =
                        poll.totalVotes > 0
                          ? Math.round((option.votes / poll.totalVotes) * 100)
                          : 0;
                      const isSelected = poll.userVotedOptionId === option.id;

                      return (
                        <div
                          key={option.id}
                          onClick={() => handleVote(poll.id, option.id)}
                          className={`relative overflow-hidden p-3 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? 'border-[#25D366] bg-[#25D366]/5 dark:bg-[#25D366]/10'
                              : 'border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-[#2A3942]/40'
                          }`}
                        >
                          {/* Animated Percentage Fill Bar */}
                          <div
                            className="absolute inset-y-0 left-0 bg-[#25D366]/20 dark:bg-[#25D366]/25 transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />

                          <div className="relative z-10 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                  isSelected
                                    ? 'border-[#25D366] bg-[#25D366] text-white font-bold'
                                    : 'border-zinc-400 dark:border-zinc-500'
                                }`}
                              >
                                {isSelected ? '✓' : ''}
                              </span>
                              <span
                                className={`font-medium ${
                                  isSelected
                                    ? 'text-[#075E54] dark:text-[#25D366] font-bold'
                                    : 'text-zinc-800 dark:text-zinc-200'
                                }`}
                              >
                                {option.text}
                              </span>
                            </div>

                            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                              {percentage}% ({option.votes})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SHARED RESOURCES */}
        {activeTab === 'resources' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Shared Study Resources</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Course slides, documentation, and architecture notes
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingResource(true)}
                className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <span>+</span> Upload Material
              </button>
            </div>

            {/* Resources List */}
            <div className="bg-white dark:bg-[#1F2C34] rounded-2xl shadow-2xs border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
              {resources.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-[#2A3942]/40 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#075E54]/10 dark:bg-[#128C7E]/20 text-[#075E54] dark:text-[#25D366] flex items-center justify-center font-bold text-base shrink-0">
                      {item.type === 'pdf' ? '📄' : item.type === 'code' ? '💻' : '📝'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {item.subject} • Uploaded by {item.author} • {item.size} • {item.date}
                      </p>
                    </div>
                  </div>

                  <a
                    href={item.url}
                    download
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#2A3942] hover:bg-[#25D366] hover:text-white text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition shrink-0 flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: STUDY NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Saved Study Notes</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Bookmarked messages and exam summary cards
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingNote(true)}
                className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <span>+</span> Add Note
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white dark:bg-[#1F2C34] rounded-2xl p-4 shadow-2xs border border-zinc-200/80 dark:border-zinc-800 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#25D366]/20 text-[#075E54] dark:text-[#25D366]">
                        {note.tag}
                      </span>
                      <span className="text-[10px] text-zinc-400">{note.timestamp}</span>
                    </div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{note.title}</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mt-1">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(`${note.title}\n\n${note.content}`)}
                      className="text-xs text-zinc-500 hover:text-[#075E54] dark:hover:text-[#25D366] font-medium"
                    >
                      Copy Note
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: COLLABORATIVE WHITEBOARD */}
        {activeTab === 'whiteboard' && (
          <div className="bg-white dark:bg-[#1F2C34] rounded-2xl p-4 shadow-2xs border border-zinc-200/80 dark:border-zinc-800 space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Collaborative Whiteboard</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Sketch architectures and formulas together</p>
              </div>

              {/* Whiteboard Controls */}
              <div className="flex items-center gap-2">
                {/* Palette */}
                {['#25D366', '#007AFF', '#FF3B30', '#FF9500', '#000000', '#FFFFFF'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBrushColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      brushColor === color ? 'border-zinc-900 dark:border-white scale-110 shadow-xs' : 'border-zinc-300'
                    }`}
                  />
                ))}

                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-3 py-1 bg-zinc-100 dark:bg-[#2A3942] hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Drawing Canvas */}
            <div className="w-full h-96 rounded-xl bg-zinc-50 dark:bg-[#0B141A] border border-dashed border-zinc-300 dark:border-zinc-700 overflow-hidden relative cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="w-full h-full block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>
        )}
      </main>

      {/* CREATE POLL MODAL */}
      {isCreatingPoll && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <form
            onSubmit={handleCreatePollSubmit}
            className="bg-white dark:bg-[#1F2C34] rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-fadeIn"
          >
            <div className="px-5 py-4 bg-[#075E54] dark:bg-[#128C7E] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">New Classroom Poll</h3>
              <button type="button" onClick={() => setIsCreatingPoll(false)}>✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Question <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  placeholder="e.g. Which hash algorithm is used in ECDH?"
                  className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-[#2A3942] rounded-xl text-zinc-900 dark:text-white border focus:outline-hidden focus:border-[#25D366]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                  Options
                </label>
                <div className="space-y-2">
                  {newPollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newPollOptions];
                          updated[idx] = e.target.value;
                          setNewPollOptions(updated);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 px-3 py-1.5 text-xs bg-zinc-100 dark:bg-[#2A3942] rounded-xl text-zinc-900 dark:text-white border focus:outline-hidden"
                      />
                      {newPollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setNewPollOptions(newPollOptions.filter((_, i) => i !== idx))}
                          className="text-red-500 font-bold px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {newPollOptions.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setNewPollOptions([...newPollOptions, ''])}
                    className="mt-2 text-xs font-semibold text-[#075E54] dark:text-[#25D366]"
                  >
                    + Add Option
                  </button>
                )}
              </div>

              {/* Quiz Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Mark as Quiz with correct answer
                </span>
                <input
                  type="checkbox"
                  checked={isQuizMode}
                  onChange={(e) => setIsQuizMode(e.target.checked)}
                  className="w-4 h-4 accent-[#25D366]"
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-[#1F2C34] border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingPoll(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#20ba59]"
              >
                Launch Poll
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD RESOURCE MODAL */}
      {isAddingResource && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!resourceTitle.trim()) return;
              setResources([
                {
                  id: `res-${Date.now()}`,
                  title: resourceTitle.trim(),
                  subject: resourceSubject,
                  author: currentUser?.fullName || 'You',
                  size: '1.5 MB',
                  type: resourceType,
                  date: 'Just now',
                  url: '#',
                },
                ...resources,
              ]);
              setResourceTitle('');
              setIsAddingResource(false);
            }}
            className="bg-white dark:bg-[#1F2C34] rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-fadeIn"
          >
            <div className="px-5 py-4 bg-[#075E54] dark:bg-[#128C7E] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Share Study Material</h3>
              <button type="button" onClick={() => setIsAddingResource(false)}>✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Raft Notes"
                  className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-[#2A3942] rounded-xl text-zinc-900 dark:text-white border focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Subject Category
                </label>
                <select
                  value={resourceSubject}
                  onChange={(e) => setResourceSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-[#2A3942] rounded-xl text-zinc-900 dark:text-white border focus:outline-hidden"
                >
                  <option>Cybersecurity & E2EE</option>
                  <option>Distributed Systems</option>
                  <option>Machine Learning</option>
                  <option>Algorithms & Data Structures</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Resource Type
                </label>
                <div className="flex gap-2">
                  {['pdf', 'code', 'doc'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setResourceType(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase ${
                        resourceType === t
                          ? 'bg-[#25D366] text-white'
                          : 'bg-zinc-100 dark:bg-[#2A3942] text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-[#1F2C34] border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingResource(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#20ba59]"
              >
                Share Resource
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE NOTE MODAL */}
      {isCreatingNote && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
              setNotes([
                {
                  id: `note-${Date.now()}`,
                  title: newNoteTitle.trim(),
                  content: newNoteContent.trim(),
                  tag: newNoteTag,
                  timestamp: 'Just now',
                },
                ...notes,
              ]);
              setNewNoteTitle('');
              setNewNoteContent('');
              setIsCreatingNote(false);
            }}
            className="bg-white dark:bg-[#1F2C34] rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-fadeIn"
          >
            <div className="px-5 py-4 bg-[#075E54] dark:bg-[#128C7E] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Bookmark Study Note</h3>
              <button type="button" onClick={() => setIsCreatingNote(false)}>✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="e.g. Redis Cluster Fault Tolerance"
                  className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-[#2A3942] rounded-xl text-zinc-900 dark:text-white border focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Tag / Category
                </label>
                <input
                  type="text"
                  value={newNoteTag}
                  onChange={(e) => setNewNoteTag(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-100 dark:bg-[#2A3942] rounded-xl text-zinc-900 dark:text-white border focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Note Content
                </label>
                <textarea
                  rows={4}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Paste or write the critical concept or code snippet..."
                  className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-[#2A3942] rounded-xl text-zinc-900 dark:text-white border focus:outline-hidden resize-none"
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-[#1F2C34] border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingNote(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#20ba59]"
              >
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ROOM CONFIG MODAL */}
      {isCreatingRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1F2C34] rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 bg-[#075E54] dark:bg-[#128C7E] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Study Room Configuration</h3>
              <button type="button" onClick={() => setIsCreatingRoom(false)}>✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Subject Topic
                </label>
                <input
                  type="text"
                  value={roomSubject}
                  onChange={(e) => setRoomSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-[#2A3942] rounded-xl text-zinc-900 dark:text-white border focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Description & Goals
                </label>
                <textarea
                  rows={3}
                  value={roomDesc}
                  onChange={(e) => setRoomDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-[#2A3942] rounded-xl text-zinc-900 dark:text-white border focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Max Participants
                  </label>
                  <span className="font-mono text-xs font-bold text-[#075E54] dark:text-[#25D366]">
                    {maxParticipants}
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full accent-[#25D366]"
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-[#1F2C34] border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingRoom(false)}
                className="px-5 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#20ba59]"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
