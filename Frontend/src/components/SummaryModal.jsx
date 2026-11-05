import React from 'react';
import { SparklesIcon, BotIcon } from './Icons';

export default function SummaryModal({ isOpen, onClose, summaryData, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl shadow-xs">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-900 dark:text-white text-base">Catch Me Up (AI Copilot)</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full">
                  {summaryData?.poweredBy || 'AI Engine'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Intelligent thread synopsis & key takeaways</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 animate-pulse">
                Analyzing thread context and formulating synopsis...
              </p>
            </div>
          ) : (
            <>
              {/* Executive TL;DR */}
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
                <h4 className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BotIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Executive TL;DR
                </h4>
                <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                  {summaryData?.summary || "No conversation activity recorded yet."}
                </p>
              </div>

              {/* Highlights */}
              {summaryData?.highlights?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Key Discussion Highlights
                  </h4>
                  <ul className="space-y-2">
                    {summaryData.highlights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {summaryData?.actionItems?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Action Items & Next Steps
                  </h4>
                  <div className="space-y-2">
                    {summaryData.actionItems.map((action, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs sm:text-sm text-zinc-800 dark:text-zinc-200"
                      >
                        <input type="checkbox" defaultChecked={false} className="rounded text-indigo-600 focus:ring-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
          <span className="text-xs text-zinc-400">
            {summaryData?.messageCount ? `Summarized ${summaryData.messageCount} messages` : ''}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

