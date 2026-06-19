import React, { useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import Icon from './Icon';

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

export default function OnboardingQuestions() {
  const navigate = useNavigate();
  const { userCar, carDetails, saveAnswers } = useCar();
  const [step, setStep] = useState(0);
  const [extraOpen, setExtraOpen] = useState(false); // решил ли «ответить ещё»

  // Вопрос по коробке — по типу трансмиссии машины.
  const transmissionQ = useMemo(() => {
    const tr = carDetails?.transmissions?.find(t => t.code === userCar?.transmissionCode);
    const variant = TRANSMISSION_Q[tr?.type] || TRANSMISSION_Q['АКПП'];
    return { id: 'transmission', ...variant };
  }, [carDetails, userCar]);

  // Полный список: 3 ядра + (по желанию) 2 доп. Всего 5 — как в брифе.
  const questions = useMemo(
    () => extraOpen ? [...CORE, EXTRA_PULL, transmissionQ] : CORE,
    [extraOpen, transmissionQ]
  );
  const total = 5; // знаменатель прогресса/«% картины» фиксирован

  if (!userCar) return <Navigate to="/add-car" replace />;

  const atGate = !extraOpen && step >= CORE.length; // после ядра — развилка «ещё / позже»
  const q = questions[step];

  const answer = (val) => {
    if (q) saveAnswers({ [q.id]: val });
    next();
  };
  const next = () => {
    if (step + 1 < questions.length) setStep(step + 1);
    else if (!extraOpen && step + 1 >= CORE.length) setStep(CORE.length); // к развилке
    else finish();
  };
  const finish = () => navigate('/dashboard', { replace: true });

  const openExtra = () => { setExtraOpen(true); setStep(CORE.length); };

  return (
    <div style={s.container}>
      <button style={s.skipTop} onClick={finish} aria-label="Позже">Позже</button>

      {atGate ? (
        <div style={s.card}>
          <div style={s.gateIcon}><Icon name="check" size={28} color={c.success} /></div>
          <div style={s.q}>Спасибо! Уже понятнее.</div>
          <div style={s.hint}>Ещё 2 коротких вопроса — про разгон и коробку — и оценка станет точнее.</div>
          <button style={s.primaryBtn} onClick={openExtra}>
            <Icon name="sparkles" size={16} color="#fff" /> Ответить ещё (2)
          </button>
          <button style={s.ghostBtn} onClick={finish}>Позже</button>
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
  gateIcon: { width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(29,158,117,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' },
  primaryBtn: { marginTop: '18px', width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: c.primary, color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  ghostBtn: { marginTop: '10px', width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'transparent', color: c.t2, fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' },
};
