/**
 * Journal service — единый источник истины для журнала обслуживания
 * и для «уже сделано» по болячкам.
 *
 * Типы записей:
 * - kind === 'manual'        — добавленные пользователем вручную из JournalScreen
 * - kind === 'fixed_issue'   — отметка «уже сделал у себя» с детальной страницы болячки
 *
 * fixedIssueIds не хранится отдельно — он всегда производный от журнала
 * (с учётом TTL по системе для хронических болячек).
 */

const STORAGE_KEY = 'aaa_journal';
const EVENT_NAME = 'aaa:journal-changed';

// Срок «возвращения» хронической болячки после отметки «уже сделано» (км).
// Применяется ТОЛЬКО к болячкам без typical_end_km (хронические/неопределённые).
// null = «навсегда» для этой системы (нет ясного износа).
const DEFAULT_RECURRENCE_KM_BY_SYSTEM = {
  engine: 60000,
  cooling: 60000,
  fuel: 60000,
  exhaust: 60000,
  transmission: 80000,
  suspension: 50000,
  brakes: 50000,
  electrical: null,
  body: null,
  interior: null,
};

export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(EVENT_NAME));
    }
  } catch (e) {
    // localStorage недоступен (приватный режим) — молча
  }
}

export function subscribe(handler) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

export function addRecord(record) {
  const records = loadRecords();
  const next = [record, ...records];
  saveRecords(next);
  return next;
}

export function removeRecord(id) {
  const next = loadRecords().filter(r => r.id !== id);
  saveRecords(next);
  return next;
}

// Идемпотентно: если запись для этой болячки уже есть — no-op.
export function markIssueFixed(issue, currentMileage) {
  const records = loadRecords();
  if (records.some(r => r.kind === 'fixed_issue' && r.issueId === issue.id)) {
    return records;
  }
  const isPermanent = issue?.mileage?.typical_end_km != null;
  const record = {
    id: Date.now(),
    kind: 'fixed_issue',
    issueId: issue.id,
    type: 'repair',
    name: issue.issue?.title || 'Болячка',
    date: new Date().toISOString().slice(0, 10),
    mileage: currentMileage || 0,
    cost: 0,
    location: '',
    notes: '',
    system: issue.issue?.system || null,
    isPermanent,
  };
  return addRecord(record);
}

export function unmarkIssueFixed(issueId) {
  const next = loadRecords().filter(
    r => !(r.kind === 'fixed_issue' && r.issueId === issueId)
  );
  saveRecords(next);
  return next;
}

// TTL: ранжированная болячка (есть typical_end_km) — отметка постоянная.
// Хроническая — возвращается, если от mileage отметки прошло больше TTL по системе.
function isFixRecordStillActive(record, currentMileage) {
  if (record.isPermanent) return true;
  const ttl = DEFAULT_RECURRENCE_KM_BY_SYSTEM[record.system];
  if (ttl == null) return true;
  const driven = (currentMileage || 0) - (record.mileage || 0);
  return driven < ttl;
}

export function getFixedIssueIds(records, currentMileage) {
  return records
    .filter(r => r.kind === 'fixed_issue' && isFixRecordStillActive(r, currentMileage))
    .map(r => r.issueId);
}

export function isIssueFixed(records, issueId, currentMileage) {
  const record = records.find(r => r.kind === 'fixed_issue' && r.issueId === issueId);
  if (!record) return false;
  return isFixRecordStillActive(record, currentMileage);
}
