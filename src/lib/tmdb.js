const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
export const IMG_BASE = 'https://image.tmdb.org/t/p/';
export const POSTER_SM = `${IMG_BASE}w185`;
export const POSTER_MD = `${IMG_BASE}w342`;
export const POSTER_LG = `${IMG_BASE}w500`;
export const POSTER_XL = `${IMG_BASE}w780`;
export const BACKDROP_MD = `${IMG_BASE}w780`;
export const BACKDROP_LG = `${IMG_BASE}w1280`;
export const BACKDROP_XL = `${IMG_BASE}original`;
export const PROFILE_MD = `${IMG_BASE}w185`;
export const PROFILE_LG = `${IMG_BASE}w342`;

const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 min cache

async function tmdbFetch(endpoint, params = {}, lang = 'en-US') {
  const searchParams = new URLSearchParams({
    api_key: API_KEY,
    language: lang,
    ...params,
  });
  const url = `${TMDB_BASE}${endpoint}?${searchParams}`;
  const cacheKey = url;

  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < TTL) return data;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  const data = await res.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

// Search multi (movies + series + anime)
export async function searchMulti(query, lang = 'en-US', page = 1) {
  return tmdbFetch('/search/multi', { query, page, include_adult: false }, lang);
}

// Search specifically
export async function searchMovies(query, lang = 'en-US') {
  return tmdbFetch('/search/movie', { query, include_adult: false }, lang);
}

export async function searchTV(query, lang = 'en-US') {
  return tmdbFetch('/search/tv', { query, include_adult: false }, lang);
}

// Get movie details
export async function getMovieDetails(id, lang = 'en-US') {
  return tmdbFetch(`/movie/${id}`, { append_to_response: 'credits,similar,videos,images,keywords,recommendations' }, lang);
}

// Get TV details
export async function getTVDetails(id, lang = 'en-US') {
  return tmdbFetch(`/tv/${id}`, { append_to_response: 'credits,similar,videos,images,keywords,recommendations,content_ratings' }, lang);
}

// Get TV season details
export async function getTVSeason(id, seasonNum, lang = 'en-US') {
  return tmdbFetch(`/tv/${id}/season/${seasonNum}`, {}, lang);
}

// Get person details
export async function getPersonDetails(id, lang = 'en-US') {
  return tmdbFetch(`/person/${id}`, { append_to_response: 'combined_credits,images,external_ids' }, lang);
}

// Discover anime (Japanese animation)
export async function discoverAnime(lang = 'en-US', page = 1) {
  return tmdbFetch('/discover/tv', {
    with_genres: '16',
    with_original_language: 'ja',
    sort_by: 'popularity.desc',
    page,
  }, lang);
}

// Trending
export async function getTrending(mediaType = 'all', timeWindow = 'week', lang = 'en-US') {
  return tmdbFetch(`/trending/${mediaType}/${timeWindow}`, {}, lang);
}

// Popular
export async function getPopularMovies(lang = 'en-US') {
  return tmdbFetch('/movie/popular', { page: 1 }, lang);
}

export async function getPopularTV(lang = 'en-US') {
  return tmdbFetch('/tv/popular', { page: 1 }, lang);
}

// Genre lists
export async function getMovieGenres(lang = 'en-US') {
  return tmdbFetch('/genre/movie/list', {}, lang);
}

export async function getTVGenres(lang = 'en-US') {
  return tmdbFetch('/genre/tv/list', {}, lang);
}

// Discover by genre
export async function discoverByGenre(mediaType, genreId, lang = 'en-US', page = 1) {
  return tmdbFetch(`/discover/${mediaType}`, { with_genres: genreId, page }, lang);
}

// Get runtime estimate
export function getRuntime(item) {
  if (item.runtime) return item.runtime;
  if (item.episode_run_time && item.episode_run_time.length > 0) return item.episode_run_time[0];
  return 90;
}

export function formatRuntime(mins) {
  if (!mins) return 'N/A';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Detect if content is anime
export function isAnime(item) {
  return (
    item.original_language === 'ja' &&
    item.genre_ids?.includes(16)
  );
}

export function getMediaType(item) {
  if (item.media_type) {
    if (item.media_type === 'tv' && isAnime(item)) return 'anime';
    return item.media_type;
  }
  if (item.title) return 'movie';
  if (item.name) {
    if (isAnime(item)) return 'anime';
    return 'tv';
  }
  return 'movie';
}

export function getTitle(item) {
  return item.title || item.name || 'Unknown Title';
}

export function getYear(item) {
  const date = item.release_date || item.first_air_date || '';
  return date ? date.split('-')[0] : 'N/A';
}

export function getPosterUrl(path, size = POSTER_MD) {
  if (!path) return null;
  return `${size}${path}`;
}

export function getBackdropUrl(path, size = BACKDROP_LG) {
  if (!path) return null;
  return `${size}${path}`;
}

// Get recommendations by mood
export const moodGenreMap = {
  Happy: { movie: [35, 10751, 10749], tv: [35, 10751] },
  Sad: [18, 10749],
  Excited: [28, 12, 878, 53],
  Relaxed: [35, 10751, 14],
  Romantic: [10749, 35, 18],
  Adventurous: [12, 28, 14, 878],
  Nostalgic: [18, 10749, 36],
  Anxious: [53, 27, 9648],
  Bored: [28, 12, 35, 878],
  Inspired: [18, 36, 99],
  Heartbroken: [18, 10749],
  Pumped: [28, 878, 53, 80],
};

export async function getMoodRecommendations(mood, type = 'movie', lang = 'en-US') {
  const genres = moodGenreMap[mood] || [28, 35];
  const genreList = Array.isArray(genres) ? genres : (genres[type] || genres.movie || genres);
  const mediaType = type === 'anime' ? 'tv' : type;
  
  let params = { with_genres: genreList.slice(0, 2).join(','), sort_by: 'vote_average.desc', 'vote_count.gte': 100 };
  if (type === 'anime') params.with_original_language = 'ja';
  
  return tmdbFetch(`/discover/${mediaType}`, params, lang);
}
