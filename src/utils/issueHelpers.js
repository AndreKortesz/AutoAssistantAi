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
export function classifyIssueByMileage(issue, currentMileage = 0) {
  const mileage = issue.mileage || {};
  const start = mileage.typical_start_km ?? 0;
  const end = mileage.typical_end_km;
  const peak = mileage.peak_km;
  const severity = issue.issue?.severity;
  const m = currentMileage || 0;

  // Особенность поколения: end_km==null И не critical.
  // Critical хроника (например, HECU recall) остаётся в current — безопасность.
  if (end == null && severity !== 'critical') {
    if (start && start - m > 50000) return 'future';
    if (start && start - m > 15000) return 'upcoming';
    return 'chronic';
  }

  // Critical хроника с пиком: ориентируемся на пик
  if (end == null) {
    if (peak != null) {
      if (m > peak + 25000) return 'past';
      const ahead = peak - m;
      if (ahead > 50000) return 'future';
      if (ahead > 25000) return 'upcoming';
      return 'current';
    }
    // Critical без конца и без пика — постоянный риск
    if (start && start - m > 50000) return 'future';
    if (start && start - m > 5000) return 'upcoming';
    return 'current';
  }

  // Ранжированная: «сейчас» = внутри диапазона (с лёгким преддверием 5к);
  // «скоро» = старт впереди на 5-50к; дальше — «будущее»; после конца +15к — «пройдено».
  if (m > end + 15000) return 'past';
  const ahead = start - m;
  if (ahead > 50000) return 'future';
  if (ahead > 5000) return 'upcoming';
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

export function calculateHealthIndex(issues, currentMileage = 0, fixedIssueIds = []) {
  const fixed = new Set(fixedIssueIds);
  let score = mileageBase(currentMileage);
  for (const issue of issues) {
    if (fixed.has(issue.id)) continue;
    score -= weightFor(issue, classifyIssueByMileage(issue, currentMileage));
  }
  return Math.max(40, Math.min(95, Math.round(score)));
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

// Название записи независимо от схемы файла:
// systemic → issue.title; HC-ТО → position.name; HC-износ → part_info.name.
export function recordTitle(r) {
  return r?.issue?.title || r?.issue?.title_short || r?.position?.name || r?.part_info?.name || 'Без названия';
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
