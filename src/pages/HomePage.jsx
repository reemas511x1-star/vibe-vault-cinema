import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import PageWrapper from '../components/shared/PageWrapper';
import MediaCard from '../components/shared/MediaCard';
import { getTrending, getPopularMovies, getPopularTV, POSTER_MD, BACKDROP_LG } from '../lib/tmdb';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function HomePage({ onAuthClick }) {
  const { user } = useAuth();
  const { library, watchingList, language, mood } = useApp();
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const lang = language === 'ar' ? 'ar-SA' : 'en-US';
  const t = (en, ar) => language === 'ar' ? ar : en;

  useEffect(() => {
    async function load() {
      setLoadingTrending(true);
      try {
        const [tr, pm, ptv] = await Promise.all([
          getTrending('all', 'week', lang),
          getPopularMovies(lang),
          getPopularTV(lang),
        ]);
        setTrending(tr.results?.slice(0, 10) || []);
        setPopularMovies(pm.results?.slice(0, 12) || []);
        setPopularTV(ptv.results?.slice(0, 12) || []);
      } finally {
        setLoadingTrending(false);
      }
    }
    load();
  }, [language]);

  // Auto-advance hero
  useEffect(() => {
    if (!trending.length) return;
    const t = setInterval(() => setHeroIndex(i => (i + 1) % Math.min(5, trending.length)), 6000);
    return () => clearInterval(t);
  }, [trending.length]);

  const hero = trending[heroIndex];
  const heroTitle = hero?.title || hero?.name;
  const heroBackdrop = hero?.backdrop_path ? `${BACKDROP_LG}${hero.backdrop_path}` : null;
  const heroYear = (hero?.release_date || hero?.first_air_date || '').split('-')[0];
  const heroRating = hero?.vote_average ? (hero.vote_average / 2).toFixed(1) : null;

  return (
    <PageWrapper>
      {/* ── HERO ── */}
      <section className="relative h-[88vh] min-h-[600px] overflow-hidden">
        {/* Backdrop */}
        <motion.div
          key={heroIndex}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
        >
          {heroBackdrop ? (
            <img src={heroBackdrop} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cinema-dark to-cinema-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent" />
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 h-full flex items-end pb-20 px-6 max-w-7xl mx-auto">
          <motion.div
            key={heroIndex}
            className="max-w-xl"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Now trending badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">
                {t('Trending Now', 'الأكثر رواجاً')}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-3 text-shadow-cinema">
              {heroTitle || 'Welcome to Vibe Vault'}
            </h1>

            <div className="flex items-center gap-3 mb-4">
              {heroYear && <span className="text-white/60 text-sm">{heroYear}</span>}
              {heroRating && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-white font-semibold text-sm">{heroRating}</span>
                </div>
              )}
              {hero?.media_type && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium glass border border-white/10 text-white/70">
                  {hero.media_type === 'movie' ? t('Movie', 'فيلم') : t('Series', 'مسلسل')}
                </span>
              )}
            </div>

            {hero?.overview && (
              <p className="text-white/60 text-sm leading-relaxed line-clamp-3 mb-6">
                {hero.overview}
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {hero && (
                <motion.button
                  className="cinema-btn flex items-center gap-2"
                  onClick={() => navigate(`/title/${hero.media_type || 'movie'}/${hero.id}`)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span>▶</span>
                  <span>{t('View Details', 'عرض التفاصيل')}</span>
                </motion.button>
              )}
              {!user && (
                <motion.button
                  className="cinema-btn-ghost"
                  onClick={onAuthClick}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {t('Sign in to track', 'سجل دخولك للمتابعة')}
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Hero dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {trending.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className={`h-1 rounded-full transition-all duration-300 ${i === heroIndex ? 'w-8 bg-cinema-accent' : 'w-2 bg-white/30'}`}
            />
          ))}
        </div>
      </section>

      {/* ── CONTINUE WATCHING ── */}
      {watchingList.length > 0 && (
        <section className="px-6 max-w-7xl mx-auto py-10">
          <SectionHeader title={t('Continue Watching', 'متابعة المشاهدة')} icon="▶" link="/library" linkLabel={t('View All', 'عرض الكل')} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
            {watchingList.slice(0, 6).map((item, i) => (
              <motion.div key={item.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                <MediaCard item={{...item, tmdb_id: item.tmdb_id, id: item.tmdb_id}} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── TRENDING ── */}
      <section className="px-6 max-w-7xl mx-auto py-10">
        <SectionHeader title={t('Trending This Week', 'الأكثر رواجاً هذا الأسبوع')} icon="🔥" />
        {loadingTrending ? (
          <SkeletonGrid count={6} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
            {trending.slice(0, 6).map((item, i) => (
              <motion.div key={item.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                <MediaCard item={item} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── POPULAR MOVIES ── */}
      <section className="px-6 max-w-7xl mx-auto py-10">
        <SectionHeader title={t('Popular Movies', 'أفلام شائعة')} icon="🎬" link="/discover" linkLabel={t('Explore', 'استكشف')} />
        {loadingTrending ? (
          <SkeletonGrid count={6} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
            {popularMovies.slice(0, 6).map((item, i) => (
              <motion.div key={item.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                <MediaCard item={{ ...item, media_type: 'movie' }} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── POPULAR SERIES ── */}
      <section className="px-6 max-w-7xl mx-auto py-10">
        <SectionHeader title={t('Popular Series', 'مسلسلات شائعة')} icon="📺" />
        {loadingTrending ? (
          <SkeletonGrid count={6} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
            {popularTV.slice(0, 6).map((item, i) => (
              <motion.div key={item.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                <MediaCard item={{ ...item, media_type: 'tv' }} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── CTA for non-logged users ── */}
      {!user && (
        <section className="px-6 max-w-3xl mx-auto py-20 text-center">
          <motion.div
            className="glass rounded-3xl p-12 border border-cinema-accent/20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-6xl mb-6">🎬</div>
            <h2 className="text-3xl font-black text-white mb-3">
              {t('Your Cinema Universe Awaits', 'عالمك السينمائي ينتظرك')}
            </h2>
            <p className="text-white/50 mb-8 leading-relaxed">
              {t(
                'Track every movie, series, and anime you watch. Get AI-powered recommendations. Build your personal cinematic identity.',
                'تتبع كل فيلم ومسلسل وأنمي تشاهده. احصل على توصيات بالذكاء الاصطناعي. ابنِ هويتك السينمائية الشخصية.'
              )}
            </p>
            <motion.button
              className="cinema-btn text-lg px-10 py-4"
              onClick={onAuthClick}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              {t('Get Started Free', 'ابدأ مجاناً')}
            </motion.button>
          </motion.div>
        </section>
      )}

      <div className="h-20" />
    </PageWrapper>
  );
}

function SectionHeader({ title, icon, link, linkLabel }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="text-sm text-cinema-accent hover:text-cinema-accent/80 transition-colors flex items-center gap-1">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden">
          <div className="aspect-[2/3] skeleton rounded-xl" />
          <div className="p-3 space-y-2">
            <div className="skeleton h-3 rounded w-3/4" />
            <div className="skeleton h-3 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
