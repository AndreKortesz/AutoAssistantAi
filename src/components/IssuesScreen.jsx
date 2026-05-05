import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import {
  groupIssuesByMileage,
  severityColor,
  severityLabel,
  formatPrice,
  formatMileage,
  frequencyText,
  getLinkedRecalls,
  getLinkedClassActions,
} from '../utils/issueHelpers';

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

export default function IssuesScreen() {
  const navigate = useNavigate();
  const { userCar, carDetails, issuesData, loading } = useCar();

  const [expandedSections, setExpandedSections] = useState({
    current: true,
    upcoming: false,
    past: false,
  });
  const [expandedIssue, setExpandedIssue] = useState(null);

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleIssue = (id) => {
    setExpandedIssue(expandedIssue === id ? null : id);
  };

  // Группируем системные болячки по пробегу
  const grouped = useMemo(() => {
    if (!issuesData) return { current: [], upcoming: [], past: [] };
    const mileage = userCar?.mileage ? parseInt(userCar.mileage) : 0;
    return groupIssuesByMileage(issuesData.systemic, mileage);
  }, [issuesData, userCar]);

  // Подсчёт по severity
  const counts = useMemo(() => {
    if (!issuesData) return { critical: 0, high: 0, medium: 0, low: 0 };
    const result = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const issue of issuesData.systemic) {
      const sev = issue.issue?.severity || 'low';
      if (result[sev] !== undefined) result[sev]++;
    }
    return result;
  }, [issuesData]);

  if (loading) {
    return <div style={s.loading}>Загрузка...</div>;
  }

  if (!userCar || !carDetails || !issuesData) {
    return (
      <div style={s.container}>
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>🚗</div>
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

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.headerTitle}>Болячки модели</h1>
        <div style={s.headerSubtitle}>
          {carLabel} • {engineLabel} • {formatMileage(userCar.mileage)}
        </div>
      </div>

      {/* Подсказка */}
      <div style={s.intro}>
        <span style={s.introIcon}>💡</span>
        <span style={s.introText}>
          Известные конструктивные дефекты для вашей конфигурации.
          Группируем по пробегу — что актуально сейчас, что впереди, что уже должно было проявиться.
        </span>
      </div>

      {/* Сводка по severity */}
      <div style={s.summary}>
        <div style={s.summaryItem}>
          <span style={{ ...s.summaryValue, color: c.critical }}>{counts.critical}</span>
          <span style={s.summaryLabel}>Критично</span>
        </div>
        <div style={s.summaryDivider} />
        <div style={s.summaryItem}>
          <span style={{ ...s.summaryValue, color: c.warning }}>{counts.high}</span>
          <span style={s.summaryLabel}>Серьёзно</span>
        </div>
        <div style={s.summaryDivider} />
        <div style={s.summaryItem}>
          <span style={{ ...s.summaryValue, color: c.primary }}>{counts.medium}</span>
          <span style={s.summaryLabel}>Внимание</span>
        </div>
        <div style={s.summaryDivider} />
        <div style={s.summaryItem}>
          <span style={{ ...s.summaryValue, color: c.success }}>{counts.low}</span>
          <span style={s.summaryLabel}>Незнач.</span>
        </div>
      </div>

      {/* Секции */}
      <div style={s.sections}>
        <Section
          type="critical"
          title="Актуально сейчас"
          count={grouped.current.length}
          open={expandedSections.current}
          onToggle={() => toggleSection('current')}
        >
          {grouped.current.length === 0 ? (
            <EmptyText>На вашем пробеге пока ничего не должно проявиться</EmptyText>
          ) : (
            grouped.current.map(issue => (
              <IssueCard
                key={issue.id}
                issue={issue}
                expanded={expandedIssue === issue.id}
                onToggle={() => toggleIssue(issue.id)}
                onDetails={() => navigate(`/issues/${issue.id}`)}
                recalls={getLinkedRecalls(issue.id, issuesData.recalls)}
                classActions={getLinkedClassActions(issue.id, issuesData.classActions)}
              />
            ))
          )}
        </Section>

        <Section
          type="warning"
          title="Скоро может проявиться"
          count={grouped.upcoming.length}
          open={expandedSections.upcoming}
          onToggle={() => toggleSection('upcoming')}
        >
          {grouped.upcoming.length === 0 ? (
            <EmptyText>На вашем пробеге всё впереди — пока без новых рисков</EmptyText>
          ) : (
            grouped.upcoming.map(issue => (
              <IssueCard
                key={issue.id}
                issue={issue}
                expanded={expandedIssue === issue.id}
                onToggle={() => toggleIssue(issue.id)}
                onDetails={() => navigate(`/issues/${issue.id}`)}
                recalls={getLinkedRecalls(issue.id, issuesData.recalls)}
                classActions={getLinkedClassActions(issue.id, issuesData.classActions)}
              />
            ))
          )}
        </Section>

        <Section
          type="success"
          title="Уже пройдено"
          count={grouped.past.length}
          open={expandedSections.past}
          onToggle={() => toggleSection('past')}
        >
          {grouped.past.length === 0 ? (
            <EmptyText>Пока нет болячек, которые остались позади</EmptyText>
          ) : (
            grouped.past.map(issue => (
              <IssueCard
                key={issue.id}
                issue={issue}
                expanded={expandedIssue === issue.id}
                onToggle={() => toggleIssue(issue.id)}
                onDetails={() => navigate(`/issues/${issue.id}`)}
                recalls={getLinkedRecalls(issue.id, issuesData.recalls)}
                classActions={getLinkedClassActions(issue.id, issuesData.classActions)}
              />
            ))
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ type, title, count, open, onToggle, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionWrapper(type)}>
        <button style={s.sectionHeader(type)} onClick={onToggle}>
          <div style={s.sectionHeaderLeft}>
            <div style={s.sectionDot(type)} />
            <span style={s.sectionTitle}>{title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={s.sectionCount(type)}>{count}</span>
            <span style={s.sectionToggle(open)}>▼</span>
          </div>
        </button>
        <div style={s.sectionContent(open)}>
          {children}
        </div>
      </div>
    </div>
  );
}

function IssueCard({ issue, expanded, onToggle, onDetails, recalls, classActions }) {
  const severity = issue.issue?.severity || 'low';
  const title = issue.issue?.title || 'Без названия';
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
            <span style={s.issueName}>{title}</span>
            <span style={s.issueMeta}>
              {subsystem && `${subsystem} · `}{freq}
            </span>
          </div>
        </div>
        {(hasRecalls || hasClassActions) && (
          <div style={s.statusIcons}>
            {hasClassActions && <div style={s.statusIcon} title="Коллективный иск">⚖️</div>}
            {hasRecalls && <div style={s.statusIcon} title="Отзывная кампания">📋</div>}
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
                <div style={s.defectBlockTitle}>⚖️ Коллективные иски</div>
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
                <div style={s.defectBlockTitle}>📋 Отзывные кампании</div>
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
              <span style={s.metricIcon}>📍</span>
              <span style={s.metricValue}>пик ~{formatMileage(peakKm)}</span>
            </div>
          )}
          {worstCost && (
            <div style={s.metricItem}>
              <span style={s.metricIcon}>💰</span>
              <span style={s.metricValue}>до {formatPrice(worstCost)}</span>
            </div>
          )}
          {issue.issue?.can_drive === false && (
            <div style={s.metricItem}>
              <span style={s.metricIcon}>⛔</span>
              <span style={s.metricValue}>ехать нельзя</span>
            </div>
          )}
        </div>

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
  
  emptyState: { padding: '40px 20px', textAlign: 'center' },
  emptyIcon: { fontSize: '64px', marginBottom: '16px' },
  emptyTitle: { fontSize: '20px', fontWeight: '700', color: c.textPrimary, margin: '0 0 8px' },
  emptySubtitle: { fontSize: '14px', color: c.textSecondary, margin: '0 0 24px' },
  emptyButton: { padding: '14px 28px', fontSize: '15px', fontWeight: '600', color: '#FFF', background: c.primary, border: 'none', borderRadius: '12px', cursor: 'pointer' },
  
  header: { padding: '16px 20px', background: c.card, borderBottom: `1px solid ${c.border}` },
  headerTitle: { fontSize: '18px', fontWeight: '700', color: c.textPrimary, margin: 0 },
  headerSubtitle: { fontSize: '13px', color: c.textSecondary, marginTop: '4px' },
  
  intro: { display: 'flex', gap: '12px', padding: '14px 16px', margin: '12px', background: c.primaryLight, borderRadius: '12px' },
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
    border: `1px solid ${type === 'critical' ? 'rgba(220, 38, 38, 0.3)' : type === 'warning' ? 'rgba(217, 119, 6, 0.3)' : type === 'success' ? 'rgba(46, 158, 111, 0.3)' : c.border}`
  }),
  sectionHeader: (type) => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: 'none', cursor: 'pointer',
    background: type === 'critical' ? 'rgba(220, 38, 38, 0.08)' : type === 'warning' ? 'rgba(217, 119, 6, 0.08)' : type === 'success' ? 'rgba(46, 158, 111, 0.08)' : c.bg,
    fontFamily: 'inherit',
  }),
  sectionHeaderLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  sectionDot: (type) => ({
    width: '10px', height: '10px', borderRadius: '50%',
    background: type === 'critical' ? c.critical : type === 'warning' ? c.warning : type === 'success' ? c.success : c.textTertiary
  }),
  sectionTitle: { fontSize: '15px', fontWeight: '600', color: c.textPrimary },
  sectionCount: (type) => ({
    fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '10px', color: 'white',
    background: type === 'critical' ? c.critical : type === 'warning' ? c.warning : type === 'success' ? c.success : c.textTertiary
  }),
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
  issueMeta: { fontSize: '12px', color: c.textTertiary },
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
  
  emptyText: { padding: '20px', textAlign: 'center', fontSize: '13px', color: c.textTertiary },
};
