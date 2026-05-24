import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { generateWeeklySummary } from '../lib/openai';
import { POSTER_MD } from '../lib/tmdb';
import PageWrapper from '../components/shared/PageWrapper';

function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().split('T')[0],
    end: sun.toISOString().split('T')[0],
  };
}

export default function WeeklyPage() {
  const { library, language, mood } = useApp();
  const { user } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [activeSummary, setActiveSummary] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loadingSummaries, setLoadingSummaries] = useState(true);
  const t = (en, ar) => language === 'ar' ? ar : en;
  const { start: weekStart, end: weekEnd } = getWeekBounds();

  const thisWeekWatched = useMemo(() => {
    return library.filter(item => {
      if (item.status !== 'watched' || !item.created_at) return false;
      const d = item.created_at.split('T')[0];
      return d >= weekStart && d <= weekEnd;
    });
  }, [library, weekStart, weekEnd]);

  const totalHoursThisWeek = useMemo(() => {
    return Math.round(thisWeekWatched.reduce((acc, item) => {
      const rt = item.runtime || (item.media_type === 'movie' ? 110 : 45);
      return acc + rt / 60;
    }, 0) * 10) / 10;
  }, [thisWeekWatched]);

  const topGenreThisWeek = useMemo(() => {
    const gc = {};
    thisWeekWatched.forEach(i => (i.genres || []).forEach(g => gc[g] = (gc[g] || 0) + 1));
    return Object.entries(gc).sort((a, b) => b[1] - a[1])[0]?.[0] || t('Various', 'متنوع');
  }, [thisWeekWatched]);

  useEffect(() => {
    if (!user) return;
    loadSummaries();
  }, [user]);

  async function loadSummaries() {
    setLoadingSummaries(true);
    const { data } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(12);
    setSummaries(data || []);
    if (data?.length > 0) setActiveSummary(data[0]);
    setLoadingSummaries(false);
  }

  async function generateThisWeek() {
    if (!user) return;
    setGenerating(true);
    try {
      const aiMsg = await generateWeeklySummary(
        thisWeekWatched, totalHoursThisWeek, topGenreThisWeek, mood, language
      );

      const payload = {
        user_id: user.id,
        week_start: weekStart,
        week_end: weekEnd,
        titles_watched: thisWeekWatched.map(i => ({ id: i.id, title: i.title, poster_path: i.poster_path, media_type: i.media_type })),
        total_hours: totalHoursThisWeek,
        new_titles_count: thisWeekWatched.length,
        top_genre: topGenreThisWeek,
        top_mood: mood,
        ai_message: aiMsg,
      };

      const { data, error } = await supabase
        .from('weekly_summaries')
        .upsert([payload], { onConflict: 'user_id,week_start' })
        .select()
        .single();

      if (data) {
        setActiveSummary(data);
        await loadSummaries();
      }
    } finally {
      setGenerating(false);
    }
  }

  const currentWeekSummary = summaries.find(s => s.week_start === weekStart);

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-20">
        {/* Header */}
        <motion.div className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-white mb-1">📅 {t('Weekly Summary', 'الملخص الأسبوعي')}</h1>
          <p className="text-white/40 text-sm">
            {t('Your cinematic week in review', 'مراجعة أسبوعك السينمائي')}
          </p>
        </motion.div>

        {/* This week snapshot */}
        <motion.div
          className="glass rounded-2xl p-6 border border-cinema-accent/20 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">{t('This Week', 'هذا الأسبوع')}</h2>
              <p className="text-xs text-white/40">{weekStart} → {weekEnd}</p>
            </div>
            <motion.button
              onClick={generateThisWeek}
              disabled={generating}
              className="cinema-btn flex items-center gap-2 text-sm"
              whileHover={{ scale: 1.03 }}
            >
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('Generating…', 'جارٍ الإنشاء…')}</>
              ) : (
                <>✨ {currentWeekSummary ? t('Regenerate', 'إعادة إنشاء') : t('Generate Summary', 'إنشاء الملخص')}</>
              )}
            </motion.button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {[
              { label: t('Titles Watched', 'عناوين شاهدتها'), value: thisWeekWatched.length, icon: '🎬' },
              { label: t('Hours Watched',  'ساعات المشاهدة'),  value: totalHoursThisWeek + 'h', icon: '⏱' },
              { label: t('Top Genre',      'أكثر نوع'),        value: topGenreThisWeek, icon: '🏷' },
              { label: t('Current Mood',   'المزاج الحالي'),    value: mood, icon: '🎭' },
            ].map((s, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-lg font-black text-white truncate">{s.value}</div>
                <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* This week posters */}
          {thisWeekWatched.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {thisWeekWatched.slice(0, 12).map(item => (
                <div key={item.id} className="flex-shrink-0 w-14 h-20 rounded-lg overflow-hidden border border-white/10">
                  {item.poster_path ? (
                    <img src={`${POSTER_MD}${item.poster_path}`} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-xl">🎬</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm">{t('No titles watched this week yet.', 'لم تشاهد أي عناوين هذا الأسبوع بعد.')}</p>
          )}
        </motion.div>

        {/* Generated summary */}
        <AnimatePresence>
          {(activeSummary || currentWeekSummary) && (
            <motion.div
              className="glass rounded-2xl p-6 border border-white/10 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">✨</span>
                <h3 className="font-bold text-cinema-accent">{t('AI Cinematic Reflection', 'التأمل السينمائي بالذكاء الاصطناعي')}</h3>
              </div>
              <p className="text-white/70 leading-relaxed whitespace-pre-line">
                {(activeSummary || currentWeekSummary)?.ai_message || t('No summary yet.', 'لا يوجد ملخص بعد.')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Past weeks */}
        {loadingSummaries ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        ) : summaries.length > 0 ? (
          <section>
            <h2 className="text-lg font-bold text-white mb-4">{t('Past Weeks', 'الأسابيع الماضية')}</h2>
            <div className="space-y-3">
              {summaries.map(s => (
                <motion.button
                  key={s.id}
                  onClick={() => setActiveSummary(activeSummary?.id === s.id ? null : s)}
                  className={`w-full glass rounded-2xl p-4 border text-left transition-all ${
                    activeSummary?.id === s.id ? 'border-cinema-accent/40' : 'border-white/10 hover:border-white/20'
                  }`}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {s.week_start} → {s.week_end}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        {s.new_titles_count} {t('titles', 'عنوان')} · {s.total_hours}h · {s.top_genre}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Poster strip */}
                      <div className="flex gap-1">
                        {(s.titles_watched || []).slice(0, 3).map((tw, i) => (
                          <div key={i} className="w-8 h-10 rounded overflow-hidden">
                            {tw.poster_path ? (
                              <img src={`${POSTER_MD}${tw.poster_path}`} alt={tw.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-white/10" />
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-white/30 text-sm">{activeSummary?.id === s.id ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {activeSummary?.id === s.id && s.ai_message && (
                      <motion.p
                        className="text-xs text-white/50 mt-3 leading-relaxed line-clamp-4 italic"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {s.ai_message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-16 text-white/30">
            <div className="text-5xl mb-4">📅</div>
            <p>{t('Generate your first weekly summary above!', 'أنشئ ملخصك الأسبوعي الأول أعلاه!')}</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
