/**
 * Статус позиции конечного износа по ФАКТУ (модель из BRIEF-onboarding-fixes ч.3):
 *  - 'checked_ok'    — проверено, всё ок (рейтинг не страдает; можно указать остаточный ресурс untilKm)
 *  - 'needs_replace' — проверили, требуется замена (рейтинг падает — подтверждённый факт)
 *  - 'unknown'       — не знаю (туман: рейтинг прежний, позиция висит как «стоит проверить»)
 * «Сделал» (заменено) идёт через журнал (fixedIssueIds), здесь не дублируется.
 *
 * Хранение: localStorage { [id]: { s, untilKm } } (не PII).
 */
const KEY = 'aaa_wear_status';
const VALID = new Set(['checked_ok', 'needs_replace', 'unknown']);
let subscribers = [];

export function loadWearStatuses() {
  try {
    const raw = localStorage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : {};
    const ok = {};
    for (const [k, v] of Object.entries(obj || {})) {
      if (typeof k !== 'string' || !/^[a-z0-9_]+$/i.test(k)) continue;
      const s = typeof v === 'string' ? v : v?.s;
      if (VALID.has(s)) ok[k] = { s, untilKm: (v && typeof v === 'object' && Number.isFinite(v.untilKm)) ? v.untilKm : null };
    }
    return ok;
  } catch (e) {
    return {};
  }
}

function save(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) {}
}

export function setWearStatus(id, status, untilKm = null) {
  if (!id) return;
  const cur = loadWearStatuses();
  if (status == null) delete cur[id];
  else if (VALID.has(status)) cur[id] = { s: status, untilKm: Number.isFinite(untilKm) ? untilKm : null };
  else return;
  save(cur);
  subscribers.forEach(fn => fn());
}

export function subscribe(fn) {
  subscribers.push(fn);
  return () => { subscribers = subscribers.filter(s => s !== fn); };
}
