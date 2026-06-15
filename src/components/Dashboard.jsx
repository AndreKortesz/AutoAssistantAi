import React, { useState, useMemo, useRef } from 'react';
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
  UI_SYSTEMS,
} from '../utils/issueHelpers';
import MileageUpdateModal from './MileageUpdateModal';
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
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
};

const MAX_INDEX = 95;

// Цвет/статус общего индекса
function indexStatus(idx) {
  if (idx >= 80) return { color: c.success, label: 'Хорошее состояние' };
  if (idx >= 65) return { color: c.primary, label: 'Нормальное состояние' };
  if (idx >= 50) return { color: c.amber, label: 'Стоит присмотреться' };
  return { color: c.amber, label: 'Несколько мест внимания' };
}

function systemStatusWord(score) {
  if (score == null) return { word: 'мало данных', color: c.textTertiary, attention: false };
  if (score >= 80) return { word: 'В норме', color: c.textTertiary, attention: false };
  if (score >= 65) return { word: 'В норме', color: c.textTertiary, attention: false };
  return { word: 'Внимание', color: c.amber, attention: true };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { userCar, carDetails, issuesData, loading, updateMileage, fixedIssueIds, markIssueFixed } = useCar();
  const [showMileageModal, setShowMileageModal] = useState(false);
  const [systemsOpen, setSystemsOpen] = useState(false);
  const [pop, setPop] = useState(false); // анимация «+N» после «Я починил»
  const animatedRef = useRef(false);

  const mileage = userCar?.mileage ? parseInt(userCar.mileage) : 0;

  const healthIndex = useMemo(() => {
    if (!issuesData) return MAX_INDEX;
    return calculateHealthIndex(issuesData.systemic, mileage, fixedIssueIds);
  }, [issuesData, mileage, fixedIssueIds]);

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
        items.push({ id: m.id, title: m.issue?.title || 'ТО', type: 'Регламент ТО', km: next, icon: 'droplet' });
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

  const animateOnce = !animatedRef.current;
  animatedRef.current = true;

  return (
    <div style={s.container}>
      {/* Шапка «Мой гараж» */}
      <div style={s.topbar}>
        <div style={s.topbarLeft}>
          <div style={s.logo}>AAA</div>
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
              <div style={s.ringWrap}>
                <svg width="84" height="84" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="42" cy="42" r={R} fill="none" stroke={c.border} strokeWidth="6" />
                  {/* засечка-потолок 95 */}
                  <circle cx="42" cy="42" r={R} fill="none" stroke={c.amber} strokeWidth="2"
                    strokeDasharray="1.5 4" opacity="0.6" />
                  <circle cx="42" cy="42" r={R} fill="none" stroke={status.color} strokeWidth="6"
                    strokeLinecap="round" strokeDasharray={CIRC}
                    strokeDashoffset={CIRC * (1 - fillRatio)}
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)' }} />
                </svg>
                <div style={s.ringCenter}>
                  <div style={{ ...s.ringVal, color: c.textPrimary }}>{healthIndex}</div>
                </div>
                {pop && <div style={s.ringPop} className="aaa-pop-up">+{pop}</div>}
              </div>
              <div style={s.healthInfo}>
                <div style={{ ...s.healthStatus, color: status.color }}>{status.label}</div>
                <div style={s.healthMean}>Для машины с таким пробегом — крепкий результат.</div>
              </div>
            </div>

            <div style={s.peer}>
              <Icon name="trophy" size={17} color={c.successDark} />
              <div style={s.peerText}>
                Крепче, чем у <b>~{peerPct}%</b> ровесников {carDetails.model_name} с похожим пробегом
              </div>
            </div>
          </>
        )}

        {!hasData && (
          <>
            <div style={s.heroDivider} />
            <div style={s.noData}>Список типичных мест внимания для этой модели ещё собираем — подключим, как будет готово.</div>
          </>
        )}
      </div>

      {/* Спросить про мою машину (обводка) */}
      <button style={s.askBtn} onClick={() => navigate('/assistant')}>
        <Icon name="chat" size={20} color={c.primary} />
        <div style={{ flex: 1 }}>
          <div style={s.askTitle}>Спросить про мою машину</div>
          <div style={s.askSub}>Ассистент знает вашу комплектацию</div>
        </div>
        <Icon name="arrowRight" size={16} color={c.textTertiary} />
      </button>

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
              <button style={s.nextAll} onClick={() => navigate('/journal')}>
                Весь план до {Math.round((mileage + 10000) / 1000)} тыс. км
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
  logo: { width: '30px', height: '30px', borderRadius: '8px', background: c.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' },
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
  ringWrap: { position: 'relative', width: '84px', height: '84px', flexShrink: 0 },
  ringCenter: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' },
  ringVal: { fontSize: '26px', fontWeight: '700', lineHeight: 1 },
  ringMax: { fontSize: '9px', color: c.textTertiary, marginTop: '2px' },
  ringPop: { position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', fontSize: '15px', fontWeight: '700', color: c.successDark, pointerEvents: 'none' },
  healthInfo: { flex: 1, minWidth: 0 },
  healthStatus: { fontSize: '17px', fontWeight: '600', marginBottom: '3px' },
  healthMean: { fontSize: '12px', color: c.textSecondary, lineHeight: 1.4 },

  peer: { marginTop: '14px', padding: '11px 14px', background: c.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' },
  peerText: { fontSize: '13px', color: c.textPrimary, lineHeight: 1.35 },

  noData: { fontSize: '13px', color: c.textSecondary, lineHeight: 1.5 },

  askBtn: { width: 'calc(100% - 24px)', margin: '0 12px 14px', padding: '13px 16px', background: 'none', border: `1px solid ${c.border}`, borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', fontFamily: 'inherit' },
  askTitle: { fontSize: '14px', fontWeight: '600', color: c.textPrimary },
  askSub: { fontSize: '12px', color: c.textTertiary, marginTop: '1px' },

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
