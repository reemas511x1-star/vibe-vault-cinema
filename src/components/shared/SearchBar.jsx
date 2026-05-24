import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { searchMulti, getPosterUrl, POSTER_SM, getTitle, getYear, getMediaType } from '../../lib/tmdb';
import { useApp } from '../../contexts/AppContext';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchBar({ compact = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 350);
  const { language, addToLibrary, showToast } = useApp();
  const navigate = useNavigate();
  const ref = useRef(null);
  const inputRef = useRef(null);

  const t = (en, ar) => language === 'ar' ? ar : en;

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    setLoading(true);
    const lang = language === 'ar' ? 'ar-SA' : 'en-US';
    searchMulti(debouncedQuery, lang)
      .then(data => {
        const filtered = (data.results || [])
          .filter(r => r.media_type !== 'person' || r.profile_path)
          .slice(0, 8);
        setResults(filtered);
        setOpen(true);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedQuery, language]);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut K
  useEffect(() => {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function goToTitle(item) {
    setOpen(false);
    setQuery('');
    const type = getMediaType(item);
    navigate(`/title/${type}/${item.id}`);
  }

  async function quickAdd(e, item) {
    e.stopPropagation();
    const type = getMediaType(item);
    await addToLibrary({
      tmdb_id: item.id,
      title: getTitle(item),
      media_type: type,
      poster_path: item.poster_path,
      year: getYear(item),
      vote_average: item.vote_average,
      status: 'planned',
      genre_ids: item.genre_ids || [],
    });
    setOpen(false);
    setQuery('');
  }

  const mediaTypeLabel = (item) => {
    const type = getMediaType(item);
    const labels = { movie: t('Movie', 'فيلم'), tv: t('Series', 'مسلسل'), anime: t('Anime', 'أنمي'), person: t('Person', 'شخص') };
    return labels[type] || type;
  };

  const mediaTypeColor = (type) => {
    const colors = { movie: '#6c5ce7', tv: '#00b894', anime: '#e17055', person: '#fdcb6e' };
    return colors[type] || '#6c5ce7';
  };

  return (
    <div className="relative w-full" ref={ref}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className={`w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cinema-accent/50 transition-all duration-300 ${
            compact ? 'pl-9 pr-12 py-2 text-sm' : 'pl-10 pr-14 py-3'
          }`}
          placeholder={t('Search movies, series, anime... (⌘K)', 'ابحث عن أفلام، مسلسلات، أنمي...')}
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </span>
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-xs"
          >✕</button>
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            className="absolute top-full mt-2 w-full glass-dark rounded-2xl overflow-hidden z-50 shadow-2xl"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ maxHeight: '420px', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
          >
            {results.map((item, i) => {
              const type = getMediaType(item);
              const poster = getPosterUrl(item.poster_path || item.profile_path, POSTER_SM);
              return (
                <motion.div
                  key={item.id}
                  onClick={() => type === 'person' ? navigate(`/person/${item.id}`) : goToTitle(item)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-all duration-150 group"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {/* Poster */}
                  <div className="w-8 h-12 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
                    {poster ? (
                      <img src={poster} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">🎬</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{getTitle(item)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: `${mediaTypeColor(type)}20`, color: mediaTypeColor(type) }}
                      >
                        {mediaTypeLabel(item)}
                      </span>
                      {getYear(item) !== 'N/A' && (
                        <span className="text-xs text-white/30">{getYear(item)}</span>
                      )}
                      {item.vote_average > 0 && (
                        <span className="text-xs text-cinema-gold">⭐ {item.vote_average?.toFixed(1)}</span>
                      )}
                    </div>
                  </div>

                  {/* Quick add */}
                  {type !== 'person' && (
                    <motion.button
                      onClick={(e) => quickAdd(e, item)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center text-white transition-all duration-200 flex-shrink-0"
                      style={{ background: 'rgba(108,92,231,0.4)' }}
                      whileHover={{ scale: 1.1, background: 'rgba(108,92,231,0.8)' }}
                      title={t('Add to library', 'أضف للمكتبة')}
                    >
                      +
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
