import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import {
  groupByImportance,
  severityColor,
  severityLabel,
  formatPrice,
  formatMileage,
  frequencyText,
  recordTitle,
  getLinkedRecalls,
  getLinkedClassActions,
  isBodyRecord,
  recordSystem,
  systemSentiment,
} from '../utils/issueHelpers';
import Icon from './Icon';
import CarSilhouette from './CarSilhouette';
import MaintenanceTab from './MaintenanceTab';
import MileageMapTab from './MileageMapTab';
import CoachmarksTour from './CoachmarksTour';

const TOUR_KEY = 'aaa_service_tour_seen';

// AutoAssistantAi — Экран болячек
// Группировка: текущие / предстоящие / прошедшие (по пробегу)
// Сортировка: по severity (critical → low)

const c = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  border: '#E2E8F0',
  primary: '#1F4FD8',
  primaryLight: 'rgba(31, 79, 216, 0.08)',
  success: '#2E9E6F',
  warning: '#D97706',
  critical: '#DC2626',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
};

// severity → цвет точки: critical красный, high янтарь, остальное серое
function sevColor(sev) {
  if (sev === 'critical') return '#E24B4A';
  if (sev === 'high') return '#BA7517';
  return '#CBD5E1';
}
function systemLabelRu(sys) {
  const map = { engine: 'Двигатель', transmission: 'Коробка', suspension: 'Подвеска', steering: 'Рулевое', brakes: 'Тормоза', cooling: 'Охлаждение', fuel: 'Топливная', exhaust: 'Выхлоп', electrical: 'Электрика', interior: 'Салон', climate: 'Климат', ignition: 'Зажигание' };
  return map[sys] || '';
}

export default function IssuesScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userCar, carDetails, issuesData, loading, fixedIssueIds, markIssueFixed, unmarkIssueFixed, issueStatuses, setIssueStatus } = useCar();

  const [activeTab, setActiveTab] = useState(location.state?.tab || 'issues'); // issues | service | map
  const [openGroups, setOpenGroups] = useState({}); // {} = дефолт (первая непустая раскрыта)
  const [seeAllGroups, setSeeAllGroups] = useState({});
  const [recallsOpen, setRecallsOpen] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState(null);
  const toggleIssue = (id) => setExpandedIssue(prev => prev === id ? null : id);

  const mileage = userCar?.mileage ? parseInt(userCar.mileage) : 0;

  const isFixed = (id) => fixedIssueIds.includes(id);

  // Подсветка по ответам-ощущениям: системы, помеченные «тревожно/средне» (flag) / «хорошо» (ok).
  const sentiment = useMemo(() => systemSentiment(userCar?.onboardingAnswers || {}), [userCar]);
  const hintFor = (issue) => sentiment[recordSystem(issue)]; // 'flag' | 'ok' | undefined

  // Сортировка ВНУТРИ группы: важность первична (severity), затем симптом (flag выше, ok ниже).
  // Между группами порядок важности НЕ трогаем (критичное всегда в своей верхней группе).
  const sevRank = { critical: 0, high: 1, medium: 2, low: 3 };
  const sentRank = { flag: 0, undefined: 1, ok: 2 };
  const sortInGroup = (arr) => [...arr].sort((a, b) =>
    (sevRank[a.issue?.severity] ?? 9) - (sevRank[b.issue?.severity] ?? 9) ||
    (sentRank[hintFor(a)] ?? 1) - (sentRank[hintFor(b)] ?? 1)
  );

  // Группируем болячки по важности (кузов отфильтрован внутри).
  // Отмеченные «сделано» убираем из активных групп — они уходят в отдельную кучу «Сделано».
  const grouped = useMemo(() => {
    if (!issuesData) return { safety: [], planned: [], minor: [], upcoming: [], past: [] };
    const g = groupByImportance(issuesData.systemic, mileage, fixedIssueIds);
    for (const k of ['safety', 'planned', 'minor', 'upcoming']) g[k] = sortInGroup(g[k].filter(i => !isFixed(i.id)));
    return g;
  }, [issuesData, mileage, fixedIssueIds, sentiment]);

  // «Мелочи» = low-болячки + отдельный тип minor_annoyance (без кузова)
  const minorAll = useMemo(() => {
    const extra = (issuesData?.minor || []).filter(r => (r.issue?.system || r.position?.system || r.part_info?.system) !== 'body');
    return [...grouped.minor, ...extra];
  }, [grouped, issuesData]);

  // «Сделано» — всё, что пользователь отметил устранённым (отдельная куча, свёрнута).
  const doneAll = useMemo(() => {
    if (!issuesData) return [];
    return (issuesData.systemic || []).filter(i => isFixed(i.id) && !isBodyRecord(i));
  }, [issuesData, fixedIssueIds]);

  const firstOpenKey = grouped.safety.length ? 'safety' : grouped.planned.length ? 'planned' : minorAll.length ? 'minor' : null;
  const isGroupOpen = (key) => (openGroups[key] !== undefined ? openGroups[key] : key === firstOpenKey);
  const toggleGroup = (key) => setOpenGroups(prev => ({ ...prev, [key]: !isGroupOpen(key) }));

  // «Сейчас» = то, что стоит внимания (безопасность + плановое). Мелочи — фон, не пугаем цифрой.
  const nowCount = grouped.safety.length + grouped.planned.length;
  const doneCount = fixedIssueIds.length;

  const tabRefs = [useRef(null), useRef(null), useRef(null)];
  const TABS = [
    { id: 'issues', label: 'Слабые места' },
    { id: 'service', label: 'ТО и расходники' },
    { id: 'map', label: 'Карта' },
  ];

  // Коачмарк-тур по 3 вкладкам — один раз, при первом заходе с реальными данными.
  const [tourOn, setTourOn] = useState(false);
  useEffect(() => {
    if (!issuesData?.hasData) return;
    let seen = true;
    try { seen = localStorage.getItem(TOUR_KEY) === 'true'; } catch (e) {}
    if (!seen) setTourOn(true);
  }, [issuesData]);
  const closeTour = () => {
    setTourOn(false);
    try { localStorage.setItem(TOUR_KEY, 'true'); } catch (e) {}
  };
  const tourSteps = [
    { targetRef: tabRefs[0], onEnter: () => setActiveTab('issues'), title: 'Слабые места',
      text: `Болячки именно вашего ${carDetails?.model_name || 'авто'} — что бывает на этой версии и пробеге. Отмечайте, что уже сделано, — оценка станет точнее.` },
    { targetRef: tabRefs[1], onEnter: () => setActiveTab('service'), title: 'ТО и расходники',
      text: 'Регламент и износ по вашему пробегу: что и когда менять. Загляните в карточку — там детали и артикулы.' },
    { targetRef: tabRefs[2], onEnter: () => setActiveTab('map'), title: 'Карта',
      text: 'Дорога вперёд по пробегу — что ждёт и через сколько тысяч км. Спокойный план, не список проблем.' },
  ];

  const rowSub = (issue) => {
    const sys = systemLabelRu(issue.issue?.system || issue.position?.system || issue.part_info?.system);
    const mi = issue.mileage || {};
    let when = '';
    if (mi.peak_km != null) when = `пик ~${Math.round(mi.peak_km / 1000)} тыс.`;
    else if (mi.typical_start_km != null) when = `от ~${Math.round(mi.typical_start_km / 1000)} тыс.`;
    const recall = getLinkedRecalls(issue.id, issuesData.recalls).length > 0 ? ' · есть recall' : '';
    return [sys, when].filter(Boolean).join(' · ') + recall;
  };

  const issueGroup = (key, opts, list) => {
    const hasSerious = list.some(i => i.issue?.severity === 'critical' || i.issue?.severity === 'high');
    const seeAll = seeAllGroups[key];
    const shown = seeAll ? list : list.slice(0, 3);
    return (
      <Section
        icon={opts.icon}
        iconColor={list.length === 0 ? c.textTertiary : hasSerious ? c.warning : c.textTertiary}
        title={opts.title} subtitle={opts.subtitle} muted={opts.muted}
        count={list.length} empty={list.length === 0}
        open={isGroupOpen(key)} onToggle={() => toggleGroup(key)}
      >
        {opts.intro && <div style={s.chronicIntro}>{opts.intro}</div>}
        {shown.map((issue, idx) => {
          const infoOnly = !issue.issue && !issue.solutions; // minor_annoyance: нет детальной страницы
          if (infoOnly) {
            return (
              <div key={issue.id} style={{ ...s.issueRow, ...(idx > 0 ? s.issueRowBorder : {}) }}>
                <span style={{ ...s.sevDot, background: sevColor(issue.issue?.severity) }} />
                <div style={s.issueRowInfo}>
                  <div style={s.issueRowTitle}>{recordTitle(issue)}</div>
                  <div style={s.issueRowSub}>{issue.description || ''}</div>
                </div>
              </div>
            );
          }
          return (
            <IssueCard
              key={issue.id}
              issue={issue}
              expanded={expandedIssue === issue.id}
              onToggle={() => toggleIssue(issue.id)}
              onDetails={() => navigate(`/issues/${issue.id}`)}
              recalls={getLinkedRecalls(issue.id, issuesData.recalls)}
              classActions={getLinkedClassActions(issue.id, issuesData.classActions)}
              isFixed={fixedIssueIds.includes(issue.id)}
              status={issueStatuses[issue.id]}
              onMarkFixed={() => markIssueFixed(issue)}
              onUnmark={() => unmarkIssueFixed(issue.id)}
              onSetStatus={(st) => setIssueStatus(issue.id, issueStatuses[issue.id] === st ? null : st)}
              hint={hintFor(issue)}
            />
          );
        })}
        {list.length > 3 && !seeAll && (
          <button style={s.moreInGroup} onClick={() => setSeeAllGroups(p => ({ ...p, [key]: true }))}>
            Ещё {list.length - 3} в этой группе
          </button>
        )}
      </Section>
    );
  };

  if (loading) {
    return <div style={s.loading}>Загрузка...</div>;
  }

  if (!userCar || !carDetails || !issuesData) {
    return (
      <div style={s.container}>
        <div style={s.emptyState}>
          <div style={{ ...s.emptyIcon, display: 'flex', justifyContent: 'center' }}><CarSilhouette color="#B8BCC2" width={110} height={60} /></div>
          <h2 style={s.emptyTitle}>Сначала добавьте автомобиль</h2>
          <p style={s.emptySubtitle}>
            Чтобы увидеть болячки именно вашей машины
          </p>
          <button style={s.emptyButton} onClick={() => navigate('/add-car')}>
            Добавить автомобиль
          </button>
        </div>
      </div>
    );
  }

  const carLabel = `${carDetails.brand} ${carDetails.model_name} ${carDetails.generation}`;
  const engineLabel = carDetails.engines.find(e => e.code === userCar.engineCode)?.label || '';

  if (!issuesData.hasData) {
    return (
      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.headerTitle}>Что бывает у этой модели</h1>
          <div style={s.headerSubtitle}>{carLabel}{engineLabel ? ` • ${engineLabel}` : ''}</div>
        </div>
        <div style={s.emptyState}>
          <div style={{ ...s.emptyIcon, display: 'flex', justifyContent: 'center' }}><Icon name="clipboard" size={52} color={c.textTertiary} /></div>
          <h2 style={s.emptyTitle}>Данные собираются</h2>
          <p style={s.emptySubtitle}>
            Список типичных болячек для этой модели ещё не закончен. Подключим, как будет готово.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.headerTitle}>Обслуживание</h1>
        <div style={s.headerSubtitle}>
          {carLabel} • {engineLabel} • {formatMileage(userCar.mileage)}
        </div>
      </div>

      {/* Шапка C: спокойная фраза + сводка 3 чисел */}
      <div style={s.calmCard}>
        <div style={s.calmTop}>
          <Icon name="smile" size={22} color={c.success} />
          <div>
            <div style={s.calmPhrase}>Для своего пробега — спокойно</div>
            <div style={s.calmHint}>Известные слабые места модели, а не поломки вашей машины.</div>
          </div>
        </div>
        <div style={s.calmNums}>
          <div style={s.calmStat}><div style={{ ...s.calmNum, color: c.textPrimary }}>{nowCount}</div><div style={s.calmStatLabel}>сейчас</div></div>
          <div style={s.calmStat}><div style={{ ...s.calmNum, color: c.textPrimary }}>{grouped.upcoming.length}</div><div style={s.calmStatLabel}>впереди</div></div>
          <div style={s.calmStat}><div style={{ ...s.calmNum, color: c.success }}>{doneCount}</div><div style={s.calmStatLabel}>пройдено</div></div>
        </div>
      </div>

      {/* Отзывные кампании и иски — из нашей базы */}
      {(issuesData.recalls.length > 0 || issuesData.classActions.length > 0 || issuesData.tsb.length > 0) && (
        <div style={s.legalCard}>
          <button style={s.legalHead} onClick={() => setRecallsOpen(o => !o)}>
            <span style={s.vinIcon}><Icon name="shield" size={20} color={c.primary} /></span>
            <div style={s.vinText}>
              <div style={s.vinTitle}>Отзывные кампании и иски</div>
              <div style={s.vinSub}>{legalSummary(issuesData)}</div>
            </div>
            <span style={{ ...s.legalChev, transform: recallsOpen ? 'rotate(180deg)' : 'none' }}>
              <Icon name="chevronDown" size={16} color={c.textTertiary} />
            </span>
          </button>

          {recallsOpen && (
            <div style={s.legalBody}>
              {issuesData.recalls.length > 0 && (
                <div style={s.legalGroup}>
                  <div style={s.legalGroupTitle}>Отзывные кампании</div>
                  {issuesData.recalls.map((r, i) => (
                    <div key={i} style={s.legalRow}>
                      <span style={s.legalFlag}>{r.country_flag || '🌐'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.legalCountry}>
                          {r.country} {r.year ? `(${r.year})` : ''}{r.recall_id ? ` · ${r.recall_id}` : ''}
                        </div>
                        <div style={s.legalDesc}>{r.description}</div>
                      </div>
                      {r.status && <span style={s.legalStatus}>{r.status}</span>}
                    </div>
                  ))}
                </div>
              )}
              {issuesData.classActions.length > 0 && (
                <div style={s.legalGroup}>
                  <div style={s.legalGroupTitle}>Коллективные иски</div>
                  {issuesData.classActions.map((ca, i) => (
                    <div key={i} style={s.legalRow}>
                      <span style={s.legalFlag}>{ca.country_flag || '🌐'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.legalCountry}>{ca.country} {ca.year_filed ? `(${ca.year_filed})` : ''}</div>
                        <div style={s.legalDesc}>{ca.result || ca.case_name || ca.claim_summary?.slice(0, 120) || '—'}</div>
                      </div>
                      <span style={s.defectBadge(ca.status)}>{statusBadge(ca.status)}</span>
                    </div>
                  ))}
                </div>
              )}
              {issuesData.tsb.length > 0 && (
                <div style={s.legalGroup}>
                  <div style={s.legalGroupTitle}>Сервисные бюллетени (TSB)</div>
                  {issuesData.tsb.map((t, i) => (
                    <div key={i} style={s.legalRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.legalCountry}>{t.code} {t.date ? `(${t.date})` : ''}</div>
                        <div style={s.legalDesc}>{t.title || t.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={s.legalNote}>Данные собраны из открытых источников (NHTSA, Росстандарт, Transport Canada и др.). Применимость к вашему VIN уточняйте у дилера.</div>
            </div>
          )}
        </div>
      )}

      {/* Вкладки раздела */}
      <div style={s.tabbar}>
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={tabRefs[i]}
            style={{ ...s.tab, ...(activeTab === t.id ? s.tabActive : {}) }}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Контент вкладок */}
      {activeTab === 'issues' && (
        <div style={s.sections}>
          {issueGroup('safety', { icon: 'shield', title: 'Важно для безопасности и мотора', subtitle: 'стоит держать в поле зрения' }, grouped.safety)}
          {issueGroup('planned', { icon: 'wrench', title: 'Плановый ремонт и износ', subtitle: 'по мере пробега' }, grouped.planned)}
          {issueGroup('minor', { icon: 'info', title: 'Мелочи · просто знать', subtitle: 'не требуют действий', muted: true }, minorAll)}
          {grouped.upcoming.length > 0 && (
            <>
              <div style={s.aheadDivider} />
              {issueGroup('upcoming', { icon: 'clock', title: 'Что может проявиться впереди', subtitle: 'старт по пробегу ещё впереди', intro: 'Не сейчас, а на горизонте. Просто чтобы знать.' }, grouped.upcoming)}
            </>
          )}
          {doneAll.length > 0 && (
            <>
              <div style={s.aheadDivider} />
              {issueGroup('done', { icon: 'check', title: 'Сделано', subtitle: 'вы отметили как устранённое', muted: true, done: true }, doneAll)}
            </>
          )}
        </div>
      )}

      {activeTab === 'service' && <MaintenanceTab />}
      {activeTab === 'map' && <MileageMapTab />}

      {tourOn && <CoachmarksTour steps={tourSteps} onClose={closeTour} />}
    </div>
  );
}

function Section({ icon, iconColor, title, subtitle, count, open, onToggle, children, muted, empty }) {
  return (
    <div style={{ ...s.groupCard, ...(muted ? s.groupCardMuted : {}) }}>
      <button style={s.groupHead} onClick={empty ? undefined : onToggle} disabled={empty}>
        {icon && <span style={s.groupIcon}><Icon name={empty ? 'check' : icon} size={24} color={empty ? c.success : (iconColor || c.textSecondary)} strokeWidth={1.7} /></span>}
        <div style={s.groupText}>
          <div style={s.groupTitle}>{title}</div>
          {subtitle && <div style={s.groupSub}>{subtitle}</div>}
        </div>
        {empty ? (
          <span style={s.groupOk}>пока чисто</span>
        ) : (
          <>
            <span style={s.groupCount}>{count}</span>
            <span style={{ ...s.groupChev, transform: open ? 'rotate(180deg)' : 'none' }}>
              <Icon name="chevronDown" size={18} color={c.textTertiary} />
            </span>
          </>
        )}
      </button>
      {!empty && open && <div style={s.groupBody}>{children}</div>}
    </div>
  );
}

function IssueCard({ issue, expanded, onToggle, onDetails, recalls, classActions, isFixed, status, onMarkFixed, onUnmark, onSetStatus, hint }) {
  const severity = issue.issue?.severity || 'low';
  const title = recordTitle(issue);
  const subsystem = issue.issue?.subsystem || issue.issue?.system || '';
  const freq = frequencyText(issue.mileage);
  const peakKm = issue.mileage?.peak_km;
  
  const hasRecalls = recalls.length > 0;
  const hasClassActions = classActions.length > 0;

  // Стоимость худшего случая
  const worstCost = issue.consequences?.worst_case_cost_rub;
  
  return (
    <div style={s.issueCard(expanded)}>
      <button style={s.issueHeader} onClick={onToggle}>
        <div style={s.issueHeaderLeft}>
          <div style={s.severityDot(severity)} />
          <div style={s.issueHeaderInfo}>
            <span style={s.issueName}>
              {title}
              {isFixed && <span style={s.fixedBadge}>✓ Сделано</span>}
            </span>
            <span style={s.issueMeta}>
              {subsystem && `${subsystem} · `}{freq}
            </span>
            {hint === 'flag' && <span style={s.hintFlag}>возможно, это про вас</span>}
            {hint === 'ok' && <span style={s.hintOk}>пока не беспокоит</span>}
          </div>
        </div>
        {(hasRecalls || hasClassActions) && (
          <div style={s.statusIcons}>
            {hasClassActions && <div style={s.statusIcon} title="Коллективный иск"><Icon name="scale" size={13} color={c.primary} /></div>}
            {hasRecalls && <div style={s.statusIcon} title="Отзывная кампания"><Icon name="fileText" size={13} color={c.primary} /></div>}
          </div>
        )}
        <span style={s.issueToggle(expanded)}>▼</span>
      </button>
      
      <div style={s.issueBody(expanded)}>
        {issue.issue?.severity_reason && (
          <p style={s.issueDescription}>
            <strong>{severityLabel(severity)}:</strong> {issue.issue.severity_reason}
          </p>
        )}

        {/* Юридический статус */}
        {(hasRecalls || hasClassActions) && (
          <div style={s.defectStatus}>
            {hasClassActions && (
              <div style={s.defectBlock}>
                <div style={s.defectBlockTitle}>Коллективные иски</div>
                {classActions.map((ca, i) => (
                  <div key={i} style={s.defectItem}>
                    <span style={s.defectFlag}>{ca.country_flag || '🌐'}</span>
                    <div style={s.defectInfo}>
                      <div style={s.defectCountry}>{ca.country} {ca.year_filed ? `(${ca.year_filed})` : ''}</div>
                      <div style={s.defectResult}>{ca.result || ca.claim_summary?.slice(0, 80) || '—'}</div>
                    </div>
                    <span style={s.defectBadge(ca.status)}>{statusBadge(ca.status)}</span>
                  </div>
                ))}
              </div>
            )}
            {hasRecalls && (
              <div style={s.defectBlock}>
                <div style={s.defectBlockTitle}>Отзывные кампании</div>
                {recalls.map((r, i) => (
                  <div key={i} style={s.defectItem}>
                    <span style={s.defectFlag}>{r.country_flag || '🌐'}</span>
                    <div style={s.defectInfo}>
                      <div style={s.defectCountry}>{r.country} {r.year ? `(${r.year})` : ''}</div>
                      <div style={s.defectResult}>{r.description?.slice(0, 100) || '—'}</div>
                    </div>
                    {r.recall_id && <span style={s.recallCode}>{r.recall_id}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Быстрые метрики */}
        <div style={s.quickMetrics}>
          {peakKm && (
            <div style={s.metricItem}>
              <span style={s.metricIcon}><Icon name="pin" size={14} color={c.textSecondary} /></span>
              <span style={s.metricValue}>пик ~{formatMileage(peakKm)}</span>
            </div>
          )}
          {worstCost && (
            <div style={s.metricItem}>
              <span style={s.metricIcon}><Icon name="wallet" size={14} color={c.textSecondary} /></span>
              <span style={s.metricValue}>до {formatPrice(worstCost)}</span>
            </div>
          )}
          {issue.issue?.can_drive === false && (
            <div style={s.metricItem}>
              <span style={s.metricIcon}><Icon name="ban" size={14} color={c.critical} /></span>
              <span style={s.metricValue}>ехать нельзя</span>
            </div>
          )}
        </div>

        {/* Дожим: что у пользователя с этой болячкой. Понятные действия. */}
        {isFixed ? (
          <div style={s.dozhimDone}>
            <span style={s.dozhimDoneLabel}><Icon name="check" size={15} color={c.success} /> Устранено — вы отметили</span>
            <button style={s.dozhimUndo} onClick={onUnmark}>Вернуть</button>
          </div>
        ) : (
          <div style={s.dozhim}>
            <div style={s.dozhimQ}>Что у вас с этим?</div>
            <div style={s.dozhimRow}>
              <button style={s.dozhimFix} onClick={onMarkFixed}>
                <Icon name="check" size={15} color="#fff" /> Уже устранил
              </button>
              <button style={{ ...s.dozhimBtn, ...(status === 'actual' ? s.dozhimBtnActive : {}) }} onClick={() => onSetStatus('actual')}>Ещё не делал</button>
              <button style={{ ...s.dozhimBtn, ...(status === 'unknown' ? s.dozhimBtnActive : {}) }} onClick={() => onSetStatus('unknown')}>Не знаю</button>
            </div>
          </div>
        )}

        <button style={s.detailButton} onClick={onDetails}>
          Подробнее →
        </button>
      </div>
    </div>
  );
}

function EmptyText({ children }) {
  return <div style={s.emptyText}>{children}</div>;
}

function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
function legalSummary(data) {
  const parts = [];
  if (data.recalls.length) parts.push(`${data.recalls.length} ${plural(data.recalls.length, 'отзывная', 'отзывных', 'отзывных')}`);
  if (data.classActions.length) parts.push(`${data.classActions.length} ${plural(data.classActions.length, 'иск', 'иска', 'исков')}`);
  if (data.tsb.length) parts.push(`${data.tsb.length} TSB`);
  return parts.join(' · ') + ' по этому поколению';
}

function statusBadge(status) {
  switch (status) {
    case 'won': return '✓ Выигран';
    case 'lost': return 'Проигран';
    case 'settlement': return 'Соглашение';
    case 'pending': return 'В процессе';
    case 'dismissed': return 'Отклонён';
    case 'withdrawn': return 'Отозван';
    default: return status || '—';
  }
}

const s = {
  container: { background: c.bg, minHeight: '100vh', paddingBottom: '100px', fontFamily: 'Inter, system-ui, sans-serif' },
  loading: { padding: '40px', textAlign: 'center', color: c.textSecondary },

  // Шапка C
  calmCard: { margin: '12px', padding: '18px', background: c.card, borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  calmTop: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  calmPhrase: { fontSize: '17px', fontWeight: '600', color: c.success },
  calmHint: { fontSize: '13px', color: c.textSecondary, lineHeight: '1.45', marginTop: '4px' },
  calmNums: { display: 'flex', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${c.border}` },
  calmStat: { flex: 1, textAlign: 'center' },
  calmNum: { fontSize: '26px', fontWeight: '700', lineHeight: 1 },
  calmStatLabel: { fontSize: '12px', color: c.textTertiary, marginTop: '4px' },

  // Таб-бар (iOS-сегмент)
  tabbar: { display: 'flex', gap: '2px', margin: '0 12px 14px', padding: '4px', background: '#EDF0F4', borderRadius: '12px' },
  tab: { flex: 1, padding: '9px 6px', background: 'none', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: c.textSecondary, cursor: 'pointer', fontFamily: 'inherit' },
  tabActive: { background: c.card, color: c.primary, boxShadow: '0 1px 3px rgba(0,0,0,0.10)' },

  // Группы-карточки (заголовок раскрывающейся группы)
  groupCard: { margin: '0 12px 10px', background: c.card, borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' },
  groupCardMuted: { background: '#F1F2F4', boxShadow: 'none' },
  groupHead: { width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
  groupIcon: { flexShrink: 0, display: 'flex' },
  groupText: { flex: 1, minWidth: 0 },
  groupTitle: { fontSize: '17px', fontWeight: '600', color: c.textPrimary, lineHeight: 1.25 },
  groupSub: { fontSize: '13px', color: c.textTertiary, marginTop: '2px' },
  groupCount: { minWidth: '30px', height: '30px', padding: '0 9px', borderRadius: '15px', background: '#EDF0F4', color: c.textPrimary, fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  groupChev: { display: 'inline-flex', transition: 'transform 0.2s', flexShrink: 0 },
  groupOk: { fontSize: '13px', color: c.success, fontWeight: '500', flexShrink: 0 },
  groupBody: { padding: '0 16px 6px' },
  aheadDivider: { height: '1px', background: c.border, margin: '6px 24px 14px' },

  issueRow: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
  issueRowBorder: { borderTop: `1px solid ${c.border}` },
  sevDot: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
  issueRowInfo: { flex: 1, minWidth: 0 },
  issueRowTitle: { fontSize: '15px', fontWeight: '600', color: c.textPrimary, lineHeight: 1.3 },
  issueRowSub: { fontSize: '12px', color: c.textTertiary, marginTop: '2px' },
  moreInGroup: { width: '100%', padding: '11px 0 4px', background: 'none', border: 'none', borderTop: `1px solid ${c.border}`, cursor: 'pointer', fontSize: '13px', color: c.primary, fontWeight: '500', fontFamily: 'inherit', textAlign: 'left' },

  okEmpty: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 4px 8px', fontSize: '13px', color: c.textSecondary },
  
  emptyState: { padding: '40px 20px', textAlign: 'center' },
  emptyIcon: { fontSize: '64px', marginBottom: '16px' },
  emptyTitle: { fontSize: '20px', fontWeight: '700', color: c.textPrimary, margin: '0 0 8px' },
  emptySubtitle: { fontSize: '14px', color: c.textSecondary, margin: '0 0 24px' },
  emptyButton: { padding: '14px 28px', fontSize: '15px', fontWeight: '600', color: '#FFF', background: c.primary, border: 'none', borderRadius: '12px', cursor: 'pointer' },
  
  header: { padding: '16px 20px', background: c.card, borderBottom: `1px solid ${c.border}` },
  headerTitle: { fontSize: '18px', fontWeight: '700', color: c.textPrimary, margin: 0 },
  headerSubtitle: { fontSize: '13px', color: c.textSecondary, marginTop: '4px' },
  
  intro: { display: 'flex', gap: '12px', padding: '14px 16px', margin: '12px', background: c.primaryLight, borderRadius: '12px' },
  legalCard: { margin: '0 12px 12px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', overflow: 'hidden' },
  legalHead: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
  vinIcon: { flexShrink: 0, display: 'flex' },
  vinText: { flex: 1, minWidth: 0 },
  vinTitle: { fontSize: '14px', fontWeight: '600', color: c.textPrimary },
  vinSub: { fontSize: '12px', color: c.textSecondary, lineHeight: '1.4', marginTop: '2px' },
  legalChev: { flexShrink: 0, display: 'flex', transition: 'transform 0.2s' },
  legalBody: { padding: '4px 14px 14px' },
  legalGroup: { marginBottom: '12px' },
  legalGroupTitle: { fontSize: '11px', fontWeight: '600', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '6px 0 8px' },
  legalRow: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderTop: `1px solid ${c.border}` },
  legalFlag: { fontSize: '16px', flexShrink: 0 },
  legalCountry: { fontSize: '13px', fontWeight: '600', color: c.textPrimary },
  legalDesc: { fontSize: '12px', color: c.textSecondary, lineHeight: '1.4', marginTop: '2px' },
  legalStatus: { fontSize: '11px', color: c.textSecondary, flexShrink: 0, whiteSpace: 'nowrap' },
  legalNote: { fontSize: '11px', color: c.textTertiary, lineHeight: '1.4', marginTop: '4px', fontStyle: 'italic' },
  introIcon: { fontSize: '18px', flexShrink: 0 },
  introText: { fontSize: '13px', color: c.textSecondary, lineHeight: '1.5' },
  
  summary: { display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '16px', margin: '0 12px 12px', background: c.card, borderRadius: '12px', border: `1px solid ${c.border}` },
  summaryItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  summaryValue: { fontSize: '24px', fontWeight: '700' },
  summaryLabel: { fontSize: '11px', color: c.textTertiary },
  summaryDivider: { width: '1px', height: '32px', background: c.border },
  
  sections: { padding: '0 12px' },
  section: { marginBottom: '16px' },
  sectionWrapper: (type) => ({
    background: c.card, borderRadius: '16px', overflow: 'hidden',
    border: `1px solid ${type === 'critical' ? 'rgba(220, 38, 38, 0.3)' : type === 'warning' ? 'rgba(217, 119, 6, 0.3)' : type === 'success' ? 'rgba(46, 158, 111, 0.3)' : type === 'info' ? 'rgba(124, 92, 217, 0.3)' : c.border}`
  }),
  sectionHeader: (type) => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: 'none', cursor: 'pointer',
    background: type === 'critical' ? 'rgba(220, 38, 38, 0.08)' : type === 'warning' ? 'rgba(217, 119, 6, 0.08)' : type === 'success' ? 'rgba(46, 158, 111, 0.08)' : type === 'info' ? 'rgba(124, 92, 217, 0.08)' : c.bg,
    fontFamily: 'inherit',
  }),
  sectionHeaderLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  sectionDot: (type) => ({
    width: '10px', height: '10px', borderRadius: '50%',
    background: type === 'critical' ? c.critical : type === 'warning' ? c.warning : type === 'success' ? c.success : type === 'info' ? '#7C5CD9' : c.textTertiary
  }),
  sectionTitle: { fontSize: '15px', fontWeight: '600', color: c.textPrimary },
  sectionCount: (type) => ({
    fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '10px', color: 'white',
    background: type === 'critical' ? c.critical : type === 'warning' ? c.warning : type === 'success' ? c.success : type === 'info' ? '#7C5CD9' : c.textTertiary
  }),
  chronicIntro: { fontSize: '12px', color: c.textSecondary, lineHeight: '1.5', padding: '4px 8px 12px', fontStyle: 'italic' },
  sectionToggle: (open) => ({ fontSize: '10px', color: c.textTertiary, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }),
  sectionContent: (open) => ({ display: open ? 'block' : 'none', padding: '12px', background: c.bg }),
  
  issueCard: (expanded) => ({
    background: c.card, borderRadius: '12px', marginBottom: '10px', overflow: 'hidden',
    border: `1px solid ${expanded ? c.primary : c.border}`,
    boxShadow: expanded ? '0 2px 8px rgba(31, 79, 216, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)'
  }),
  issueHeader: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
  issueHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 },
  severityDot: (severity) => ({
    width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
    background: severityColor(severity),
  }),
  issueHeaderInfo: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 },
  issueName: { fontSize: '15px', fontWeight: '600', color: c.textPrimary, lineHeight: '1.3' },
  fixedBadge: { marginLeft: '8px', fontSize: '11px', fontWeight: '600', color: c.success, background: 'rgba(46, 158, 111, 0.12)', padding: '2px 6px', borderRadius: '6px', verticalAlign: 'middle', whiteSpace: 'nowrap' },
  issueMeta: { fontSize: '12px', color: c.textTertiary },
  hintFlag: { display: 'inline-block', marginTop: '5px', fontSize: '11px', fontWeight: '500', color: c.warning, background: 'rgba(186,117,23,0.10)', padding: '2px 8px', borderRadius: '6px' },
  hintOk: { display: 'inline-block', marginTop: '5px', fontSize: '11px', color: c.textTertiary, background: c.bg, padding: '2px 8px', borderRadius: '6px' },
  statusIcons: { display: 'flex', gap: '4px', marginRight: '8px', flexShrink: 0 },
  statusIcon: { width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', background: c.primaryLight, borderRadius: '6px' },
  issueToggle: (open) => ({ fontSize: '10px', color: c.textTertiary, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }),
  issueBody: (open) => ({ display: open ? 'block' : 'none', padding: '16px', background: 'linear-gradient(to bottom, #FAFBFC, #FFFFFF)', borderTop: `1px solid ${c.border}` }),
  
  issueDescription: { fontSize: '13px', color: c.textSecondary, lineHeight: '1.5', margin: '0 0 14px' },
  
  defectStatus: { marginBottom: '16px', padding: '14px', background: c.primaryLight, borderRadius: '12px', border: '1px solid rgba(31, 79, 216, 0.15)' },
  defectBlock: { marginBottom: '14px' },
  defectBlockTitle: { fontSize: '12px', fontWeight: '600', color: c.primary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' },
  defectItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: c.card, borderRadius: '8px', marginBottom: '6px' },
  defectFlag: { fontSize: '18px' },
  defectInfo: { flex: 1, minWidth: 0 },
  defectCountry: { fontSize: '13px', fontWeight: '600', color: c.textPrimary },
  defectResult: { fontSize: '12px', color: c.textSecondary, lineHeight: '1.4' },
  defectBadge: (status) => ({
    fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', flexShrink: 0,
    background: status === 'won' ? 'rgba(46, 158, 111, 0.08)' : status === 'lost' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(217, 119, 6, 0.08)',
    color: status === 'won' ? c.success : status === 'lost' ? c.critical : c.warning,
  }),
  recallCode: { fontSize: '11px', color: c.textSecondary, fontFamily: 'monospace', flexShrink: 0 },
  
  quickMetrics: { display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' },
  metricItem: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: c.bg, borderRadius: '8px', border: `1px solid ${c.border}` },
  metricIcon: { fontSize: '14px' },
  metricValue: { fontSize: '13px', fontWeight: '600', color: c.textPrimary },
  
  detailButton: { width: '100%', padding: '14px', background: c.primary, color: '#FFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },

  dozhim: { marginBottom: '12px', padding: '12px', background: c.bg, borderRadius: '10px' },
  dozhimQ: { fontSize: '13px', color: c.textSecondary, marginBottom: '8px' },
  dozhimRow: { display: 'flex', gap: '6px' },
  dozhimFix: { flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px 4px', background: c.success, border: `1px solid ${c.success}`, borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' },
  dozhimBtn: { flex: 1, padding: '9px 4px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '13px', color: c.textPrimary, cursor: 'pointer', fontFamily: 'inherit' },
  dozhimBtnActive: { borderColor: c.primary, color: c.primary, background: 'rgba(31,79,216,0.06)', fontWeight: '600' },
  dozhimDone: { marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', padding: '10px 12px', background: 'rgba(46,158,111,0.08)', borderRadius: '10px' },
  dozhimDoneLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: c.success, fontWeight: '500' },
  dozhimUndo: { background: 'none', border: 'none', color: c.textSecondary, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' },


  emptyText: { padding: '20px', textAlign: 'center', fontSize: '13px', color: c.textTertiary },
};
