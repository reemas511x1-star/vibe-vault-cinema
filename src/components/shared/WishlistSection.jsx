import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import StarRating from './StarRating';

const TYPES = [
  { value: 'note',             en: 'Personal Note',      ar: 'ملاحظة شخصية'     },
  { value: 'feature_request',  en: 'Feature Request',    ar: 'طلب ميزة'          },
  { value: 'improvement',      en: 'Improvement Idea',   ar: 'فكرة تحسين'        },
  { value: 'experience_rating',en: 'Rate Feature',       ar: 'تقييم ميزة'        },
];

const AREAS = ['Search', 'Stats', 'Mood System', 'AI Features', 'Weekly Summary', 'Library', 'UI/Design', 'Other'];

export default function WishlistSection({ titleId, titleName }) {
  const { language, addWishlistItem, fetchWishlist, updateWishlistItem } = useApp();
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'note', title: '', content: '', feature_area: '', experience_rating: 0, status: 'pending' });
  const [saving, setSaving] = useState(false);
  const t = (en, ar) => language === 'ar' ? ar : en;

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const { data } = await fetchWishlist();
    setItems(data || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await addWishlistItem({
      ...form,
      experience_rating: form.experience_rating || null,
    });
    setForm({ type: 'note', title: '', content: '', feature_area: '', experience_rating: 0, status: 'pending' });
    setShowForm(false);
    await loadItems();
    setSaving(false);
  }

  async function toggleStatus(item) {
    const newStatus = item.status === 'done' ? 'pending' : 'done';
    await updateWishlistItem(item.id, { status: newStatus });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
  }

  const statusColors = {
    pending:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
    done:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    in_review: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };

  const typeIcons = {
    note: '📝',
    feature_request: '✨',
    improvement: '🔧',
    experience_rating: '⭐',
  };

  return (
    <section className="mt-10 glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h2 className="text-lg font-bold text-white">{t('My Wishlist & Ideas', 'قائمة أمنياتي وأفكاري')}</h2>
            <p className="text-xs text-white/40">{t('Personal notes & app improvement ideas', 'ملاحظاتك الشخصية وأفكار تحسين التطبيق')}</p>
          </div>
        </div>
        <motion.button
          onClick={() => setShowForm(!showForm)}
          className="cinema-btn text-sm py-2 px-4"
          whileHover={{ scale: 1.03 }}
        >
          {showForm ? t('Cancel', 'إلغاء') : '+ ' + t('Add Idea', 'أضف فكرة')}
        </motion.button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleSubmit}
            className="mb-6 glass rounded-xl p-5 border border-cinema-accent/20 space-y-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 block mb-1.5">{t('Type', 'النوع')}</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full glass border border-white/10 rounded-xl px-3 py-2 text-sm text-white bg-transparent"
                >
                  {TYPES.map(tp => (
                    <option key={tp.value} value={tp.value} className="bg-cinema-dark">
                      {t(tp.en, tp.ar)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1.5">{t('Feature Area', 'مجال الميزة')}</label>
                <select
                  value={form.feature_area}
                  onChange={e => setForm(f => ({ ...f, feature_area: e.target.value }))}
                  className="w-full glass border border-white/10 rounded-xl px-3 py-2 text-sm text-white bg-transparent"
                >
                  <option value="" className="bg-cinema-dark">{t('Select…', 'اختر…')}</option>
                  {AREAS.map(a => (
                    <option key={a} value={a} className="bg-cinema-dark">{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40 block mb-1.5">{t('Title', 'العنوان')} *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={t('Brief title for your idea…', 'عنوان مختصر لفكرتك…')}
                className="w-full glass border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 bg-transparent focus:outline-none focus:border-cinema-accent/50"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 block mb-1.5">{t('Details', 'التفاصيل')}</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder={t('Describe your idea in detail…', 'اشرح فكرتك بالتفصيل…')}
                rows={3}
                className="w-full glass border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 bg-transparent resize-none focus:outline-none focus:border-cinema-accent/50"
              />
            </div>

            {form.type === 'experience_rating' && (
              <div>
                <label className="text-xs text-white/40 block mb-2">{t('Experience Rating', 'تقييم التجربة')}</label>
                <StarRating value={form.experience_rating} onChange={v => setForm(f => ({ ...f, experience_rating: v }))} max={5} />
              </div>
            )}

            <div className="flex justify-end">
              <motion.button
                type="submit"
                disabled={saving}
                className="cinema-btn py-2 px-6"
                whileHover={{ scale: 1.02 }}
              >
                {saving ? t('Saving…', 'جاري الحفظ…') : t('Submit', 'إرسال')}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-white/30">
          <div className="text-4xl mb-3">💡</div>
          <p className="text-sm">{t('No ideas yet. Share your thoughts!', 'لا توجد أفكار بعد. شارك أفكارك!')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              className={`glass rounded-xl p-4 border transition-all ${item.status === 'done' ? 'border-emerald-500/20 opacity-70' : 'border-white/10'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xl flex-shrink-0 mt-0.5">{typeIcons[item.type] || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-semibold ${item.status === 'done' ? 'line-through text-white/40' : 'text-white'}`}>
                        {item.title}
                      </h4>
                      {item.feature_area && (
                        <span className="text-xs px-2 py-0.5 rounded-full glass border border-white/10 text-white/50">{item.feature_area}</span>
                      )}
                    </div>
                    {item.content && <p className="text-xs text-white/50 mt-1 leading-relaxed">{item.content}</p>}
                    {item.experience_rating > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: item.experience_rating }).map((_, j) => (
                          <span key={j} className="text-yellow-400 text-xs">★</span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-white/25 mt-2">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusColors[item.status]}`}>
                    {item.status === 'done' ? t('Done', 'تم') : item.status === 'in_review' ? t('In Review', 'قيد المراجعة') : t('Pending', 'معلق')}
                  </span>
                  <button
                    onClick={() => toggleStatus(item)}
                    className="w-6 h-6 rounded-full border border-white/20 hover:border-emerald-400 flex items-center justify-center text-xs transition-all hover:bg-emerald-500/10"
                    title={t('Toggle done', 'تبديل الحالة')}
                  >
                    {item.status === 'done' ? '↩' : '✓'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
