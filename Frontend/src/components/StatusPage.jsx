import React, { useState, useEffect, useRef } from 'react';

const STATUS_BACKGROUNDS = [
  'bg-gradient-to-br from-[#075E54] to-[#128C7E]',
  'bg-gradient-to-br from-purple-700 to-indigo-800',
  'bg-gradient-to-br from-pink-600 to-rose-700',
  'bg-gradient-to-br from-amber-600 to-orange-700',
  'bg-gradient-to-br from-emerald-600 to-teal-800',
  'bg-gradient-to-br from-blue-700 to-cyan-800',
];

const INITIAL_CONTACT_STATUSES = [
  {
    id: 'status-sarah',
    userId: 'user_sarah',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    timeAgo: '25 minutes ago',
    hasUnviewed: true,
    stories: [
      {
        id: 's-s-1',
        type: 'text',
        content: 'Web Crypto ECDH + AES-GCM 256 keys fully operational in browser sandbox! 🔐🚀',
        bg: 'bg-gradient-to-br from-[#075E54] to-[#128C7E]',
        timestamp: '11:20 AM',
      },
      {
        id: 's-s-2',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&fit=crop',
        caption: 'Zero-knowledge message ciphertext inspection complete.',
        timestamp: '11:35 AM',
      },
    ],
  },
  {
    id: 'status-alex',
    userId: 'user_alex',
    name: 'Alex Vance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    timeAgo: '42 minutes ago',
    hasUnviewed: true,
    stories: [
      {
        id: 's-a-1',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&fit=crop',
        caption: 'Multi-instance Redis Pub/Sub cluster benchmarks looking rock solid! ⚡',
        timestamp: '10:50 AM',
      },
    ],
  },
  {
    id: 'status-priya',
    userId: 'user_priya',
    name: 'Priya Patel',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
    timeAgo: '2 hours ago',
    hasUnviewed: false,
    stories: [
      {
        id: 's-p-1',
        type: 'text',
        content: 'DeepSeek LLM copilot summarizing 500-message threads under 800ms! 🤖✨',
        bg: 'bg-gradient-to-br from-purple-700 to-indigo-800',
        timestamp: '09:15 AM',
      },
    ],
  },
];

export default function StatusPage({
  currentUser = null,
  onClose = () => {},
}) {
  const [contactStatuses, setContactStatuses] = useState(INITIAL_CONTACT_STATUSES);
  const [myStories, setMyStories] = useState([
    {
      id: 'my-1',
      type: 'text',
      content: 'Building the next-gen WhatsApp & Slack hybrid app! 💚📱',
      bg: 'bg-gradient-to-br from-[#075E54] to-[#128C7E]',
      timestamp: 'Today, 8:40 AM',
    },
  ]);

  // Viewer state
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Creation modal state
  const [isCreatingText, setIsCreatingText] = useState(false);
  const [isCreatingImage, setIsCreatingImage] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [selectedBg, setSelectedBg] = useState(STATUS_BACKGROUNDS[0]);
  const [imageCaption, setImageCaption] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);
  const progressTimerRef = useRef(null);

  // Auto-advance progress timer for 5 seconds per status
  useEffect(() => {
    if (!activeStoryGroup || isPaused) {
      clearInterval(progressTimerRef.current);
      return;
    }

    const currentStories = activeStoryGroup.stories || [];
    const intervalTime = 50; // update every 50ms
    const step = (100 / (5000 / intervalTime)); // reach 100% in 5000ms

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next story or close viewer
          if (activeStoryIndex < currentStories.length - 1) {
            setActiveStoryIndex((i) => i + 1);
            return 0;
          } else {
            // Finished all stories in group
            // Mark as viewed
            setContactStatuses((prevList) =>
              prevList.map((cs) =>
                cs.id === activeStoryGroup.id ? { ...cs, hasUnviewed: false } : cs
              )
            );
            setActiveStoryGroup(null);
            return 0;
          }
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(progressTimerRef.current);
  }, [activeStoryGroup, activeStoryIndex, isPaused]);

  const handleOpenViewer = (group, startIndex = 0) => {
    setActiveStoryGroup(group);
    setActiveStoryIndex(startIndex);
    setProgress(0);
    setIsPaused(false);
  };

  const handlePrevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((i) => i - 1);
      setProgress(0);
    }
  };

  const handleNextStory = () => {
    const currentStories = activeStoryGroup?.stories || [];
    if (activeStoryIndex < currentStories.length - 1) {
      setActiveStoryIndex((i) => i + 1);
      setProgress(0);
    } else {
      setActiveStoryGroup(null);
    }
  };

  const handleCreateTextStatus = () => {
    if (!textContent.trim()) return;
    const newStory = {
      id: `my-${Date.now()}`,
      type: 'text',
      content: textContent.trim(),
      bg: selectedBg,
      timestamp: 'Just now',
    };
    setMyStories((prev) => [newStory, ...prev]);
    setTextContent('');
    setIsCreatingText(false);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setIsCreatingImage(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateImageStatus = () => {
    if (!imagePreview) return;
    const newStory = {
      id: `my-${Date.now()}`,
      type: 'image',
      mediaUrl: imagePreview,
      caption: imageCaption.trim(),
      timestamp: 'Just now',
    };
    setMyStories((prev) => [newStory, ...prev]);
    setImagePreview(null);
    setImageCaption('');
    setIsCreatingImage(false);
  };

  const recentUpdates = contactStatuses.filter((s) => s.hasUnviewed);
  const viewedUpdates = contactStatuses.filter((s) => !s.hasUnviewed);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ECE5DD] dark:bg-[#0B141A] overflow-y-auto">
      {/* WhatsApp Header Bar */}
      <header className="px-5 py-4 bg-[#075E54] dark:bg-[#1F2C34] text-white flex items-center justify-between shadow-xs sticky top-0 z-20">
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
            <h1 className="font-bold text-lg leading-tight">Status</h1>
            <p className="text-xs text-white/80">Disappears after 24 hours</p>
          </div>
        </div>

        {/* Quick Add Floating Actions */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input for Camera/Gallery */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setIsCreatingText(true)}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
            title="Create Text Status"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-md transition"
            title="Add Photo Status"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* "My Status" Section */}
        <div className="bg-white dark:bg-[#1F2C34] rounded-2xl p-4 shadow-2xs border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3.5 cursor-pointer flex-1"
              onClick={() => {
                if (myStories.length > 0) {
                  handleOpenViewer({
                    id: 'my-group',
                    name: 'My Status',
                    avatar: currentUser?.profilepic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
                    stories: myStories,
                  });
                } else {
                  setIsCreatingText(true);
                }
              }}
            >
              {/* Avatar with Status Ring */}
              <div className="relative">
                <div
                  className={`p-0.5 rounded-full ${
                    myStories.length > 0 ? 'ring-2 ring-[#25D366]' : ''
                  }`}
                >
                  <img
                    src={currentUser?.profilepic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt="My status"
                    className="w-13 h-13 rounded-full object-cover"
                  />
                </div>
                {/* Plus Badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreatingText(true);
                  }}
                  className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-sm shadow-xs border-2 border-white dark:border-[#1F2C34]"
                  title="Add Status"
                >
                  +
                </button>
              </div>

              <div>
                <h2 className="font-bold text-sm text-zinc-900 dark:text-white">My Status</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {myStories.length > 0
                    ? `${myStories.length} update${myStories.length > 1 ? 's' : ''} • Tap to view`
                    : 'Tap to add status update'}
                </p>
              </div>
            </div>

            {/* Quick Action Icons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsCreatingText(true)}
                className="p-2 rounded-full text-zinc-500 hover:text-[#075E54] dark:hover:text-[#25D366] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Create Text Story"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full text-zinc-500 hover:text-[#075E54] dark:hover:text-[#25D366] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Add Photo Story"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Updates (Green Ring for unviewed) */}
        {recentUpdates.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">
              Recent Updates
            </h3>
            <div className="bg-white dark:bg-[#1F2C34] rounded-2xl shadow-2xs divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
              {recentUpdates.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenViewer(item)}
                  className="flex items-center gap-3.5 p-3.5 hover:bg-zinc-50 dark:hover:bg-[#2A3942]/60 cursor-pointer transition"
                >
                  {/* WhatsApp Unviewed Green Ring */}
                  <div className="p-0.5 rounded-full ring-2 ring-[#25D366] ring-offset-1 dark:ring-offset-[#1F2C34]">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">
                      {item.name}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.timeAgo}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Viewed Updates (Grey Ring) */}
        {viewedUpdates.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">
              Viewed Updates
            </h3>
            <div className="bg-white dark:bg-[#1F2C34] rounded-2xl shadow-2xs divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
              {viewedUpdates.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenViewer(item)}
                  className="flex items-center gap-3.5 p-3.5 hover:bg-zinc-50 dark:hover:bg-[#2A3942]/60 cursor-pointer transition opacity-80 hover:opacity-100"
                >
                  {/* Viewed Grey Ring */}
                  <div className="p-0.5 rounded-full ring-2 ring-zinc-300 dark:ring-zinc-700">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">
                      {item.name}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.timeAgo}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* FULLSCREEN STATUS VIEWER */}
      {activeStoryGroup && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between animate-fadeIn select-none"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Top Progress Bars & Header */}
          <div className="p-4 z-20 space-y-3">
            {/* Segmented Progress Bar */}
            <div className="flex items-center gap-1.5 max-w-lg mx-auto">
              {activeStoryGroup.stories.map((st, i) => (
                <div key={st.id || i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear"
                    style={{
                      width:
                        i < activeStoryIndex
                          ? '100%'
                          : i === activeStoryIndex
                          ? `${progress}%`
                          : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header: User Info & Close */}
            <div className="flex items-center justify-between max-w-lg mx-auto text-white">
              <div className="flex items-center gap-3">
                <img
                  src={activeStoryGroup.avatar}
                  alt={activeStoryGroup.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/60"
                />
                <div>
                  <h3 className="font-bold text-sm leading-tight">{activeStoryGroup.name}</h3>
                  <p className="text-[11px] text-white/70">
                    {activeStoryGroup.stories[activeStoryIndex]?.timestamp || 'Today'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStoryGroup(null)}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
                aria-label="Close story"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Center Story Display with Left/Right Touch Tap Areas */}
          <div className="relative flex-1 flex items-center justify-center max-w-lg mx-auto w-full px-4 overflow-hidden">
            {/* Left Tap Zone */}
            <div
              className="absolute left-0 inset-y-0 w-1/3 cursor-pointer z-10"
              onClick={handlePrevStory}
            />

            {/* Right Tap Zone */}
            <div
              className="absolute right-0 inset-y-0 w-1/3 cursor-pointer z-10"
              onClick={handleNextStory}
            />

            {/* Story Content Render */}
            {(() => {
              const currentStory = activeStoryGroup.stories[activeStoryIndex];
              if (!currentStory) return null;

              if (currentStory.type === 'text') {
                return (
                  <div
                    className={`w-full h-[70vh] rounded-3xl ${
                      currentStory.bg || 'bg-gradient-to-br from-[#075E54] to-[#128C7E]'
                    } text-white p-8 flex items-center justify-center text-center shadow-2xl`}
                  >
                    <p className="text-xl sm:text-2xl font-bold leading-relaxed break-words">
                      {currentStory.content}
                    </p>
                  </div>
                );
              }

              return (
                <div className="relative w-full h-[70vh] rounded-3xl overflow-hidden flex flex-col justify-end shadow-2xl bg-zinc-900">
                  <img
                    src={currentStory.mediaUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {currentStory.caption && (
                    <div className="relative z-10 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-sm font-medium text-center">
                      {currentStory.caption}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Bottom Reply Bar */}
          <div className="p-4 z-20 max-w-lg mx-auto w-full">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 text-white">
              <input
                type="text"
                placeholder="Reply to status..."
                className="flex-1 bg-transparent text-sm placeholder-white/60 focus:outline-hidden"
              />
              <button
                type="button"
                className="text-white hover:text-[#25D366] transition"
                title="Send Reply"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEXT STATUS CREATION MODAL */}
      {isCreatingText && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md h-[500px] rounded-3xl ${selectedBg} text-white p-6 flex flex-col justify-between shadow-2xl relative animate-fadeIn`}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCreatingText(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>

              {/* Background Color Swatches */}
              <div className="flex items-center gap-2">
                {STATUS_BACKGROUNDS.map((bgClass, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedBg(bgClass)}
                    className={`w-6 h-6 rounded-full border-2 ${bgClass} ${
                      selectedBg === bgClass ? 'border-white scale-110' : 'border-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Centered Text Input */}
            <textarea
              rows={4}
              maxLength={200}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Type a status update..."
              className="w-full bg-transparent text-white text-2xl font-bold placeholder-white/50 text-center resize-none focus:outline-hidden border-none"
              autoFocus
            />

            {/* Bottom Controls */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/70">{textContent.length}/200</span>
              <button
                type="button"
                disabled={!textContent.trim()}
                onClick={handleCreateTextStatus}
                className="w-11 h-11 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-lg transition disabled:opacity-50"
              >
                <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO STATUS CREATION MODAL */}
      {isCreatingImage && imagePreview && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between h-[560px] animate-fadeIn">
            {/* Header */}
            <div className="p-4 flex items-center justify-between text-white z-10">
              <button
                type="button"
                onClick={() => setIsCreatingImage(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
              <span className="text-xs font-semibold">Photo Status</span>
              <div className="w-5" />
            </div>

            {/* Image Preview */}
            <div className="flex-1 overflow-hidden relative flex items-center justify-center">
              <img src={imagePreview} alt="" className="max-h-full max-w-full object-contain" />
            </div>

            {/* Caption & Submit */}
            <div className="p-4 bg-zinc-950/80 backdrop-blur-md flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a caption..."
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                className="flex-1 bg-zinc-800 text-white text-xs px-4 py-2.5 rounded-full focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCreateImageStatus}
                className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md hover:bg-[#20ba59]"
              >
                <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
