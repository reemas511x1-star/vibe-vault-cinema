import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';

const moodPresets = [
  { name: 'Masculine Dark', icon: '🌑', color: '#6c5ce7' },
  { name: 'Light', icon: '☀️', color: '#fdcb6e' },
  { name: 'Feminine Vibrant', icon: '🌸', color: '#fd79a8' },
  { name: 'Feminine Soft', icon: '🌷', color: '#fab1d3' },
  { name: 'Neutral', icon: '🌫️', color: '#a29bfe' },
  { name: 'Dark', icon: '🌒', color: '#2d3436' },
];

const weatherOptions = [
  { name: 'Sunny', icon: '☀️', color: '#fdcb6e' },
  { name: 'Stormy', icon: '⛈️', color: '#636e72' },
  { name: 'Cloudy', icon: '☁️', color: '#b2bec3' },
  { name: 'Rainy', icon: '🌧️', color: '#74b9ff' },
  { name: 'Sandstorm', icon: '🌪️', color: '#e17055' },
  { name: 'Blizzard', icon: '❄️', color: '#dfe6e9' },
  { name: 'Thunder & Lightning', icon: '⚡', color: '#fdcb6e' },
  { name: 'Night Rain', icon: '🌃', color: '#6c5ce7' },
  { name: 'Morning Rain', icon: '🌦️', color: '#81ecec' },
  { name: 'Autumn', icon: '🍂', color: '#e17055' },
];

export default function MoodPicker() {
  const [open, setOpen] = useState(false);
  const { mood, weather, setMood, setWeather, language } = useApp();
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentIcon = weather
    ? weatherOptions.find(w => w.name === weather)?.icon || '🌡️'
    : moodPresets.find(m => m.name === mood)?.icon || '🌑';

  const t = (en, ar) => language === 'ar' ? ar : en;

  return (
    <div className="relative" ref={ref}>
      <motion.button
        onClick={() => setOpen(!open)}
        className="relative flex items-center gap-2 px-3 py-2 rounded-xl glass hover:border-cinema-accent/40 transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={t('Mood & Atmosphere', 'المزاج والأجواء')}
      >
        <span className="text-xl">{currentIcon}</span>
        <span className="text-xs text-white/50 hidden sm:block">{t('Vibe', 'الأجواء')}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 glass-dark rounded-2xl p-4 z-50 shadow-2xl"
            style={{
              width: '280px',
              right: language === 'ar' ? 'auto' : '0',
              left: language === 'ar' ? '0' : 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(108,92,231,0.2)',
            }}
          >
            {/* Mood Presets */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                {t('Mood Preset', 'نمط المزاج')}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {moodPresets.map(preset => (
                  <motion.button
                    key={preset.name}
                    onClick={() => { setMood(preset.name); setWeather(null); setOpen(false); }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200"
                    style={{
                      background: mood === preset.name && !weather
                        ? `rgba(${hexToRgb(preset.color)}, 0.2)`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${mood === preset.name && !weather ? preset.color + '60' : 'transparent'}`,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-lg">{preset.icon}</span>
                    <span className="text-[10px] text-white/60 text-center leading-tight">{preset.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="section-divider mb-4" />

            {/* Weather */}
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                {t('Weather Atmosphere', 'أجواء الطقس')}
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {weatherOptions.map(w => (
                  <motion.button
                    key={w.name}
                    onClick={() => { setWeather(w.name); setOpen(false); }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200"
                    style={{
                      background: weather === w.name
                        ? `rgba(${hexToRgb(w.color)}, 0.2)`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${weather === w.name ? w.color + '60' : 'transparent'}`,
                    }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    title={w.name}
                  >
                    <span className="text-base">{w.icon}</span>
                    <span className="text-[8px] text-white/50 text-center leading-tight">{w.name.split(' ')[0]}</span>
                  </motion.button>
                ))}
              </div>
              {weather && (
                <motion.button
                  onClick={() => { setWeather(null); }}
                  className="mt-2 w-full text-xs text-white/40 hover:text-white/70 transition-colors py-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {t('✕ Clear weather effect', '✕ إزالة تأثير الطقس')}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : '108,92,231';
}
