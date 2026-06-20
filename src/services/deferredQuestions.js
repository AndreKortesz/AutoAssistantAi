/**
 * Отложенные вопросы к ассистенту: пользователь в опросе выбрал «спросить ассистента»,
 * но мы не уводим его из флоу — сохраняем вопрос и мягко напоминаем на главной.
 * { id, label (короткая тема для нуджа), prompt (готовый вопрос ассистенту) }
 */
const KEY = 'aaa_deferred_questions';

export function loadDeferred() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
}

function save(arr) {
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {}
}

export function addDeferred(item) {
  if (!item?.id) return;
  const cur = loadDeferred();
  if (cur.some(x => x.id === item.id)) return; // не дублируем
  cur.push({ id: item.id, label: item.label || '', prompt: item.prompt || '' });
  save(cur);
}

export function removeDeferred(id) {
  save(loadDeferred().filter(x => x.id !== id));
}
