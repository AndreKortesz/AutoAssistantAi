import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import {
  calculateHealthIndex,
  groupIssuesByMileage,
  severityColor,
  severityLabel,
  formatMileage,
  frequencyText,
} from '../utils/issueHelpers';
import MileageUpdateModal from './MileageUpdateModal';

const c = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  border: '#E2E8F0',
  primary: '#1F4FD8',
  primaryLight: 'rgba(31, 79, 216, 0.08)',
  success: '#2E9E6F',
  successLight: 'rgba(46, 158, 111, 0.08)',
  warning: '#D97706',
  warningLight: 'rgba(217, 119, 6, 0.08)',
  critical: '#DC2626',
  criticalLight: 'rgba(220, 38, 38, 0.08)',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { userCar, carDetails, issuesData, loading, updateMileage } = useCar();
  const [showMileageModal, setShowMileageModal] = useState(false);

  const mileage = userCar?.mileage ? parseInt(userCar.mileage) : 0;

  const healthIndex = useMemo(() => {
    if (!issuesData) return 100;
    return calculateHealthIndex(issuesData.systemic, mileage);
  }, [issuesData, mileage]);

  const grouped = useMemo(() => {
    if (!issuesData) return { current: [], upcoming: [], past: [] };
    return groupIssuesByMileage(issuesData.systemic, mileage);
  }, [issuesData, mileage]);

  const top3Current = grouped.current.slice(0, 3);

  if (loading) {
    return <div style={s.loading}>Загрузка...</div>;
  }

  if (!userCar || !carDetails || !issuesData) {
    return (
      <div style={s.container}>
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>🚗</div>
          <h2 style={s.emptyTitle}>Добавьте автомобиль</h2>
          <p style={s.emptySubtitle}>Чтобы увидеть здоровье вашей машины</p>
          <button style={s.emptyButton} onClick={() => navigate('/add-car')}>
            Добавить автомобиль
          </button>
        </div>
      </div>
    );
  }

  const carLabel = `${carDetails.brand} ${carDetails.model_name} ${carDetails.generation}`;
  const engineLabel = carDetails.engines.find(e => e.code === userCar.engineCode)?.label || '';
  const transLabel = carDetails.transmissions.find(t => t.code === userCar.transmissionCode)?.label || '';

  const healthStatus = 
    healthIndex >= 80 ? { color: c.success, label: 'отличное' } :
    healthIndex >= 60 ? { color: c.primary, label: 'хорошее' } :
    healthIndex >= 40 ? { color: c.warning, label: 'требует внимания' } :
    { color: c.critical, label: 'требует ремонта' };

  return (
    <div style={s.container}>
      {/* Шапка с машиной */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <div>
            <h1 style={s.carName}>{carLabel}</h1>
            <div style={s.carDetails}>
              {engineLabel} · {transLabel} · {userCar.year}
            </div>
          </div>
        </div>
        <button
          style={s.mileageButton}
          onClick={() => setShowMileageModal(true)}
        >
          {formatMileage(mileage)} ✏️
        </button>
      </div>

      {/* Health Index */}
      <div style={s.healthCard}>
        <div style={s.healthRing}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke={c.border} strokeWidth="10" />
            <circle
              cx="80" cy="80" r="70"
              fill="none"
              stroke={healthStatus.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(healthIndex / 100) * 440} 440`}
              transform="rotate(-90 80 80)"
              style={{ transition: 'all 0.5s ease' }}
            />
          </svg>
          <div style={s.healthRingCenter}>
            <div style={{ ...s.healthValue, color: healthStatus.color }}>{healthIndex}</div>
            <div style={s.healthMax}>из 100</div>
          </div>
        </div>
        <div style={s.healthLabel}>
          Здоровье: <span style={{ color: healthStatus.color, fontWeight: 600 }}>{healthStatus.label}</span>
        </div>
        <div style={s.healthSubLabel}>
          На основе {issuesData.systemic.length} известных болячек для вашей конфигурации
        </div>
      </div>

      {/* Что актуально */}
      {top3Current.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Что актуально сейчас</h2>
            <button style={s.sectionLink} onClick={() => navigate('/issues')}>
              все болячки →
            </button>
          </div>
          <div style={s.issuesList}>
            {top3Current.map(issue => (
              <button
                key={issue.id}
                style={s.issueRow}
                onClick={() => navigate(`/issues/${issue.id}`)}
              >
                <div style={{ ...s.severityDot, background: severityColor(issue.issue?.severity) }} />
                <div style={s.issueRowInfo}>
                  <div style={s.issueRowTitle}>{issue.issue?.title || 'Без названия'}</div>
                  <div style={s.issueRowMeta}>
                    {severityLabel(issue.issue?.severity)} · {frequencyText(issue.mileage)}
                  </div>
                </div>
                <span style={s.issueRowArrow}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Краткая статистика */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Что у вас в базе</h2>
        <div style={s.statsGrid}>
          <StatCard
            value={issuesData.systemic.length}
            label="Болячек"
            color={c.critical}
            onClick={() => navigate('/issues')}
          />
          <StatCard
            value={issuesData.wear.length}
            label="Износ"
            color={c.warning}
          />
          <StatCard
            value={issuesData.maintenance.length}
            label="ТО"
            color={c.primary}
            onClick={() => navigate('/journal')}
          />
          <StatCard
            value={issuesData.recalls.length}
            label="Recalls"
            color={c.success}
          />
        </div>
      </div>

      {/* Быстрые действия */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Быстрые действия</h2>
        <div style={s.actionsGrid}>
          <button style={s.actionCard} onClick={() => navigate('/issues')}>
            <span style={s.actionIcon}>⚠️</span>
            <span style={s.actionLabel}>Все болячки</span>
          </button>
          <button style={s.actionCard} onClick={() => navigate('/journal')}>
            <span style={s.actionIcon}>📋</span>
            <span style={s.actionLabel}>Журнал ТО</span>
          </button>
          <button style={s.actionCard} onClick={() => navigate('/assistant')}>
            <span style={s.actionIcon}>💬</span>
            <span style={s.actionLabel}>Ассистент</span>
          </button>
          <button style={s.actionCard} onClick={() => setShowMileageModal(true)}>
            <span style={s.actionIcon}>📊</span>
            <span style={s.actionLabel}>Обновить пробег</span>
          </button>
        </div>
      </div>

      <div style={{ height: '40px' }} />

      {showMileageModal && (
        <MileageUpdateModal
          isOpen={true}
          currentMileage={mileage}
          onUpdate={async ({ mileage: newMileage }) => {
            await updateMileage(newMileage);
          }}
          onClose={() => setShowMileageModal(false)}
        />
      )}
    </div>
  );
}

function StatCard({ value, label, color, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag style={{ ...s.statCard, ...(onClick ? s.statCardClickable : {}) }} onClick={onClick}>
      <div style={{ ...s.statValue, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </Tag>
  );
}

const s = {
  container: { background: c.bg, minHeight: '100vh', paddingBottom: '100px', fontFamily: 'Inter, system-ui, sans-serif' },
  loading: { padding: '40px', textAlign: 'center', color: c.textSecondary },
  
  emptyState: { padding: '60px 20px', textAlign: 'center' },
  emptyIcon: { fontSize: '64px', marginBottom: '16px' },
  emptyTitle: { fontSize: '22px', fontWeight: '700', color: c.textPrimary, margin: '0 0 8px' },
  emptySubtitle: { fontSize: '14px', color: c.textSecondary, margin: '0 0 24px' },
  emptyButton: { padding: '14px 28px', fontSize: '15px', fontWeight: '600', color: '#FFF', background: c.primary, border: 'none', borderRadius: '12px', cursor: 'pointer' },
  
  header: { padding: '20px 16px 16px', background: c.card, borderBottom: `1px solid ${c.border}` },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  carName: { fontSize: '18px', fontWeight: '700', color: c.textPrimary, margin: 0, lineHeight: '1.3' },
  carDetails: { fontSize: '13px', color: c.textSecondary, marginTop: '4px' },
  mileageButton: { width: '100%', padding: '10px 14px', background: c.primaryLight, color: c.primary, border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' },
  
  healthCard: { padding: '24px 16px', background: c.card, marginBottom: '12px', textAlign: 'center', borderBottom: `1px solid ${c.border}` },
  healthRing: { position: 'relative', width: '160px', height: '160px', margin: '0 auto 16px' },
  healthRingCenter: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' },
  healthValue: { fontSize: '40px', fontWeight: '700', lineHeight: 1 },
  healthMax: { fontSize: '12px', color: c.textTertiary, marginTop: '4px' },
  healthLabel: { fontSize: '15px', color: c.textPrimary, marginBottom: '4px' },
  healthSubLabel: { fontSize: '12px', color: c.textTertiary, lineHeight: '1.4' },
  
  section: { padding: '16px', background: c.card, marginBottom: '12px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: c.textPrimary, margin: 0 },
  sectionLink: { background: 'none', border: 'none', fontSize: '13px', color: c.primary, cursor: 'pointer', fontWeight: '500', fontFamily: 'inherit' },
  
  issuesList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  issueRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: c.bg, border: 'none', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%' },
  severityDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  issueRowInfo: { flex: 1, minWidth: 0 },
  issueRowTitle: { fontSize: '14px', fontWeight: '600', color: c.textPrimary, lineHeight: '1.3' },
  issueRowMeta: { fontSize: '12px', color: c.textTertiary, marginTop: '2px' },
  issueRowArrow: { fontSize: '20px', color: c.textTertiary, flexShrink: 0 },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' },
  statCard: { padding: '14px 8px', background: c.bg, borderRadius: '10px', textAlign: 'center', border: 'none', fontFamily: 'inherit' },
  statCardClickable: { cursor: 'pointer' },
  statValue: { fontSize: '22px', fontWeight: '700', marginBottom: '2px' },
  statLabel: { fontSize: '11px', color: c.textSecondary },
  
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
  actionCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px', background: c.bg, border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' },
  actionIcon: { fontSize: '24px' },
  actionLabel: { fontSize: '13px', fontWeight: '600', color: c.textPrimary },
};
