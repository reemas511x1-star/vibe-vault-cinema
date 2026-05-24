import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { generateTasteSummary } from '../lib/openai';
import PageWrapper from '../components/shared/PageWrapper';

const PRESET_AVATARS = ['🎬', '🎭', '🍿', '🎥', '🎦', '🌟', '🏆', '🎞', '🎪', '🎠', '🦁', '🐉'];

export default function ProfilePage() {
  const { user, profile, updateProfile, updatePassword } = useAuth();
  const { language, library, watchedList, totalWatchHours, showToast } = useApp();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isPublic, setIsPublic] = useState(profile?.is_public || false);
  const [uploading, setUploading] = useState(false);
  const [tasteSummary, setTasteSummary] = useState(profile?.taste_summary || '');
  const [generatingTaste, setGeneratingTaste] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showNetflixImport, setShowNetflixImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const fileRef = useRef();
  const t = (en, ar) => language === 'ar' ? ar : en;

  const avatar = profile?.avatar_url;
  const isEmoji = avatar && !avatar.startsWith('http');
  const totalHours = Math.round(totalWatchHours / 60);

  async function handleSaveProfile() {
    setSavingProfile(true);
    const { error } = await updateProfile({ display_name: displayName, is_public: isPublic, taste_summary: tasteSummary });
    if (error) showToast(error.message, 'error');
    else showToast(t('Profile saved!', 'تم حفظ الملف الشخصي!'), 'success');
    setSavingProfile(false);
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateProfile({ avatar_url: publicUrl + '?t=' + Date.now() });
      showToast(t('Avatar updated!', 'تم تحديث الصورة!'), 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  }

  async function setEmojiAvatar(emoji) {
    await updateProfile({ avatar_url: emoji });
    showToast(t('Avatar set!', 'تم تعيين الصورة!'), 'success');
  }

  async function handleGenerateTaste() {
    setGeneratingTaste(true);
    try {
      const summary = await generateTasteSummary(watchedList, language);
      setTasteSummary(summary);
      await updateProfile({ taste_summary: summary });
    } finally {
      setGeneratingTaste(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { showToast(t('Passwords do not match', 'كلمتا المرور غير متطابقتين'), 'error'); return; }
    if (newPassword.length < 6) { showToast(t('Password must be at least 6 characters', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'), 'error'); return; }
    setSavingPassword(true);
    const { error } = await updatePassword(newPassword);
    if (error) showToast(error.message, 'error');
    else { showToast(t('Password changed!', 'تم تغيير كلمة المرور!'), 'success'); setNewPassword(''); setConfirmPassword(''); }
    setSavingPassword(false);
  }

  async function handleNetflixImport(e) {
    e.preventDefault();
    if (!importFile) return;
    setImportStatus(t('Parsing CSV…', 'جارٍ تحليل الملف…'));

    const text = await importFile.text();
    const lines = text.split('\n').slice(1).filter(l => l.trim());
    setImportStatus(t(`Found ${lines.length} rows. Processing…`, `تم العثور على ${lines.length} سطراً. جارٍ المعالجة…`));

    await supabase.from('netflix_imports').insert([{
      user_id: user.id,
      filename: importFile.name,
      total_rows: lines.length,
      status: 'completed',
    }]);

    setImportStatus(t(`Import logged! ${lines.length} titles from your Netflix history recorded. You can now search and manually add them to your library.`, `تم تسجيل الاستيراد! تم تسجيل ${lines.length} عنواناً من سجل Netflix الخاص بك. يمكنك الآن البحث عنها وإضافتها يدوياً.`));
  }

  const shareUrl = isPublic && profile?.public_slug
    ? `${window.location.origin}/user/${profile.public_slug}`
    : null;

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20">
        {/* Header */}
        <motion.div className="mb-10 flex items-center gap-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 bg-white/5 flex items-center justify-center text-4xl">
            {avatar && !isEmoji ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{isEmoji ? avatar : '🎬'}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{profile?.display_name || user?.email?.split('@')[0]}</h1>
            <p className="text-white/40 text-sm">{user?.email}</p>
            <p className="text-xs text-white/30 mt-1">
              {watchedList.length} {t('watched', 'شاهدت')} · {totalHours}h {t('total', 'إجمالي')}
            </p>
          </div>
        </motion.div>

        {/* Section: Avatar */}
        <Section title={t('Avatar', 'الصورة الشخصية')} icon="👤">
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_AVATARS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setEmojiAvatar(emoji)}
                className={`w-10 h-10 rounded-xl text-xl transition-all hover:scale-110 ${avatar === emoji ? 'bg-cinema-accent/20 border border-cinema-accent/50' : 'glass border border-white/10'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleAvatarUpload} />
            <motion.button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="cinema-btn-ghost flex items-center gap-2 text-sm"
              whileHover={{ scale: 1.03 }}
            >
              {uploading ? (
                <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />{t('Uploading…', 'جارٍ الرفع…')}</>
              ) : (
                <>📷 {t('Upload photo or GIF', 'ارفع صورة أو GIF')}</>
              )}
            </motion.button>
          </div>
        </Section>

        {/* Section: Profile */}
        <Section title={t('Profile', 'الملف الشخصي')} icon="✏️">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 block mb-1.5">{t('Display Name', 'الاسم المعروض')}</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full glass border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white bg-transparent focus:outline-none focus:border-cinema-accent/50"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isPublic ? 'bg-cinema-accent border-cinema-accent' : 'border-white/20'}`}
                onClick={() => setIsPublic(!isPublic)}
              >
                {isPublic && <span className="text-xs text-white">✓</span>}
              </div>
              <span className="text-sm text-white/60">{t('Make profile public (shareable link)', 'اجعل الملف الشخصي عاماً (رابط مشاركة)')}</span>
            </label>

            {isPublic && shareUrl && (
              <div className="flex items-center gap-2 glass rounded-xl p-3 border border-white/10">
                <span className="text-xs text-white/40 flex-1 truncate">{shareUrl}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(shareUrl); showToast(t('Copied!', 'تم النسخ!'), 'success'); }}
                  className="text-xs text-cinema-accent hover:opacity-80"
                >
                  {t('Copy', 'نسخ')}
                </button>
              </div>
            )}

            <motion.button onClick={handleSaveProfile} disabled={savingProfile} className="cinema-btn w-full" whileHover={{ scale: 1.02 }}>
              {savingProfile ? t('Saving…', 'جارٍ الحفظ…') : t('Save Profile', 'حفظ الملف')}
            </motion.button>
          </div>
        </Section>

        {/* Section: AI Taste */}
        <Section title={t('AI Taste Summary', 'ملخص الذوق بالذكاء الاصطناعي')} icon="✨">
          {tasteSummary && (
            <p className="text-sm text-white/60 leading-relaxed mb-4 italic">{tasteSummary}</p>
          )}
          <motion.button
            onClick={handleGenerateTaste}
            disabled={generatingTaste || watchedList.length === 0}
            className="cinema-btn-ghost flex items-center gap-2 text-sm"
            whileHover={{ scale: 1.03 }}
          >
            {generatingTaste ? (
              <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />{t('Analyzing…', 'جارٍ التحليل…')}</>
            ) : (
              <>✨ {tasteSummary ? t('Regenerate', 'إعادة إنشاء') : t('Generate My Taste Profile', 'إنشاء ملف الذوق الخاص بي')}</>
            )}
          </motion.button>
          {watchedList.length === 0 && (
            <p className="text-xs text-white/30 mt-2">{t('Watch some titles first!', 'شاهد بعض العناوين أولاً!')}</p>
          )}
        </Section>

        {/* Section: Netflix Import */}
        <Section title={t('Netflix Import', 'استيراد Netflix')} icon="🔴">
          <div className="space-y-3 text-sm text-white/60">
            <p>{t(
              'Import your Netflix viewing history. Download your data from Netflix (Account → Privacy → Download your personal info) and upload the ViewingActivity.csv file.',
              'استورد سجل مشاهدتك من Netflix. نزّل بياناتك من Netflix (الحساب → الخصوصية → تنزيل معلوماتك الشخصية) وارفع ملف ViewingActivity.csv.'
            )}</p>
            <p className="text-xs text-white/30">
              🔒 {t('Your Netflix credentials are never stored. Only the CSV data.', 'لا يتم تخزين بيانات اعتماد Netflix الخاصة بك. البيانات من ملف CSV فقط.')}
            </p>

            {!showNetflixImport ? (
              <motion.button onClick={() => setShowNetflixImport(true)} className="cinema-btn-ghost text-sm flex items-center gap-2" whileHover={{ scale: 1.03 }}>
                🔴 {t('Import from Netflix CSV', 'استيراد من CSV Netflix')}
              </motion.button>
            ) : (
              <form onSubmit={handleNetflixImport} className="space-y-3">
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => setImportFile(e.target.files?.[0] || null)}
                  className="block text-xs text-white/50 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-cinema-accent/20 file:text-cinema-accent hover:file:bg-cinema-accent/30 cursor-pointer"
                />
                {importFile && (
                  <motion.button type="submit" className="cinema-btn text-sm" whileHover={{ scale: 1.02 }}>
                    {t('Import', 'استيراد')}
                  </motion.button>
                )}
                {importStatus && <p className="text-xs text-white/50 leading-relaxed">{importStatus}</p>}
              </form>
            )}
          </div>
        </Section>

        {/* Section: Password */}
        {!user?.app_metadata?.provider || user.app_metadata.provider === 'email' ? (
          <Section title={t('Change Password', 'تغيير كلمة المرور')} icon="🔑">
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={t('New password', 'كلمة المرور الجديدة')}
                className="w-full glass border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 bg-transparent focus:outline-none focus:border-cinema-accent/50"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={t('Confirm new password', 'تأكيد كلمة المرور')}
                className="w-full glass border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 bg-transparent focus:outline-none focus:border-cinema-accent/50"
              />
              <motion.button type="submit" disabled={savingPassword} className="cinema-btn text-sm" whileHover={{ scale: 1.02 }}>
                {savingPassword ? t('Changing…', 'جارٍ التغيير…') : t('Change Password', 'تغيير كلمة المرور')}
              </motion.button>
            </form>
          </Section>
        ) : null}
      </div>
    </PageWrapper>
  );
}

function Section({ title, icon, children }) {
  return (
    <motion.div
      className="glass rounded-2xl p-6 border border-white/10 mb-5"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="flex items-center gap-2 text-base font-bold text-white mb-5">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </motion.div>
  );
}
