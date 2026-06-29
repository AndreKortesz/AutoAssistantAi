/**
 * Стадия 2 «созревания»: умный возврат открытых «не знаю».
 * Для каждого аспекта, отмеченного «не знаю», запоминаем пробег в момент отметки.
 * Напоминаем не сразу, а когда накопилось наблюдение (проехал N км) — и только пассивно.
 * После 3 «отмахиваний» аспект затухает (dormant): больше сам не всплывает.
 *
 * Хранение — localStorage (не PII): { [id]: { km, shown } }.
 */
const KEY = 'aaa_maturing';

// Порог наблюдения (км с момента «не знаю») + текст возврата по каждому аспекту.
export const MATURE = {
  engine_cold_start: { km: 150, label: 'холодный пуск', ask: 'Вы отмечали холодный пуск как «не знаю». Уже заводили пару раз — как схватывает с утра?' },
  oil_consumption: { km: 1500, label: 'расход масла', ask: 'Вы отмечали расход масла как «не знаю». Прошло ~1500 км — приходилось доливать, заметна убыль?' },
  engine_noise: { km: 150, label: 'звуки мотора', ask: 'Вы отмечали звуки мотора как «не знаю». Послушали на холостых — нет постороннего цокота/стука?' },
  engine_pull: { km: 400, label: 'разгон', ask: 'Вы отмечали разгон как «не знаю». Уже поездили — как машина тянет?' },
  transmission: { km: 600, label: 'коробка', ask: 'Вы отмечали коробку как «не знаю». Поездили в разных режимах — как переключается?' },
};

export function loadMaturing() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
}
function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }

// Зафиксировать пробег на момент «не знаю» (только если ещё не зафиксирован).
export function markUnknown(id, km) {
  if (!MATURE[id]) return;
  const o = loadMaturing();
  if (!o[id]) { o[id] = { km: km || 0, shown: 0 }; save(o); }
}

// Аспект закрыт (дан определённый ответ) — убираем из отслеживания.
export function clearMaturing(id) {
  const o = loadMaturing();
  if (o[id]) { delete o[id]; save(o); }
}

// «Отмахнулись» — +1 к счётчику показов (после 3 аспект затухает).
export function dismissAspect(id) {
  const o = loadMaturing();
  if (o[id]) { o[id].shown = (o[id].shown || 0) + 1; save(o); }
}

// Какие открытые аспекты «созрели» для напоминания: «не знаю», наблюдение накоплено, ещё не затухли.
export function dueAspects(answers, mileage) {
  const o = loadMaturing();
  const m = mileage || 0;
  return Object.keys(MATURE).filter(id =>
    answers?.[id] === 'unknown' &&
    o[id] && (o[id].shown || 0) < 3 &&
    m - (o[id].km || 0) >= MATURE[id].km
  );
}
