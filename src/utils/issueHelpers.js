/**
 * Утилиты для работы с болячками
 */

/**
 * Классификация болячек по пробегу:
 * - past:     уже должна была проявиться
 * - current:  актуальна сейчас
 * - upcoming: ещё впереди
 * - chronic:  актуальна на любом пробеге (typical_end_km == null)
 */
export function classifyIssueByMileage(issue, currentMileage = 0) {
  const mileage = issue.mileage || {};
  const start = mileage.typical_start_km || 0;
  const end = mileage.typical_end_km;
  const peak = mileage.peak_km;

  // Болячка с null end_km — хроническая, всегда актуальна
  if (end === null || end === undefined) {
    if (start && currentMileage < start - 10000) return 'upcoming';
    return 'current';
  }

  // По диапазону
  if (currentMileage > end + 10000) return 'past';
  if (currentMileage < start - 10000) return 'upcoming';
  return 'current';
}

/**
 * Группировка болячек на: текущие, предстоящие, прошедшие
 */
export function groupIssuesByMileage(issues, currentMileage = 0) {
  const result = { current: [], upcoming: [], past: [] };
  for (const issue of issues) {
    const cat = classifyIssueByMileage(issue, currentMileage);
    if (cat === 'past') result.past.push(issue);
    else if (cat === 'upcoming') result.upcoming.push(issue);
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
 * Расчёт индекса здоровья автомобиля (0-100)
 * 
 * Логика:
 * - Стартуем со 100
 * - Снимаем по {weight} баллов за каждую current systemic_defect
 *   - critical: -15
 *   - high: -8
 *   - medium: -4
 *   - low: -2
 * - upcoming болячки снимают вдвое меньше
 * - past — не снимают (пользователь либо починил, либо проехал)
 * 
 * Минимум 0, максимум 100.
 */
export function calculateHealthIndex(issues, currentMileage = 0) {
  let score = 100;
  
  for (const issue of issues) {
    const severity = issue.issue?.severity || 'low';
    const cat = classifyIssueByMileage(issue, currentMileage);
    
    if (cat === 'past') continue;
    
    const weights = {
      critical: 15,
      high: 8,
      medium: 4,
      low: 2,
    };
    
    let weight = weights[severity] || 2;
    if (cat === 'upcoming') weight = weight / 2;
    
    score -= weight;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
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

/**
 * Получить связанные recalls для болячки
 */
export function getLinkedRecalls(issueId, recalls) {
  return (recalls || []).filter(r => r.linked_issue_id === issueId);
}

/**
 * Получить связанные class actions для болячки
 */
export function getLinkedClassActions(issueId, classActions) {
  return (classActions || []).filter(c => c.linked_issue_id === issueId);
}

/**
 * Получить связанные TSB для болячки
 */
export function getLinkedTSB(issueId, tsbs) {
  return (tsbs || []).filter(t => t.linked_issue_id === issueId);
}
