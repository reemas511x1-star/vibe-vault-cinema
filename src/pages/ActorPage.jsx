import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPersonDetails, PROFILE_LG, POSTER_MD, PROFILE_MD } from '../lib/tmdb';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import PageWrapper from '../components/shared/PageWrapper';
import MediaCard from '../components/shared/MediaCard';

export default function ActorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, addToLibrary } = useApp();
  const { user } = useAuth();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('acting');
  const lang = language === 'ar' ? 'ar-SA' : 'en-US';
  const t = (en, ar) => language === 'ar' ? ar : en;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getPersonDetails(id, lang);
        setPerson(data);
        if (user) {
          const { data: follow } = await supabase
            .from('actor_follows')
            .select('id')
            .eq('user_id', user.id)
            .eq('tmdb_id', parseInt(id))
            .single();
          setFollowing(!!follow);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, language]);

  async function toggleFollow() {
    if (!user || !person) return;
    if (following) {
      await supabase.from('actor_follows').delete().eq('user_id', user.id).eq('tmdb_id', person.id);
      setFollowing(false);
    } else {
      await supabase.from('actor_follows').insert([{
        user_id: user.id, tmdb_id: person.id, name: person.name, profile_path: person.profile_path,
      }]);
      setFollowing(true);
    }
  }

  if (loading) return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-6 pt-10">
        <div className="skeleton h-48 w-48 rounded-full mx-auto mb-6" />
        <div className="skeleton h-8 rounded w-48 mx-auto mb-4" />
        <div className="skeleton h-4 rounded w-full mb-2" />
        <div className="skeleton h-4 rounded w-2/3 mx-auto" />
      </div>
    </PageWrapper>
  );

  if (!person) return null;

  const credits = person.combined_credits;
  const acting = credits?.cast
    ?.filter(c => c.poster_path)
    ?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
    ?.slice(0, 24) || [];
  const directing = credits?.crew
    ?.filter(c => c.job === 'Director' && c.poster_path)
    ?.slice(0, 12) || [];
  const photos = person.images?.profiles?.slice(0, 12) || [];
  const age = person.birthday
    ? Math.floor((new Date() - new Date(person.birthday)) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="mb-8 text-sm text-white/40 hover:text-white transition-colors flex items-center gap-2">
          ← {t('Back', 'رجوع')}
        </button>

        {/* Profile header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Photo */}
          <motion.div className="flex-shrink-0 mx-auto md:mx-0" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-48 h-64 md:w-56 md:h-72 rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              {person.profile_path ? (
                <img src={`${PROFILE_LG}${person.profile_path}`} alt={person.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center text-6xl">👤</div>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div className="flex-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-black text-white">{person.name}</h1>
              {user && (
                <motion.button
                  onClick={toggleFollow}
                  className={`px-5 py-2 rounded-xl text-sm font-medium border transition-all ${
                    following
                      ? 'bg-cinema-accent/20 border-cinema-accent/50 text-cinema-accent'
                      : 'glass border-white/20 text-white/60 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.03 }}
                >
                  {following ? '❤️ ' + t('Following', 'تتابع') : '🤍 ' + t('Follow', 'تابع')}
                </motion.button>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-5">
              {person.known_for_department && (
                <span className="px-3 py-1 glass rounded-full border border-white/10">{person.known_for_department}</span>
              )}
              {age && <span>{t('Age', 'العمر')}: <span className="text-white">{age}</span></span>}
              {person.birthday && <span>{t('Born', 'مواليد')}: <span className="text-white">{person.birthday}</span></span>}
              {person.place_of_birth && <span>{person.place_of_birth}</span>}
            </div>

            {person.biography && (
              <p className="text-white/60 text-sm leading-relaxed line-clamp-6">{person.biography}</p>
            )}

            <div className="flex gap-4 mt-5 text-center">
              <div className="glass rounded-xl p-3 border border-white/10 min-w-[80px]">
                <div className="text-2xl font-black text-cinema-accent">{acting.length}</div>
                <div className="text-xs text-white/40">{t('Titles', 'عنوان')}</div>
              </div>
              {person.popularity && (
                <div className="glass rounded-xl p-3 border border-white/10 min-w-[80px]">
                  <div className="text-2xl font-black text-cinema-accent">{Math.round(person.popularity)}</div>
                  <div className="text-xs text-white/40">{t('Popularity', 'الشعبية')}</div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10 mb-8">
          {[
            { key: 'acting',    label: t('Filmography', 'الأعمال'),    count: acting.length },
            ...(directing.length > 0 ? [{ key: 'directing', label: t('Directed', 'أخرجها'), count: directing.length }] : []),
            ...(photos.length > 0 ? [{ key: 'photos', label: t('Photos', 'الصور'), count: photos.length }] : []),
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-all border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === tab.key ? 'border-cinema-accent text-white' : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              {tab.label}
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'acting' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {acting.map((item, i) => (
              <motion.div key={`${item.id}-${i}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <MediaCard item={{ ...item, media_type: item.media_type === 'tv' ? 'tv' : 'movie' }} />
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'directing' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {directing.map((item, i) => (
              <motion.div key={`${item.id}-${i}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <MediaCard item={{ ...item, media_type: item.media_type === 'tv' ? 'tv' : 'movie' }} />
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo, i) => (
              <motion.div
                key={i}
                className="rounded-xl overflow-hidden aspect-[2/3]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <img
                  src={`${PROFILE_LG}${photo.file_path}`}
                  alt={person.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
