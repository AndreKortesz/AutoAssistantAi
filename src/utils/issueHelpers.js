/**
 * Утилиты для работы с болячками
 */

/**
 * Классификация болячек по пробегу:
 * - past:     уже должна была проявиться
 * - current:  актуальна сейчас
 * - upcoming: 15-50к впереди
 * - future:   далеко впереди (>50к), в индекс не идёт, в UI сливается с upcoming
 * - chronic:  «особенность поколения» — end_km==null и не critical. Фон, не давит на индекс.
 */
// Эпицентр болячки — пробег, где она реально проявляется/кусается:
// пик, иначе середина диапазона [start,end], иначе старт. null если данных нет.
export function issueAnchorKm(issue) {
  const mi = issue.mileage || {};
  const start = mi.typical_start_km ?? null;
  const end = mi.typical_end_km ?? null;
  const peak = mi.peak_km ?? null;
  if (peak != null) return peak;
  if (start != null && end != null) return Math.round((start + end) / 2);
  return start;
}

export function classifyIssueByMileage(issue, currentMileage = 0) {
  const mileage = issue.mileage || {};
  const end = mileage.typical_end_km ?? null;
  const peak = mileage.peak_km ?? null;
  const severity = issue.issue?.severity;
  const m = currentMileage || 0;
  const anchor = issueAnchorKm(issue);

  const CURRENT_WINDOW = 20000;   // насколько близко к эпицентру, чтобы быть «сейчас»
  const CRIT_WINDOW = 30000;      // критичные показываем чуть раньше
  const UPCOMING_MAX = 80000;     // дальше — «будущее» (в списке не давит, видно на «Карте»)
  const win = severity === 'critical' ? CRIT_WINDOW : CURRENT_WINDOW;

  // Уже позади: за концом диапазона или заметно за пиком.
  if (end != null && m > end + 15000) return 'past';
  if (end == null && peak != null && m > peak + 30000) {
    // Далеко за пиком. Критичный риск всё равно держим в поле зрения.
    return severity === 'critical' ? 'current' : 'past';
  }

  // Нет данных по пробегу: критичное — в поле зрения, остальное — фон поколения.
  if (anchor == null) return severity === 'critical' ? 'current' : 'chronic';

  const ahead = anchor - m;
  if (ahead > UPCOMING_MAX) return 'future';
  if (ahead > win) return 'upcoming';

  // В пределах окна или уже на эпицентре.
  // Ушли заметно за эпицентр, конца нет и не критично → фон поколения, не давим.
  if (ahead < -30000 && end == null && severity !== 'critical') return 'chronic';
  return 'current';
}

/**
 * Группировка болячек на 4 ведра: current / upcoming / chronic / past
 * future-болячки UI-нo сливаются с upcoming.
 */
export function groupIssuesByMileage(issues, currentMileage = 0) {
  const result = { current: [], upcoming: [], past: [], chronic: [] };
  for (const issue of issues) {
    const cat = classifyIssueByMileage(issue, currentMileage);
    if (cat === 'past') result.past.push(issue);
    else if (cat === 'chronic') result.chronic.push(issue);
    else if (cat === 'upcoming' || cat === 'future') result.upcoming.push(issue);
    else result.current.push(issue);
  }
  
  // Сортируем: critical → high → medium → low
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  for (const key of Object.keys(result)) {
    result[key].sort((a, b) => {
      const sa = severityOrder[a.issue?.severity] ?? 99;
      const sb = severityOrder[b.issue?.severity] ?? 99;
      return sa - sb;
    });
  }
  
  return result;
}

/**
 * База здоровья от пробега: новая машина ~90, 200к+ ~65.
 * Наличие известных болячек у модели ≠ состояние конкретной машины,
 * поэтому базу задаёт пробег, а болячки лишь корректируют её.
 */
function mileageBase(mileage) {
  const m = mileage || 0;
  if (m <= 50000) return 90;
  if (m >= 200000) return 65;
  return 90 - ((m - 50000) / (200000 - 50000)) * (90 - 65);
}

/**
 * Расчёт индекса здоровья автомобиля (40-95).
 *
 * Логика:
 * - База зависит от пробега (mileageBase), не от количества болячек
 * - Мягкие веса за актуальные неотмеченные болячки:
 *   critical −3, high −1.5, medium −0.7, low −0.3
 * - upcoming снимают вдвое меньше; past — не снимают
 * - Болячки, отмеченные пользователем как «уже сделано» (fixedIssueIds), не снимают
 * - Никогда не 0 и не 100: clamp 40-95
 */
const SEVERITY_WEIGHTS = { critical: 3, high: 1.5, medium: 0.7, low: 0.3 };

// Единый источник правды: сколько баллов снимает болячка с учётом категории.
// past/future/chronic/fixed — 0. upcoming — половина.
export function weightFor(issue, cat) {
  if (cat === 'past' || cat === 'future' || cat === 'chronic') return 0;
  let w = SEVERITY_WEIGHTS[issue.issue?.severity] ?? 0.3;
  if (cat === 'upcoming') w = w / 2;
  return w;
}

export function calculateHealthIndex(issues, currentMileage = 0, fixedIssueIds = [], answers = null) {
  const fixed = new Set(fixedIssueIds);
  let score = mileageBase(currentMileage);
  for (const issue of issues) {
    if (fixed.has(issue.id)) continue;
    score -= weightFor(issue, classifyIssueByMileage(issue, currentMileage));
  }
  // Ответы-ощущения мягко корректируют оценку (хорошо ↑, тревожно ↓, не знаю — ноль).
  if (answers) score += answerAdjustment(answers);
  return Math.max(40, Math.min(95, Math.round(score)));
}

/* ============================================================
 * «Созревание» индекса (модель Oura): индекс — не диагноз, а
 * предварительная оценка, которая крепнет по мере данных.
 * Источники картины: вопросы-ощущения (~30%), отметки болячек (~50%),
 * журнал + пробег (~20%).
 * ============================================================ */

// Насколько сильно ответ по системе двигает индекс. Двигатель/коробка — тяжелее.
// Ключи совпадают с questionId из формы вопросов (этап C).
export const SENSATION_WEIGHTS = {
  engine_cold_start: 4,
  oil_consumption: 4,
  engine_noise: 4,
  engine_pull: 3,
  transmission: 4,
  suspension_knock: 2,
  steering: 2,
  brakes: 3,
  service_history: 0, // нейтрально, не штрафует
};
const SENSATION_TOTAL_QUESTIONS = 5; // ядро (3) + 2 доп. — база для «% картины»

// Суммарная поправка к индексу от ответов. Мягкая, чтобы цифра не прыгала.
export function answerAdjustment(answers = {}) {
  let delta = 0;
  for (const [id, val] of Object.entries(answers || {})) {
    const w = SENSATION_WEIGHTS[id] ?? 2;
    if (val === 'good') delta += w * 0.4;
    else if (val === 'mid') delta -= w * 0.3;
    else if (val === 'bad') delta -= w;
    // 'unknown' → 0 (туман, не штрафуем)
  }
  return delta;
}

// «Процент картины собран» — от 0 до 100. Растёт от любого источника.
// answers: {id:val}; issues: болячки модели; fixedIssueIds: отмеченные «устранено»;
// journalCount: число записей журнала; mileageKnown: задан ли пробег.
export function pictureCompleteness({ answers = {}, issues = [], fixedIssueIds = [], issueStatuses = {}, journalCount = 0, mileageKnown = false } = {}) {
  const definite = Object.values(answers || {}).filter(v => v && v !== 'unknown').length;
  const qPct = Math.min(30, (definite / SENSATION_TOTAL_QUESTIONS) * 30);

  const relevant = (issues || []).filter(i => !isBodyRecord(i));
  const fixed = new Set(fixedIssueIds);
  // «Решено» = отмечено «устранено» (журнал) ИЛИ подтверждено «актуально».
  const decided = relevant.filter(i => fixed.has(i.id) || issueStatuses[i.id] === 'actual').length;
  const iPct = relevant.length ? Math.min(50, (decided / relevant.length) * 50) : 0;

  let jPct = 0;
  if (journalCount > 0) jPct += 10;
  if (mileageKnown) jPct += 10;
  jPct = Math.min(20, jPct);

  return Math.round(Math.min(100, qPct + iPct + jPct));
}

// Уровень зрелости по «% картины»: 1 предварительная → 2 уточняется → 3 точная.
// Пороги: одни вопросы (макс 30%) + пробег (10%) = 40% → ещё предварительная;
// в уровень 2 выводит отметка болячек (как в прототипе: 40% = ещё серое кольцо).
export function maturityLevel(picturePct) {
  if (picturePct >= 80) return { level: 3, key: 'precise', label: 'Точная оценка' };
  if (picturePct >= 50) return { level: 2, key: 'refining', label: 'Оценка уточняется' };
  return { level: 1, key: 'preliminary', label: 'Предварительная оценка' };
}

// Группировка issue.system → 4 системы UI. Кузов НЕ показываем (решение владельца),
// но болячки кузова/электрики/салона остаются в ОБЩЕМ индексе.
const SYSTEM_MAP = {
  engine: 'engine', cooling: 'engine', fuel: 'engine', exhaust: 'engine',
  transmission: 'transmission',
  suspension: 'suspension', steering: 'suspension',
  brakes: 'brakes',
};

export const UI_SYSTEMS = [
  { key: 'engine', label: 'Двигатель' },
  { key: 'suspension', label: 'Ходовая' },
  { key: 'transmission', label: 'Коробка' },
  { key: 'brakes', label: 'Тормоза' },
];

// Индекс по одной системе (та же формула, на подмножестве болячек).
// Возвращает null, если у системы нет данных — тогда показываем «—», не выдумываем «95».
export function calculateSystemHealth(issues, systemKey, currentMileage = 0, fixedIssueIds = []) {
  const subset = (issues || []).filter(i => SYSTEM_MAP[i.issue?.system] === systemKey);
  if (subset.length === 0) return { score: null, count: 0, active: 0 };
  const fixed = new Set(fixedIssueIds);
  let score = mileageBase(currentMileage);
  let active = 0;
  for (const issue of subset) {
    if (fixed.has(issue.id)) continue;
    const w = weightFor(issue, classifyIssueByMileage(issue, currentMileage));
    if (w > 0) active++;
    score -= w;
  }
  return { score: Math.max(40, Math.min(95, Math.round(score))), count: subset.length, active };
}

// Грубая оценка «крепче N% ровесников» — ЧЕСТНО из данных пользователя,
// не из выдуманной статистики парка. Основа: индекс состояния + пробег-к-возрасту
// (типичный РФ-пробег ~15 000 км/год). Это оценка, не опрос реальных владельцев.
export function estimatePeerPercentile(healthIndex, mileage, year) {
  const now = new Date().getFullYear();
  const age = Math.max(1, now - (parseInt(year) || now));
  const kmPerYear = (mileage || 0) / age;
  const BASELINE = 15000;
  // меньше пробег на год возраста → выше; больше → ниже
  let mileageAdj = (BASELINE - kmPerYear) / BASELINE;       // меньше пробег → +, больше → −
  mileageAdj = Math.max(-0.4, Math.min(0.4, mileageAdj));
  const idxNorm = (Math.max(40, Math.min(95, healthIndex)) - 40) / 55;  // 0..1
  const pct = 0.65 * idxNorm + 0.35 * (0.5 + mileageAdj);   // вклад состояния + пробега
  return Math.round(Math.max(35, Math.min(85, pct * 100)));
}

// Кузов исключаем из раздела «Обслуживание» (решение владельца).
export function isBodyRecord(r) {
  return recordSystem(r) === 'body';
}

// Группировка болячек по ВАЖНOСTИ (для вкладки «Слабые места»).
// Возвращает: safety (critical/high), planned (medium), minor (low),
// upcoming (старт впереди ≤ horizon), past (позади). Кузов отфильтрован.
export function groupByImportance(issues, currentMileage = 0, fixedIssueIds = []) {
  const res = { safety: [], planned: [], minor: [], upcoming: [], past: [] };
  for (const issue of issues || []) {
    if (isBodyRecord(issue)) continue;
    const cat = classifyIssueByMileage(issue, currentMileage);
    if (cat === 'past') { res.past.push(issue); continue; }
    // upcoming/future уже отфильтрованы по горизонту 80к в classify — показываем «впереди».
    if (cat === 'upcoming' || cat === 'future') { res.upcoming.push(issue); continue; }
    // current / chronic → активно сейчас, делим по severity
    const sev = issue.issue?.severity;
    if (sev === 'critical' || sev === 'high') res.safety.push(issue);
    else if (sev === 'medium') res.planned.push(issue);
    else res.minor.push(issue);
  }
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortSev = arr => arr.sort((a, b) => (order[a.issue?.severity] ?? 9) - (order[b.issue?.severity] ?? 9));
  ['safety', 'planned', 'minor'].forEach(k => sortSev(res[k]));
  // «впереди» — по близости эпицентра (ближайшее первым).
  res.upcoming.sort((a, b) => (issueAnchorKm(a) ?? 1e9) - (issueAnchorKm(b) ?? 1e9));
  return res;
}

// Статус позиции износа/ТО по текущему пробегу.
// → { state: 'overdue'|'now'|'soon'|'early', dueKm, remaining }
export function wearStatus(record, currentMileage = 0, fixedIssueIds = []) {
  const m = currentMileage || 0;
  // если отмечено «уже сделал» — считаем недавно заменённым → рано
  if (fixedIssueIds.includes(record.id)) return { state: 'early', dueKm: null, remaining: null };
  const wr = wearRange(record);
  const mi = record.mileage || {};
  const low = wr?.min ?? mi.typical_start_km ?? mi.peak_km ?? null;
  const high = wr?.max ?? mi.typical_end_km ?? mi.peak_km ?? low;
  if (low == null) return { state: 'early', dueKm: null, remaining: null };
  if (m > high + 20000) return { state: 'overdue', dueKm: high, remaining: m - high };
  if (m >= low) return { state: 'now', dueKm: low, remaining: 0 };
  const remaining = low - m;
  if (remaining <= 15000) return { state: 'soon', dueKm: low, remaining };
  return { state: 'early', dueKm: low, remaining };
}

// Название записи независимо от схемы файла:
// systemic → issue.title; HC-ТО → position.name; HC-износ → part_info.name.
export function recordTitle(r) {
  return r?.issue?.title || r?.issue?.title_short || r?.position?.name || r?.part_info?.name || r?.title || 'Без названия';
}

// Система записи независимо от схемы (для группировки/иконок).
export function recordSystem(r) {
  return r?.issue?.system || r?.position?.system || r?.part_info?.system || null;
}

// wear_interval_km бывает числом или {min,max}. Нормализуем к {min,max}.
export function wearRange(r) {
  const w = r?.wear_interval_km;
  if (w == null) return null;
  if (typeof w === 'number') return { min: w, max: w };
  if (typeof w === 'object' && (w.min != null || w.max != null)) return { min: w.min ?? w.max, max: w.max ?? w.min };
  return null;
}

// Полная стоимость владения в год — ОЦЕНКА из допущений (не собранные факты).
// Допущения вынесены в .assumptions, чтобы честно показать пользователю.
export const OWNERSHIP_ASSUMPTIONS = {
  annualKm: 15000,
  fuelPriceRub: 60,       // АИ-95, ориентир ~2026
  dieselPriceRub: 65,
  tyreSetRub: 22000,      // комплект
  tyreYears: 3,           // меняют раз в N лет
  osagoRub: 10000,        // ОСАГО, ориентир (зависит от стажа/региона)
  taxRegion: 'Москва',
};

// расход л/100км по объёму (оценка)
function estFuelPer100(displacement, fuelType) {
  const d = parseFloat(displacement) || 1.6;
  let l = d <= 1.4 ? 7.5 : d <= 1.6 ? 8 : d <= 2.0 ? 9.5 : d <= 2.5 ? 11 : d <= 3.0 ? 12.5 : 14;
  if (fuelType === 'дизель') l *= 0.8;
  return l;
}

// транспортный налог/год по мощности (московские ставки, ₽/л.с.)
function estTax(powerHp) {
  const p = parseInt(powerHp) || 0;
  if (!p) return null;
  const rate = p <= 100 ? 12 : p <= 125 ? 25 : p <= 150 ? 35 : p <= 175 ? 45 : p <= 200 ? 50 : p <= 250 ? 65 : 150;
  return Math.round(p * rate);
}

export function estimateOwnership(annualBudget, engine) {
  const a = OWNERSHIP_ASSUMPTIONS;
  const svc = annualBudget?.scenarios?.average || null;
  const service = svc?.total ?? null;

  const diesel = engine?.fuel === 'дизель';
  const fuel = engine?.displacement
    ? Math.round((a.annualKm / 100) * estFuelPer100(engine.displacement, engine?.fuel) * (diesel ? a.dieselPriceRub : a.fuelPriceRub))
    : null;
  const tax = estTax(engine?.power_hp);
  const tyres = Math.round(a.tyreSetRub / a.tyreYears);
  const insurance = a.osagoRub;

  const items = [
    { key: 'service', label: 'Обслуживание (ТО, расходники, ремонт)', value: service, kind: 'data' },
    { key: 'fuel', label: 'Топливо', value: fuel, kind: 'est' },
    { key: 'tax', label: 'Транспортный налог', value: tax, kind: 'est' },
    { key: 'insurance', label: 'ОСАГО', value: insurance, kind: 'est' },
    { key: 'tyres', label: 'Шины (комплект раз в 3 года)', value: tyres, kind: 'est' },
  ].filter(i => i.value != null);

  const total = items.reduce((s, i) => s + i.value, 0);
  return { items, total, assumptions: a };
}

// «обновлено N назад» из ISO-таймстампа
export function formatRelativeTime(iso) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн. назад`;
  if (days < 30) { const w = Math.floor(days / 7); return `${w} нед. назад`; }
  if (days < 365) { const m = Math.floor(days / 30); return `${m} мес. назад`; }
  const y = Math.floor(days / 365);
  return `${y} г. назад`;
}

/**
 * Цвет severity
 */
export function severityColor(severity) {
  switch (severity) {
    case 'critical': return '#DC2626';
    case 'high': return '#D97706';
    case 'medium': return '#F59E0B';
    case 'low': return '#94A3B8';
    default: return '#94A3B8';
  }
}

/**
 * Текст severity на русском
 */
export function severityLabel(severity) {
  switch (severity) {
    case 'critical': return 'Критично';
    case 'high': return 'Серьёзно';
    case 'medium': return 'Внимание';
    case 'low': return 'Незначительно';
    default: return '—';
  }
}

/**
 * Форматирование цены в рублях
 */
export function formatPrice(price) {
  if (!price) return '—';
  if (typeof price === 'number') {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  }
  if (typeof price === 'object' && price.min !== undefined) {
    const { min, max } = price;
    if (min === max) return formatPrice(min);
    return `${formatPrice(min)} – ${formatPrice(max)}`.replace(' ₽ – ', ' – ').replace(/(\d) ₽$/, '$1 ₽');
  }
  return '—';
}

/**
 * Форматирование пробега
 */
export function formatMileage(km) {
  if (km === null || km === undefined) return '—';
  if (km >= 1000) {
    return new Intl.NumberFormat('ru-RU').format(km) + ' км';
  }
  return km + ' км';
}

/**
 * Краткое описание частоты для UI
 */
export function frequencyText(mileage) {
  if (!mileage) return '—';
  if (mileage.frequency_description) return mileage.frequency_description;
  if (mileage.frequency_percent) return `у ${mileage.frequency_percent}% владельцев`;
  return '—';
}

// linked_issue_id может быть строкой или массивом строк
function linkMatches(linked, issueId) {
  if (Array.isArray(linked)) return linked.includes(issueId);
  return linked === issueId;
}

/**
 * Получить связанные recalls для болячки
 */
export function getLinkedRecalls(issueId, recalls) {
  return (recalls || []).filter(r => linkMatches(r.linked_issue_id, issueId));
}

/**
 * Получить связанные class actions для болячки
 */
export function getLinkedClassActions(issueId, classActions) {
  return (classActions || []).filter(c => linkMatches(c.linked_issue_id, issueId));
}

/**
 * Получить связанные TSB для болячки
 */
export function getLinkedTSB(issueId, tsbs) {
  return (tsbs || []).filter(t => linkMatches(t.linked_issue_id, issueId));
}
