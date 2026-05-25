import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/shared/PageWrapper';

const MOOD_TAGS = [
  { key: 'سعيد',            icon: '😄' },
  { key: 'حزين',            icon: '😢' },
  { key: 'متحمس',           icon: '🤩' },
  { key: 'بحاجة للبكاء',   icon: '😭' },
  { key: 'مرهق',            icon: '😴' },
  { key: 'مملول',           icon: '😑' },
  { key: 'قلقان',           icon: '😰' },
  { key: 'رومانسي',         icon: '💕' },
  { key: 'مغامر',           icon: '🗺' },
  { key: 'مرعوب',           icon: '😱' },
  { key: 'فضولي',           icon: '🧐' },
  { key: 'ناقم',            icon: '😤' },
  { key: 'حنين للماضي',    icon: '🌅' },
  { key: 'محتاج تحفيز',   icon: '💪' },
  { key: 'محتاج ضحك',     icon: '😂' },
];

const WATCH_TYPES = [
  { key: 'فيلم',    icon: '🎬' },
  { key: 'مسلسل',  icon: '📺' },
  { key: 'أنمي',   icon: '⛩' },
];

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function fetchGroqRecommendation(freeText, selectedMoods, selectedTypes) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('مفتاح Groq API غير موجود. أضف VITE_GROQ_API_KEY إلى ملف .env الخاص بك.');
  }

  const typesList = selectedTypes.join(' أو ');
  const moodsList = selectedMoods.join('، ');

  const prompt = `أنت خبير سينمائي عربي متحمس ومتذوق للأفلام والمسلسلات والأنمي.

المستخدم يريد توصية الليلة بناءً على المعلومات التالية:

**المزاج بكلماته الخاصة:** "${freeText || 'لم يحدد'}"
**الحالة المزاجية:** ${moodsList || 'لم يحدد'}
**نوع المحتوى المفضل:** ${typesList}

قدم توصية واحدة مثالية تناسب هذا المزاج تماماً. يجب أن تكون التوصية:
- عنواناً حقيقياً موجوداً فعلاً (فيلم، مسلسل، أو أنمي)
- مناسبة لنوع المحتوى المطلوب (${typesList})
- تتوافق تماماً مع المزاج المحدد

أجب بالتنسيق التالي فقط (JSON):
{
  "title": "اسم العنوان بالعربي أو الأصلي",
  "original_title": "الاسم الأصلي بالإنجليزي إن وجد",
  "type": "نوع المحتوى (فيلم / مسلسل / أنمي)",
  "year": "سنة الإصدار",
  "description": "وصف مختصر وجذاب للعنوان في جملتين أو ثلاث",
  "why_matches": "لماذا يناسب هذا العنوان مزاج المستخدم تحديداً؟ اشرح بحماس وعمق في 3-4 جمل",
  "mood_score": "مدى توافق التوصية مع المزاج من 1 إلى 10",
  "vibe_tag": "وسم مختصر يصف جو العمل (مثل: مشاعر عميقة، إثارة وأكشن، كوميديا سوداء...)"
}`;

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'أنت خبير سينمائي عربي. دائماً أجب بـ JSON صحيح فقط بدون أي نص إضافي خارج JSON.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 600,
      temperature: 0.85,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `خطأ Groq: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim() ?? '';

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('تعذّر تحليل رد الذكاء الاصطناعي.');
  return JSON.parse(jsonMatch[0]);
}

export default function WoshAshofPage() {
  const [freeText, setFreeText] = useState('');
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleMood(mood) {
    setSelectedMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  }

  function toggleType(type) {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!freeText.trim() && selectedMoods.length === 0) {
      setError('اكتب كيف تحس أو اختر مزاجاً واحداً على الأقل.');
      return;
    }
    if (selectedTypes.length === 0) {
      setError('اختر نوع المحتوى اللي تبيه.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const rec = await fetchGroqRecommendation(freeText, selectedMoods, selectedTypes);
      setResult(rec);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setFreeText('');
    setSelectedMoods([]);
    setSelectedTypes([]);
    setError('');
  }

  const canSubmit = (freeText.trim() || selectedMoods.length > 0) && selectedTypes.length > 0;

  return (
    <PageWrapper>
      <div className="min-h-screen" dir="rtl">
        {/* Header */}
        <div className="max-w-2xl mx-auto px-4 pt-10 pb-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-3xl"
              style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
              🎬
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 leading-tight">
              وش أشوف الليلة؟
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              قولنا كيف حالك، واحنا نختار لك التوصية المثالية
            </p>
          </motion.div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-24 space-y-6">
          {/* Step 1: Free text */}
          <motion.section
            className="glass rounded-2xl p-5 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
              ١. كيف أنت الآن؟
            </label>
            <textarea
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              placeholder="مثلاً: تعبت من الأسبوع وأبي شي يريّحني... أو: أبي شي يخليني أضحك وأنسى كل شي..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 resize-none transition-all duration-300 leading-relaxed"
              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            />
          </motion.section>

          {/* Step 2: Mood tags */}
          <motion.section
            className="glass rounded-2xl p-5 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">
              ٢. حدد مزاجك{selectedMoods.length > 0 && <span className="mr-2 text-white/40 normal-case">({selectedMoods.length} محدد)</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_TAGS.map(mood => {
                const active = selectedMoods.includes(mood.key);
                return (
                  <motion.button
                    key={mood.key}
                    type="button"
                    onClick={() => toggleMood(mood.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                      active
                        ? 'bg-sky-500/20 border-sky-400/50 text-sky-200'
                        : 'bg-white/4 border-white/10 text-white/60 hover:text-white hover:border-white/25 hover:bg-white/8'
                    }`}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>{mood.icon}</span>
                    <span>{mood.key}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>

          {/* Step 3: Content type */}
          <motion.section
            className="glass rounded-2xl p-5 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">
              ٣. إيش تبي تشوف؟
            </label>
            <div className="grid grid-cols-3 gap-3">
              {WATCH_TYPES.map(type => {
                const active = selectedTypes.includes(type.key);
                return (
                  <motion.button
                    key={type.key}
                    type="button"
                    onClick={() => toggleType(type.key)}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all duration-200 ${
                      active
                        ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200'
                        : 'bg-white/4 border-white/10 text-white/60 hover:text-white hover:border-white/25 hover:bg-white/8'
                    }`}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span className="text-sm font-semibold">{type.key}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="rounded-xl px-4 py-3 text-sm text-red-300 border border-red-500/25"
                style={{ background: 'rgba(239,68,68,0.08)' }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          {!result && (
            <motion.button
              onClick={handleSubmit}
              disabled={loading || !canSubmit}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 ${
                canSubmit && !loading
                  ? 'text-white'
                  : 'text-white/30 cursor-not-allowed'
              }`}
              style={canSubmit && !loading ? {
                background: 'linear-gradient(135deg, #0f4c75, #1b6ca8)',
                boxShadow: '0 8px 32px rgba(15,76,117,0.4)',
              } : {
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              whileHover={canSubmit && !loading ? { scale: 1.02 } : {}}
              whileTap={canSubmit && !loading ? { scale: 0.97 } : {}}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>ذكاءنا الاصطناعي يفكر لك...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span>
                  <span>وش أشوف الليلة؟</span>
                </>
              )}
            </motion.button>
          )}

          {/* Result card */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, type: 'spring', damping: 22 }}
              >
                {/* Glow border card */}
                <div
                  className="rounded-2xl p-px"
                  style={{ background: 'linear-gradient(135deg, rgba(15,76,117,0.8), rgba(27,108,168,0.5), rgba(15,76,117,0.8))' }}
                >
                  <div className="rounded-2xl p-6 space-y-5" style={{ background: 'rgba(8,12,22,0.97)' }}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                            style={{ background: 'rgba(15,76,117,0.3)', borderColor: 'rgba(27,108,168,0.5)', color: '#7ec8e3' }}>
                            {result.type}
                          </span>
                          {result.year && (
                            <span className="text-xs text-white/35">{result.year}</span>
                          )}
                          {result.vibe_tag && (
                            <span className="text-xs text-white/35 border border-white/10 px-2 py-0.5 rounded-full">
                              {result.vibe_tag}
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl font-black text-white leading-tight">
                          {result.title}
                        </h2>
                        {result.original_title && result.original_title !== result.title && (
                          <p className="text-sm text-white/35 mt-0.5" dir="ltr">{result.original_title}</p>
                        )}
                      </div>
                      {result.mood_score && (
                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl border"
                          style={{ background: 'rgba(15,76,117,0.25)', borderColor: 'rgba(27,108,168,0.4)' }}>
                          <span className="text-xl font-black text-sky-300">{result.mood_score}</span>
                          <span className="text-[9px] text-white/30 leading-tight text-center">توافق</span>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(27,108,168,0.4), transparent)' }} />

                    {/* Description */}
                    {result.description && (
                      <div>
                        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">القصة</p>
                        <p className="text-white/70 text-sm leading-relaxed">{result.description}</p>
                      </div>
                    )}

                    {/* Why it matches */}
                    {result.why_matches && (
                      <div className="rounded-xl p-4 border"
                        style={{ background: 'rgba(15,76,117,0.12)', borderColor: 'rgba(27,108,168,0.3)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">💡</span>
                          <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">ليش هذا تحديداً؟</p>
                        </div>
                        <p className="text-white/65 text-sm leading-relaxed">{result.why_matches}</p>
                      </div>
                    )}

                    {/* Selected context pills */}
                    {selectedMoods.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedMoods.map(m => {
                          const tag = MOOD_TAGS.find(t => t.key === m);
                          return (
                            <span key={m} className="text-xs px-2 py-1 rounded-full text-white/40 border border-white/8"
                              style={{ background: 'rgba(255,255,255,0.04)' }}>
                              {tag?.icon} {m}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Try again */}
                    <motion.button
                      onClick={handleReset}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-all duration-200 border border-white/10 hover:border-white/25"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      ابحث من جديد
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageWrapper>
  );
}
