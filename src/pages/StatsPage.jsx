import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { useApp } from '../contexts/AppContext';
import { PROFILE_MD, POSTER_MD } from '../lib/tmdb';
import PageWrapper from '../components/shared/PageWrapper';

const ACCENT_COLORS = ['#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e', '#00b894', '#0984e3', '#e17055', '#00cec9'];

export default function StatsPage() {
  const { library, watchedList, watchingList, plannedList, totalWatchHours, language } = useApp();
  const t = (en, ar) => language === 'ar' ? ar : en;

  const stats = useMemo(() => {
    const genreCount = {};
    const actorCount = {};
    const yearCount = {};
    const monthCount = {};

    for (const item of watchedList) {
      // Genres
      (item.genres || []).forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1; });
      // Years
      if (item.year) yearCount[item.year] = (yearCount[item.year] || 0) + 1;
      // Month added
      if (item.created_at) {
        const m = new Date(item.created_at).toLocaleString('en-US', { month: 'short' });
        monthCount[m] = (monthCount[m] || 0) + 1;
      }
    }

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    const eraData = Object.entries(yearCount)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value]) => ({ name, value }));

    // Type breakdown
    const movies = watchedList.filter(i => i.media_type === 'movie').length;
    const series = watchedList.filter(i => i.media_type === 'tv').length;
    const anime  = watchedList.filter(i => i.media_type === 'anime').length;

    // Rating distribution
    const ratings = [1, 2, 3, 4, 5].map(r => ({
      name: '★'.repeat(r),
      value: watchedList.filter(i => Math.round(i.rating) === r).length,
    }));

    // Average rating
    const rated = watchedList.filter(i => i.rating > 0);
    const avgRating = rated.length
      ? (rated.reduce((a, i) => a + i.rating, 0) / rated.length).toFixed(1)
      : 0;

    // Radar data (taste profile)
    const radarData = [
      { subject: t('Action',     'أكشن'),     A: genreCount['Action']     || 0 },
      { subject: t('Drama',      'دراما'),     A: genreCount['Drama']      || 0 },
      { subject: t('Comedy',     'كوميديا'),   A: genreCount['Comedy']     || 0 },
      { subject: t('Sci-Fi',     'خيال علمي'), A: genreCount['Science Fiction'] || genreCount['Sci-Fi & Fantasy'] || 0 },
      { subject: t('Romance',    'رومانسي'),   A: genreCount['Romance']    || 0 },
      { subject: t('Thriller',   'إثارة'),     A: genreCount['Thriller']   || 0 },
    ];

    // Rewatch count
    const rewatchCount = watchedList.filter(i => i.will_rewatch).length;

    return { topGenres, eraData, movies, series, anime, ratings, avgRating, radarData, rewatchCount };
  }, [watchedList, language]);

  const totalHours = Math.round(totalWatchHours / 60);
  const totalDays  = Math.round(totalHours / 24 * 10) / 10;

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-20">
        {/* Header */}
        <motion.div className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-white mb-1">📊 {t('My Statistics', 'إحصائياتي')}</h1>
          <p className="text-white/40 text-sm">{t('Your complete cinematic profile', 'ملفك السينمائي الكامل')}</p>
        </motion.div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: t('Total Watched', 'الكل شاهدته'),  value: watchedList.length,  icon: '✅', color: 'emerald' },
            { label: t('Watch Hours',   'ساعات المشاهدة'), value: totalHours,          icon: '⏱',  color: 'blue'    },
            { label: t('Currently Watching', 'أشاهد الآن'), value: watchingList.length, icon: '▶',  color: 'purple'  },
            { label: t('Planned',        'مخطط'),         value: plannedList.length,  icon: '🕐', color: 'amber'   },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="glass rounded-2xl p-5 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-white/40 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: t('Movies',       'أفلام'),      value: stats.movies,           icon: '🎬' },
            { label: t('Series',       'مسلسلات'),    value: stats.series,           icon: '📺' },
            { label: t('Anime',        'أنمي'),        value: stats.anime,            icon: '⛩' },
            { label: t('Avg Rating',   'متوسط التقييم'), value: stats.avgRating + '★', icon: '⭐' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="glass rounded-2xl p-4 border border-white/10 flex items-center gap-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
            >
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <div className="text-xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-white/40">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Genre pie */}
          <motion.div
            className="glass rounded-2xl p-6 border border-white/10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-base font-bold text-white mb-5">{t('Genre Breakdown', 'توزيع الأنواع')}</h3>
            {stats.topGenres.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={stats.topGenres} cx="50%" cy="50%" outerRadius={80} dataKey="value" strokeWidth={0}>
                      {stats.topGenres.map((_, i) => (
                        <Cell key={i} fill={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {stats.topGenres.slice(0, 6).map((g, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ACCENT_COLORS[i % ACCENT_COLORS.length] }} />
                      <span className="text-white/70 truncate flex-1">{g.name}</span>
                      <span className="text-white font-semibold">{g.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyChart />
            )}
          </motion.div>

          {/* Taste Radar */}
          <motion.div
            className="glass rounded-2xl p-6 border border-white/10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-base font-bold text-white mb-5">{t('Taste Radar', 'رادار الذوق')}</h3>
            {watchedList.length > 3 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={stats.radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                  <Radar name="taste" dataKey="A" stroke="#6c5ce7" fill="#6c5ce7" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg={t('Watch 4+ titles to see your taste radar', 'شاهد 4+ عناوين لترى رادار ذوقك')} />
            )}
          </motion.div>

          {/* Era breakdown */}
          {stats.eraData.length > 0 && (
            <motion.div
              className="glass rounded-2xl p-6 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-base font-bold text-white mb-5">{t('Era Breakdown', 'توزيع الحقب')}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.eraData}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="value" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Rating distribution */}
          <motion.div
            className="glass rounded-2xl p-6 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="text-base font-bold text-white mb-5">{t('Rating Distribution', 'توزيع التقييمات')}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.ratings}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="value" fill="#fdcb6e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Fun facts */}
        <motion.div
          className="glass rounded-2xl p-6 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-base font-bold text-white mb-5">🎯 {t('Fun Facts', 'حقائق ممتعة')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { label: t('Total watch time', 'إجمالي وقت المشاهدة'), value: `${totalDays} ${t('days', 'أيام')}` },
              { label: t('Will rewatch',      'سيعيد مشاهدتها'),    value: stats.rewatchCount },
              { label: t('Top genre',          'الأكثر مشاهدة'),     value: stats.topGenres[0]?.name || '–' },
              { label: t('Library total',      'إجمالي المكتبة'),    value: library.length },
            ].map((fact, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-xl font-black text-cinema-accent mb-1">{fact.value}</div>
                <div className="text-xs text-white/40">{fact.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

function EmptyChart({ msg }) {
  return (
    <div className="h-48 flex flex-col items-center justify-center text-white/20 text-sm text-center gap-2">
      <span className="text-3xl">📊</span>
      {msg || 'No data yet'}
    </div>
  );
}
