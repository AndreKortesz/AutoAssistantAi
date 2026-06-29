import React, { useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import Icon from './Icon';
import { addDeferred } from '../services/deferredQuestions';
import { markUnknown, clearMaturing } from '../services/maturingAspects';

// Этап C: вопросы-ощущения после добавления авто (стиль Duolingo, в наших карточках).
// Заполняют ответы → «созревание» индекса. Ничего не обязательно: «Не знаю» и «Позже» везде.
const c = {
  bg: '#F7F8FA', card: '#FFFFFF', border: '#E2E8F0',
  primary: '#1F4FD8', primaryLight: 'rgba(31,79,216,0.08)',
  success: '#1D9E75', amber: '#BA7517', critical: '#DC2626',
  t1: '#1E293B', t2: '#64748B', t3: '#94A3B8',
};

// Маркер-иконка ответа — единственный цвет на кнопке (по принципу «цвет точкой»).
const MARK = {
  good: { icon: 'check', color: c.success },
  mid: { icon: 'alert', color: c.amber },
  bad: { icon: 'alert', color: c.critical },
};

// Вопрос по коробке подставляется по transmission.type.
const TRANSMISSION_Q = {
  'АКПП': { q: 'Как переключаются передачи?', hint: 'На разгоне и в пробках', options: [
    { val: 'good', label: 'Плавно' }, { val: 'mid', label: 'Лёгкие толчки' }, { val: 'bad', label: 'Пинки, задумчивость' }] },
  'Вариатор': { q: 'Как ведёт себя на разгоне?', hint: 'Вариатор (CVT)', options: [
    { val: 'good', label: 'Плавно, без рывков' }, { val: 'mid', label: 'Лёгкий гул' }, { val: 'bad', label: 'Рывки, «задумчивость»' }] },
  'CVT': { q: 'Как ведёт себя на разгоне?', hint: 'Вариатор (CVT)', options: [
    { val: 'good', label: 'Плавно, без рывков' }, { val: 'mid', label: 'Лёгкий гул' }, { val: 'bad', label: 'Рывки, «задумчивость»' }] },
  'Робот': { q: 'Как в пробках и при трогании?', hint: 'Робот (DCT/AMT)', options: [
    { val: 'good', label: 'Плавно' }, { val: 'mid', label: 'Подёргивает' }, { val: 'bad', label: 'Дёргает, пинки, перегрев' }] },
  'МКПП': { q: 'Передачи и сцепление?', hint: 'Механика', options: [
    { val: 'good', label: 'Чётко включаются' }, { val: 'mid', label: 'Иногда хруст / туго' }, { val: 'bad', label: 'Сцепление буксует, хруст' }] },
};

const CORE = [
  { id: 'engine_cold_start', q: 'Как заводится на холодную?', hint: 'Утром, после ночи на стоянке', options: [
    { val: 'good', label: 'Сразу, ровно' }, { val: 'mid', label: 'С запинкой, не сразу' }, { val: 'bad', label: 'Троит, плавают обороты' }] },
  { id: 'oil_consumption', q: 'Расход масла между заменами?', hint: 'Доливаете ли между ТО', options: [
    { val: 'good', label: 'Не доливаю' }, { val: 'mid', label: 'Доливаю немного' }, { val: 'bad', label: 'Уходит заметно' }] },
  { id: 'engine_noise', q: 'Звуки от мотора на холостых?', hint: 'На прогретом, на месте', options: [
    { val: 'good', label: 'Тихо, ровно' }, { val: 'mid', label: 'Лёгкий цокот' }, { val: 'bad', label: 'Стук' }] },
];

const EXTRA_PULL = { id: 'engine_pull', q: 'Как тянет при разгоне?', hint: 'Под нагрузкой', options: [
  { val: 'good', label: 'Бодро' }, { val: 'mid', label: 'Нормально' }, { val: 'bad', label: 'Вяло, потеря тяги' }] };

// Подсказки «проверить самому» для механики «Не знаю».
const TIPS = {
  engine_cold_start: 'Заведите утром на холодную и послушайте первые 10 секунд: схватывает сразу и ровно — или троит, плавают обороты.',
  oil_consumption: 'Проверьте уровень по щупу сейчас, отметьте, и сверьте через ~1000 км — есть ли заметная убыль.',
  engine_noise: 'На прогретом моторе на холостых послушайте у открытого капота — нет ли цокота или стука.',
  engine_pull: 'На свободной дороге разгонитесь с 60 до 100 — тянет бодро или вяло, с провалами.',
  transmission: 'Прокатитесь спокойно и под газ: обратите внимание на толчки, рывки или «задумчивость» при переключениях.',
};
const SERVICE_TIP = 'При ближайшем визите в сервис попросите мастера проверить этот момент — обычно это быстро и недорого.';

// Готовый вопрос ассистенту по каждой теме (для отложенного «спросить ассистента»).
const ASSIST_Q = {
  engine_cold_start: 'Как понять, нормально ли мой мотор заводится на холодную, и стоит ли беспокоиться?',
  oil_consumption: 'Какой расход масла нормален для моего мотора и когда это повод проверить двигатель?',
  engine_noise: 'Какие звуки мотора на холостых — это норма, а какие повод проверить?',
  engine_pull: 'Машина как будто вяло тянет при разгоне — в чём может быть причина?',
  transmission: 'Как понять, что с коробкой что-то не так, и что стоит проверить?',
};

export default function OnboardingQuestions() {
  const navigate = useNavigate();
  const { userCar, carDetails, saveAnswers } = useCar();
  // «Напомнить позже» работает так: вопрос остаётся неотвеченным (или «не знаю»),
  // и при повторном входе («Уточнить» на главной) мы стартуем с первого незакрытого —
  // то есть пропущенные/«не знаю» вопросы возвращаются.
  // Опрос — все 5 вопросов подряд (без необязательной развилки). Старт — с первого
  // незакрытого: определённый ответ закрывает, «не знаю»/без ответа — нет, поэтому
  // повторный вход возвращает к открытым/«не знаю».
  const ALL_IDS = ['engine_cold_start', 'oil_consumption', 'engine_noise', 'engine_pull', 'transmission'];
  const answered = userCar?.onboardingAnswers || {};
  const isDone = (id) => answered[id] && answered[id] !== 'unknown';
  const [step, setStep] = useState(() => {
    const i = ALL_IDS.findIndex(id => !isDone(id));
    return i === -1 ? 0 : i;
  });
  const [pending, setPending] = useState(null);      // вопрос, по которому открыты «3 пути» (после «Не знаю»)
  const [openPath, setOpenPath] = useState(null);     // 'self' | 'service' — какая подсказка раскрыта
  const [confirmSkip, setConfirmSkip] = useState(false); // подтверждение выхода из опроса
  const [askedConfirm, setAskedConfirm] = useState(false); // показали подтверждение «вопрос отложен ассистенту»

  // Вопрос по коробке — по типу трансмиссии машины.
  const transmissionQ = useMemo(() => {
    const tr = carDetails?.transmissions?.find(t => t.code === userCar?.transmissionCode);
    const variant = TRANSMISSION_Q[tr?.type] || TRANSMISSION_Q['АКПП'];
    return { id: 'transmission', ...variant };
  }, [carDetails, userCar]);

  // Все 5 вопросов подряд: 3 ядра + разгон + коробка.
  const questions = useMemo(() => [...CORE, EXTRA_PULL, transmissionQ], [transmissionQ]);
  const total = questions.length; // 5

  if (!userCar) return <Navigate to="/add-car" replace />;

  const q = questions[step];

  const mileage = userCar?.mileage ? parseInt(userCar.mileage) : 0;
  const answer = (val) => {
    if (q) {
      saveAnswers({ [q.id]: val });
      if (val === 'unknown') markUnknown(q.id, mileage); // запоминаем пробег для умного возврата
      else clearMaturing(q.id);                          // закрыт — убираем из отслеживания
    }
    if (val === 'unknown') { setPending(q); setOpenPath(null); } // не штрафуем, предлагаем путь к ответу
    else next();
  };
  const continueFromPending = () => { setPending(null); setOpenPath(null); setAskedConfirm(false); next(); };
  // Назад к вопросу (не продвигаем дальше) — можно ответить заново.
  const backFromPending = () => { setPending(null); setOpenPath(null); setAskedConfirm(false); };
  // Не уводим из опроса и не прыгаем резко: сохраняем вопрос и показываем подтверждение.
  const askAssistantLater = () => {
    if (pending) addDeferred({ id: pending.id, label: pending.q, prompt: ASSIST_Q[pending.id] || `Подскажи про «${pending.q}» на моём авто` });
    setAskedConfirm(true);
  };
  // Идём к следующему НЕзакрытому вопросу (не отвечён или «не знаю»), уже определённые
  // пропускаем. Поэтому при повторном входе переспрашиваются только открытые, без хождения по кругу.
  const next = () => {
    const nextOpen = questions.findIndex((qq, i) => i > step && !isDone(qq.id));
    if (nextOpen === -1) finish();
    else setStep(nextOpen);
  };
  const finish = () => navigate('/dashboard', { replace: true });

  return (
    <div style={s.container}>
      <button style={s.skipTop} onClick={() => setConfirmSkip(true)} aria-label="Позже">Позже</button>

      {confirmSkip && (
        <div style={s.confirmOverlay} onClick={() => setConfirmSkip(false)}>
          <div style={s.confirmCard} onClick={e => e.stopPropagation()}>
            <div style={s.confirmTitle}>Пропустить опрос?</div>
            <div style={s.confirmText}>Это пара коротких вопросов — они делают оценку точнее. Можно вернуться к ним в любой момент через «Уточнить» на главной.</div>
            <button style={s.primaryBtn} onClick={() => setConfirmSkip(false)}>Продолжить опрос</button>
            <button style={s.ghostBtn} onClick={finish}>Всё равно пропустить</button>
          </div>
        </div>
      )}

      {pending && askedConfirm ? (
        <div style={s.card}>
          <div style={s.gateIcon}><Icon name="check" size={28} color={c.success} /></div>
          <div style={s.q}>Записали вопрос</div>
          <div style={s.hint}>Сейчас спокойно допройдём опрос. Сразу после него на главной появится напоминание — и ассистент поможет разобраться с этим: «{pending.q}». Ничего не потеряется.</div>
          <button style={s.primaryBtn} onClick={continueFromPending}>
            <Icon name="arrowRight" size={16} color="#fff" /> Продолжить опрос
          </button>
        </div>
      ) : pending ? (
        <div style={s.card}>
          <button style={s.cardBack} onClick={backFromPending} aria-label="Назад к вопросу">
            <Icon name="arrowLeft" size={18} color={c.t2} /> Назад
          </button>
          <div style={s.q}>Как это узнать?</div>
          <div style={s.hint}>На вторичке мало кто знает всё — это нормально. Этот момент не штрафует оценку, отметим, когда узнаете.</div>
          <div style={s.options}>
            <div>
              <button style={s.pathBtn} onClick={() => setOpenPath(p => p === 'self' ? null : 'self')}>
                <Icon name="search" size={20} color={c.primary} />
                <div style={s.pathInfo}>
                  <div style={s.pathTitle}>Проверить самому</div>
                  <div style={s.pathSub}>Простой способ оценить</div>
                </div>
                <Icon name="chevronDown" size={16} color={c.t3} style={{ transform: openPath === 'self' ? 'rotate(180deg)' : 'none' }} />
              </button>
              {openPath === 'self' && <div style={s.tip}>{TIPS[pending.id]}</div>}
            </div>
            <div>
              <button style={s.pathBtn} onClick={() => setOpenPath(p => p === 'service' ? null : 'service')}>
                <Icon name="wrench" size={20} color={c.primary} />
                <div style={s.pathInfo}>
                  <div style={s.pathTitle}>Спросить в сервисе</div>
                  <div style={s.pathSub}>Что попросить проверить</div>
                </div>
                <Icon name="chevronDown" size={16} color={c.t3} style={{ transform: openPath === 'service' ? 'rotate(180deg)' : 'none' }} />
              </button>
              {openPath === 'service' && <div style={s.tip}>{SERVICE_TIP}</div>}
            </div>
            <button style={s.pathBtn} onClick={askAssistantLater}>
              <Icon name="chat" size={20} color={c.primary} />
              <div style={s.pathInfo}>
                <div style={s.pathTitle}>Спросить ассистента</div>
                <div style={s.pathSub}>Запишем — напомним на главной</div>
              </div>
              <Icon name="arrowRight" size={16} color={c.t3} />
            </button>
          </div>
          <button style={s.primaryBtn} onClick={continueFromPending}>Продолжить</button>
        </div>
      ) : q ? (
        <div style={s.card}>
          <div style={s.progressTop}>
            <div style={s.progressBar}><div style={{ ...s.progressFill, width: `${((step + 1) / total) * 100}%` }} /></div>
            <span style={s.progressNum}>{step + 1} из {total}</span>
          </div>

          <div style={s.q}>{q.q}</div>
          {q.hint && <div style={s.hint}>{q.hint}</div>}

          <div style={s.options}>
            {q.options.map(opt => {
              const m = MARK[opt.val];
              return (
                <button key={opt.val} style={s.option} onClick={() => answer(opt.val)} aria-label={opt.label}>
                  <Icon name={m.icon} size={20} color={m.color} />
                  <span style={s.optionLabel}>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <button style={s.unknownBtn} onClick={() => answer('unknown')}>
            Не знаю / только купил <Icon name="arrowRight" size={15} color={c.t3} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: c.bg, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" },
  skipTop: { position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', color: c.t3, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' },
  card: { background: c.card, border: `1px solid ${c.border}`, borderRadius: '18px', padding: '22px', boxShadow: '0 2px 10px rgba(15,23,42,0.05)' },
  progressTop: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  progressBar: { flex: 1, height: '5px', background: c.bg, borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', background: c.success, borderRadius: '3px', transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1)' },
  progressNum: { fontSize: '13px', color: c.t3, flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  q: { fontSize: '20px', fontWeight: '600', color: c.t1, lineHeight: 1.25 },
  hint: { fontSize: '13px', color: c.t3, marginTop: '5px', lineHeight: 1.4 },
  options: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' },
  option: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '15px 16px', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' },
  optionLabel: { fontSize: '15px', color: c.t1, fontWeight: '500' },
  unknownBtn: { marginTop: '18px', width: '100%', padding: '10px', background: 'none', border: 'none', color: c.t3, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  pathBtn: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' },
  pathInfo: { flex: 1, minWidth: 0 },
  pathTitle: { fontSize: '15px', color: c.t1, fontWeight: '500' },
  pathSub: { fontSize: '12px', color: c.t3, marginTop: '2px' },
  tip: { fontSize: '13px', color: c.t2, lineHeight: 1.5, padding: '10px 14px 2px 14px' },
  pendingFoot: { fontSize: '12px', color: c.t3, textAlign: 'center', marginTop: '10px', lineHeight: 1.4 },
  cardBack: { display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: c.t2, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', padding: '0 0 12px', marginLeft: '-2px' },
  confirmOverlay: { position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  confirmCard: { background: c.card, borderRadius: '16px', padding: '22px', maxWidth: '360px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  confirmTitle: { fontSize: '18px', fontWeight: '600', color: c.t1, marginBottom: '8px' },
  confirmText: { fontSize: '14px', color: c.t2, lineHeight: 1.5, marginBottom: '18px' },
  gateIcon: { width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(29,158,117,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' },
  primaryBtn: { marginTop: '18px', width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: c.primary, color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  ghostBtn: { marginTop: '10px', width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'transparent', color: c.t2, fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' },
};
