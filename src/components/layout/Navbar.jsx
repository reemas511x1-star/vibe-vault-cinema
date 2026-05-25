import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import MoodPicker from '../weather/MoodPicker';
import SearchBar from '../shared/SearchBar';

const navLinks = [
  { to: '/', label: 'Home', labelAr: 'الرئيسية', icon: '🏠' },
  { to: '/library', label: 'Library', labelAr: 'مكتبتي', icon: '📚' },
  { to: '/discover', label: 'Discover', labelAr: 'اكتشف', icon: '🔭' },
  { to: '/stats', label: 'Stats', labelAr: 'الإحصائيات', icon: '📊' },
  { to: '/watch-now', label: 'What to Watch', labelAr: 'ماذا أشاهد؟', icon: '🎯' },
  { to: '/wosh-ashof', label: 'وش أشوف؟', labelAr: 'وش أشوف؟', icon: '✨' },
];

export default function Navbar({ onAuthClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage, library } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const t = (en, ar) => language === 'ar' ? ar : en;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatar = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass-dark border-b border-white/5' : 'bg-transparent'
        }`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <motion.div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                🎬
              </motion.div>
              <span className="font-bold text-sm hidden sm:block">
                <span className="text-gradient-cinema">Vibe Vault</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1 mx-4">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to}>
                  <motion.div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                      location.pathname === link.to
                        ? 'text-white bg-cinema-accent/20 border border-cinema-accent/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-base">{link.icon}</span>
                    <span>{t(link.label, link.labelAr)}</span>
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-sm">
              <SearchBar compact />
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Language Toggle */}
              <motion.button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="px-2.5 py-1.5 rounded-lg glass text-xs font-semibold transition-all duration-200 hover:border-cinema-accent/40"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {language === 'en' ? 'عربي' : 'EN'}
              </motion.button>

              {/* Mood Picker */}
              <MoodPicker />

              {/* Auth */}
              {user ? (
                <div className="relative group">
                  <motion.button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass hover:border-cinema-accent/40 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    {avatar ? (
                      <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}>
                        {displayName[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-white/70 max-w-[80px] truncate hidden sm:block">{displayName}</span>
                    <span className="text-white/30 text-xs">▾</span>
                  </motion.button>

                  {/* Dropdown */}
                  <div className="absolute top-full mt-2 right-0 w-48 glass-dark rounded-xl p-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 shadow-2xl z-50">
                    <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      <span>👤</span> {t('Profile', 'الملف الشخصي')}
                    </Link>
                    <Link to="/library" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      <span>📚</span> {t('Library', 'مكتبتي')} ({library.length})
                    </Link>
                    <Link to="/weekly" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      <span>📅</span> {t('Weekly Summary', 'ملخص أسبوعي')}
                    </Link>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <span>🚪</span> {t('Sign Out', 'تسجيل الخروج')}
                    </button>
                  </div>
                </div>
              ) : (
                <motion.button
                  onClick={onAuthClick}
                  className="btn-primary text-white text-sm py-2 px-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('Sign In', 'دخول')}
                </motion.button>
              )}

              {/* Mobile menu */}
              <button
                className="md:hidden p-2 rounded-lg glass"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <div className={`w-4 h-0.5 bg-white mb-1 transition-all ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <div className={`w-4 h-0.5 bg-white mb-1 transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
                <div className={`w-4 h-0.5 bg-white transition-all ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="md:hidden glass-dark border-t border-white/5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-4 space-y-1">
                {navLinks.map(link => (
                  <Link key={link.to} to={link.to}>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                      location.pathname === link.to
                        ? 'text-white bg-cinema-accent/20'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}>
                      <span>{link.icon}</span>
                      {t(link.label, link.labelAr)}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
