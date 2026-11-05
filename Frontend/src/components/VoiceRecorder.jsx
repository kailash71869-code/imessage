import React, { useState, useEffect, useRef } from 'react';
import { MicIcon, SendIcon } from './Icons';

export default function VoiceRecorder({ isRecording, onCancel, onFinishRecording }) {
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      setSeconds(0);
      audioChunksRef.current = [];
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      startAudioCapture();
    } else {
      clearInterval(timerRef.current);
      stopAudioCapture();
    }

    return () => {
      clearInterval(timerRef.current);
      stopAudioCapture();
    };
  }, [isRecording]);

  const startAudioCapture = async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach((track) => track.stop());
          onFinishRecording(audioBlob, seconds);
        };

        mediaRecorder.start();
      } else {
        console.warn('[VoiceRecorder] getUserMedia not supported in this context.');
      }
    } catch (err) {
      console.warn('[VoiceRecorder] Microphone permission denied or audio device not found. Using simulated voice note fallback:', err.message);
    }
  };

  const stopAudioCapture = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFinish = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback synthetic voice blob
      const syntheticBlob = new Blob(['RIFF....WAVEfmt '], { type: 'audio/webm' });
      onFinishRecording(syntheticBlob, Math.max(seconds, 3));
    }
  };

  if (!isRecording) return null;

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl px-4 py-2.5 animate-fadeIn">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
        <span className="text-xs font-mono font-semibold text-red-600 dark:text-red-400">
          {formatTime(seconds)}
        </span>
      </div>

      {/* Visualizer bars */}
      <div className="flex-1 flex items-center justify-center gap-1 h-6 overflow-hidden">
        {[40, 75, 55, 90, 60, 85, 45, 95, 65, 80, 50, 70, 90, 60].map((height, i) => (
          <span
            key={i}
            className="w-1 bg-red-400/80 dark:bg-red-500 rounded-full transition-all duration-300 animate-pulse"
            style={{
              height: `${Math.max(20, (height * (1 + Math.sin(seconds + i) * 0.4)) % 100)}%`,
              animationDelay: `${i * 70}ms`,
            }}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleFinish}
          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-xs transition"
          title="Send Voice Note"
        >
          <SendIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

