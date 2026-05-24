import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../components/shared/PageWrapper';
import MediaCard from '../components/shared/MediaCard';
import { useApp } from '../contexts/AppContext';
import {
  getTrending, getPopularMovies, getPopularTV, discoverAnime,
  getMovieGenres, getTVGenres, discoverByGenre
} from '../lib/tmdb';

const TABS = [
  { key: 'trending', en: 'Trending', ar: 'رائج',        icon: '🔥' },
  { key: 'movies',   en: 'Movies',   ar: 'أفلام',       icon: '🎬' },
  { key: 'series',   en: 'Series',   ar: 'مسلسلات',     icon: '📺' },
  { key: 'anime',    en: 'Anime',    ar: 'أنمي',         icon: '⛩' },
];

export default function DiscoverPage() {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState('trending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [page, setPage] = useState(1);
  const lang = language === 'ar' ? 'ar-SA' : 'en-US';
  const t = (en, ar) => language === 'ar' ? ar : en;

  useEffect(() => {
    async function loadGenres() {
      const [mg, tg] = await Promise.all([getMovieGenres(lang), getTVGenres(lang)]);
      const combined = [...(mg.genres || []), ...(tg.genres || [])];
      const unique = Array.from(new Map(combined.map(g => [g.id, g])).values());
      setGenres(unique.slice(0, 16));
    }
    loadGenres();
  }, [language]);

  useEffect(() => {
    setPage(1);
    setItems([]);
    fetchItems(1, true);
  }, [activeTab, selectedGenre, language]);

  async function fetchItems(pg = 1, reset = false) {
    setLoading(true);
    try {
      let data;
      if (selectedGenre) {
        const mediaType = activeTab === 'series' ? 'tv' : activeTab === 'anime' ? 'tv' : 'movie';
        data = await discoverByGenre(mediaType, selectedGenre, lang, pg);
      } else {
        switch (activeTab) {
          case 'movies':  data = await getPopularMovies(lang); break;
          case 'series':  data = await getPopularTV(lang); break;
          case 'anime':   data = await discoverAnime(lang, pg); break;
          default:        data = await getTrending('all', 'week', lang); break;
        }
      }
      const results = (data.results || []).map(i => ({
        ...i,
        media_type: activeTab === 'series' ? 'tv' : activeTab === 'anime' ? 'anime' : (i.media_type || 'movie'),
      }));
      setItems(prev => reset ? results : [...prev, ...results]);
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchItems(next, false);
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-20">
        {/* Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-white mb-1">🔭 {t('Discover', 'اكتشف')}</h1>
          <p className="text-white/40 text-sm">{t('Browse movies, series, and anime', 'استعرض الأفلام والمسلسلات والأنمي')}</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map(tab => (
            <motion.button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedGenre(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                activeTab === tab.key
                  ? 'bg-cinema-accent/20 border-cinema-accent/50 text-white'
                  : 'glass border-white/10 text-white/50 hover:text-white hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>{tab.icon}</span>
              <span>{language === 'ar' ? tab.ar : tab.en}</span>
            </motion.button>
          ))}
        </div>

        {/* Genre filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setSelectedGenre(null)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
              !selectedGenre ? 'bg-cinema-accent/20 border-cinema-accent/50 text-white' : 'glass border-white/10 text-white/40 hover:text-white'
            }`}
          >
            {t('All', 'الكل')}
          </button>
          {genres.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGenre(selectedGenre === g.id ? null : g.id)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                selectedGenre === g.id ? 'bg-cinema-accent/20 border-cinema-accent/50 text-white' : 'glass border-white/10 text-white/40 hover:text-white'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] skeleton rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map((item, i) => (
                <motion.div
                  key={`${item.id}-${i}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                >
                  <MediaCard item={item} />
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center mt-10">
              <motion.button
                onClick={loadMore}
                disabled={loading}
                className="cinema-btn-ghost flex items-center gap-2"
                whileHover={{ scale: 1.03 }}
              >
                {loading ? (
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  t('Load More', 'تحميل المزيد')
                )}
              </motion.button>
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
