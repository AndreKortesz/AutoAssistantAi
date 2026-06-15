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
const path = require('path');

const app = express();
app.use(express.json({ limit: '256kb' }));

const DIST = path.join(__dirname, 'dist');
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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
          generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
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

// статика фронтенда + SPA-fallback
app.use(express.static(DIST));
app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AutoAssistantAi server on :${PORT} (AI: ${KEY ? 'on' : 'off'})`));
