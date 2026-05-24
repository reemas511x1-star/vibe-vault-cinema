import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import PageWrapper from '../components/shared/PageWrapper';
import { getMoodRecommendations, POSTER_MD } from '../lib/tmdb';
import { generateMoodMatch } from '../lib/openai';

const MOODS = [
  { key: 'Happy',       icon: '😄', color: '#fdcb6e' },
  { key: 'Sad',         icon: '😢', color: '#74b9ff' },
  { key: 'Excited',     icon: '🤩', color: '#fd79a8' },
  { key: 'Relaxed',     icon: '😌', color: '#55efc4' },
  { key: 'Romantic',    icon: '💕', color: '#fd79a8' },
  { key: 'Adventurous', icon: '🗺',  color: '#fdcb6e' },
  { key: 'Nostalgic',   icon: '🌅', color: '#e17055' },
  { key: 'Anxious',     icon: '😰', color: '#a29bfe' },
  { key: 'Bored',       icon: '😐', color: '#b2bec3' },
  { key: 'Inspired',    icon: '💡', color: '#ffeaa7' },
  { key: 'Heartbroken', icon: '💔', color: '#d63031' },
  { key: 'Pumped',      icon: '💪', color: '#e17055' },
];

const MOOD_LABELS_AR = {
  Happy: 'سعيد', Sad: 'حزين', Excited: 'متحمس', Relaxed: 'مسترخٍ',
  Romantic: 'رومانسي', Adventurous: 'مغامر', Nostalgic: 'حنين', Anxious: 'قلق',
  Bored: 'ممل', Inspired: 'مُلهَم', Heartbroken: 'محطم القلب', Pumped: 'متفجر الطاقة',
};

const TYPES = [
  { key: 'movie',   en: 'Movie',      ar: 'فيلم',   icon: '🎬' },
  { key: 'tv',      en: 'Series',     ar: 'مسلسل',  icon: '📺' },
  { key: 'anime',   en: 'Anime',      ar: 'أنمي',   icon: '⛩' },
  { key: 'random',  en: 'Surprise!',  ar: 'فاجئني!', icon: '🎲' },
];

const DURATIONS = [
  { key: 'short',  en: 'Short (<1.5h)',  ar: 'قصير' },
  { key: 'medium', en: 'Medium (1.5-2.5h)', ar: 'متوسط' },
  { key: 'long',   en: 'Long (2.5h+)',  ar: 'طويل'  },
  { key: 'binge',  en: 'Binge Series',  ar: 'مسلسل طويل' },
];

export default function WatchNowPage() {
  const { library, language, addToLibrary, showToast } = useApp();
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedType, setSelectedType] = useState('movie');
  const [selectedDuration, setSelectedDuration] = useState('medium');
  const [results, setResults] = useState([]);
  const [aiMessage, setAiMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const t = (en, ar) => language === 'ar' ? ar : en;

  async function handleFind() {
    if (!selectedMood) { showToast(t('Pick a mood first!', 'اختر مزاجاً أولاً!'), 'info'); return; }
    setLoading(true);
    setResults([]);
    setAiMessage('');

    try {
      const actualType = selectedType === 'random'
        ? ['movie', 'tv', 'anime'][Math.floor(Math.random() * 3)]
        : selectedType;

      const lang = language === 'ar' ? 'ar-SA' : 'en-US';
      const [tmdbRes, aiRes] = await Promise.all([
        getMoodRecommendations(selectedMood, actualType, lang),
        generateMoodMatch(selectedMood, library.slice(0, 8), language),
      ]);

      let items = tmdbRes.results || [];
      if (selectedDuration === 'short')  items = items.filter(i => !i.runtime || i.runtime < 90);
      if (selectedDuration === 'medium') items = items.filter(i => !i.runtime || (i.runtime >= 90 && i.runtime <= 150));
      if (selectedDuration === 'long')   items = items.filter(i => !i.runtime || i.runtime > 150);

      setResults(items.slice(0, 8).map(i => ({ ...i, media_type: actualType === 'anime' ? 'tv' : actualType })));
      setAiMessage(aiRes);
    } finally {
      setLoading(false);
    }
  }

  const moodObj = MOODS.find(m => m.key === selectedMood);

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-20">
        {/* Header */}
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black text-white mb-3">🎯 {t('What Should I Watch?', 'ماذا أشاهد؟')}</h1>
          <p className="text-white/40">{t('Tell us how you feel — we\'ll find the perfect match.', 'أخبرنا كيف تشعر — سنجد ما يناسبك تماماً.')}</p>
        </motion.div>

        {/* Step 1 — Mood */}
        <motion.section className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-5">
            {t('1. How are you feeling?', '١. كيف تشعر الآن؟')}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {MOODS.map(mood => (
              <motion.button
                key={mood.key}
                onClick={() => setSelectedMood(mood.key)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  selectedMood === mood.key
                    ? 'border-2'
                    : 'glass border-white/10 hover:border-white/30'
                }`}
                style={selectedMood === mood.key ? {
                  borderColor: mood.color,
                  background: `${mood.color}15`,
                  boxShadow: `0 0 20px ${mood.color}30`,
                } : {}}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">{mood.icon}</span>
                <span className="text-xs text-white/70 font-medium">
                  {language === 'ar' ? MOOD_LABELS_AR[mood.key] : mood.key}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Step 2 — Type */}
        <motion.section className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-5">
            {t('2. What type?', '٢. ما نوع المحتوى؟')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TYPES.map(tp => (
              <motion.button
                key={tp.key}
                onClick={() => setSelectedType(tp.key)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all text-sm font-medium ${
                  selectedType === tp.key
                    ? 'bg-cinema-accent/20 border-cinema-accent/60 text-white'
                    : 'glass border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-lg">{tp.icon}</span>
                <span>{t(tp.en, tp.ar)}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Step 3 — Duration */}
        <motion.section className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-5">
            {t('3. How much time do you have?', '٣. كم لديك من الوقت؟')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DURATIONS.map(d => (
              <button
                key={d.key}
                onClick={() => setSelectedDuration(d.key)}
                className={`py-3 px-4 rounded-xl border text-sm transition-all ${
                  selectedDuration === d.key
                    ? 'bg-cinema-accent/20 border-cinema-accent/60 text-white'
                    : 'glass border-white/10 text-white/60 hover:text-white'
                }`}
              >
                {t(d.en, d.ar)}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Find button */}
        <div className="flex justify-center mb-12">
          <motion.button
            onClick={handleFind}
            disabled={loading}
            className="cinema-btn text-lg py-4 px-12 flex items-center gap-3"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={moodObj ? { boxShadow: `0 0 40px ${moodObj.color}40` } : {}}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('Finding the perfect match…', 'نبحث عن التطابق المثالي…')}
              </>
            ) : (
              <>
                {moodObj?.icon || '🎬'}
                {t('Find My Match', 'اعثر على ما يناسبني')}
              </>
            )}
          </motion.button>
        </div>

        {/* AI Message */}
        <AnimatePresence>
          {aiMessage && (
            <motion.div
              className="glass rounded-2xl p-6 border border-cinema-accent/20 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-cinema-accent/20 flex items-center justify-center text-sm">✨</div>
                <h3 className="font-semibold text-cinema-accent text-sm">{t('AI Recommendation', 'توصية الذكاء الاصطناعي')}</h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{aiMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-bold text-white mb-5">
                {moodObj && <span>{moodObj.icon} </span>}
                {t('Your Matches', 'توصياتك')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((item, i) => (
                  <ResultCard key={item.id} item={item} index={i} language={language} addToLibrary={addToLibrary} user={user} moodColor={moodObj?.color} />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}

function ResultCard({ item, index, language, addToLibrary, user, moodColor }) {
  const [added, setAdded] = useState(false);
  const t = (en, ar) => language === 'ar' ? ar : en;
  const poster = item.poster_path ? `${POSTER_MD}${item.poster_path}` : null;
  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || '').split('-')[0];
  const rating = item.vote_average ? (item.vote_average / 2).toFixed(1) : null;

  async function handleAdd() {
    if (!user) return;
    await addToLibrary({
      tmdb_id: item.id,
      media_type: item.media_type || 'movie',
      title,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      year,
      vote_average: item.vote_average,
      genres: item.genre_ids?.map(String) || [],
      overview: item.overview,
      status: 'planned',
    });
    setAdded(true);
  }

  return (
    <motion.div
      className="glass rounded-2xl overflow-hidden border border-white/10 flex gap-4 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={moodColor ? { boxShadow: `0 0 20px ${moodColor}10` } : {}}
    >
      {poster && (
        <div className="w-20 h-28 rounded-xl overflow-hidden flex-shrink-0">
          <img src={poster} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-white text-sm mb-1 line-clamp-2">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-white/40 mb-2">
          {year && <span>{year}</span>}
          {rating && <span>⭐ {rating}</span>}
        </div>
        {item.overview && (
          <p className="text-xs text-white/50 line-clamp-3 leading-relaxed">{item.overview}</p>
        )}
        {user && (
          <motion.button
            onClick={handleAdd}
            disabled={added}
            className={`mt-3 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              added
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'glass border-white/20 text-white/60 hover:text-white hover:border-cinema-accent/50'
            }`}
            whileHover={{ scale: added ? 1 : 1.03 }}
          >
            {added ? '✓ ' + t('Added!', 'تمت الإضافة!') : '+ ' + t('Add to Library', 'أضف للمكتبة')}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
