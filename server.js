/**
 * AutoAssistantAi — продакшен-сервер.
 * Отдаёт собранный фронтенд (dist/) и проксирует чат к Gemini.
 *
 * Безопасность:
 * - Ключ Gemini ТОЛЬКО в process.env.GEMINI_API_KEY, на фронт не уходит.
 * - Лимит размера тела, простой rate-limit по IP.
 * - Ответы заземлены на болячки из контекста; в системном промпте —
 *   запрет выдумывать артикулы/recall/цены (правило проекта).
 */
const express = require('express');
const compression = require('compression');
const path = require('path');

const app = express();
// gzip всего ответа: данные модели ~828 КБ → ~114 КБ. Главный ускоритель загрузки.
app.use(compression());
app.use(express.json({ limit: '256kb' }));

const DIST = path.join(__dirname, 'dist');
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Куда слать уведомления об интересе к сервисам (любой канал — опционально):
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;   // токен бота
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;      // chat_id владельца
const INTEREST_WEBHOOK = process.env.INTEREST_WEBHOOK_URL; // произвольный вебхук (Slack/Make/и т.п.)
// Память-счётчик на время жизни процесса (для быстрой сводки; постоянное хранение — Phase 3/БД).
const interestCounts = Object.create(null);

// --- простой in-memory rate-limit: 20 запросов/мин на IP ---
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // защита от роста памяти
  return arr.length > 20;
}

function buildSystemPrompt(ctx) {
  ctx = ctx || {};
  const car = ctx.car ? `Автомобиль пользователя: ${ctx.car}.` : '';
  const mileage = ctx.mileage ? `Текущий пробег: ${ctx.mileage} км.` : '';
  const issues = Array.isArray(ctx.issues) && ctx.issues.length
    ? 'Известные болячки именно для этой конфигурации (используй ТОЛЬКО эти факты как опору, не добавляй своих артикулов и цен):\n' +
      ctx.issues.map(i => `- ${i.title}${i.severity ? ` [${i.severity}]` : ''}${i.cause ? `: ${i.cause}` : ''}`).join('\n')
    : 'Подтверждённых данных по болячкам этой модели в базе пока нет — отвечай осторожно и не выдумывай.';
  return [
    'Ты — AutoAssistantAi: спокойный опытный автомеханик-друг для российского автовладельца.',
    'Тон: спокойный, без алармизма, без капса и без нагнетания. Информируешь и успокаиваешь, не пугаешь. Советуешь мягко («стоит проверить», «рекомендую»), не приказываешь.',
    'НИКОГДА не выдумывай артикулы запчастей, номера recall и точные цены. Если не уверен — честно скажи, что точных данных нет. Опирайся на факты из контекста ниже.',
    'Отвечай кратко, по делу, на русском. Если симптом опасен для безопасности (тормоза, рулевое, возгорание) — мягко посоветуй не откладывать диагностику.',
    car, mileage, issues,
  ].filter(Boolean).join('\n\n');
}

app.post('/api/chat', async (req, res) => {
  if (!KEY) return res.status(503).json({ error: 'Ассистент пока не настроен. Загляните позже.' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;
  if (rateLimited(ip)) return res.status(429).json({ error: 'Слишком много запросов подряд — подождите минуту.' });

  const { message, history, carContext } = req.body || {};
  if (!message || typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ error: 'Некорректный запрос.' });
  }

  const contents = [];
  if (Array.isArray(history)) {
    for (const h of history.slice(-8)) {
      if (h && h.text) {
        contents.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: String(h.text).slice(0, 2000) }] });
      }
    }
  }
  contents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: buildSystemPrompt(carContext) }] },
          contents,
          // thinkingBudget: 0 — отключаем «мышление» 2.5 Flash, иначе оно
          // съедает maxOutputTokens и ответ обрывается на полуслове.
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    );
    if (!r.ok) {
      const t = await r.text();
      console.error('Gemini error', r.status, t.slice(0, 500));
      let msg = '';
      try { msg = JSON.parse(t)?.error?.message || ''; } catch (_) { msg = t.slice(0, 160); }
      return res.status(502).json({
        error: 'Ассистент не ответил, попробуйте ещё раз.',
        detail: `Gemini ${r.status} (${MODEL}): ${msg}`.slice(0, 280),
      });
    }
    const data = await r.json();
    const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text).join('').trim();
    res.json({ text: text || 'Не удалось сформировать ответ. Попробуйте переформулировать вопрос.' });
  } catch (e) {
    console.error('proxy error', e.message);
    res.status(502).json({ error: 'Ошибка связи с ассистентом.' });
  }
});

// --- Интерес к сервисам: уведомление владельцу + счётчик спроса ---
// text → Telegram (читаемое сообщение); event → вебхук (структурой, для Google Таблицы и т.п.).
async function notifyOwner(text, event) {
  const jobs = [];
  if (TG_TOKEN && TG_CHAT) {
    jobs.push(fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text, disable_notification: false }),
    }).catch(e => console.error('tg notify error', e.message)));
  }
  if (INTEREST_WEBHOOK) {
    jobs.push(fetch(INTEREST_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, ...event }),
    }).catch(e => console.error('webhook notify error', e.message)));
  }
  await Promise.allSettled(jobs);
}

app.post('/api/interest', async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;
  if (rateLimited(ip)) return res.status(429).json({ ok: false });

  const { service_id, user_id } = req.body || {};
  if (!service_id || typeof service_id !== 'string' || service_id.length > 64) {
    return res.status(400).json({ ok: false });
  }
  const sid = service_id.replace(/[^a-z0-9_]/gi, '').slice(0, 64);
  interestCounts[sid] = (interestCounts[sid] || 0) + 1;

  // Всегда в логи Railway (владелец видит). Плюс Telegram/вебхук, если настроены env.
  const uid = String(user_id || 'anon').slice(0, 32);
  console.info(`[interest] ${sid} — всего за сессию процесса: ${interestCounts[sid]} (user ${uid})`);
  notifyOwner(
    `🔔 Интерес к сервису «${sid}». Нажатий (с перезапуска): ${interestCounts[sid]}.`,
    { service_id: sid, user_id: uid, timestamp: new Date().toISOString() }
  );

  res.json({ ok: true });
});

// статика фронтенда + SPA-fallback.
// Хешированные ассеты (/assets/*-<hash>.js|css) иммутабельны → кэшируем на год.
// Остальное (index.html, JSON-данные) — без долгого кэша, чтобы деплой/правки данных подхватывались.
app.use(express.static(DIST, {
  setHeaders: (res, filePath) => {
    // Vite-хэш в имени: base64url-алфавит (буквы/цифры/-/_), напр. index-DK-Y4MrR.js
    if (/-[A-Za-z0-9_-]{8,}\.(js|css)$|\.[0-9a-f]{8,}\.(js|css)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(DIST, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AutoAssistantAi server on :${PORT} (AI: ${KEY ? 'on' : 'off'})`));
