import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { POSTER_MD } from '../../lib/tmdb';
import StarRating from './StarRating';

const STATUS_COLORS = {
  watched: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  watching: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  planned: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const STATUS_LABELS = {
  watched: { en: 'Watched', ar: 'شاهدت' },
  watching: { en: 'Watching', ar: 'أشاهد' },
  planned: { en: 'Plan to Watch', ar: 'سأشاهد' },
};

const TYPE_LABELS = {
  movie: { en: 'Movie', ar: 'فيلم' },
  tv: { en: 'Series', ar: 'مسلسل' },
  anime: { en: 'Anime', ar: 'أنمي' },
};

export default function MediaCard({ item, showActions = true, compact = false }) {
  const { language, addToLibrary, updateLibraryItem, removeFromLibrary, library } = useApp();
  const { user } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const t = (en, ar) => language === 'ar' ? ar : en;

  const inLibrary = library.find(l => l.tmdb_id === (item.tmdb_id || item.id) && l.media_type === item.media_type);
  const poster = item.poster_path ? `${POSTER_MD}${item.poster_path}` : null;
  const year = item.year || (item.release_date || item.first_air_date || '').split('-')[0];
  const type = item.media_type || 'movie';
  const title = item.title || item.name || 'Unknown';
  const rating = inLibrary?.rating ?? item.vote_average;
  const displayRating = rating ? (inLibrary?.rating ? rating : (rating / 2).toFixed(1)) : null;

  async function handleQuickAdd() {
    if (!user) return;
    setAddLoading(true);
    await addToLibrary({
      tmdb_id: item.tmdb_id || item.id,
      media_type: type,
      title,
      original_title: item.original_title || item.original_name,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      year,
      vote_average: item.vote_average,
      genres: item.genres?.map(g => g.name) || [],
      genre_ids: item.genre_ids || [],
      overview: item.overview,
      status: 'planned',
    });
    setAddLoading(false);
  }

  const linkPath = `/title/${type}/${item.tmdb_id || item.id}`;

  if (compact) {
    return (
      <motion.div
        className="glass rounded-xl overflow-hidden flex gap-3 p-2"
        whileHover={{ scale: 1.02 }}
      >
        <Link to={linkPath}>
          <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
            {poster ? (
              <img src={poster} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={linkPath}>
            <p className="text-sm font-semibold text-white truncate hover:text-cinema-accent transition-colors">{title}</p>
          </Link>
          <p className="text-xs text-white/40 mt-0.5">{year} · {TYPE_LABELS[type]?.[language] || type}</p>
          {displayRating && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-yellow-400 text-xs">★</span>
              <span className="text-xs text-white/60">{displayRating}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative group cursor-pointer"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
    >
      {/* Card */}
      <div className="glass rounded-xl overflow-hidden border border-white/8 transition-all duration-300 group-hover:border-cinema-accent/30 group-hover:shadow-[0_0_30px_rgba(108,92,231,0.15)]">
        {/* Poster */}
        <Link to={linkPath}>
          <div className="relative aspect-[2/3] bg-white/5 overflow-hidden">
            {poster ? (
              <img
                src={poster}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/20">
                <span className="text-5xl">🎬</span>
                <span className="text-xs">No poster</span>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Status badge */}
            {inLibrary && (
              <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[inLibrary.status]}`}>
                {STATUS_LABELS[inLibrary.status]?.[language]}
              </div>
            )}

            {/* Type badge */}
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium bg-black/50 text-white/70 border border-white/10">
              {TYPE_LABELS[type]?.[language] || type}
            </div>

            {/* Rating on poster */}
            {displayRating && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-sm font-bold text-white">{displayRating}</span>
              </div>
            )}

            {/* Rewatch badge */}
            {inLibrary?.will_rewatch && (
              <div className="absolute bottom-2 right-2 text-xs bg-cinema-accent/80 text-white px-1.5 py-0.5 rounded-full">
                🔁
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="p-3">
          <Link to={linkPath}>
            <h3 className="font-semibold text-sm text-white leading-tight line-clamp-2 hover:text-cinema-accent transition-colors mb-1">
              {title}
            </h3>
          </Link>

          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">{year}</span>

            {/* Genre tags */}
            {item.genres && item.genres.length > 0 && (
              <div className="flex gap-1">
                {item.genres.slice(0, 1).map((g, i) => (
                  <span key={i} className="text-xs text-white/50 bg-white/5 px-1.5 py-0.5 rounded">
                    {typeof g === 'string' ? g : g.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Episode progress for watching */}
          {inLibrary?.status === 'watching' && inLibrary.current_episode && (
            <div className="mt-2 text-xs text-blue-400">
              S{inLibrary.current_season} E{inLibrary.current_episode}
              {inLibrary.total_episodes ? ` / ${inLibrary.total_episodes}` : ''}
            </div>
          )}
        </div>
      </div>

      {/* Quick-add button — shown on hover if not in library */}
      {showActions && !inLibrary && user && (
        <motion.button
          className="absolute bottom-16 right-2 w-8 h-8 rounded-full bg-cinema-accent flex items-center justify-center text-white shadow-lg z-10"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.7 }}
          transition={{ duration: 0.2 }}
          onClick={handleQuickAdd}
          disabled={addLoading}
          title={t('Add to library', 'أضف إلى المكتبة')}
        >
          {addLoading ? (
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-sm font-bold">+</span>
          )}
        </motion.button>
      )}
    </motion.div>
  );
}
