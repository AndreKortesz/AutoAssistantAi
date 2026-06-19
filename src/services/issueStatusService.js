/**
 * Статус болячки по мнению пользователя (помимо «устранено», которое живёт в журнале):
 * - 'actual'  — подтвердил, что для него актуально
 * - 'unknown' — «не знаю» (туман, не штрафует, но это отмеченное действие)
 * Хранится в localStorage (не PII). «Устранено» по-прежнему идёт через журнал.
 */
const KEY = 'aaa_issue_status';
const VALID = new Set(['actual', 'unknown']);
let subscribers = [];

export function loadStatuses() {
  try {
    const raw = localStorage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : {};
    const ok = {};
    for (const [k, v] of Object.entries(obj || {})) {
      if (typeof k === 'string' && /^[a-z0-9_]+$/i.test(k) && VALID.has(v)) ok[k] = v;
    }
    return ok;
  } catch (e) {
    return {};
  }
}

export function setStatus(id, status) {
  if (!id) return;
  const cur = loadStatuses();
  if (status == null) delete cur[id];
  else if (VALID.has(status)) cur[id] = status;
  else return;
  try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) {}
  subscribers.forEach(fn => fn());
}

export function subscribe(fn) {
  subscribers.push(fn);
  return () => { subscribers = subscribers.filter(s => s !== fn); };
}
