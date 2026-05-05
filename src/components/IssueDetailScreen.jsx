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
} from '../utils/issueHelpers';

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

export default function IssueDetailScreen() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { userCar, carDetails, issuesData, loading: carLoading } = useCar();
  
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('service');
  const [expanded, setExpanded] = useState({
    symptoms: true,
    cause: true,
    solution: true,
    parts: true,
    reviews: false,
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
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
  
  const recalls = getLinkedRecalls(issue.id, issuesData?.recalls);
  const classActions = getLinkedClassActions(issue.id, issuesData?.classActions);
  const tsbs = getLinkedTSB(issue.id, issuesData?.tsb);
  
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
      </div>

      {/* Юридический статус */}
      {(recalls.length > 0 || classActions.length > 0 || tsbs.length > 0) && (
        <Section title="📋 Признано производителем">
          {classActions.length > 0 && (
            <div style={s.legalBlock}>
              <div style={s.legalTitle}>⚖️ Коллективные иски</div>
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
              <div style={s.legalTitle}>📋 Отзывные кампании</div>
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
              <div style={s.legalTitle}>📄 Сервисные бюллетени (TSB)</div>
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
        </Section>
      )}

      {/* Симптомы */}
      {issue.issue?.symptoms?.length > 0 && (
        <Section title="🩺 Симптомы" expanded={expanded.symptoms} onToggle={() => toggle('symptoms')}>
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
        <Section title="🔍 Почему это происходит" expanded={expanded.cause} onToggle={() => toggle('cause')}>
          {issue.issue.cause.primary && (
            <p style={s.causeText}>{issue.issue.cause.primary}</p>
          )}
          {issue.issue.cause.secondary?.length > 0 && (
            <div style={s.causeList}>
              <div style={s.causeListTitle}>Дополнительные причины:</div>
              {issue.issue.cause.secondary.map((s2, i) => (
                <div key={i} style={s.causeItem}>• {s2}</div>
              ))}
            </div>
          )}
          {issue.issue.cause.not_cause?.length > 0 && (
            <div style={s.causeList}>
              <div style={s.causeListTitle}>НЕ является причиной (частые ошибки диагностики):</div>
              {issue.issue.cause.not_cause.map((s2, i) => (
                <div key={i} style={{ ...s.causeItem, color: c.textTertiary }}>✗ {s2}</div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Решение */}
      {solutions.length > 0 && (
        <Section title="🛠 Решение" expanded={expanded.solution} onToggle={() => toggle('solution')}>
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
                      <Metric icon="🎯" label="Сложность" value={difficultyLabel(currentSol.diy_difficulty)} />
                    )}
                    {currentSol.diy_time_hours && (
                      <Metric icon="⏱" label="Время" value={`${currentSol.diy_time_hours} ч`} />
                    )}
                  </>
                ) : (
                  <>
                    {currentSol.service_time_hours && (
                      <Metric icon="⏱" label="Время в сервисе" value={`${currentSol.service_time_hours} ч`} />
                    )}
                    {currentSol.labor_cost && (
                      <Metric icon="💰" label="Работа" value={formatPrice(currentSol.labor_cost)} />
                    )}
                  </>
                )}
                {currentSol.effectiveness && (
                  <Metric icon="✅" label="Эффективность" value={effectivenessLabel(currentSol.effectiveness)} />
                )}
              </div>

              {currentSol.diy_warning && activeTab === 'diy' && (
                <div style={s.warning}>
                  <strong>⚠️ Внимание:</strong> {currentSol.diy_warning}
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

      {/* Запчасти */}
      {issue.parts?.length > 0 && (
        <Section title="🔧 Запчасти" expanded={expanded.parts} onToggle={() => toggle('parts')}>
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

      {/* Отзывы владельцев */}
      {issue.owner_reports?.length > 0 && (
        <Section
          title={`💬 Опыт владельцев (${issue.owner_reports.length})`}
          expanded={expanded.reviews}
          onToggle={() => toggle('reviews')}
        >
          {issue.owner_reports.map((r, i) => (
            <div key={i} style={s.reviewCard}>
              <div style={s.reviewMeta}>
                {r.year && <span>{r.year} год</span>}
                {r.mileage_km && <span> · {formatMileage(r.mileage_km)}</span>}
                {r.solution_worked !== undefined && (
                  <span style={{ color: r.solution_worked ? c.success : c.critical }}>
                    {r.solution_worked ? ' · решение помогло' : ' · решение не помогло'}
                  </span>
                )}
              </div>
              <div style={s.reviewText}>{r.comment}</div>
              {r.source && <div style={s.reviewSource}>— {r.source}</div>}
            </div>
          ))}
        </Section>
      )}

      <div style={{ height: '40px' }} />
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
  return (
    <div style={s.metric}>
      <span style={s.metricIcon}>{icon}</span>
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
      {part.price && (
        <div style={s.partPrice}>{formatPrice(part.price)}</div>
      )}
      {part.reason && <div style={s.partReason}>{part.reason}</div>}
    </div>
  );
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
  
  section: { background: c.card, marginTop: '12px', overflow: 'hidden' },
  sectionHeader: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: c.textPrimary },
  sectionToggle: { fontSize: '10px', color: c.textTertiary, transition: 'transform 0.2s' },
  sectionBody: { padding: '0 20px 20px' },
  
  // Юридический статус
  legalBlock: { marginBottom: '14px' },
  legalTitle: { fontSize: '12px', fontWeight: '600', color: c.primary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' },
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
  
  // Reviews
  reviewCard: { padding: '12px 14px', background: c.bg, borderRadius: '10px', marginBottom: '8px' },
  reviewMeta: { fontSize: '12px', color: c.textTertiary, marginBottom: '6px' },
  reviewText: { fontSize: '13px', color: c.textPrimary, lineHeight: '1.5' },
  reviewSource: { fontSize: '11px', color: c.textTertiary, marginTop: '6px' },
};
