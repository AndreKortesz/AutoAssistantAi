/**
 * Аналитика интереса к сервисам (сбор спроса для переговоров с партнёрами).
 * Каждое нажатие «Уведомить» = событие { service_id, user_id, timestamp }.
 *
 * MVP (бэка пока нет): пишем событие в лог + инкрементим локальный счётчик.
 * Структура события готова к подключению к бэкенду.
 * Phase 3: события уходят в PostgreSQL, в админке — дашборд «спрос по сервисам».
 *
 * Счётчики — ВНУТРЕННЯЯ аналитика владельца, пользователю НЕ показываются.
 */
const COUNTS_KEY = 'aaa_service_interest';   // { [serviceId]: count } — локальный счётчик (MVP)
const NOTIFIED_KEY = 'aaa_service_notified'; // [serviceId] — на что уже нажали (для состояния кнопки)

// Анонимный стабильный id пользователя (не PII). В Phase 3 заменится на реальный.
function getUserId() {
  try {
    let id = localStorage.getItem('aaa_uid');
    if (!id) { id = 'u_' + Math.random().toString(36).slice(2, 10); localStorage.setItem('aaa_uid', id); }
    return id;
  } catch (e) { return 'anon'; }
}

function read(key) { try { return JSON.parse(localStorage.getItem(key)) || (key === NOTIFIED_KEY ? [] : {}); } catch (e) { return key === NOTIFIED_KEY ? [] : {}; } }
function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

/**
 * Единая точка для событий интереса. Возвращает событие (для будущей отправки на бэк).
 */
export function trackServiceInterest(serviceId, meta = {}) {
  if (!serviceId) return null;
  const event = { service_id: serviceId, user_id: getUserId(), timestamp: new Date().toISOString(), ...meta };

  // Отправляем событие на сервер (он уведомит владельца — лог/Telegram, см. server.js).
  // Fire-and-forget: интерфейс не ждёт ответа и не падает, если сети нет.
  try {
    fetch('/api/interest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => {});
  } catch (e) {}

  // Локальный счётчик (резерв/офлайн). Phase 3: основная аналитика — в БД на бэке.
  const counts = read(COUNTS_KEY);
  counts[serviceId] = (counts[serviceId] || 0) + 1;
  write(COUNTS_KEY, counts);

  const notified = read(NOTIFIED_KEY);
  if (!notified.includes(serviceId)) { notified.push(serviceId); write(NOTIFIED_KEY, notified); }

  return event;
}

export function isNotified(serviceId) {
  return read(NOTIFIED_KEY).includes(serviceId);
}
