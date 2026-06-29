import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import {
  calculateHealthIndex,
  calculateSystemHealth,
  estimatePeerPercentile,
  groupIssuesByMileage,
  classifyIssueByMileage,
  formatMileage,
  formatPrice,
  formatRelativeTime,
  recordTitle,
  estimateOwnership,
  UI_SYSTEMS,
} from '../utils/issueHelpers';
import MileageUpdateModal from './MileageUpdateModal';
import { loadDeferred, removeDeferred } from '../services/deferredQuestions';
import { dueAspects, markUnknown, dismissAspect, MATURE } from '../services/maturingAspects';
import CarSilhouette from './CarSilhouette';
import Icon from './Icon';

const c = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  border: '#E2E8F0',
  primary: '#1F4FD8',
  primaryLight: 'rgba(31, 79, 216, 0.08)',
  success: '#1D9E75',
  successDark: '#0F6E56',
  amber: '#BA7517',
  amberLight: 'rgba(186, 117, 23, 0.10)',
  critical: '#DC2626',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
};

const MAX_INDEX = 95;

const COST_COLORS = ['#1F4FD8', '#BA7517', '#1D9E75', '#7C5CD9', '#94A3B8'];

const ASSISTANT_QUESTIONS = [
  'Почему стучит на холодную?',
  'Какое масло лить в мой мотор?',
  'Когда менять ремень/цепь ГРМ?',
  'Что значит ошибка P0011?',
  'Почему растёт расход топлива?',
  'Как часто менять тормозную жидкость?',
  'Что за стук в подвеске на кочках?',
  'Нужна ли замена антифриза сейчас?',
  'Какие болячки у моего мотора?',
];

function CostRow({ color, label, value }) {
  if (!value) return null;
  return (
    <div style={s.costRow}>
      <span style={{ ...s.costDot, background: color }} />
      <span style={s.costRowLabel}>{label}</span>
      <span style={s.costRowVal}>{value.toLocaleString('ru-RU')} ₽</span>
    </div>
  );
}

// Цвет/статус общего индекса. ring — цвет дуги кольца, text — цвет статус-текста.
// Зелёный для хорошо/норма, янтарь — внимание, красный — только при низком.
function indexStatus(idx) {
  if (idx >= 65) return { ring: c.success, text: c.successDark, label: idx >= 80 ? 'Хорошее состояние' : 'Нормальное состояние' };
  if (idx >= 50) return { ring: c.amber, text: c.amber, label: 'Стоит присмотреться' };
  return { ring: c.critical, text: c.critical, label: 'Несколько мест внимания' };
}

// Плавный счётчик: число «доезжает» от прежнего к новому за ~600мс (а не подменяется).
// Уважает prefers-reduced-motion — тогда показывает сразу.
function useCountUp(target, ms = 650) {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setVal(target); fromRef.current = target; return; }
    let raf, start;
    const tick = (t) => {
      if (start == null) start = t;
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

// Линейная интерполяция между двумя hex-цветами (t: 0..1) → rgb-строка.
function lerpColor(a, b, t) {
  const k = Math.max(0, Math.min(1, t));
  const h = (x) => [parseInt(x.slice(1, 3), 16), parseInt(x.slice(3, 5), 16), parseInt(x.slice(5, 7), 16)];
  const [r1, g1, b1] = h(a), [r2, g2, b2] = h(b);
  const m = (p, q) => Math.round(p + (q - p) * k);
  return `rgb(${m(r1, r2)}, ${m(g1, g2)}, ${m(b1, b2)})`;
}
const RING_MUTED = '#7FC9AD';  // приглушённый зелёный — мало данных
const RING_FULL = '#1D9E75';   // насыщенный основной — картина собрана

function systemStatusWord(score) {
  if (score == null) return { word: 'мало данных', color: c.textTertiary, attention: false };
  if (score >= 80) return { word: 'В норме', color: c.textTertiary, attention: false };
  if (score >= 65) return { word: 'В норме', color: c.textTertiary, attention: false };
  return { word: 'Внимание', color: c.amber, attention: true };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { userCar, carDetails, issuesData, loading, updateMileage, fixedIssueIds, markIssueFixed, picturePct, maturity, journalRecords } = useCar();
  const [showMileageModal, setShowMileageModal] = useState(false);
  const [systemsOpen, setSystemsOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(false);
  const [pop, setPop] = useState(false); // анимация «+N» после «Я починил»
  const [notice, setNotice] = useState(null); // тихая микро-награда (тост)
  const [deferred, setDeferred] = useState(() => loadDeferred()); // отложенные вопросы к ассистенту
  const [entered, setEntered] = useState(false); // анимация входа кольца «от полного к текущему»
  const [showInfo, setShowInfo] = useState(false); // модалка «Что это за оценка»
  const animatedRef = useRef(false);

  // Запуск анимации кольца при входе/возврате на главную (компонент монтируется заново при навигации).
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setEntered(true); return; }
    const raf = requestAnimationFrame(() => setEntered(true)); // следующий кадр → CSS-переход «полное → текущее»
    return () => cancelAnimationFrame(raf);
  }, []);

  const deferredItem = deferred[0] || null; // показываем по одному
  const askDeferred = (item) => { removeDeferred(item.id); setDeferred(loadDeferred()); navigate('/assistant', { state: { prompt: item.prompt } }); };
  const dismissDeferred = (item) => { removeDeferred(item.id); setDeferred(loadDeferred()); };

  // Стадия 2: «созревшие» открытые «не знаю» (наблюдение накоплено по пробегу).
  const [due, setDue] = useState([]);
  const [maturingHidden, setMaturingHidden] = useState(false); // скрыто на эту сессию (после «×»)
  const dueAspect = !maturingHidden && due.length > 0 ? due[0] : null;
  const dismissMaturing = () => { due.forEach(dismissAspect); setMaturingHidden(true); };

  const mileage = userCar?.mileage ? parseInt(userCar.mileage) : 0;

  const answers = userCar?.onboardingAnswers || null;
  // Опрос — все 5 вопросов. «не знаю» (unknown) — НЕ определённый ответ: открытый аспект, который «дозреет».
  const SURVEY_QS = ['engine_cold_start', 'oil_consumption', 'engine_noise', 'engine_pull', 'transmission'];
  const isDefinite = (id) => answers && answers[id] && answers[id] !== 'unknown';
  const isSeen = (id) => !!(answers && answers[id]); // любой ответ, включая «не знаю»
  const definiteCount = SURVEY_QS.filter(isDefinite).length;
  const seenCount = SURVEY_QS.filter(isSeen).length;
  const surveyNotAllSeen = seenCount < SURVEY_QS.length;          // не все 5 вопросов пройдены
  // «созревшие» открытые «не знаю» считаются отдельно (см. due / maturingAspects, Стадия 2)

  const healthIndex = useMemo(() => {
    if (!issuesData) return MAX_INDEX;
    return calculateHealthIndex(issuesData.systemic, mileage, fixedIssueIds, answers);
  }, [issuesData, mileage, fixedIssueIds, answers]);

  const shownIndex = useCountUp(healthIndex); // плавно «доезжает» к новому значению

  // Микро-награды: рост «% картины» → тихий тост; первое достижение «точной оценки» → спокойный момент.
  const prevPct = useRef(picturePct);
  const prevLevel = useRef(maturity?.level);
  useEffect(() => {
    if (picturePct > prevPct.current) {
      let celebrated = true;
      try { celebrated = localStorage.getItem('aaa_maturity_done') === 'true'; } catch (e) {}
      if (maturity.level === 3 && prevLevel.current < 3 && !celebrated) {
        setNotice('Оценка готова — теперь она про вашу машину, а не про модель.');
        try { localStorage.setItem('aaa_maturity_done', 'true'); } catch (e) {}
      } else {
        setNotice(`Картина точнее — ${picturePct}%`);
      }
    }
    prevPct.current = picturePct;
    prevLevel.current = maturity?.level;
  }, [picturePct, maturity]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  // Стадия 2: фиксируем пробег для «не знаю» без записи (бэкафилл) и считаем «созревшие».
  useEffect(() => {
    if (!answers) { setDue([]); return; }
    Object.keys(MATURE).forEach(id => { if (answers[id] === 'unknown') markUnknown(id, mileage); });
    setDue(dueAspects(answers, mileage));
  }, [answers, mileage]);


  const grouped = useMemo(() => {
    if (!issuesData) return { current: [], upcoming: [], past: [], chronic: [] };
    return groupIssuesByMileage(issuesData.systemic, mileage);
  }, [issuesData, mileage]);

  // системы
  const systems = useMemo(() => {
    if (!issuesData) return [];
    return UI_SYSTEMS.map(s => ({
      ...s,
      ...calculateSystemHealth(issuesData.systemic, s.key, mileage, fixedIssueIds),
    }));
  }, [issuesData, mileage, fixedIssueIds]);

  const attentionSystems = systems.filter(s => systemStatusWord(s.score).attention);

  // приоритет №1: самая «тяжёлая» актуальная неотмеченная болячка
  const priority = useMemo(() => {
    const sevRank = { critical: 0, high: 1, medium: 2, low: 3 };
    return grouped.current
      .filter(i => !fixedIssueIds.includes(i.id))
      .sort((a, b) => (sevRank[a.issue?.severity] ?? 9) - (sevRank[b.issue?.severity] ?? 9))[0] || null;
  }, [grouped, fixedIssueIds]);

  const moreCount = Math.max(0, grouped.current.filter(i => !fixedIssueIds.includes(i.id)).length - 1);

  // ближайшие события (maintenance + upcoming болячки) по пробегу
  const nextEvents = useMemo(() => {
    if (!issuesData) return [];
    const items = [];
    for (const m of issuesData.maintenance || []) {
      const interval = m.maintenance_interval_km;
      if (!interval) continue;
      const next = Math.ceil(mileage / interval) * interval;
      if (next > mileage && next <= mileage + 10000) {
        items.push({ id: m.id, title: recordTitle(m), type: 'Регламент ТО', km: next, icon: 'droplet' });
      }
    }
    for (const i of grouped.upcoming) {
      const start = i.mileage?.typical_start_km;
      if (start && start > mileage && start <= mileage + 10000) {
        items.push({ id: i.id, title: i.issue?.title_short || i.issue?.title, type: 'Износ', km: start, icon: 'zap' });
      }
    }
    return items.sort((a, b) => a.km - b.km).slice(0, 3);
  }, [issuesData, grouped, mileage]);

  const peerPct = useMemo(
    () => estimatePeerPercentile(healthIndex, mileage, userCar?.year),
    [healthIndex, mileage, userCar]
  );

  const ownership = useMemo(() => {
    if (!issuesData) return null;
    const eng = carDetails?.engines?.find(e => e.code === userCar?.engineCode) || null;
    return estimateOwnership(issuesData.annual_budget, eng);
  }, [issuesData, carDetails, userCar]);

  // случайный пример вопроса для ассистента (новый при каждом заходе);
  // приоритетно подмешиваем вопрос про текущую болячку, если она есть
  const exampleQuestion = useMemo(() => {
    const pool = [...ASSISTANT_QUESTIONS];
    if (priority?.issue?.title) pool.unshift(`Что значит «${priority.issue.title}»?`, `Стоит ли беспокоиться: ${priority.issue.title_short || priority.issue.title}?`);
    return pool[Math.floor(Math.random() * pool.length)];
  }, [priority]);

  if (loading) return <div style={s.loading}>Загрузка...</div>;

  if (!userCar || !carDetails || !issuesData) {
    return (
      <div style={s.container}>
        <div style={s.emptyState}>
          <CarSilhouette color="#B8BCC2" width={120} height={66} />
          <h2 style={s.emptyTitle}>Добавьте автомобиль</h2>
          <p style={s.emptySubtitle}>Чтобы увидеть состояние вашей машины</p>
          <button style={s.emptyButton} onClick={() => navigate('/add-car')}>Добавить автомобиль</button>
        </div>
      </div>
    );
  }

  const carLabel = `${carDetails.brand} ${carDetails.model_name}`;
  const engineLabel = carDetails.engines.find(e => e.code === userCar.engineCode)?.label || '';
  const updatedAgo = formatRelativeTime(userCar.mileageUpdatedAt);
  const status = indexStatus(healthIndex);
  const hasData = issuesData.hasData;

  // кольцо
  const R = 35, CIRC = 2 * Math.PI * R;
  const fillRatio = Math.min(1, healthIndex / MAX_INDEX);

  // Цвет дуги = зрелость насыщенностью: мало данных → приглушённый, по мере сбора → насыщенный.
  // На точной оценке (ур.3) — реальный цвет по значению (зелёный/янтарь/красный).
  const ringEndColor = maturity.level === 3 ? status.ring : lerpColor(RING_MUTED, RING_FULL, picturePct / 80);
  // Анимация входа: до entered кольцо полное и насыщенное (вспышка), затем CSS-переход к текущему.
  const ringColor = entered ? ringEndColor : RING_FULL;
  const ringOffset = entered ? CIRC * (1 - fillRatio) : 0;

  // Чек-лист источников «Что собрано»
  const systemicList = (issuesData.systemic || []).filter(i => (i.issue?.system || i.position?.system) !== 'body');
  const systemicTotal = systemicList.length;
  const systemicMarked = systemicList.filter(i => fixedIssueIds.includes(i.id)).length;
  const journalCount = (journalRecords || []).length;

  const animateOnce = !animatedRef.current;
  animatedRef.current = true;

  return (
    <div style={s.container}>
      {/* Шапка «Мой гараж» */}
      <div style={s.topbar}>
        <div style={s.topbarLeft}>
          <img src="/branding/logo-mark-light.png" alt="AutoAssistantAi" style={s.logo} />
          <span style={s.topbarTitle}>Мой гараж</span>
        </div>
      </div>

      {/* ГЕРО-карточка */}
      <div style={s.hero}>
        <div style={s.heroTop}>
          <CarSilhouette color={userCar.color} bodyType={userCar.bodyType} animate={animateOnce} width={92} height={50} />
          <div style={s.heroInfo}>
            <div style={s.carName}>{carLabel}</div>
            <div style={s.carSub}>{engineLabel}{carDetails.generation ? ` · ${carDetails.generation}` : ''}</div>
            <button style={s.mileageBtn} onClick={() => setShowMileageModal(true)}>
              <span style={s.mileageVal}>{formatMileage(mileage)}</span>
              {updatedAgo && <span style={s.mileageAgo}> · обновлено {updatedAgo}</span>}
              <Icon name="pencil" size={13} color={c.primary} style={{ marginLeft: 4 }} />
            </button>
          </div>
        </div>

        {hasData && (
          <>
            <div style={s.heroDivider} />
            <div style={s.healthRow}>
              <button style={s.ringWrap} onClick={() => setShowInfo(true)} aria-label="Что это за оценка">
                {maturity.level < 3 && <span style={s.ringPulse} className="aaa-ring-pulse" />}
                <svg width="84" height="84" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="42" cy="42" r={R} fill="none" stroke={c.border} strokeWidth="6" />
                  {/* засечка-потолок 95 — только когда оценка точная */}
                  {maturity.level === 3 && (
                    <circle cx="42" cy="42" r={R} fill="none" stroke={c.amber} strokeWidth="2"
                      strokeDasharray="1.5 4" opacity="0.6" />
                  )}
                  {/* Одна дуга: длина = оценка, цвет = зрелость (насыщенность). Вход: полное → текущее. */}
                  <circle cx="42" cy="42" r={R} fill="none" stroke={ringColor} strokeWidth="6"
                    strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={ringOffset}
                    style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1), stroke 0.9s ease' }} />
                </svg>
                <div style={s.ringCenter}>
                  <div style={{ ...s.ringVal, color: c.textPrimary }}>{shownIndex}</div>
                  <div style={s.ringHintTap}>подробнее <span style={s.ringI}>i</span></div>
                </div>
                {pop && <div style={s.ringPop} className="aaa-pop-up">+{pop}</div>}
              </button>
              <div style={s.healthInfo}>
                {maturity.level === 3 ? (
                  <>
                    <div style={{ ...s.healthStatus, color: status.text }}>{status.label}</div>
                    <div style={s.healthMean}>Для машины с таким пробегом — крепкий результат.</div>
                  </>
                ) : (
                  <>
                    <div style={{ ...s.healthStatus, color: c.textPrimary }}>Рейтинг формируется</div>
                    <div style={s.healthMean}>Чем больше отметите — тем точнее оценка.</div>
                  </>
                )}
              </div>
            </div>

            {/* Чек-лист источников: видно, ЧТО закрыть, чтобы оценка дозрела. */}
            {maturity.level < 3 && (
              <div style={s.sources}>
                <div style={s.sourceRow}>
                  {seenCount >= SURVEY_QS.length
                    ? <><Icon name="check" size={16} color={c.success} /><span style={s.sourceText}>Первые вопросы — готово</span></>
                    : <><span style={s.sourceDot} /><span style={s.sourceText}>Первые вопросы — {seenCount} из {SURVEY_QS.length}</span>
                        <button style={s.sourceBtn} onClick={() => navigate('/checkup')}>Пройти</button></>}
                </div>
                <div style={s.sourceRow}>
                  {systemicTotal > 0 && systemicMarked >= systemicTotal
                    ? <><Icon name="check" size={16} color={c.success} /><span style={s.sourceText}>Болячки отмечены</span></>
                    : <><span style={s.sourceDot} /><span style={s.sourceText}>Отметить болячки — {systemicMarked} из {systemicTotal}</span>
                        <button style={s.sourceBtn} onClick={() => navigate('/issues')}>Отметить</button></>}
                </div>
                <div style={s.sourceRow}>
                  {journalCount > 0
                    ? <><Icon name="check" size={16} color={c.success} /><span style={s.sourceText}>Журнал ТО — {journalCount} {journalCount === 1 ? 'запись' : 'записей'}</span></>
                    : <><span style={s.sourceDot} /><span style={s.sourceText}>Записи в журнале ТО — пусто</span>
                        <button style={s.sourceBtn} onClick={() => navigate('/journal')}>Добавить</button></>}
                </div>
              </div>
            )}

            {maturity.level === 3 && (
              <div style={s.peer}>
                <Icon name="trophy" size={17} color={c.successDark} />
                <div style={s.peerText}>
                  Крепче, чем у <b>~{peerPct}%</b> ровесников {carDetails.model_name} с похожим пробегом
                </div>
              </div>
            )}

            {ownership?.total > 0 && (
              <div style={s.costWrap}>
                <button style={s.costHead} onClick={() => setCostOpen(o => !o)}>
                  <Icon name="wallet" size={18} color={c.textSecondary} />
                  <span style={s.costTitle}>Стоимость владения в год</span>
                  <span style={s.costSum}>~{ownership.total.toLocaleString('ru-RU')} ₽</span>
                  <span style={{ ...s.costChev, transform: costOpen ? 'rotate(180deg)' : 'none' }}>
                    <Icon name="chevronDown" size={16} color={c.textTertiary} />
                  </span>
                </button>
                {costOpen && (
                  <div style={s.costBody}>
                    <div style={s.costBar}>
                      {ownership.items.map((it, i) => (
                        <div key={it.key} style={{ width: `${(it.value / ownership.total) * 100}%`, background: COST_COLORS[i % COST_COLORS.length], height: '100%' }} />
                      ))}
                    </div>
                    <div style={s.costLegend}>
                      {ownership.items.map((it, i) => (
                        <CostRow key={it.key} color={COST_COLORS[i % COST_COLORS.length]} label={it.label} value={it.value} />
                      ))}
                    </div>
                    <button style={s.costLink} onClick={() => navigate('/cost')}>
                      Подробный расчёт <Icon name="arrowRight" size={14} color={c.primary} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!hasData && (
          <>
            <div style={s.heroDivider} />
            <div style={s.noData}>Список типичных мест внимания для этой модели ещё собираем — подключим, как будет готово.</div>
          </>
        )}
      </div>

      {/* Слот-нудж: отложенный вопрос ассистенту, иначе «созревший» открытый «не знаю».
          Прогресс источников (опрос/болячки/журнал) живёт в чек-листе под кольцом. */}
      {hasData && (deferredItem ? (
        <div style={s.deferCard}>
          <div style={s.deferIcon}><Icon name="bulb" size={18} color={c.primary} /></div>
          <div style={{ flex: 1, minWidth: 0 }} onClick={() => askDeferred(deferredItem)}>
            <div style={s.deferTitle}>Вы хотели уточнить</div>
            <div style={s.deferSub}>«{deferredItem.label}» — спросить ассистента?</div>
          </div>
          <button style={s.deferAsk} onClick={() => askDeferred(deferredItem)}>Спросить</button>
          <button style={s.deferClose} onClick={() => dismissDeferred(deferredItem)} aria-label="Скрыть"><Icon name="x" size={15} color={c.textTertiary} /></button>
        </div>
      ) : dueAspect ? (
        <div style={s.surveyCard} onClick={() => navigate('/checkup')}>
          <div style={s.surveyIcon}><Icon name="bulb" size={18} color={c.primary} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.surveyTitle}>Появился способ узнать</div>
            <div style={s.surveySub}>{MATURE[dueAspect].ask}</div>
          </div>
          <button style={s.surveyBtn} onClick={(e) => { e.stopPropagation(); navigate('/checkup'); }}>Ответить</button>
          <button style={s.deferClose} onClick={(e) => { e.stopPropagation(); dismissMaturing(); }} aria-label="Позже"><Icon name="x" size={15} color={c.textTertiary} /></button>
        </div>
      ) : null)}

      {/* Спросить про мою машину (обводка) */}
      <div style={s.askBtn}>
        <div style={s.askTop} onClick={() => navigate('/assistant')}>
          <Icon name="chat" size={20} color={c.primary} />
          <div style={{ flex: 1 }}>
            <div style={s.askTitle}>Спросить про мою машину</div>
            <div style={s.askSub}>Ассистент — как друг, который разбирается в машинах</div>
          </div>
          <Icon name="arrowRight" size={16} color={c.textTertiary} />
        </div>
        <button style={s.askChip} onClick={() => navigate('/assistant', { state: { prompt: exampleQuestion } })}>
          <Icon name="sparkles" size={14} color={c.textTertiary} />
          <span style={s.askChipText}>{exampleQuestion}</span>
        </button>
      </div>

      {hasData && (
        <>
          {/* Приоритет №1 */}
          {priority && (
            <div style={{ ...s.prioCard, opacity: pop ? 0.55 : 1, transition: 'opacity 0.5s' }}>
              <div style={s.prioLabel}>СТОИТ ПРОВЕРИТЬ ПЕРВЫМ</div>
              <div style={s.prioMain}>
                <span style={s.prioDot} />
                <div style={{ flex: 1 }}>
                  <div style={s.prioTitle}>{priority.issue?.title || 'Без названия'}</div>
                  <div style={s.prioDesc}>{priority.issue?.severity_reason || priority.issue?.cause?.primary || 'Стоит проверить при ближайшем визите в сервис.'}</div>
                </div>
              </div>
              <div style={s.prioFoot}>
                <span style={s.prioCost}>{priorityCost(priority)}</span>
                <div style={s.prioBtns}>
                  <button style={s.prioFixed} onClick={() => handleFixed(priority)}>Я починил</button>
                  <button style={s.prioWhat} onClick={() => navigate(`/issues/${priority.id}`)}>Что это значит</button>
                </div>
              </div>
              {moreCount > 0 && (
                <button style={s.prioMore} onClick={() => navigate('/issues')}>
                  Ещё {moreCount} {plural(moreCount, 'место', 'места', 'мест')} стоит посмотреть
                  <Icon name="arrowRight" size={15} color={c.textSecondary} />
                </button>
              )}
            </div>
          )}

          {/* Системы (сворачиваемые) */}
          <div style={s.sysCard}>
            <button style={s.sysHead} onClick={() => setSystemsOpen(o => !o)}>
              <div style={s.sysHeadLeft}>
                <Icon name="activity" size={18} color={attentionSystems.length ? c.amber : c.success} />
                <div>
                  <div style={s.sysHeadTitle}>{systemsHeadline(attentionSystems)}</div>
                  <div style={s.sysHeadSub}>{systemsSub(systems)}</div>
                </div>
              </div>
              <span style={{ ...s.chev, transform: systemsOpen ? 'rotate(180deg)' : 'none' }}>
                <Icon name="chevronDown" size={16} color={c.textTertiary} />
              </span>
            </button>
            {systemsOpen && (
              <div style={s.sysBody}>
                {systems.map(sys => {
                  const st = systemStatusWord(sys.score);
                  const ratio = sys.score == null ? 0 : sys.score / MAX_INDEX;
                  return (
                    <div key={sys.key} style={s.sysRow} onClick={() => navigate('/issues')}>
                      <span style={s.sysName}>{sys.label}</span>
                      <div style={s.sysBar}>
                        <div style={{ ...s.sysBarFill, width: `${ratio * 100}%`, background: st.attention ? c.amber : c.success }} />
                      </div>
                      <span style={{ ...s.sysWord, color: st.color }}>{st.word}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ближайшие 10 000 км */}
          {nextEvents.length > 0 && (
            <div style={s.nextCard}>
              <div style={s.nextHead}>
                <span style={s.nextTitle}>Ближайшие 10 000 км</span>
                <span style={s.nextRange}>{Math.round(mileage / 1000)}–{Math.round((mileage + 10000) / 1000)} тыс.</span>
              </div>
              <div style={s.nextList}>
                {nextEvents.map(ev => (
                  <div key={ev.id} style={s.nextItem} onClick={() => navigate(`/issues/${ev.id}`)}>
                    <Icon name={ev.icon} size={16} color={c.primary} />
                    <div style={{ flex: 1 }}>
                      <div style={s.nextItemTitle}>{ev.title}</div>
                      <div style={s.nextItemType}>{ev.type}</div>
                    </div>
                    <span style={s.nextItemKm}>~{Math.round(ev.km / 1000)} тыс.</span>
                  </div>
                ))}
              </div>
              <button style={s.nextAll} onClick={() => navigate('/issues', { state: { tab: 'service' } })}>
                Весь регламент ТО
                <Icon name="arrowRight" size={15} color={c.textSecondary} />
              </button>
            </div>
          )}
        </>
      )}

      <div style={{ height: 24 }} />

      {showMileageModal && (
        <MileageUpdateModal
          isOpen
          currentMileage={mileage}
          onUpdate={async ({ mileage: nm }) => { await updateMileage(nm); }}
          onClose={() => setShowMileageModal(false)}
        />
      )}

      {notice && (
        <div style={s.notice}>
          <Icon name="sparkles" size={16} color={c.success} />
          <span>{notice}</span>
        </div>
      )}

      {showInfo && (
        <div style={s.infoOverlay} onClick={() => setShowInfo(false)}>
          <div style={s.infoCard} onClick={(e) => e.stopPropagation()}>
            <div style={s.infoTitle}>Что это за оценка</div>
            <p style={s.infoText}>
              Это оценка здоровья именно вашей машины по шкале <b>40–95</b>. Она складывается из ваших
              ответов про ощущения, отметок болячек и записей в журнале ТО.
            </p>
            <p style={s.infoText}>
              {maturity.level === 3
                ? 'Картина собрана — оценка точная.'
                : 'Пока оценка предварительная: мы ещё собираем данные. Чем больше отметите — тем точнее.'}
            </p>
            <div style={s.infoBarTop}>
              <span style={s.infoBarLabel}>Данных собрано</span>
              <span style={s.infoBarPct}>{picturePct}%</span>
            </div>
            <div style={s.infoBar}><div style={{ ...s.infoBarFill, width: `${picturePct}%` }} /></div>
            <button style={s.infoBtn} onClick={() => setShowInfo(false)}>Понятно</button>
          </div>
        </div>
      )}
    </div>
  );

  // --- helpers внутри компонента (нужен доступ к стейту/контексту) ---
  function handleFixed(issue) {
    const before = healthIndex;
    // отметка вернёт баллы; считаем дельту для «+N»
    // (markIssueFixed придёт из контекста ниже)
    const after = calculateHealthIndex(issuesData.systemic, mileage, [...fixedIssueIds, issue.id]);
    const delta = Math.max(0, after - before);
    markIssueFixed(issue);
    if (delta > 0) {
      setPop(delta);
      setTimeout(() => setPop(false), 1300);
    }
  }
}

// вне компонента: утилиты без стейта
function priorityCost(issue) {
  const wc = issue.consequences?.worst_case_cost_rub;
  const part = issue.parts?.[0]?.price;
  if (part) return `Деталь ~${formatPrice(part)}`;
  if (wc) return `Ремонт до ${formatPrice(wc)}`;
  return 'Стоит проверить';
}
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
function systemsHeadline(attention) {
  if (attention.length === 0) return 'Все системы в норме';
  const n = attention.length;
  return `На ${n} ${plural(n, 'систему', 'системы', 'систем')} обратите внимание`;
}
function systemsSub(systems) {
  const att = systems.filter(s => s.score != null && s.score < 65).map(s => s.label);
  if (att.length === 0) return 'все системы в норме';
  return `${att.join(' и ')} · остальные в норме`;
}

const s = {
  container: { background: c.bg, minHeight: '100vh', paddingBottom: '100px', fontFamily: 'Inter, -apple-system, system-ui, sans-serif' },
  loading: { padding: '40px', textAlign: 'center', color: c.textSecondary },

  emptyState: { padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  emptyTitle: { fontSize: '22px', fontWeight: '700', color: c.textPrimary, margin: '12px 0 0' },
  emptySubtitle: { fontSize: '14px', color: c.textSecondary, margin: 0 },
  emptyButton: { marginTop: '16px', padding: '14px 28px', fontSize: '15px', fontWeight: '600', color: '#FFF', background: c.primary, border: 'none', borderRadius: '12px', cursor: 'pointer' },

  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' },
  topbarLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  logo: { width: '30px', height: '30px', borderRadius: '8px', objectFit: 'cover', display: 'block', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' },
  topbarTitle: { fontSize: '15px', fontWeight: '600', color: c.textPrimary },

  hero: { margin: '0 12px 12px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '18px', padding: '16px 18px' },
  heroTop: { display: 'flex', alignItems: 'center', gap: '14px' },
  heroInfo: { flex: 1, minWidth: 0 },
  carName: { fontSize: '17px', fontWeight: '700', color: c.textPrimary, lineHeight: 1.15 },
  carSub: { fontSize: '12px', color: c.textTertiary, marginTop: '2px' },
  mileageBtn: { display: 'inline-flex', alignItems: 'center', marginTop: '6px', padding: 0, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  mileageVal: { fontSize: '13px', fontWeight: '600', color: c.textSecondary },
  mileageAgo: { fontSize: '11px', color: c.textTertiary },

  heroDivider: { height: '1px', background: c.border, margin: '14px 0' },
  healthRow: { display: 'flex', alignItems: 'center', gap: '16px' },
  ringWrap: { position: 'relative', width: '84px', height: '84px', flexShrink: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  ringPulse: { position: 'absolute', top: '50%', left: '50%', width: '84px', height: '84px', marginTop: '-42px', marginLeft: '-42px', borderRadius: '50%', border: `2px solid ${RING_FULL}`, pointerEvents: 'none' },
  ringCenter: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' },
  ringVal: { fontSize: '26px', fontWeight: '700', lineHeight: 1 },
  ringHintTap: { fontSize: '9px', color: c.textTertiary, marginTop: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' },
  ringI: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '11px', height: '11px', borderRadius: '50%', border: `1px solid ${c.textTertiary}`, fontSize: '8px', fontStyle: 'italic', lineHeight: 1 },
  ringMax: { fontSize: '9px', color: c.textTertiary, marginTop: '2px' },
  ringPop: { position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', fontSize: '15px', fontWeight: '700', color: c.successDark, pointerEvents: 'none' },
  ringHint: { fontSize: '10px', color: c.textTertiary, marginTop: '1px' },
  notice: { position: 'fixed', left: '50%', bottom: '78px', transform: 'translateX(-50%)', zIndex: 1500, display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '92%', padding: '11px 16px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', boxShadow: '0 6px 20px rgba(15,23,42,0.14)', fontSize: '13px', color: c.textPrimary },
  healthInfo: { flex: 1, minWidth: 0 },
  healthStatus: { fontSize: '17px', fontWeight: '600', marginBottom: '3px' },
  healthMean: { fontSize: '12px', color: c.textSecondary, lineHeight: 1.4 },

  peer: { marginTop: '14px', padding: '11px 14px', background: c.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' },
  peerText: { fontSize: '13px', color: c.textPrimary, lineHeight: 1.35 },

  // «Картина собрана N%» + CTA «Уточнить оценку»
  pictureWrap: { marginTop: '14px' },
  refineHint: { fontSize: '12px', color: c.textTertiary, textAlign: 'center', marginTop: '8px', lineHeight: 1.4 },

  // Чек-лист источников «что собрано»
  sources: { marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' },
  sourceRow: { display: 'flex', alignItems: 'center', gap: '9px' },
  sourceDot: { width: '16px', height: '16px', borderRadius: '50%', border: `1.5px solid ${c.border}`, flexShrink: 0 },
  sourceText: { flex: 1, fontSize: '13px', color: c.textSecondary },
  sourceBtn: { flexShrink: 0, padding: '6px 12px', borderRadius: '8px', border: 'none', background: c.primaryLight, color: c.primary, fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },

  // Модалка «Что это за оценка»
  infoOverlay: { position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  infoCard: { background: c.card, borderRadius: '16px', padding: '22px', maxWidth: '360px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  infoTitle: { fontSize: '18px', fontWeight: '600', color: c.textPrimary, marginBottom: '10px' },
  infoText: { fontSize: '14px', color: c.textSecondary, lineHeight: 1.55, margin: '0 0 12px' },
  infoBarTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px', marginBottom: '6px' },
  infoBarLabel: { fontSize: '13px', color: c.textSecondary },
  infoBarPct: { fontSize: '13px', fontWeight: '600', color: c.textPrimary, fontVariantNumeric: 'tabular-nums' },
  infoBar: { height: '7px', borderRadius: '4px', background: c.bg, overflow: 'hidden' },
  infoBarFill: { height: '100%', background: c.success, borderRadius: '4px' },
  infoBtn: { marginTop: '18px', width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: c.primary, color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  surveyCard: { display: 'flex', alignItems: 'center', gap: '11px', margin: '0 12px 14px', padding: '13px 14px', background: c.primaryLight, borderRadius: '14px', cursor: 'pointer' },
  surveyIcon: { width: '36px', height: '36px', borderRadius: '10px', background: c.card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  surveyTitle: { fontSize: '14px', fontWeight: '600', color: c.textPrimary },
  surveySub: { fontSize: '12px', color: c.textSecondary, marginTop: '2px', lineHeight: 1.35 },
  surveyBtn: { flexShrink: 0, padding: '8px 16px', borderRadius: '9px', border: 'none', background: c.primary, color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  pictureTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' },
  pictureLabel: { fontSize: '13px', color: c.textSecondary },
  picturePct: { fontSize: '13px', fontWeight: '600', color: c.textPrimary, fontVariantNumeric: 'tabular-nums' },
  pictureBar: { height: '7px', borderRadius: '4px', background: c.bg, overflow: 'hidden' },
  pictureFill: { height: '100%', background: c.success, borderRadius: '4px', transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)' },
  refineBtn: { marginTop: '10px', width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: c.primaryLight, color: c.primary, fontSize: '14px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' },

  noData: { fontSize: '13px', color: c.textSecondary, lineHeight: 1.5 },

  deferCard: { display: 'flex', alignItems: 'center', gap: '11px', margin: '0 12px 14px', padding: '13px 14px', background: c.primaryLight, borderRadius: '14px' },
  deferIcon: { width: '36px', height: '36px', borderRadius: '10px', background: c.card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  deferTitle: { fontSize: '12px', color: c.textSecondary },
  deferSub: { fontSize: '14px', fontWeight: '500', color: c.textPrimary, lineHeight: 1.35, cursor: 'pointer' },
  deferAsk: { flexShrink: 0, padding: '8px 14px', borderRadius: '9px', border: 'none', background: c.primary, color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  deferClose: { flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
  askBtn: { margin: '0 12px 14px', padding: '13px 16px', background: 'none', border: `1px solid ${c.border}`, borderRadius: '14px' },
  askTop: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  askTitle: { fontSize: '14px', fontWeight: '600', color: c.textPrimary },
  askSub: { fontSize: '12px', color: c.textTertiary, marginTop: '1px' },
  askChip: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginTop: '10px', padding: '10px 12px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
  askChipText: { fontSize: '13px', color: c.textSecondary },

  costWrap: { marginTop: '12px' },
  costHead: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0 0', borderTop: `1px solid ${c.border}`, borderLeft: 'none', borderRight: 'none', borderBottom: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  costTitle: { flex: 1, fontSize: '13px', color: c.textPrimary, textAlign: 'left' },
  costSum: { fontSize: '14px', fontWeight: '700', color: c.textPrimary },
  costChev: { display: 'inline-flex', transition: 'transform 0.2s' },
  costBody: { paddingTop: '12px' },
  costBar: { display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: c.bg },
  costLegend: { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' },
  costRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  costDot: { width: '8px', height: '8px', borderRadius: '2px', flexShrink: 0 },
  costRowLabel: { flex: 1, fontSize: '13px', color: c.textSecondary },
  costRowVal: { fontSize: '13px', fontWeight: '600', color: c.textPrimary },
  costLink: { marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: c.primary, fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', padding: 0 },

  prioCard: { margin: '0 12px 12px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '16px' },
  prioLabel: { fontSize: '11px', fontWeight: '600', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' },
  prioMain: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  prioDot: { width: '10px', height: '10px', borderRadius: '50%', background: c.amber, marginTop: '5px', flexShrink: 0 },
  prioTitle: { fontSize: '15px', fontWeight: '600', color: c.textPrimary, marginBottom: '3px' },
  prioDesc: { fontSize: '13px', color: c.textSecondary, lineHeight: 1.45 },
  prioFoot: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', gap: '8px', flexWrap: 'wrap' },
  prioCost: { fontSize: '12px', color: c.textTertiary },
  prioBtns: { display: 'flex', gap: '8px' },
  prioFixed: { fontSize: '13px', fontWeight: '600', padding: '8px 14px', borderRadius: '10px', background: 'none', border: `1px solid ${c.border}`, color: c.textSecondary, cursor: 'pointer', fontFamily: 'inherit' },
  prioWhat: { fontSize: '13px', fontWeight: '600', padding: '8px 16px', borderRadius: '10px', background: c.primaryLight, color: c.primary, border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  prioMore: { marginTop: '12px', width: '100%', padding: '11px', borderRadius: '10px', background: 'none', border: `1px solid ${c.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', color: c.textSecondary, fontFamily: 'inherit' },

  sysCard: { margin: '0 12px 12px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden' },
  sysHead: { width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', textAlign: 'left', fontFamily: 'inherit' },
  sysHeadLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  sysHeadTitle: { fontSize: '14px', fontWeight: '600', color: c.textPrimary },
  sysHeadSub: { fontSize: '12px', color: c.textTertiary, marginTop: '1px' },
  chev: { display: 'inline-flex', transition: 'transform 0.2s' },
  sysBody: { padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  sysRow: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
  sysName: { fontSize: '13px', color: c.textPrimary, width: '76px', flexShrink: 0 },
  sysBar: { flex: 1, height: '6px', background: c.bg, borderRadius: '3px', overflow: 'hidden' },
  sysBarFill: { height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' },
  sysWord: { fontSize: '12px', fontWeight: '500', width: '64px', textAlign: 'right', flexShrink: 0 },

  nextCard: { margin: '0 12px 12px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '16px' },
  nextHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  nextTitle: { fontSize: '14px', fontWeight: '600', color: c.textPrimary },
  nextRange: { fontSize: '12px', color: c.textTertiary },
  nextList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  nextItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: c.bg, borderRadius: '10px', cursor: 'pointer' },
  nextItemTitle: { fontSize: '13px', color: c.textPrimary },
  nextItemType: { fontSize: '11px', color: c.textTertiary },
  nextItemKm: { fontSize: '12px', fontWeight: '600', color: c.textSecondary },
  nextAll: { marginTop: '10px', width: '100%', padding: '11px', borderRadius: '10px', background: 'none', border: `1px solid ${c.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', color: c.textSecondary, fontFamily: 'inherit' },
};
