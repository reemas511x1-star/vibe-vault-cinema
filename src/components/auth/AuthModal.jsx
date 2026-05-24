import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('signin'); // signin | signup | forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { language } = useApp();

  const t = (en, ar) => language === 'ar' ? ar : en;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, displayName);
        if (error) setError(error.message);
        else {
          setMessage(t('Check your email to verify your account!', 'تحقق من بريدك الإلكتروني لتأكيد حسابك!'));
          setMode('signin');
        }
      } else if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
        else onClose();
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) setError(error.message);
        else setMessage(t('Password reset email sent!', 'تم إرسال رابط إعادة تعيين كلمة المرور!'));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.4, type: 'spring', damping: 25 }}
        >
          {/* Animated border */}
          <div
            className="rounded-2xl p-px"
            style={{
              background: 'linear-gradient(135deg, rgba(108,92,231,0.6), rgba(253,121,168,0.4), rgba(108,92,231,0.6))',
            }}
          >
            <div
              className="rounded-2xl p-8"
              style={{ background: 'rgba(10,10,18,0.97)', backdropFilter: 'blur(40px)' }}
            >
              {/* Logo */}
              <div className="text-center mb-8">
                <motion.div
                  className="inline-flex items-center gap-2 mb-3"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}>
                    🎬
                  </div>
                  <span className="text-xl font-bold text-gradient-cinema">Vibe Vault</span>
                </motion.div>
                <motion.h2
                  className="text-2xl font-bold text-white mb-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {mode === 'signin' && t('Welcome Back', 'مرحباً بعودتك')}
                  {mode === 'signup' && t('Join the Cinema', 'انضم إلى عالم السينما')}
                  {mode === 'forgot' && t('Reset Password', 'إعادة تعيين كلمة المرور')}
                </motion.h2>
                <p className="text-white/40 text-sm">
                  {mode === 'signin' && t('Your cinematic universe awaits', 'كونك السينمائي بانتظارك')}
                  {mode === 'signup' && t('Track every frame of your life', 'سجّل كل لحظة سينمائية')}
                  {mode === 'forgot' && t('We\'ll send you a reset link', 'سنرسل لك رابط إعادة التعيين')}
                </p>
              </div>

              {/* Google OAuth */}
              {mode !== 'forgot' && (
                <motion.button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl mb-6 transition-all duration-300 font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                  whileHover={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('Continue with Google', 'المتابعة بحساب Google')}
                </motion.button>
              )}

              {mode !== 'forgot' && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-sm">{t('or', 'أو')}</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">{t('Display Name', 'الاسم')}</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="cinema-input"
                      placeholder={t('Your name', 'اسمك')}
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">{t('Email', 'البريد الإلكتروني')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="cinema-input"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                {mode !== 'forgot' && (
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">{t('Password', 'كلمة المرور')}</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="cinema-input"
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                  </div>
                )}

                {error && (
                  <motion.p
                    className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
                {message && (
                  <motion.p
                    className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {message}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-white font-semibold py-3"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      {t('Loading...', 'جارٍ التحميل...')}
                    </span>
                  ) : (
                    <>
                      {mode === 'signin' && t('Sign In', 'تسجيل الدخول')}
                      {mode === 'signup' && t('Create Account', 'إنشاء حساب')}
                      {mode === 'forgot' && t('Send Reset Link', 'إرسال رابط الإعادة')}
                    </>
                  )}
                </motion.button>
              </form>

              {/* Links */}
              <div className="mt-6 text-center space-y-2">
                {mode === 'signin' && (
                  <>
                    <button
                      onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                      className="block w-full text-sm text-white/40 hover:text-cinema-accent transition-colors"
                    >
                      {t('Forgot password?', 'نسيت كلمة المرور؟')}
                    </button>
                    <button
                      onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                      className="block w-full text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {t("Don't have an account? Sign up", "ليس لديك حساب؟ سجّل الآن")}
                    </button>
                  </>
                )}
                {mode === 'signup' && (
                  <button
                    onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                    className="block w-full text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {t('Already have an account? Sign in', 'لديك حساب؟ سجّل الدخول')}
                  </button>
                )}
                {mode === 'forgot' && (
                  <button
                    onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                    className="block w-full text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {t('Back to sign in', 'العودة لتسجيل الدخول')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
