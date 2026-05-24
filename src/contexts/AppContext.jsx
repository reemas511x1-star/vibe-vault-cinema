import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AppContext = createContext({});

export function AppProvider({ children }) {
  const { user, profile } = useAuth();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguageState] = useState('en');
  const [mood, setMoodState] = useState('Masculine Dark');
  const [weather, setWeatherState] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Sync profile settings
  useEffect(() => {
    if (profile) {
      setLanguageState(profile.language || 'en');
      setMoodState(profile.mood || 'Masculine Dark');
      setWeatherState(profile.weather || null);
    }
  }, [profile]);

  // Set RTL direction
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Fetch user library
  const fetchLibrary = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('library')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setLibrary(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchLibrary();
    else setLibrary([]);
  }, [user, fetchLibrary]);

  // Subscribe to real-time library changes
  useEffect(() => {
    if (!user) return;
    
    const sub = supabase
      .channel(`library-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'library',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLibrary(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setLibrary(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
        } else if (payload.eventType === 'DELETE') {
          setLibrary(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [user]);

  // Add to library
  async function addToLibrary(titleData) {
    if (!user) return { error: { message: 'Not authenticated' } };
    
    // Check for duplicates
    const exists = library.find(item => item.tmdb_id === titleData.tmdb_id && item.media_type === titleData.media_type);
    if (exists) {
      showToast('Already in your library', 'info');
      return { data: exists, isDuplicate: true };
    }

    const { data, error } = await supabase
      .from('library')
      .insert([{
        user_id: user.id,
        ...titleData,
      }])
      .select()
      .single();

    if (data) {
      showToast(`"${titleData.title}" added to library!`, 'success');
    }
    return { data, error };
  }

  // Update library item
  async function updateLibraryItem(id, updates) {
    const { data, error } = await supabase
      .from('library')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    return { data, error };
  }

  // Remove from library
  async function removeFromLibrary(id) {
    const { error } = await supabase
      .from('library')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (!error) showToast('Removed from library', 'info');
    return { error };
  }

  // Language setter with profile sync
  async function setLanguage(lang) {
    setLanguageState(lang);
    if (user) {
      await supabase.from('profiles').update({ language: lang }).eq('id', user.id);
    }
  }

  // Mood setter with profile sync
  async function setMood(newMood) {
    setMoodState(newMood);
    if (user) {
      await supabase.from('profiles').update({ mood: newMood }).eq('id', user.id);
    }
  }

  // Weather setter with profile sync
  async function setWeather(newWeather) {
    setWeatherState(newWeather);
    if (user) {
      await supabase.from('profiles').update({ weather: newWeather }).eq('id', user.id);
    }
  }

  // Toast system
  function showToast(message, type = 'info', duration = 3000) {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  // Recently viewed
  function addToRecentlyViewed(title) {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(t => t.tmdb_id !== title.tmdb_id);
      return [title, ...filtered].slice(0, 10);
    });
  }

  // Get filtered library
  const watchedList = library.filter(item => item.status === 'watched');
  const watchingList = library.filter(item => item.status === 'watching');
  const plannedList = library.filter(item => item.status === 'planned');

  // Stats
  const totalWatchHours = watchedList.reduce((acc, item) => {
    const runtime = item.runtime || (item.media_type === 'movie' ? 110 : 45);
    const eps = item.current_episode || 1;
    const mins = item.media_type === 'movie' ? runtime : runtime * eps;
    return acc + mins;
  }, 0);

  // Wishlist functions
  async function addWishlistItem(item) {
    if (!user) return;
    const { data, error } = await supabase
      .from('wishlist')
      .insert([{ user_id: user.id, ...item }])
      .select()
      .single();
    return { data, error };
  }

  async function fetchWishlist() {
    if (!user) return { data: [] };
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return { data, error };
  }

  async function updateWishlistItem(id, updates) {
    const { data, error } = await supabase
      .from('wishlist')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    return { data, error };
  }

  return (
    <AppContext.Provider value={{
      library,
      watchedList,
      watchingList,
      plannedList,
      loading,
      language,
      mood,
      weather,
      toasts,
      recentlyViewed,
      totalWatchHours,
      fetchLibrary,
      addToLibrary,
      updateLibraryItem,
      removeFromLibrary,
      setLanguage,
      setMood,
      setWeather,
      showToast,
      removeToast,
      addToRecentlyViewed,
      addWishlistItem,
      fetchWishlist,
      updateWishlistItem,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
