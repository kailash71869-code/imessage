import React, { useState, useEffect, useCallback } from 'react';
import { t } from '../lib/i18n';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:5000'
    : (typeof window !== 'undefined' ? window.location.origin : '')
);

const CATEGORIES = [
  { id: 'all', labelKey: 'all' },
  { id: 'world', labelKey: 'world' },
  { id: 'technology', labelKey: 'tech' },
  { id: 'science', labelKey: 'science' },
  { id: 'sports', labelKey: 'sports' },
  { id: 'business', labelKey: 'business' },
  { id: 'health', labelKey: 'health' },
  { id: 'education', labelKey: 'education' },
  { id: 'entertainment', labelKey: 'entertainment' },
];

export default function NewsFeed({
  onShareToChat,
  onClose,
  currentLanguage = 'en',
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sharedArticleId, setSharedArticleId] = useState(null);
  const [readingArticle, setReadingArticle] = useState(null);

  // Fetch news from API
  const fetchArticles = useCallback(async (cat = selectedCategory, query = searchQuery) => {
    setIsLoading(true);
    try {
      let endpoint = `${BACKEND_URL}/api/news`;
      const params = new URLSearchParams();

      if (cat && cat !== 'all') {
        params.append('category', cat);
      }
      if (query && query.trim()) {
        params.append('q', query.trim());
      }

      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch (err) {
      console.warn('[NewsFeed] Failed to fetch news:', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchArticles(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery, fetchArticles]);

  // Pull-to-refresh simulation
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      fetchArticles(selectedCategory, searchQuery);
    }, 600);
  };

  // Share to chat handler
  const handleShare = (article, e) => {
    e?.stopPropagation();
    if (onShareToChat) {
      onShareToChat({
        text: `📰 *${article.title}*\n\n${article.description}\n\nSource: ${article.source} • ${article.readTime}`,
        messageType: 'news',
        newsArticle: article,
      });
      setSharedArticleId(article.id);
      setTimeout(() => setSharedArticleId(null), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="px-4 py-3 bg-[#075E54] dark:bg-zinc-900 text-white flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-white/15 rounded-lg transition"
              title={t('close', currentLanguage)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
            {/* Newspaper Icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>

          <div>
            <h1 className="font-bold text-sm sm:text-base leading-tight tracking-tight">
              {t('newsFeed', currentLanguage)}
            </h1>
            <p className="text-[11px] text-emerald-100/80">
              Real-time Global Headlines • {articles.length} Stories
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#128C7E] hover:bg-[#25D366] text-white rounded-xl text-xs font-semibold shadow-xs transition ${
            isRefreshing ? 'animate-spin' : 'hover:scale-102 active:scale-98'
          }`}
          title={t('refresh', currentLanguage)}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">{t('refresh', currentLanguage)}</span>
        </button>
      </header>

      {/* Search and Category Filter Bar */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder={t('searchNews', currentLanguage)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#128C7E]"
          />
        </div>

        {/* Category Tabs Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition shadow-2xs ${
                  isSelected
                    ? 'bg-[#128C7E] text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {t(cat.labelKey, currentLanguage)}
              </button>
            );
          })}
        </div>
      </div>

      {/* News Feed Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          /* Skeleton Loading State */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="h-44 bg-zinc-200 dark:bg-zinc-800 w-full" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4" />
                  <div className="space-y-1.5">
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-full" />
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-5/6" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-1/4" />
                    <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 text-2xl">
              📰
            </div>
            <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              No articles found
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Try searching for different keywords or select another news category tab.
            </p>
          </div>
        ) : (
          /* Real Articles Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article) => (
              <article
                key={article.id}
                onClick={() => setReadingArticle(article)}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer group hover:border-[#128C7E]/50"
              >
                {/* Article Header Image */}
                <div className="relative h-44 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Category Pill */}
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white rounded-md">
                    {article.category}
                  </span>
                  {/* Read Time Badge */}
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 text-[10px] font-medium bg-[#075E54]/90 backdrop-blur-md text-white rounded-md">
                    {article.readTime}
                  </span>
                </div>

                {/* Article Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 mb-1.5">
                      <span className="font-semibold text-[#128C7E] dark:text-[#25D366]">
                        {article.source}
                      </span>
                      <span>
                        {new Date(article.publishedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h2 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 group-hover:text-[#075E54] dark:group-hover:text-[#25D366] transition-colors">
                      {article.title}
                    </h2>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                      {article.description}
                    </p>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">
                      By {article.author}
                    </span>

                    {/* Share to Chat button */}
                    <button
                      type="button"
                      onClick={(e) => handleShare(article, e)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        sharedArticleId === article.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[#DCF8C6] hover:bg-[#25D366] dark:bg-[#005c4b] dark:hover:bg-[#128C7E] text-[#075E54] dark:text-emerald-100'
                      }`}
                      title="Share this article into active conversation"
                    >
                      {sharedArticleId === article.id ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>Shared!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          <span>{t('shareToChat', currentLanguage)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Full Article Reader Modal */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Image Header */}
            <div className="relative h-60 bg-zinc-950 shrink-0">
              <img
                src={readingArticle.imageUrl}
                alt={readingArticle.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition shadow-md"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-4 flex gap-2">
                <span className="px-2.5 py-1 text-xs font-bold uppercase bg-[#075E54] text-white rounded-md">
                  {readingArticle.category}
                </span>
                <span className="px-2.5 py-1 text-xs font-semibold bg-black/60 text-white rounded-md">
                  {readingArticle.readTime}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="font-semibold text-[#128C7E] dark:text-[#25D366]">
                  {readingArticle.source} • By {readingArticle.author}
                </span>
                <span>
                  {new Date(readingArticle.publishedAt).toLocaleDateString([], {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {readingArticle.title}
              </h1>

              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border-l-4 border-[#128C7E]">
                {readingArticle.description}
              </p>

              <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-3">
                <p>{readingArticle.content}</p>
                <p className="text-xs text-zinc-400 italic">
                  Reported by {readingArticle.author} for {readingArticle.source}. Distributed through the iMessage global syndication wire.
                </p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition"
              >
                {t('close', currentLanguage)}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  handleShare(readingArticle, e);
                  setReadingArticle(null);
                }}
                className="flex items-center gap-2 px-5 py-2 bg-[#128C7E] hover:bg-[#075E54] text-white rounded-xl text-xs font-semibold shadow-md transition transform hover:scale-102"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>{t('shareToChat', currentLanguage)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
