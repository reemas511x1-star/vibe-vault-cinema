// ─── Groq AI Client (OpenAI-compatible API) ───────────────────────────────────
// Model: llama-3.3-70b-versatile via api.groq.com
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_BASE    = 'https://api.groq.com/openai/v1';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

const NO_KEY_EN = '✨ AI features require a Groq API key. Add VITE_GROQ_API_KEY to your .env file.';
const NO_KEY_AR = '✨ ميزات الذكاء الاصطناعي تتطلب مفتاح Groq. أضف VITE_GROQ_API_KEY إلى ملف .env.';

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function chatCompletion(messages, options = {}) {
  if (!GROQ_API_KEY) throw new Error(NO_KEY_EN);

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens:  options.maxTokens  ?? 800,
      temperature: options.temperature ?? 0.8,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

// ─── Safe wrapper — never throws to the UI ───────────────────────────────────
async function safe(messages, options = {}, fallback = '') {
  try {
    return await chatCompletion(messages, options);
  } catch (err) {
    console.warn('[Groq AI]', err.message);
    return fallback || err.message;
  }
}

// ─── Mood-based recommendation message ───────────────────────────────────────
export async function generateMoodMatch(mood, watchHistory = [], lang = 'en') {
  const isAr  = lang === 'ar';
  const titles = watchHistory.slice(0, 10).map(t => t.title).join(', ');

  const prompt = isAr
    ? `أنت خبير سينمائي. المستخدم يشعر بـ "${mood}". سجل مشاهدته: ${titles || 'لا يوجد بعد'}.\nاقترح 3 عناوين تتناسب مع هذا المزاج مع سبب واضح لكل منها. كن محدداً وحماساً.`
    : `You are a film expert. The user is feeling "${mood}". Their watch history: ${titles || 'none yet'}.\nSuggest 3 titles that perfectly match this mood with a compelling reason for each. Be specific and enthusiastic.`;

  return safe([
    { role: 'system', content: isAr ? 'أنت خبير سينمائي متحمس.' : 'You are an enthusiastic cinematic expert and personal assistant.' },
    { role: 'user',   content: prompt },
  ], { temperature: 0.85 }, isAr ? NO_KEY_AR : NO_KEY_EN);
}

// ─── Cinematic journal / AI review ────────────────────────────────────────────
export async function generateCinematicJournal(title, rating, notes = '', lang = 'en') {
  const isAr = lang === 'ar';

  const prompt = isAr
    ? `اكتب مراجعة سينمائية أدبية جميلة لـ "${title}" (تقييم ${rating}/5).\nملاحظات المستخدم: ${notes || 'لا توجد'}.\nالأسلوب: ناقد سينمائي متمرس. حوالي 120 كلمة.`
    : `Write a beautiful, literary cinematic review for "${title}" (rated ${rating}/5).\nUser notes: ${notes || 'none'}.\nStyle: seasoned film critic — poetic and insightful. About 120 words.`;

  return safe([
    { role: 'system', content: isAr ? 'أنت ناقد سينمائي فني.' : 'You are an artistic film critic.' },
    { role: 'user',   content: prompt },
  ], { temperature: 0.9, maxTokens: 500 });
}

// ─── Weekly AI summary ─────────────────────────────────────────────────────────
export async function generateWeeklySummary(watched = [], totalHours = 0, topGenre = '', topMood = '', lang = 'en') {
  const isAr   = lang === 'ar';
  const titles = watched.map(t => t.title).join(', ');

  const prompt = isAr
    ? `اكتب ملخصاً أسبوعياً سينمائياً شخصياً.\nشاهد: ${titles || 'لا شيء هذا الأسبوع'}. ساعات: ${totalHours}. أكثر نوع: ${topGenre || 'متنوع'}. المزاج السائد: ${topMood || 'محايد'}.\nالأسلوب: دافئ وشخصي كصديق. 100-120 كلمة.`
    : `Write a warm, personalized weekly cinema summary.\nWatched: ${titles || 'nothing this week'}. Hours: ${totalHours}h. Top genre: ${topGenre || 'varied'}. Mood: ${topMood || 'neutral'}.\nStyle: warm and personal, like a friend reflecting on your week in cinema. 100-120 words.`;

  return safe([
    { role: 'system', content: isAr ? 'أنت صديق سينمائي دافئ.' : 'You are a warm cinematic friend.' },
    { role: 'user',   content: prompt },
  ], { temperature: 0.85, maxTokens: 400 });
}

// ─── AI taste profile ──────────────────────────────────────────────────────────
export async function generateTasteSummary(watchHistory = [], lang = 'en') {
  const isAr   = lang === 'ar';
  const titles = watchHistory
    .filter(t => t.rating > 0)
    .slice(0, 20)
    .map(t => `${t.title} (${t.rating}★)`)
    .join(', ');

  const prompt = isAr
    ? `حلل ذوق هذا المشاهد: ${titles || 'لا توجد تقييمات بعد'}.\nاكتب وصفاً لذوقه السينمائي في 80-100 كلمة. كن إيجابياً ومحدداً وجذاباً.`
    : `Analyze this viewer's taste: ${titles || 'no ratings yet'}.\nWrite an insightful, positive taste profile in 80-100 words. Be specific and intriguing.`;

  return safe([
    { role: 'system', content: isAr ? 'أنت محلل أذواق سينمائية.' : 'You are a cinematic taste analyst.' },
    { role: 'user',   content: prompt },
  ], { temperature: 0.8, maxTokens: 350 });
}

// ─── Side-by-side title comparison ────────────────────────────────────────────
export async function compareTitles(title1, title2, lang = 'en') {
  const isAr = lang === 'ar';

  const prompt = isAr
    ? `قارن بين "${title1}" و "${title2}" من حيث: القصة، الأداء، الإخراج، التأثير الثقافي.\nمقارنة موضوعية وممتعة في 180-200 كلمة.`
    : `Compare "${title1}" vs "${title2}" covering: story, performances, direction, cultural impact.\nEngaging, balanced comparison in about 200 words.`;

  return safe([
    { role: 'system', content: isAr ? 'أنت ناقد سينمائي خبير.' : 'You are an expert film critic.' },
    { role: 'user',   content: prompt },
  ], { maxTokens: 600, temperature: 0.8 });
}

// ─── What-should-I-watch suggestion ──────────────────────────────────────────
export async function getWatchSuggestion(feeling, type, duration, watchHistory = [], lang = 'en') {
  const isAr   = lang === 'ar';
  const watched = watchHistory.slice(0, 15).map(t => t.title).join(', ');
  const durMap  = { short: '< 90 min', medium: '90-150 min', long: '> 150 min', binge: 'long bingeable series' };

  const prompt = isAr
    ? `شعور المستخدم: ${feeling}. يريد: ${type}. مدة: ${duration}. شاهد سابقاً: ${watched || 'لا شيء'}.\nاقترح عنواناً محدداً مع سبب مقنع لماذا يناسبه تماماً الآن.`
    : `Feeling: ${feeling}. Wants: ${type}. Duration: ${durMap[duration] || duration}. Watched: ${watched || 'nothing yet'}.\nSuggest one specific title with a compelling reason it's perfect for right now.`;

  return safe([
    { role: 'system', content: isAr ? 'أنت مرشد سينمائي شخصي.' : 'You are a personal cinema guide.' },
    { role: 'user',   content: prompt },
  ], { temperature: 0.9, maxTokens: 400 });
}
