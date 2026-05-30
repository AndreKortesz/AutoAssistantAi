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
    if (start && start - m > 15000) return 'upcoming';
    return 'current';
  }

  // Ранжированная: окно ±15k; «скоро» 15-50к впереди; дальше — «будущее»
  if (m > end + 15000) return 'past';
  const ahead = start - m;
  if (ahead > 50000) return 'future';
  if (ahead > 15000) return 'upcoming';
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
export function calculateHealthIndex(issues, currentMileage = 0, fixedIssueIds = []) {
  const fixed = new Set(fixedIssueIds);
  let score = mileageBase(currentMileage);

  const weights = { critical: 3, high: 1.5, medium: 0.7, low: 0.3 };

  for (const issue of issues) {
    if (fixed.has(issue.id)) continue;
    const cat = classifyIssueByMileage(issue, currentMileage);
    if (cat === 'past' || cat === 'future' || cat === 'chronic') continue;

    let weight = weights[issue.issue?.severity] ?? 0.3;
    if (cat === 'upcoming') weight = weight / 2;

    score -= weight;
  }

  return Math.max(40, Math.min(95, Math.round(score)));
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
