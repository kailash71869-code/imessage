import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Determine the general category of a file based on its extension or mime/type
 */
function getFileType(item) {
  if (!item) return 'image';
  if (item.type) {
    if (item.type.startsWith('video') || item.type === 'video') return 'video';
    if (item.type.startsWith('image') || item.type === 'image') return 'image';
    if (item.type.startsWith('doc') || item.type === 'document' || item.type === 'file') return 'document';
  }

  const url = item.url || item.mediaUrl || '';
  const cleanUrl = url.split('?')[0].toLowerCase();

  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(cleanUrl)) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(cleanUrl)) return 'image';
  return 'document';
}

/**
 * Get distinct styling and badge for document extensions
 */
function getDocMetadata(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase() || 'doc';
  switch (ext) {
    case 'pdf':
      return { badge: 'PDF', bg: 'bg-red-500/10 text-red-500 border-red-500/30', color: '#ef4444' };
    case 'doc':
    case 'docx':
      return { badge: 'DOC', bg: 'bg-blue-500/10 text-blue-500 border-blue-500/30', color: '#3b82f6' };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return { badge: 'SHEET', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', color: '#10b981' };
    case 'ppt':
    case 'pptx':
      return { badge: 'SLIDES', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/30', color: '#f59e0b' };
    case 'zip':
    case 'tar':
    case 'gz':
    case 'rar':
      return { badge: 'ARCHIVE', bg: 'bg-purple-500/10 text-purple-500 border-purple-500/30', color: '#8b5cf6' };
    default:
      return { badge: ext.toUpperCase().slice(0, 4), bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30', color: '#71717a' };
  }
}

export default function MediaViewer({
  isOpen,
  onClose,
  mediaList = [],
  initialIndex = 0,
  onShare,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Video player custom controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);

  // Keep currentIndex updated if initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Reset zoom & pan when switching media
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsPlaying(false);
  }, [currentIndex]);

  const activeItem = mediaList[currentIndex] || mediaList[0];
  const fileType = activeItem ? getFileType(activeItem) : 'image';

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (mediaList.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
  }, [mediaList.length]);

  const handleNext = useCallback(() => {
    if (mediaList.length <= 1) return;
    setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
  }, [mediaList.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(4, z + 0.25));
      } else if (e.key === '-') {
        setZoom((z) => Math.max(0.5, z - 0.25));
      } else if (e.key === '0') {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Mouse pan event handlers
  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Download media
  const handleDownload = () => {
    if (!activeItem) return;
    const url = activeItem.url || activeItem.mediaUrl;
    const filename = activeItem.name || activeItem.title || `download-${Date.now()}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share media
  const handleShare = () => {
    if (!activeItem) return;
    const url = activeItem.url || activeItem.mediaUrl;

    if (onShare) {
      onShare(activeItem);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  // Video event handlers
  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen || !activeItem) return null;

  const activeUrl = activeItem.url || activeItem.mediaUrl;
  const fileName = activeItem.name || activeItem.title || 'Attached Media';
  const docMeta = getDocMetadata(fileName);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fadeIn"
      onMouseUp={handleMouseUp}
    >
      {/* Top Controls Header */}
      <header className="px-4 py-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white z-20">
        <div className="flex items-center gap-3 min-w-0">
          {/* File details */}
          <div className="min-w-0">
            <h2 className="font-semibold text-sm sm:text-base text-zinc-100 truncate max-w-xs sm:max-w-md">
              {fileName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              {activeItem.senderName && <span>By {activeItem.senderName}</span>}
              {activeItem.timestamp && <span>• {activeItem.timestamp}</span>}
              {mediaList.length > 1 && (
                <span className="px-2 py-0.5 bg-zinc-800 rounded-full font-mono text-[10px]">
                  {currentIndex + 1} / {mediaList.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 hover:bg-white/10 rounded-xl transition text-zinc-300 hover:text-white"
            title="Download Media"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 hover:bg-white/10 rounded-xl transition text-zinc-300 hover:text-white relative"
            title="Share Media"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {copyFeedback && (
              <span className="absolute -bottom-7 right-0 px-2 py-0.5 bg-[#25D366] text-white text-[10px] font-semibold rounded-md shadow-md animate-fadeIn">
                Copied!
              </span>
            )}
          </button>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-red-500/20 rounded-xl transition text-zinc-400 hover:text-red-400"
            title="Close (Esc)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden p-4"
        onMouseMove={handleMouseMove}
      >
        {/* Previous Button */}
        {mediaList.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition z-30 shadow-lg border border-white/10"
            title="Previous (Left Arrow)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Next Button */}
        {mediaList.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition z-30 shadow-lg border border-white/10"
            title="Next (Right Arrow)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* 1. IMAGE VIEWER WITH ZOOM & PAN */}
        {fileType === 'image' && (
          <div
            className={`max-w-full max-h-full flex items-center justify-center transition-transform ${
              zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
            onMouseDown={handleMouseDown}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <img
              src={activeUrl}
              alt={fileName}
              draggable={false}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            />
          </div>
        )}

        {/* 2. VIDEO PLAYER WITH CONTROLS */}
        {fileType === 'video' && (
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <video
              ref={videoRef}
              src={activeUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="max-h-[70vh] w-full rounded-2xl shadow-2xl bg-black"
              onClick={handleTogglePlay}
            />

            {/* Custom Video Controls Bar */}
            <div className="w-full mt-3 px-4 py-2 bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-zinc-800 flex items-center gap-3 text-white text-xs">
              {/* Play / Pause */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="p-2 hover:bg-white/10 rounded-xl transition"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>

              {/* Time Scrubber */}
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 accent-[#25D366] h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
              />

              {/* Timestamp */}
              <span className="font-mono text-zinc-400 text-[11px] shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Mute Button */}
              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
              >
                {isMuted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 3. DOCUMENT PREVIEW (PDF, DOCX, XLSX, ZIP) */}
        {fileType === 'document' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-scaleUp">
            {/* File Icon */}
            <div className={`w-24 h-24 mx-auto rounded-3xl border flex flex-col items-center justify-center ${docMeta.bg}`}>
              <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-bold tracking-wider">{docMeta.badge}</span>
            </div>

            <div>
              <h3 className="font-bold text-lg text-white break-words">
                {fileName}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {activeItem.size || 'Document attachment'} • Encrypted AES-GCM
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#128C7E] hover:bg-[#075E54] text-white rounded-xl text-xs font-semibold shadow-md transition transform hover:scale-102"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download File</span>
              </button>

              <a
                href={activeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition"
              >
                Open in Tab ↗
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer & Image Zoom Controls */}
      <footer className="px-4 py-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-white z-20">
        {/* Zoom Controls (only for images) */}
        {fileType === 'image' ? (
          <div className="flex items-center gap-1.5 bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-zinc-800">
            {/* Zoom Out */}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-1 hover:bg-white/10 rounded-lg text-zinc-300 hover:text-white"
              title="Zoom Out (-)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>

            <span className="font-mono text-xs px-2 text-zinc-300">
              {Math.round(zoom * 100)}%
            </span>

            {/* Zoom In */}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
              className="p-1 hover:bg-white/10 rounded-lg text-zinc-300 hover:text-white"
              title="Zoom In (+)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="text-[10px] uppercase font-semibold px-2 py-0.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white ml-1"
              title="Reset Zoom (0)"
            >
              Reset
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* Thumbnail Preview Strip */}
        {mediaList.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-sm sm:max-w-md py-1">
            {mediaList.map((item, idx) => {
              const itemType = getFileType(item);
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                    isSelected ? 'border-[#25D366] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {itemType === 'image' ? (
                    <img
                      src={item.url || item.mediaUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : itemType === 'video' ? (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-bold">
                      ▶
                    </div>
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[9px] text-zinc-300 font-bold">
                      DOC
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </footer>
    </div>
  );
}
