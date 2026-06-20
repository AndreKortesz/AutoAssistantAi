import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import * as dataService from '../services/dataService';
import {
  severityColor,
  severityLabel,
  formatPrice,
  formatMileage,
  frequencyText,
  getLinkedRecalls,
  getLinkedClassActions,
  getLinkedTSB,
  calculateHealthIndex,
} from '../utils/issueHelpers';
import Icon from './Icon';

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

// Поле может быть строкой ИЛИ массивом строк (в данных встречаются оба
// варианта из-за исторической сборки). Нормализуем к массиву.
function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null || v === '') return [];
  return [v];
}

// Объединяет глобальные (linked_issue_id) и встроенные в запись (defect_status)
// юридические данные, отбрасывая дубли по ключу.
function mergeLegal(primary, extra, keyFn) {
  const seen = new Set(primary.map(keyFn).filter(Boolean));
  const merged = [...primary];
  for (const item of extra || []) {
    const key = keyFn(item);
    if (!key || !seen.has(key)) {
      if (key) seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

export default function IssueDetailScreen() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { userCar, carDetails, issuesData, loading: carLoading, fixedIssueIds, markIssueFixed, unmarkIssueFixed } = useCar();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('service');
  const [toast, setToast] = useState(null);
  const [expanded, setExpanded] = useState({
    symptoms: true,
    cause: true,
    consequences: true,
    solution: true,
    prevention: true,
    diagnostic: false,
    parts: true,
    history: false,
    reviews: true,
    sources: false,
  });

  useEffect(() => {
    let mounted = true;
    if (!userCar?.modelId || !issueId) return;
    
    dataService.getIssueById(userCar.modelId, issueId)
      .then(data => {
        if (mounted) {
          setIssue(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load issue:', err);
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [userCar, issueId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const mileage = userCar?.mileage ? parseInt(userCar.mileage) : 0;
  const isFixed = issue ? fixedIssueIds.includes(issue.id) : false;
  const isFixable = issue && (issue.type === 'systemic_defect' || issue.type === 'common_wear');

  const handleMarkFixed = () => {
    if (!issue || isFixed) return;
    const answers = userCar?.onboardingAnswers || null;
    const before = calculateHealthIndex(issuesData?.systemic || [], mileage, fixedIssueIds, answers);
    const after = calculateHealthIndex(issuesData?.systemic || [], mileage, [...fixedIssueIds, issue.id], answers);
    markIssueFixed(issue);
    setToast({ before, after, issueId: issue.id });
  };

  const handleUndoFix = () => {
    if (!toast) return;
    unmarkIssueFixed(toast.issueId);
    setToast(null);
  };

  const handleUnmark = () => {
    if (!issue) return;
    unmarkIssueFixed(issue.id);
  };

  const toggle = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (carLoading || loading) {
    return <div style={s.loading}>Загрузка...</div>;
  }

  if (!issue) {
    return (
      <div style={s.container}>
        <Header onBack={() => navigate('/issues')} />
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><Icon name="search" size={44} color={c.textTertiary} /></div>
          <h2 style={{ color: c.textPrimary, marginBottom: '8px' }}>Болячка не найдена</h2>
          <p style={{ color: c.textSecondary }}>Возможно, она была удалена или не относится к вашей конфигурации</p>
        </div>
      </div>
    );
  }

  const severity = issue.issue?.severity || 'low';
  const title = issue.issue?.title || 'Без названия';
  const carInfo = issue.car || {};
  const engine = carInfo.engine?.code || '';
  const trans = carInfo.transmission?.code || '';
  const fuel = carInfo.engine?.fuel_requirements || null;
  
  const ds = issue.defect_status || {};
  const recalls = mergeLegal(
    getLinkedRecalls(issue.id, issuesData?.recalls),
    ds.related_recalls,
    (r) => r.recall_id || r.campaign_code || r.description
  ).map(r => ({ ...r, affected_units: r.affected_units ?? r.affected }));
  const classActions = mergeLegal(
    getLinkedClassActions(issue.id, issuesData?.classActions),
    ds.class_actions,
    (ca) => ca.case_number || ca.case_name || ca.claim_summary
  ).map(ca => ({ ...ca, year_filed: ca.year_filed ?? ca.year }));
  const tsbs = mergeLegal(
    getLinkedTSB(issue.id, issuesData?.tsb),
    ds.tsb,
    (t) => t.code || t.title || t.description
  );
  
  const solutions = issue.solutions || [];
  const diySol = solutions.find(s => s.diy_possible) || solutions[0];
  const serviceSol = solutions.find(s => s.diy_difficulty === 'professional_only') || solutions[0];
  const currentSol = activeTab === 'diy' ? diySol : serviceSol;

  return (
    <div style={s.container}>
      <Header onBack={() => navigate('/issues')} />

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroTop}>
          <div style={{ ...s.severityBadge, color: severityColor(severity), background: severityColor(severity) + '14' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: severityColor(severity) }} />
            {severityLabel(severity)}
          </div>
          {issue.issue?.system && <div style={s.systemTag}>{issue.issue.system}</div>}
        </div>
        <h1 style={s.title}>{title}</h1>
        <div style={s.carInfo}>
          {carInfo.brand} {carInfo.model} {carInfo.generation}
          {engine && ` · ${engine}`}
          {trans && ` · ${trans}`}
        </div>

        {issue.issue?.severity_reason && (
          <div style={s.severityNote}>
            {issue.issue.severity_reason}
          </div>
        )}

        {fuel?.quality_sensitivity_note && (
          <div style={s.fuelNote}>
            <Icon name="droplet" size={16} color={c.warning} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Топливо{fuel.octane_recommended ? `: рекомендуется АИ-${fuel.octane_recommended}` : ''}.</strong> {fuel.quality_sensitivity_note}
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <div style={s.statValue}>{frequencyText(issue.mileage)}</div>
            <div style={s.statLabel}>Частота</div>
          </div>
          {issue.mileage?.peak_km && (
            <div style={s.statCard}>
              <div style={s.statValue}>~{formatMileage(issue.mileage.peak_km)}</div>
              <div style={s.statLabel}>Пик проявления</div>
            </div>
          )}
          {issue.consequences?.worst_case_cost_rub && (
            <div style={s.statCard}>
              <div style={s.statValue}>{formatPrice(issue.consequences.worst_case_cost_rub)}</div>
              <div style={s.statLabel}>Худший случай</div>
            </div>
          )}
          {issue.issue?.can_drive !== undefined && (
            <div style={s.statCard}>
              <div style={s.statValue}>{issue.issue.can_drive ? 'Можно' : 'Нельзя'}</div>
              <div style={s.statLabel}>Можно ли ехать</div>
            </div>
          )}
        </div>

        {isFixable && (
          isFixed ? (
            <button style={s.fixedDone} onClick={handleUnmark}>
              ✓ Устранено — отменить
            </button>
          ) : (
            <button style={s.fixedAction} onClick={handleMarkFixed}>
              ✓ Уже сделал у себя
            </button>
          )
        )}
      </div>

      {/* Юридический статус */}
      {(recalls.length > 0 || classActions.length > 0 || tsbs.length > 0 || ds.is_acknowledged || ds.fix_in_production?.description) && (
        <Section title="Признано производителем">
          {ds.is_acknowledged && (
            <div style={s.legalBlock}>
              <div style={s.legalAck}>
                ✓ Признано: {ds.acknowledged_by || 'производителем'}{ds.acknowledged_date ? ` (${ds.acknowledged_date})` : ''}
              </div>
            </div>
          )}
          {classActions.length > 0 && (
            <div style={s.legalBlock}>
              <div style={s.legalTitle}>Коллективные иски</div>
              {classActions.map((ca, i) => (
                <div key={i} style={s.legalItem}>
                  <span style={s.legalFlag}>{ca.country_flag || '🌐'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.legalCountry}>{ca.country} {ca.year_filed ? `(${ca.year_filed})` : ''}</div>
                    <div style={s.legalDescription}>{ca.case_name || ca.claim_summary?.slice(0, 120)}</div>
                    {ca.result && <div style={s.legalDescription}><strong>Результат:</strong> {ca.result}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {recalls.length > 0 && (
            <div style={s.legalBlock}>
              <div style={s.legalTitle}>Отзывные кампании</div>
              {recalls.map((r, i) => (
                <div key={i} style={s.legalItem}>
                  <span style={s.legalFlag}>{r.country_flag || '🌐'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.legalCountry}>
                      {r.country} {r.year ? `(${r.year})` : ''}
                      {r.recall_id && <span style={s.recallId}> · {r.recall_id}</span>}
                    </div>
                    <div style={s.legalDescription}>{r.description}</div>
                    {r.affected_units && <div style={s.legalDescription}>Затронуто: {r.affected_units.toLocaleString('ru-RU')} авто</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tsbs.length > 0 && (
            <div style={s.legalBlock}>
              <div style={s.legalTitle}>Сервисные бюллетени (TSB)</div>
              {tsbs.map((t, i) => (
                <div key={i} style={s.legalItem}>
                  <div style={{ flex: 1 }}>
                    <div style={s.legalCountry}>{t.code} {t.date ? `(${t.date})` : ''}</div>
                    <div style={s.legalDescription}>{t.title || t.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {ds.fix_in_production?.description && (
            <div style={s.legalBlock}>
              <div style={s.legalTitle}>Исправлено в производстве</div>
              <div style={s.legalDescription}>
                {ds.fix_in_production.date ? `${ds.fix_in_production.date}: ` : ''}{ds.fix_in_production.description}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Симптомы */}
      {issue.issue?.symptoms?.length > 0 && (
        <Section title="Симптомы" expanded={expanded.symptoms} onToggle={() => toggle('symptoms')}>
          <div style={s.symptomsList}>
            {issue.issue.symptoms.map((sy, i) => (
              <div key={i} style={s.symptomItem}>
                <div style={s.symptomDot} />
                <div>
                  <div style={s.symptomDesc}>{sy.description}</div>
                  {sy.conditions && <div style={s.symptomCond}>{sy.conditions}</div>}
                </div>
              </div>
            ))}
          </div>
          {issue.issue?.obd_codes?.length > 0 && (
            <div style={s.obdCodes}>
              <div style={s.obdTitle}>Коды OBD</div>
              <div style={s.obdList}>
                {issue.issue.obd_codes.map((code, i) => (
                  <div key={i} style={s.obdItem}>
                    <code style={s.obdCode}>{code.code}</code>
                    <span style={s.obdDesc}>{code.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Причина */}
      {issue.issue?.cause && (
        <Section title="Почему это происходит" expanded={expanded.cause} onToggle={() => toggle('cause')}>
          {issue.issue.cause.primary && (
            <p style={s.causeText}>{issue.issue.cause.primary}</p>
          )}
          {asArray(issue.issue.cause.secondary).length > 0 && (
            <div style={s.causeList}>
              <div style={s.causeListTitle}>Дополнительные причины:</div>
              {asArray(issue.issue.cause.secondary).map((s2, i) => (
                <div key={i} style={s.causeItem}>• {s2}</div>
              ))}
            </div>
          )}
          {asArray(issue.issue.cause.not_cause).length > 0 && (
            <div style={s.causeList}>
              <div style={s.causeListTitle}>НЕ является причиной (частые ошибки диагностики):</div>
              {asArray(issue.issue.cause.not_cause).map((s2, i) => (
                <div key={i} style={{ ...s.causeItem, color: c.textTertiary }}>✗ {s2}</div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Что будет, если тянуть */}
      {issue.consequences && (issue.consequences.description || issue.consequences.worst_case || issue.consequences.time_to_failure) && (
        <Section title="Что будет, если тянуть" expanded={expanded.consequences} onToggle={() => toggle('consequences')}>
          {issue.consequences.description && <p style={s.causeText}>{issue.consequences.description}</p>}
          {issue.consequences.worst_case && (
            <div style={s.conseqRow}><span style={s.conseqLabel}>Худший сценарий</span><span style={s.conseqVal}>{issue.consequences.worst_case}{issue.consequences.worst_case_cost_rub ? ` — ${formatPrice(issue.consequences.worst_case_cost_rub)}` : ''}</span></div>
          )}
          {issue.consequences.repair_if_ignored_cost_rub && (
            <div style={s.conseqRow}><span style={s.conseqLabel}>Если запустить</span><span style={s.conseqVal}>{formatPrice(issue.consequences.repair_if_ignored_cost_rub)}</span></div>
          )}
          {issue.consequences.time_to_failure && (
            <div style={s.conseqRow}><span style={s.conseqLabel}>Сколько можно ехать</span><span style={s.conseqVal}>{issue.consequences.time_to_failure}</span></div>
          )}
        </Section>
      )}

      {/* Решение */}
      {solutions.length > 0 && (
        <Section title="Решение" expanded={expanded.solution} onToggle={() => toggle('solution')}>
          {/* Tabs */}
          <div style={s.tabs}>
            <button
              style={{ ...s.tab, ...(activeTab === 'service' ? s.tabActive : {}) }}
              onClick={() => setActiveTab('service')}
            >
              В сервисе
            </button>
            <button
              style={{ ...s.tab, ...(activeTab === 'diy' ? s.tabActive : {}) }}
              onClick={() => setActiveTab('diy')}
            >
              Самому
            </button>
          </div>

          {currentSol && (
            <div style={s.solutionContent}>
              <h3 style={s.solutionTitle}>{currentSol.title}</h3>
              {currentSol.description && <p style={s.solutionDesc}>{currentSol.description}</p>}
              
              <div style={s.solutionMetrics}>
                {activeTab === 'diy' ? (
                  <>
                    {currentSol.diy_difficulty && (
                      <Metric icon="difficulty" label="Сложность" value={difficultyLabel(currentSol.diy_difficulty)} />
                    )}
                    {currentSol.diy_time_hours > 0 && (
                      <Metric icon="time" label="Время" value={`${currentSol.diy_time_hours} ч`} />
                    )}
                  </>
                ) : (
                  <>
                    {currentSol.service_time_hours > 0 && (
                      <Metric icon="time" label="Время в сервисе" value={`${currentSol.service_time_hours} ч`} />
                    )}
                    {currentSol.labor_cost > 0 && (
                      <Metric icon="cost" label="Работа" value={formatPrice(currentSol.labor_cost)} />
                    )}
                  </>
                )}
                {currentSol.effectiveness && (
                  <Metric icon="effect" label="Эффективность" value={effectivenessLabel(currentSol.effectiveness)} />
                )}
              </div>

              {currentSol.diy_warning && activeTab === 'diy' && (
                <div style={s.warning}>
                  <strong>Внимание:</strong> {currentSol.diy_warning}
                </div>
              )}

              {currentSol.diy_tools?.length > 0 && activeTab === 'diy' && (
                <div style={s.toolsList}>
                  <div style={s.toolsTitle}>Инструменты:</div>
                  <div style={s.toolsTags}>
                    {currentSol.diy_tools.map((tool, i) => (
                      <span key={i} style={s.toolTag}>{tool}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* Как избежать */}
      {issue.prevention?.possible && (issue.prevention.recommendation || asArray(issue.prevention.actions).length > 0) && (
        <Section title="Как избежать" expanded={expanded.prevention} onToggle={() => toggle('prevention')}>
          {issue.prevention.recommendation && <p style={s.causeText}>{issue.prevention.recommendation}</p>}
          {asArray(issue.prevention.actions).map((a, i) => {
            const text = typeof a === 'string' ? a : (a.description || a.action || '');
            if (!text) return null;
            const interval = typeof a === 'object' ? a.interval_km : null;
            return (
              <div key={i} style={s.preventItem}>
                <span style={s.preventDot} />
                <div style={s.preventText}>
                  {text}
                  {interval ? <span style={s.preventInterval}> · каждые {formatMileage(interval)}</span> : null}
                </div>
              </div>
            );
          })}
        </Section>
      )}

      {/* Как проверить самому */}
      {issue.diagnostic && (issue.diagnostic.instruction || issue.diagnostic.visual_check) && (
        <Section title="Как проверить самому" expanded={expanded.diagnostic} onToggle={() => toggle('diagnostic')}>
          {issue.diagnostic.instruction && <p style={{ ...s.causeText, whiteSpace: 'pre-line' }}>{issue.diagnostic.instruction}</p>}
          {issue.diagnostic.visual_check && (
            <div style={s.diagBlock}><span style={s.diagLabel}>На что смотреть</span><div style={s.diagText}>{issue.diagnostic.visual_check}</div></div>
          )}
          {asArray(issue.diagnostic.tools_needed).length > 0 && (
            <div style={s.toolsList}>
              <div style={s.toolsTitle}>Инструменты</div>
              <div style={s.toolsTags}>
                {asArray(issue.diagnostic.tools_needed).map((t, i) => <span key={i} style={s.toolTag}>{t}</span>)}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Запчасти */}
      {issue.parts?.length > 0 && (
        <Section title="Запчасти" expanded={expanded.parts} onToggle={() => toggle('parts')}>
          {issue.parts.map((part, i) => (
            <PartCard key={i} part={part} />
          ))}
          {issue.related_parts?.length > 0 && (
            <>
              <div style={{ ...s.causeListTitle, marginTop: '16px' }}>Заменить заодно:</div>
              {issue.related_parts.map((part, i) => (
                <PartCard key={i} part={part} secondary />
              ))}
            </>
          )}
        </Section>
      )}

      {/* Отзывы владельцев — показываем только содержательные (с текстом) */}
      {(() => {
        const reports = (issue.owner_reports || [])
          .map(r => (typeof r === 'string' ? { comment: r } : r))
          .filter(r => (r.comment || r.text || r.quote || '').trim());
        if (reports.length === 0) return null;
        return (
          <Section
            title={`Опыт владельцев (${reports.length})`}
            expanded={expanded.reviews}
            onToggle={() => toggle('reviews')}
          >
            {reports.map((r, i) => (
              <div key={i} style={s.reviewCard}>
                {(r.year || r.mileage_km || r.solution_worked !== undefined) && (
                  <div style={s.reviewMeta}>
                    {r.year && <span>{r.year} год</span>}
                    {r.mileage_km && <span> · {formatMileage(r.mileage_km)}</span>}
                    {r.solution_worked !== undefined && (
                      <span style={{ color: r.solution_worked ? c.success : c.critical }}>
                        {r.solution_worked ? ' · решение помогло' : ' · решение не помогло'}
                      </span>
                    )}
                  </div>
                )}
                <div style={s.reviewText}>{r.comment || r.text || r.quote}</div>
                {r.source && <div style={s.reviewSource}>— {r.source}</div>}
              </div>
            ))}
          </Section>
        );
      })()}

      {/* По годам выпуска */}
      {issue.history?.affected_years?.length > 0 && (
        <Section title="По годам выпуска" expanded={expanded.history} onToggle={() => toggle('history')}>
          <div style={s.conseqRow}>
            <span style={s.conseqLabel}>Затронуты годы</span>
            <span style={s.conseqVal}>{yearsRange(issue.history.affected_years)}</span>
          </div>
          {yearsRange(issue.history.safe_years) && (
            <div style={s.conseqRow}>
              <span style={s.conseqLabel}>Без проблемы</span>
              <span style={{ ...s.conseqVal, color: c.success }}>{yearsRange(issue.history.safe_years)}</span>
            </div>
          )}
          {issue.history.fixed_description && <p style={{ ...s.causeText, marginTop: '10px' }}>{issue.history.fixed_description}</p>}
        </Section>
      )}

      {/* Источники */}
      {issue.sources?.length > 0 && (
        <Section title={`Источники (${issue.sources.length})`} expanded={expanded.sources} onToggle={() => toggle('sources')}>
          {issue.sources.map((src, i) => (
            <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={s.sourceRow}>
              <span style={s.sourceName}>{sourceLabel(src)}{src.date ? ` · ${src.date}` : ''}</span>
              <Icon name="arrowRight" size={14} color={c.textTertiary} />
            </a>
          ))}
        </Section>
      )}

      <div style={{ height: '40px' }} />

      {toast && (
        <div style={s.toast}>
          <div style={s.toastBody}>
            <div style={s.toastTitle}>Записали в журнал</div>
            <div style={s.toastSub}>
              Если ещё проявится — отметите снова. Здоровье {toast.before} → {toast.after}
            </div>
          </div>
          <button style={s.toastAction} onClick={handleUndoFix}>Отменить запись</button>
        </div>
      )}
    </div>
  );
}

function Header({ onBack }) {
  return (
    <div style={s.header}>
      <button style={s.backButton} onClick={onBack}>← Назад</button>
    </div>
  );
}

function Section({ title, expanded = true, onToggle, children }) {
  const showToggle = onToggle !== undefined;
  return (
    <div style={s.section}>
      {showToggle ? (
        <button style={s.sectionHeader} onClick={onToggle}>
          <span style={s.sectionTitle}>{title}</span>
          <span style={{ ...s.sectionToggle, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>
      ) : (
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>{title}</span>
        </div>
      )}
      {expanded && <div style={s.sectionBody}>{children}</div>}
    </div>
  );
}

function Metric({ icon, label, value }) {
  const map = { difficulty: 'target', time: 'clock', cost: 'wallet', effect: 'check' };
  const iconName = map[icon] || icon;
  return (
    <div style={s.metric}>
      <span style={s.metricIcon}><Icon name={iconName} size={18} color={c.textSecondary} /></span>
      <div>
        <div style={s.metricValue}>{value}</div>
        <div style={s.metricLabel}>{label}</div>
      </div>
    </div>
  );
}

function PartCard({ part, secondary }) {
  return (
    <div style={{ ...s.partCard, ...(secondary ? { background: c.bg } : {}) }}>
      <div style={s.partHeader}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.partName}>{part.name}</div>
          {part.manufacturer && <div style={s.partManuf}>{part.manufacturer}</div>}
        </div>
        {part.part_number && <code style={s.partNumber}>{part.part_number}</code>}
      </div>
      {part.price > 0 && (
        <div style={s.partPrice}>{formatPrice(part.price)}{part.price_usd ? <span style={s.partUsd}> · ${part.price_usd} в США</span> : null}</div>
      )}
      {part.reason && <div style={s.partReason}>{part.reason}</div>}

      {part.revision_history?.length > 0 && (
        <div style={s.partSub}>
          <div style={s.partSubTitle}>Ревизии детали</div>
          {part.revision_history.map((rv, i) => (
            <div key={i} style={s.revRow}>
              <code style={s.revPn}>{rv.part_number}</code>
              <span style={{ ...s.revStatus, color: rv.status === 'проблемная' ? c.critical : rv.status === 'актуальная' ? c.success : c.textTertiary }}>{rv.status}</span>
              {rv.note && <span style={s.revNote}>{rv.note}</span>}
            </div>
          ))}
        </div>
      )}
      {asArray(part.alternatives).length > 0 && (
        <div style={s.partSub}>
          <div style={s.partSubTitle}>Хорошие аналоги</div>
          {asArray(part.alternatives).map((a, i) => (
            <div key={i} style={s.altRow}>
              <span style={s.altManuf}>{a.manufacturer}</span>
              {a.part_number && <code style={s.revPn}>{a.part_number}</code>}
              {a.notes && <span style={s.revNote}>{a.notes}</span>}
            </div>
          ))}
        </div>
      )}
      {asArray(part.do_not_buy).length > 0 && (
        <div style={s.partSub}>
          <div style={{ ...s.partSubTitle, color: c.critical }}>Не брать</div>
          {asArray(part.do_not_buy).map((a, i) => (
            <div key={i} style={s.altRow}>
              <span style={s.altManuf}>{a.manufacturer}{a.part_number ? ` (${a.part_number})` : ''}</span>
              {a.reason && <span style={s.revNote}>{a.reason}</span>}
            </div>
          ))}
        </div>
      )}
      {asArray(part.where_to_buy).length > 0 && (
        <div style={s.whereBuy}>Где купить: {asArray(part.where_to_buy).join(' · ')}</div>
      )}
    </div>
  );
}

// Компактный диапазон годов: [2010,2011,...2017] → «2010–2017».
// Отбрасываем мусорные значения (0/null/строки), чтобы не показывать «0–)».
function yearsRange(years) {
  const valid = (Array.isArray(years) ? years : [years])
    .map(y => parseInt(y, 10))
    .filter(y => y >= 1900 && y <= 2100)
    .sort((a, b) => a - b);
  if (valid.length === 0) return '';
  const min = valid[0], max = valid[valid.length - 1];
  return min === max ? `${min}` : `${min}–${max}`;
}

// Понятная подпись источника: заголовок → домен из URL → автор/тип → запасной вариант.
function sourceLabel(src) {
  if (src.title) return src.title;
  if (src.url) {
    try { return new URL(src.url).hostname.replace(/^www\./, ''); } catch (e) {}
  }
  return src.author || src.type || 'Источник';
}

function difficultyLabel(d) {
  const map = { easy: 'Легко', medium: 'Средне', hard: 'Сложно', professional_only: 'Только сервис' };
  return map[d] || d;
}

function effectivenessLabel(e) {
  const map = { permanent: 'Навсегда', temporary: 'Временно', uncertain: 'Не точно' };
  return map[e] || e;
}

const s = {
  container: { background: c.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
  loading: { padding: '40px', textAlign: 'center', color: c.textSecondary },
  
  header: { display: 'flex', alignItems: 'center', padding: '12px 16px', background: c.card, borderBottom: `1px solid ${c.border}`, position: 'sticky', top: 0, zIndex: 100 },
  backButton: { background: 'none', border: 'none', fontSize: '15px', color: c.primary, cursor: 'pointer', fontWeight: '500', padding: '4px 0' },
  
  hero: { padding: '20px', background: c.card },
  heroTop: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' },
  severityBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  systemTag: { fontSize: '13px', color: c.textSecondary, background: c.bg, padding: '4px 10px', borderRadius: '6px' },
  title: { fontSize: '22px', fontWeight: '700', color: c.textPrimary, lineHeight: '1.3', margin: '0 0 8px' },
  carInfo: { fontSize: '14px', color: c.textSecondary, marginBottom: '16px' },
  
  severityNote: { padding: '12px 14px', background: c.primaryLight, borderLeft: `3px solid ${c.primary}`, borderRadius: '6px', fontSize: '13px', color: c.textSecondary, lineHeight: '1.5', marginBottom: '16px' },
  
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  statCard: { padding: '14px', background: c.bg, borderRadius: '12px', textAlign: 'center' },
  statValue: { fontSize: '15px', fontWeight: '700', color: c.textPrimary, marginBottom: '2px' },
  statLabel: { fontSize: '11px', color: c.textTertiary },

  fixedAction: { width: '100%', marginTop: '14px', padding: '13px 16px', background: 'rgba(46, 158, 111, 0.08)', color: c.success, border: '1px solid rgba(46, 158, 111, 0.25)', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  fixedDone: { width: '100%', marginTop: '14px', padding: '13px 16px', background: 'rgba(46, 158, 111, 0.14)', color: c.success, border: '1px solid rgba(46, 158, 111, 0.4)', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },

  toast: { position: 'fixed', left: '16px', right: '16px', bottom: '24px', padding: '14px 16px', background: c.textPrimary, color: '#FFFFFF', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)', zIndex: 200, display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '420px', margin: '0 auto' },
  toastBody: { flex: 1, minWidth: 0 },
  toastTitle: { fontSize: '14px', fontWeight: '600', marginBottom: '2px' },
  toastSub: { fontSize: '12px', opacity: 0.85, lineHeight: '1.4' },
  toastAction: { background: 'none', border: 'none', color: '#7AB8FF', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', padding: 0 },
  
  section: { background: c.card, marginTop: '12px', overflow: 'hidden' },
  sectionHeader: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: c.textPrimary },
  sectionToggle: { fontSize: '10px', color: c.textTertiary, transition: 'transform 0.2s' },
  sectionBody: { padding: '0 20px 20px' },
  
  // Юридический статус
  legalBlock: { marginBottom: '14px' },
  legalTitle: { fontSize: '12px', fontWeight: '600', color: c.primary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' },
  legalAck: { fontSize: '13px', fontWeight: '600', color: c.success },
  legalItem: { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: c.bg, borderRadius: '8px', marginBottom: '6px' },
  legalFlag: { fontSize: '20px', flexShrink: 0 },
  legalCountry: { fontSize: '13px', fontWeight: '600', color: c.textPrimary, marginBottom: '2px' },
  legalDescription: { fontSize: '12px', color: c.textSecondary, lineHeight: '1.4', marginTop: '2px' },
  recallId: { fontFamily: 'monospace', color: c.textSecondary, fontWeight: '500' },
  
  // Симптомы
  symptomsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  symptomItem: { display: 'flex', alignItems: 'flex-start', gap: '10px' },
  symptomDot: { width: '6px', height: '6px', borderRadius: '50%', background: c.primary, marginTop: '8px', flexShrink: 0 },
  symptomDesc: { fontSize: '14px', color: c.textPrimary, lineHeight: '1.4' },
  symptomCond: { fontSize: '12px', color: c.textSecondary, marginTop: '2px' },
  
  // OBD
  obdCodes: { marginTop: '16px', padding: '12px', background: c.bg, borderRadius: '8px' },
  obdTitle: { fontSize: '12px', fontWeight: '600', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  obdList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  obdItem: { display: 'flex', alignItems: 'baseline', gap: '8px' },
  obdCode: { fontSize: '12px', fontFamily: 'monospace', color: c.primary, fontWeight: '600', background: c.primaryLight, padding: '2px 6px', borderRadius: '4px' },
  obdDesc: { fontSize: '12px', color: c.textSecondary },
  
  // Cause
  causeText: { fontSize: '14px', color: c.textPrimary, lineHeight: '1.5', margin: '0 0 12px' },
  causeList: { marginTop: '10px' },
  causeListTitle: { fontSize: '12px', fontWeight: '600', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  causeItem: { fontSize: '13px', color: c.textSecondary, lineHeight: '1.5', paddingLeft: '4px' },
  
  // Solution
  tabs: { display: 'flex', gap: '0', borderRadius: '10px', background: c.bg, padding: '4px', marginBottom: '14px' },
  tab: { flex: 1, padding: '10px', background: 'none', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: c.textSecondary, cursor: 'pointer', fontFamily: 'inherit' },
  tabActive: { background: c.card, color: c.primary, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  
  solutionContent: {},
  solutionTitle: { fontSize: '16px', fontWeight: '600', color: c.textPrimary, margin: '0 0 6px' },
  solutionDesc: { fontSize: '13px', color: c.textSecondary, lineHeight: '1.5', margin: '0 0 14px' },
  
  solutionMetrics: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' },
  metric: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: c.bg, borderRadius: '8px', minWidth: '120px' },
  metricIcon: { fontSize: '18px' },
  metricValue: { fontSize: '13px', fontWeight: '600', color: c.textPrimary },
  metricLabel: { fontSize: '11px', color: c.textTertiary },
  
  warning: { padding: '12px 14px', background: 'rgba(217, 119, 6, 0.08)', borderLeft: `3px solid ${c.warning}`, borderRadius: '6px', fontSize: '13px', color: c.textSecondary, lineHeight: '1.5', marginBottom: '14px' },
  
  toolsList: { marginBottom: '14px' },
  toolsTitle: { fontSize: '12px', fontWeight: '600', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  toolsTags: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  toolTag: { fontSize: '12px', padding: '4px 10px', background: c.bg, borderRadius: '6px', color: c.textPrimary },
  
  // Parts
  partCard: { padding: '12px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', marginBottom: '8px' },
  partHeader: { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' },
  partName: { fontSize: '14px', fontWeight: '600', color: c.textPrimary },
  partManuf: { fontSize: '12px', color: c.textTertiary, marginTop: '2px' },
  partNumber: { fontSize: '12px', fontFamily: 'monospace', color: c.primary, fontWeight: '600', background: c.primaryLight, padding: '4px 8px', borderRadius: '4px', flexShrink: 0 },
  partPrice: { fontSize: '14px', fontWeight: '600', color: c.success, marginTop: '4px' },
  partReason: { fontSize: '12px', color: c.textSecondary, marginTop: '4px', fontStyle: 'italic' },
  
  // Fuel note
  fuelNote: { display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '12px 14px', background: 'rgba(217, 119, 6, 0.08)', borderRadius: '8px', fontSize: '13px', color: c.textSecondary, lineHeight: '1.45', marginTop: '12px' },

  // Consequences / history rows
  conseqRow: { display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '7px 0', borderBottom: `1px solid ${c.border}` },
  conseqLabel: { fontSize: '13px', color: c.textTertiary, flexShrink: 0 },
  conseqVal: { fontSize: '13px', fontWeight: '600', color: c.textPrimary, textAlign: 'right' },

  // Prevention
  preventItem: { display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '8px' },
  preventDot: { width: '6px', height: '6px', borderRadius: '50%', background: c.success, marginTop: '7px', flexShrink: 0 },
  preventText: { fontSize: '13px', color: c.textPrimary, lineHeight: '1.45' },
  preventInterval: { color: c.textTertiary },

  // Diagnostic
  diagBlock: { marginTop: '10px', padding: '10px 12px', background: c.bg, borderRadius: '8px' },
  diagLabel: { fontSize: '12px', fontWeight: '600', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.5px' },
  diagText: { fontSize: '13px', color: c.textSecondary, lineHeight: '1.45', marginTop: '4px' },

  // Parts extra
  partUsd: { fontSize: '12px', fontWeight: '400', color: c.textTertiary },
  partSub: { marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${c.border}` },
  partSubTitle: { fontSize: '11px', fontWeight: '600', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  revRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '5px' },
  revPn: { fontSize: '11px', fontFamily: 'monospace', color: c.primary, background: c.primaryLight, padding: '2px 6px', borderRadius: '4px' },
  revStatus: { fontSize: '12px', fontWeight: '600' },
  revNote: { fontSize: '12px', color: c.textSecondary, flexBasis: '100%', lineHeight: '1.4' },
  altRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '5px' },
  altManuf: { fontSize: '13px', fontWeight: '600', color: c.textPrimary },
  whereBuy: { fontSize: '12px', color: c.textTertiary, marginTop: '10px', lineHeight: '1.4' },

  // Sources
  sourceRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${c.border}`, textDecoration: 'none' },
  sourceName: { fontSize: '13px', color: c.primary },

  // Reviews
  reviewCard: { padding: '12px 14px', background: c.bg, borderRadius: '10px', marginBottom: '8px' },
  reviewMeta: { fontSize: '12px', color: c.textTertiary, marginBottom: '6px' },
  reviewText: { fontSize: '13px', color: c.textPrimary, lineHeight: '1.5' },
  reviewSource: { fontSize: '11px', color: c.textTertiary, marginTop: '6px' },
};
