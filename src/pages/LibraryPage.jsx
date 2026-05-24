import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import PageWrapper from '../components/shared/PageWrapper';
import MediaCard from '../components/shared/MediaCard';
import { POSTER_MD } from '../lib/tmdb';

const TABS = [
  { key: 'all',      en: 'All',           ar: 'الكل',        icon: '📚' },
  { key: 'watched',  en: 'Watched',       ar: 'شاهدت',       icon: '✅' },
  { key: 'watching', en: 'Watching',      ar: 'أشاهد الآن',  icon: '▶' },
  { key: 'planned',  en: 'Plan to Watch', ar: 'سأشاهد',      icon: '🕐' },
];
const TYPES = [
  { key: 'all',   en: 'All Types', ar: 'الكل'     },
  { key: 'movie', en: 'Movies',    ar: 'أفلام'    },
  { key: 'tv',    en: 'Series',    ar: 'مسلسلات'  },
  { key: 'anime', en: 'Anime',     ar: 'أنمي'     },
];

export default function LibraryPage() {
  const { library, language, loading } = useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const t = (en, ar) => language === 'ar' ? ar : en;

  const filtered = useMemo(() => {
    let items = [...library];
    if (activeTab !== 'all') items = items.filter(i => i.status === activeTab);
    if (activeType !== 'all') items = items.filter(i => i.media_type === activeType);
    if (search) items = items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));
    switch (sortBy) {
      case 'rating': items.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'title':  items.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'year':   items.sort((a, b) => (b.year || '0').localeCompare(a.year || '0')); break;
      default:       items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return items;
  }, [library, activeTab, activeType, search, sortBy]);

  const counts = {
    all: library.length,
    watched: library.filter(i => i.status === 'watched').length,
    watching: library.filter(i => i.status === 'watching').length,
    planned: library.filter(i => i.status === 'planned').length,
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-white mb-1">{t('My Library', 'مكتبتي')}</h1>
          <p className="text-white/40 text-sm">
            {library.length} {t('titles tracked', 'عنوان متتبع')}
          </p>
        </motion.div>

        {/* Status Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map(tab => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                activeTab === tab.key
                  ? 'bg-cinema-accent/20 border-cinema-accent/50 text-white'
                  : 'glass border-white/10 text-white/50 hover:text-white hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>{tab.icon}</span>
              <span>{language === 'ar' ? tab.ar : tab.en}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-cinema-accent/30' : 'bg-white/10'}`}>
                {counts[tab.key]}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search your library…', 'ابحث في مكتبتك…')}
              className="w-full pl-9 pr-4 py-2.5 glass rounded-xl border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cinema-accent/50 bg-transparent"
            />
          </div>

          {/* Type filter */}
          <select
            value={activeType}
            onChange={e => setActiveType(e.target.value)}
            className="glass border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white bg-transparent focus:outline-none focus:border-cinema-accent/50"
          >
            {TYPES.map(tp => (
              <option key={tp.key} value={tp.key} className="bg-cinema-dark">
                {language === 'ar' ? tp.ar : tp.en}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="glass border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white bg-transparent focus:outline-none focus:border-cinema-accent/50"
          >
            <option value="recent" className="bg-cinema-dark">{t('Recent', 'الأحدث')}</option>
            <option value="rating" className="bg-cinema-dark">{t('Rating', 'التقييم')}</option>
            <option value="title"  className="bg-cinema-dark">{t('Title', 'العنوان')}</option>
            <option value="year"   className="bg-cinema-dark">{t('Year', 'السنة')}</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] skeleton rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState tab={activeTab} search={search} language={language} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${activeType}-${search}-${sortBy}`}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                >
                  <MediaCard item={{ ...item, tmdb_id: item.tmdb_id, id: item.tmdb_id }} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </PageWrapper>
  );
}

function EmptyState({ tab, search, language }) {
  const t = (en, ar) => language === 'ar' ? ar : en;
  if (search) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-bold text-white mb-2">{t('No results found', 'لا توجد نتائج')}</h3>
      <p className="text-white/40 text-sm">{t(`Nothing matches "${search}"`, `لا يوجد ما يطابق "${search}"`)}</p>
    </div>
  );
  const msgs = {
    all:      { en: "Your library is empty — start tracking titles!", ar: "مكتبتك فارغة — ابدأ بتتبع العناوين!" },
    watched:  { en: "No watched titles yet.", ar: "لا توجد عناوين مشاهدة بعد." },
    watching: { en: "Not watching anything currently.", ar: "لا تشاهد شيئاً حالياً." },
    planned:  { en: "Nothing planned to watch.", ar: "لا توجد عناوين مخططة للمشاهدة." },
  };
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <motion.div
        className="text-7xl mb-6"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🎬
      </motion.div>
      <h3 className="text-2xl font-bold text-white mb-3">{msgs[tab]?.[language] || msgs.all[language]}</h3>
      <p className="text-white/40">{t('Use the search bar in the navbar to find and add titles.', 'استخدم شريط البحث في شريط التنقل لإيجاد العناوين وإضافتها.')}</p>
    </div>
  );
}
