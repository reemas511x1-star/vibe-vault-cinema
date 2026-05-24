import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  getMovieDetails, getTVDetails, BACKDROP_XL, POSTER_LG, POSTER_MD, PROFILE_MD,
  getTitle, getYear, getPosterUrl
} from '../lib/tmdb';
import { generateCinematicJournal } from '../lib/openai';
import StarRating from '../components/shared/StarRating';
import MediaCard from '../components/shared/MediaCard';
import WishlistSection from '../components/shared/WishlistSection';
import PageWrapper from '../components/shared/PageWrapper';

const STATUS_OPTIONS = [
  { value: 'planned',  en: 'Plan to Watch', ar: 'سأشاهد',      color: 'amber'   },
  { value: 'watching', en: 'Watching',       ar: 'أشاهد الآن',  color: 'blue'    },
  { value: 'watched',  en: 'Watched',        ar: 'شاهدت',       color: 'emerald' },
];

export default function TitleDetailPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { library, addToLibrary, updateLibraryItem, removeFromLibrary, language, showToast, addToRecentlyViewed } = useApp();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState('planned');
  const [localRating, setLocalRating] = useState(0);
  const [localNotes, setLocalNotes] = useState('');
  const [willRewatch, setWillRewatch] = useState(false);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [castExpanded, setCastExpanded] = useState(false);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journal, setJournal] = useState('');
  const [activeTab, setActiveTab] = useState('similar_story');
  const lang = language === 'ar' ? 'ar-SA' : 'en-US';
  const t = (en, ar) => language === 'ar' ? ar : en;

  const libEntry = library.find(l => l.tmdb_id === parseInt(id) && l.media_type === type);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = type === 'movie' ? await getMovieDetails(id, lang) : await getTVDetails(id, lang);
        setDetails(data);
        addToRecentlyViewed({ tmdb_id: data.id, title: data.title || data.name, poster_path: data.poster_path, media_type: type });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, type, language]);

  // Sync library state
  useEffect(() => {
    if (libEntry) {
      setLocalStatus(libEntry.status || 'planned');
      setLocalRating(libEntry.rating || 0);
      setLocalNotes(libEntry.notes || '');
      setWillRewatch(libEntry.will_rewatch || false);
      setCurrentSeason(libEntry.current_season || 1);
      setCurrentEpisode(libEntry.current_episode || 1);
    }
  }, [libEntry]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const payload = {
      tmdb_id: parseInt(id),
      media_type: type,
      title: getTitle(details),
      original_title: details?.original_title || details?.original_name,
      poster_path: details?.poster_path,
      backdrop_path: details?.backdrop_path,
      year: getYear(details),
      vote_average: details?.vote_average,
      runtime: details?.runtime || (details?.episode_run_time?.[0]),
      genres: details?.genres?.map(g => g.name) || [],
      genre_ids: details?.genres?.map(g => g.id) || [],
      overview: details?.overview,
      status: localStatus,
      rating: localRating || null,
      notes: localNotes,
      will_rewatch: willRewatch,
      current_season: currentSeason,
      current_episode: currentEpisode,
      total_seasons: details?.number_of_seasons,
      total_episodes: details?.number_of_episodes,
      date_watched: localStatus === 'watched' ? new Date().toISOString().split('T')[0] : null,
    };
    if (libEntry) {
      await updateLibraryItem(libEntry.id, payload);
      showToast(t('Saved!', 'تم الحفظ!'), 'success');
    } else {
      await addToLibrary(payload);
    }
    setSaving(false);
  }

  async function handleGenerateJournal() {
    if (!localRating) { showToast(t('Please rate first', 'قيّم العنوان أولاً'), 'info'); return; }
    setJournalLoading(true);
    try {
      const text = await generateCinematicJournal(getTitle(details), localRating, localNotes, language);
      setJournal(text);
      if (user) {
        await supabase.from('journal_entries').insert([{
          user_id: user.id, tmdb_id: parseInt(id), library_id: libEntry?.id,
          title: getTitle(details), content: text, type: 'review',
        }]);
      }
    } finally {
      setJournalLoading(false);
    }
  }

  if (loading) return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className="skeleton h-[50vh] rounded-2xl mb-8" />
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="skeleton h-6 rounded w-3/4" />
            <div className="skeleton h-4 rounded w-full" />
            <div className="skeleton h-4 rounded w-2/3" />
          </div>
        </div>
      </div>
    </PageWrapper>
  );

  if (!details) return null;

  const title = getTitle(details);
  const year = getYear(details);
  const backdrop = details.backdrop_path ? `${BACKDROP_XL}${details.backdrop_path}` : null;
  const poster = details.poster_path ? `${POSTER_LG}${details.poster_path}` : null;
  const cast = details.credits?.cast?.slice(0, castExpanded ? 20 : 8) || [];
  const similar = details.similar?.results?.slice(0, 6) || [];
  const recommendations = details.recommendations?.results?.slice(0, 6) || [];

  return (
    <PageWrapper>
      {/* ── BACKDROP HERO ── */}
      <div className="relative h-[60vh] min-h-[420px] overflow-hidden">
        {backdrop && (
          <img src={backdrop} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-cinema-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/80 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 glass px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white transition-colors border border-white/10 flex items-center gap-2"
        >
          ← {t('Back', 'رجوع')}
        </button>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-48 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <motion.div className="flex-shrink-0 w-48 md:w-56 self-start mx-auto md:mx-0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10">
              {poster ? (
                <img src={poster} alt={title} className="w-full" />
              ) : (
                <div className="aspect-[2/3] bg-white/5 flex items-center justify-center text-5xl">🎬</div>
              )}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div className="flex-1 min-w-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex flex-wrap gap-2 mb-3">
              {details.genres?.map(g => (
                <span key={g.id} className="px-2.5 py-1 rounded-full text-xs font-medium glass border border-white/10 text-white/70">
                  {g.name}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-2">{title}</h1>

            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-white/50">
              <span>{year}</span>
              {details.vote_average && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-white font-semibold">{(details.vote_average / 2).toFixed(1)}</span>
                  <span className="text-white/30">/ 5</span>
                </div>
              )}
              {details.runtime && <span>{Math.floor(details.runtime / 60)}h {details.runtime % 60}m</span>}
              {details.number_of_seasons && <span>{details.number_of_seasons} {t('Seasons', 'مواسم')}</span>}
              {details.original_language && (
                <span className="uppercase px-2 py-0.5 bg-white/5 rounded">{details.original_language}</span>
              )}
            </div>

            <p className="text-white/60 leading-relaxed mb-6 text-sm md:text-base">{details.overview}</p>

            {/* ── TRACKING PANEL ── */}
            <div className="glass rounded-2xl p-5 border border-white/10 space-y-5">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                {t('Track This Title', 'تتبع هذا العنوان')}
              </h3>

              {/* Status selector */}
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setLocalStatus(opt.value)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                      localStatus === opt.value
                        ? `bg-${opt.color}-500/20 border-${opt.color}-500/50 text-${opt.color}-400`
                        : 'glass border-white/10 text-white/40 hover:text-white'
                    }`}
                  >
                    {t(opt.en, opt.ar)}
                  </button>
                ))}
              </div>

              {/* Season/Episode for watching TV */}
              {localStatus === 'watching' && type !== 'movie' && (
                <div className="flex gap-4">
                  <div>
                    <label className="text-xs text-white/40 block mb-1">{t('Season', 'الموسم')}</label>
                    <input
                      type="number" min="1" max={details.number_of_seasons || 99}
                      value={currentSeason}
                      onChange={e => setCurrentSeason(parseInt(e.target.value) || 1)}
                      className="w-20 glass border border-white/10 rounded-lg px-3 py-2 text-sm text-white bg-transparent focus:outline-none focus:border-cinema-accent/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 block mb-1">{t('Episode', 'الحلقة')}</label>
                    <input
                      type="number" min="1"
                      value={currentEpisode}
                      onChange={e => setCurrentEpisode(parseInt(e.target.value) || 1)}
                      className="w-20 glass border border-white/10 rounded-lg px-3 py-2 text-sm text-white bg-transparent focus:outline-none focus:border-cinema-accent/50"
                    />
                  </div>
                </div>
              )}

              {/* Will Rewatch */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${willRewatch ? 'bg-cinema-accent border-cinema-accent' : 'border-white/20 group-hover:border-white/40'}`}
                  onClick={() => setWillRewatch(!willRewatch)}
                >
                  {willRewatch && <span className="text-xs text-white">✓</span>}
                </div>
                <span className="text-sm text-white/60">{t('Will definitely rewatch', 'سأشاهده مرة أخرى حتماً')}</span>
                <span className="text-lg">🔁</span>
              </label>

              {/* Star Rating */}
              <div>
                <label className="text-xs text-white/40 block mb-2">{t('Your Rating', 'تقييمك')}</label>
                <StarRating value={localRating} onChange={setLocalRating} max={5} halfStars />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-white/40 block mb-2">{t('Private Notes', 'ملاحظاتك الخاصة')}</label>
                <textarea
                  value={localNotes}
                  onChange={e => setLocalNotes(e.target.value)}
                  placeholder={t('Your thoughts, notes, quotes…', 'أفكارك، ملاحظاتك، اقتباساتك…')}
                  rows={3}
                  className="w-full glass border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 bg-transparent resize-none focus:outline-none focus:border-cinema-accent/50"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 flex-wrap">
                <motion.button
                  onClick={handleSave}
                  disabled={saving || !user}
                  className="cinema-btn flex-1 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>{libEntry ? '💾' : '+'} {libEntry ? t('Save Changes', 'حفظ التغييرات') : t('Add to Library', 'أضف للمكتبة')}</>
                  )}
                </motion.button>

                {localRating > 0 && (
                  <motion.button
                    onClick={handleGenerateJournal}
                    disabled={journalLoading}
                    className="cinema-btn-ghost flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                  >
                    {journalLoading ? '✨ Writing…' : '✨ ' + t('AI Journal', 'يوميات الذكاء الاصطناعي')}
                  </motion.button>
                )}

                {libEntry && (
                  <button
                    onClick={() => { removeFromLibrary(libEntry.id); navigate(-1); }}
                    className="px-4 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 glass border border-white/10 hover:border-red-500/30 transition-all"
                  >
                    🗑
                  </button>
                )}
              </div>

              {!user && (
                <p className="text-xs text-white/30 text-center">{t('Sign in to track this title', 'سجل دخولك لتتبع هذا العنوان')}</p>
              )}
            </div>

            {/* AI Journal */}
            <AnimatePresence>
              {journal && (
                <motion.div
                  className="mt-5 glass rounded-2xl p-5 border border-cinema-accent/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">✨</span>
                    <h4 className="font-semibold text-cinema-accent text-sm">
                      {t('Your Cinematic Journal', 'يومياتك السينمائية')}
                    </h4>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed italic">{journal}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── WISHLIST SECTION ── */}
        {user && <WishlistSection titleId={parseInt(id)} titleName={title} />}

        {/* ── CAST ── */}
        {cast.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{t('Cast', 'طاقم التمثيل')}</h2>
              <button onClick={() => setCastExpanded(!castExpanded)} className="text-sm text-cinema-accent hover:opacity-80 transition-opacity">
                {castExpanded ? t('Show less', 'عرض أقل') : t('Show all', 'عرض الكل')}
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {cast.map((person, i) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link to={`/actor/${person.id}`} className="group">
                    <div className="rounded-xl overflow-hidden aspect-[2/3] bg-white/5 mb-2 border border-white/5 group-hover:border-cinema-accent/30 transition-all">
                      {person.profile_path ? (
                        <img
                          src={`${PROFILE_MD}${person.profile_path}`}
                          alt={person.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl text-white/20">👤</div>
                      )}
                    </div>
                    <p className="text-xs text-white font-medium truncate group-hover:text-cinema-accent transition-colors">{person.name}</p>
                    <p className="text-xs text-white/40 truncate">{person.character}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── SIMILAR ── */}
        {(similar.length > 0 || recommendations.length > 0) && (
          <section className="mt-12">
            <div className="flex gap-4 mb-5 border-b border-white/10">
              {['similar_story', 'similar_era'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                    activeTab === tab ? 'border-cinema-accent text-white' : 'border-transparent text-white/40 hover:text-white'
                  }`}
                >
                  {tab === 'similar_story' ? t('Similar by Story', 'مشابه بالقصة') : t('Similar by Era', 'مشابه بالحقبة')}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(activeTab === 'similar_story' ? similar : recommendations).map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <MediaCard item={{ ...item, media_type: item.media_type || type }} />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageWrapper>
  );
}
