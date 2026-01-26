import React, { useState } from 'react';

const IssuesScreen = ({ car, onNavigateToDetail }) => {
  const [expandedSections, setExpandedSections] = useState({ current: true, upcoming: false, past: false });
  const [expandedIssue, setExpandedIssue] = useState('issue-1');
  const [vinValue, setVinValue] = useState('');
  const [showVinModal, setShowVinModal] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [vinResult, setVinResult] = useState(null);
  const [vinHidden, setVinHidden] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleIssue = (issueId) => {
    setExpandedIssue(expandedIssue === issueId ? null : issueId);
  };

  const handleVinCheck = () => {
    if (vinValue.length >= 10) {
      setShowVinModal(true);
    }
  };

  const handleOriginSelect = (origin) => {
    setVinResult(origin);
    setShowVinModal(false);
    setVinHidden(true);
  };

  const handleDontKnow = () => {
    if (!showTip) {
      setShowTip(true);
    } else {
      setVinResult('imported');
      setShowVinModal(false);
      setVinHidden(true);
    }
  };

  const styles = {
    container: { background: '#F7F8FA', minHeight: '100vh', paddingBottom: '100px' },
    header: { padding: '16px 20px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' },
    headerTitle: { fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 },
    headerSubtitle: { fontSize: '14px', color: '#64748B', marginTop: '4px' },
    intro: { display: 'flex', gap: '12px', padding: '14px 16px', margin: '12px', background: 'rgba(31, 79, 216, 0.08)', borderRadius: '12px' },
    introIcon: { fontSize: '18px' },
    introText: { fontSize: '13px', color: '#64748B', lineHeight: '1.5' },
    summary: { display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '16px', margin: '0 12px 12px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' },
    summaryItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
    summaryValue: { fontSize: '24px', fontWeight: '700', color: '#1E293B' },
    summaryLabel: { fontSize: '11px', color: '#94A3B8' },
    summaryDivider: { width: '1px', height: '32px', background: '#E2E8F0' },
    sections: { padding: '0 12px' },
    section: { marginBottom: '16px' },
    sectionWrapper: (type) => ({
      background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden',
      border: `1px solid ${type === 'critical' ? 'rgba(220, 38, 38, 0.3)' : type === 'warning' ? 'rgba(217, 119, 6, 0.3)' : type === 'success' ? 'rgba(46, 158, 111, 0.3)' : '#E2E8F0'}`
    }),
    sectionHeader: (type) => ({
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: 'none', cursor: 'pointer',
      background: type === 'critical' ? 'rgba(220, 38, 38, 0.08)' : type === 'warning' ? 'rgba(217, 119, 6, 0.08)' : type === 'success' ? 'rgba(46, 158, 111, 0.08)' : '#F7F8FA'
    }),
    sectionHeaderLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    sectionDot: (type) => ({
      width: '10px', height: '10px', borderRadius: '50%',
      background: type === 'critical' ? '#DC2626' : type === 'warning' ? '#D97706' : type === 'success' ? '#2E9E6F' : '#94A3B8'
    }),
    sectionTitle: { fontSize: '15px', fontWeight: '600', color: '#1E293B' },
    sectionCount: (type) => ({
      fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '10px', color: 'white',
      background: type === 'critical' ? '#DC2626' : type === 'warning' ? '#D97706' : type === 'success' ? '#2E9E6F' : '#94A3B8'
    }),
    sectionToggle: (open) => ({ fontSize: '10px', color: '#94A3B8', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }),
    sectionContent: (open) => ({ display: open ? 'block' : 'none', padding: '12px', background: '#F7F8FA' }),
    issueCard: (expanded) => ({
      background: '#FFFFFF', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden',
      border: `1px solid ${expanded ? '#1F4FD8' : '#E2E8F0'}`,
      boxShadow: expanded ? '0 2px 8px rgba(31, 79, 216, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)'
    }),
    issueHeader: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' },
    issueHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
    severityDot: (severity) => ({
      width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
      background: severity === 'critical' ? '#DC2626' : severity === 'high' ? '#D97706' : severity === 'medium' ? '#1F4FD8' : '#2E9E6F'
    }),
    issueHeaderInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
    issueName: { fontSize: '15px', fontWeight: '600', color: '#1E293B' },
    issueMeta: { fontSize: '12px', color: '#94A3B8' },
    statusIcons: { display: 'flex', gap: '4px', marginRight: '8px' },
    statusIcon: { width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', background: 'rgba(31, 79, 216, 0.08)', borderRadius: '6px' },
    issueToggle: (open) => ({ fontSize: '10px', color: '#94A3B8', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }),
    issueBody: (open) => ({ display: open ? 'block' : 'none', padding: '16px', background: 'linear-gradient(to bottom, #FAFBFC, #FFFFFF)', borderTop: '1px solid #E2E8F0' }),
    defectStatus: { marginBottom: '16px', padding: '14px', background: 'rgba(31, 79, 216, 0.08)', borderRadius: '12px', border: '1px solid rgba(31, 79, 216, 0.15)' },
    defectBlock: { marginBottom: '14px' },
    defectBlockTitle: { fontSize: '12px', fontWeight: '600', color: '#1F4FD8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' },
    defectItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#FFFFFF', borderRadius: '8px', marginBottom: '6px' },
    defectFlag: { fontSize: '18px' },
    defectInfo: { flex: 1 },
    defectCountry: { fontSize: '13px', fontWeight: '600', color: '#1E293B' },
    defectResult: { fontSize: '12px', color: '#64748B' },
    defectBadge: (type) => ({ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', background: type === 'won' ? 'rgba(46, 158, 111, 0.08)' : 'rgba(217, 119, 6, 0.08)', color: type === 'won' ? '#2E9E6F' : '#D97706' }),
    recallCode: { fontSize: '12px', color: '#64748B', fontFamily: 'monospace' },
    recallStatus: { fontSize: '14px' },
    progressContainer: { marginBottom: '14px' },
    progressBar: { position: 'relative', height: '8px', background: '#E2E8F0', borderRadius: '4px', marginBottom: '6px' },
    progressZone: (left, width) => ({ position: 'absolute', top: 0, left: `${left}%`, width: `${width}%`, height: '100%', borderRadius: '4px', background: 'rgba(220, 38, 38, 0.2)' }),
    progressMarker: (left) => ({ position: 'absolute', top: '-3px', left: `${left}%`, width: '4px', height: '14px', borderRadius: '2px', background: '#DC2626' }),
    progressLabels: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' },
    progressLabel: { fontSize: '10px', color: '#94A3B8' },
    progressCurrent: (left) => ({ position: 'absolute', left: `${left}%`, fontSize: '10px', fontWeight: '500', color: '#DC2626', whiteSpace: 'nowrap', transform: 'translateX(-50%)' }),
    issueDescription: { fontSize: '13px', color: '#64748B', lineHeight: '1.5', margin: '0 0 14px' },
    quickMetrics: { display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' },
    metricItem: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#F7F8FA', borderRadius: '8px', border: '1px solid #E2E8F0' },
    metricIcon: { fontSize: '14px' },
    metricValue: { fontSize: '13px', fontWeight: '600', color: '#1E293B' },
    detailButton: { width: '100%', padding: '14px', background: '#1F4FD8', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    vinSection: { marginTop: '20px', display: vinHidden ? 'none' : 'block' },
    vinCard: { background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '2px dashed #1F4FD8', textAlign: 'center' },
    vinIconBig: { fontSize: '48px', marginBottom: '12px' },
    vinTitleBig: { fontSize: '18px', fontWeight: '700', color: '#1E293B', marginBottom: '8px' },
    vinDesc: { fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '20px' },
    vinBenefits: { textAlign: 'left', marginBottom: '20px' },
    vinBenefit: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', fontSize: '14px', color: '#1E293B' },
    vinCheck: { width: '20px', height: '20px', background: '#2E9E6F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', flexShrink: 0 },
    vinInputSection: { display: 'flex', gap: '8px', marginBottom: '12px' },
    vinInputField: { flex: 1, padding: '14px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', fontFamily: 'monospace', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '1px' },
    vinCheckButton: { padding: '14px 20px', background: '#1F4FD8', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    vinNote: { fontSize: '12px', color: '#94A3B8', lineHeight: '1.5', marginBottom: '8px' },
    vinSkip: { fontSize: '13px', color: '#64748B', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' },
    modalOverlay: { display: showVinModal ? 'flex' : 'none', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, alignItems: 'flex-end', justifyContent: 'center' },
    modalContent: { background: '#FFFFFF', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' },
    modalHandle: { width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '0 auto 16px' },
    modalSuccessIcon: { fontSize: '48px', textAlign: 'center', marginBottom: '8px' },
    modalTitle: { fontSize: '20px', fontWeight: '700', textAlign: 'center', marginBottom: '20px' },
    modalCarInfo: { background: '#F7F8FA', borderRadius: '12px', padding: '16px', marginBottom: '20px' },
    modalCarRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E2E8F0' },
    modalLabel: { fontSize: '14px', color: '#64748B' },
    modalValue: { fontSize: '14px', fontWeight: '600', color: '#1E293B' },
    modalDivider: { height: '1px', background: '#E2E8F0', margin: '20px 0' },
    modalQuestion: { marginBottom: '16px' },
    modalQuestionTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' },
    originOptions: { display: 'flex', flexDirection: 'column', gap: '12px' },
    originOption: { display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: '#F7F8FA', borderRadius: '12px', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.2s' },
    originIcon: { fontSize: '28px' },
    originTextStrong: { display: 'block', fontSize: '15px', fontWeight: '600', marginBottom: '2px' },
    originTextSpan: { fontSize: '13px', color: '#64748B' },
    tipBox: { display: showTip ? 'block' : 'none', background: '#FEF3C7', borderRadius: '12px', padding: '16px', marginTop: '16px' },
    tipBoxTitle: { fontSize: '14px', fontWeight: '700', marginBottom: '8px' },
    tipBoxList: { margin: 0, paddingLeft: '20px' },
    tipBoxItem: { fontSize: '13px', color: '#1E293B', marginBottom: '6px', lineHeight: '1.4' },
    modalSkip: { display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#64748B', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', width: '100%' },
    personalizedSection: { display: vinResult ? 'block' : 'none', marginTop: '20px' },
    resultCard: { background: '#FFFFFF', borderRadius: '16px', marginBottom: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    resultHeader: (type) => ({ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: type === 'warning' ? '#FEF3C7' : type === 'info' ? 'rgba(31, 79, 216, 0.08)' : type === 'success' ? 'rgba(46, 158, 111, 0.1)' : '#F7F8FA' }),
    resultIcon: { fontSize: '20px' },
    resultTitle: { fontSize: '15px', fontWeight: '700', margin: 0 },
    resultBody: { padding: '16px' },
    resultText: { fontSize: '14px', color: '#1E293B', lineHeight: '1.5', marginBottom: '8px' },
    rightsList: { margin: '16px 0' },
    rightsItem: { display: 'flex', gap: '12px', marginBottom: '12px' },
    rightsNum: { width: '24px', height: '24px', background: '#1F4FD8', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
    rightsItemText: { fontSize: '14px', lineHeight: '1.4', margin: 0 },
    resultBtn: { width: '100%', padding: '14px', background: '#1F4FD8', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    resultBtnSecondary: { width: '100%', padding: '14px', background: 'rgba(31, 79, 216, 0.08)', color: '#1F4FD8', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
    importLinks: { marginTop: '12px' },
    importLink: { display: 'block', padding: '12px', background: '#F7F8FA', borderRadius: '8px', fontSize: '14px', color: '#1F4FD8', textDecoration: 'none', marginBottom: '8px' },
    partVinItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#F7F8FA', borderRadius: '8px', marginTop: '12px' },
    partName: { fontSize: '14px', fontWeight: '500' },
    partNumber: { fontSize: '14px', fontFamily: 'monospace', color: '#1F4FD8', fontWeight: '600' },
  };

  const issues = {
    current: [
      { id: 'issue-1', name: 'Подшипник первичного вала КПП', meta: 'Коробка • 25% владельцев', severity: 'high', hasLawsuits: true, hasRecalls: true },
      { id: 'issue-2', name: 'Сальник первичного вала КПП', meta: 'Коробка • 30% владельцев', severity: 'medium' },
      { id: 'issue-3', name: 'Слабое ЛКП', meta: 'Кузов • 50% владельцев', severity: 'low' },
      { id: 'issue-4', name: 'Стойки стабилизатора', meta: 'Подвеска • 40% владельцев', severity: 'low' },
    ],
    upcoming: [{ id: 'issue-5', name: 'Растяжение цепи ГРМ', meta: 'Двигатель • 20% владельцев', severity: 'critical', hasLawsuits: true, hasRecalls: true }],
    past: [
      { id: 'issue-6', name: 'Стук рулевой рейки', meta: 'Рулевое • 35% владельцев', severity: 'medium', hasRecalls: true },
      { id: 'issue-7', name: 'Подшипники ступиц', meta: 'Подвеска • 30% владельцев', severity: 'low' },
    ],
  };

  const renderIssueCard = (issue) => (
    <div key={issue.id} style={styles.issueCard(expandedIssue === issue.id)}>
      <button style={styles.issueHeader} onClick={() => toggleIssue(issue.id)}>
        <div style={styles.issueHeaderLeft}>
          <div style={styles.severityDot(issue.severity)} />
          <div style={styles.issueHeaderInfo}>
            <span style={styles.issueName}>{issue.name}</span>
            <span style={styles.issueMeta}>{issue.meta}</span>
          </div>
        </div>
        {(issue.hasLawsuits || issue.hasRecalls) && (
          <div style={styles.statusIcons}>
            {issue.hasLawsuits && <div style={styles.statusIcon}>⚖️</div>}
            {issue.hasRecalls && <div style={styles.statusIcon}>📋</div>}
          </div>
        )}
        <span style={styles.issueToggle(expandedIssue === issue.id)}>▼</span>
      </button>
      <div style={styles.issueBody(expandedIssue === issue.id)}>
        {issue.hasLawsuits && (
          <div style={styles.defectStatus}>
            <div style={styles.defectBlock}>
              <div style={styles.defectBlockTitle}>⚖️ Коллективные иски</div>
              <div style={styles.defectItem}>
                <span style={styles.defectFlag}>🇺🇸</span>
                <div style={styles.defectInfo}>
                  <div style={styles.defectCountry}>США (2018)</div>
                  <div style={styles.defectResult}>Расширение гарантии до 150k миль</div>
                </div>
                <span style={styles.defectBadge('won')}>✓ Выигран</span>
              </div>
            </div>
            {issue.hasRecalls && (
              <div style={{ ...styles.defectBlock, marginBottom: 0 }}>
                <div style={styles.defectBlockTitle}>📋 Отзывные кампании</div>
                <div style={styles.defectItem}>
                  <span style={styles.defectFlag}>🇺🇸</span>
                  <div style={styles.defectInfo}><div style={styles.defectCountry}>США</div></div>
                  <span style={styles.recallCode}>19V-287 (2019)</span>
                  <span style={styles.recallStatus}>✅</span>
                </div>
                <div style={styles.defectItem}>
                  <span style={styles.defectFlag}>🇷🇺</span>
                  <div style={styles.defectInfo}><div style={styles.defectCountry}>Россия</div></div>
                  <span style={styles.recallCode}>не проводилась</span>
                  <span style={styles.recallStatus}>❌</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div style={styles.progressZone(25, 50)} />
            <div style={styles.progressMarker(45)} />
          </div>
          <div style={styles.progressLabels}>
            <span style={styles.progressLabel}>60K</span>
            <span style={styles.progressCurrent(45)}>~87K</span>
            <span style={styles.progressLabel}>120K</span>
          </div>
        </div>
        <p style={styles.issueDescription}>Скрежет при переключении передач. Подшипник первичного вала изнашивается.</p>
        <div style={styles.quickMetrics}>
          <div style={styles.metricItem}><span style={styles.metricIcon}>⏱</span><span style={styles.metricValue}>3-5 ч</span></div>
          <div style={styles.metricItem}><span style={styles.metricIcon}>💰</span><span style={styles.metricValue}>15-45K ₽</span></div>
          <div style={styles.metricItem}><span style={styles.metricIcon}>🔴</span><span style={styles.metricValue}>Сложно</span></div>
        </div>
        <button style={styles.detailButton} onClick={() => onNavigateToDetail && onNavigateToDetail(issue.id)}>Подробнее и решения →</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Болячки {car?.brand || 'Hyundai'} {car?.model || 'Solaris'}</h1>
        <p style={styles.headerSubtitle}>{car?.engine || '1.6 (123 л.с.)'} {car?.transmission || '6-АКПП'} • ~{car?.mileage || '87'} тыс. км</p>
      </div>

      <div style={styles.intro}>
        <span style={styles.introIcon}>💡</span>
        <span style={styles.introText}>Показываем болячки, актуальные для вашего пробега. Не все проблемы случатся — это статистика по модели.</span>
      </div>

      <div style={styles.summary}>
        <div style={styles.summaryItem}><span style={styles.summaryValue}>4</span><span style={styles.summaryLabel}>актуально сейчас</span></div>
        <div style={styles.summaryDivider} />
        <div style={styles.summaryItem}><span style={styles.summaryValue}>1</span><span style={styles.summaryLabel}>в будущем</span></div>
        <div style={styles.summaryDivider} />
        <div style={styles.summaryItem}><span style={styles.summaryValue}>2</span><span style={styles.summaryLabel}>уже прошли</span></div>
      </div>

      <div style={styles.sections}>
        <div style={styles.section}>
          <div style={styles.sectionWrapper('critical')}>
            <button style={styles.sectionHeader('critical')} onClick={() => toggleSection('current')}>
              <div style={styles.sectionHeaderLeft}>
                <div style={styles.sectionDot('critical')} />
                <span style={styles.sectionTitle}>Актуально сейчас</span>
                <span style={styles.sectionCount('critical')}>4</span>
              </div>
              <span style={styles.sectionToggle(expandedSections.current)}>▼</span>
            </button>
            <div style={styles.sectionContent(expandedSections.current)}>{issues.current.map(renderIssueCard)}</div>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionWrapper('warning')}>
            <button style={styles.sectionHeader('warning')} onClick={() => toggleSection('upcoming')}>
              <div style={styles.sectionHeaderLeft}>
                <div style={styles.sectionDot('warning')} />
                <span style={styles.sectionTitle}>Скоро может проявиться</span>
                <span style={styles.sectionCount('warning')}>1</span>
              </div>
              <span style={styles.sectionToggle(expandedSections.upcoming)}>▼</span>
            </button>
            <div style={styles.sectionContent(expandedSections.upcoming)}>{issues.upcoming.map(renderIssueCard)}</div>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionWrapper('success')}>
            <button style={styles.sectionHeader('success')} onClick={() => toggleSection('past')}>
              <div style={styles.sectionHeaderLeft}>
                <div style={styles.sectionDot('success')} />
                <span style={styles.sectionTitle}>Уже прошли (проверьте)</span>
                <span style={styles.sectionCount('success')}>2</span>
              </div>
              <span style={styles.sectionToggle(expandedSections.past)}>▼</span>
            </button>
            <div style={styles.sectionContent(expandedSections.past)}>{issues.past.map(renderIssueCard)}</div>
          </div>
        </div>

        {/* VIN Section */}
        <div style={styles.vinSection}>
          <div style={styles.vinCard}>
            <div style={styles.vinIconBig}>🔍</div>
            <h3 style={styles.vinTitleBig}>Уточнить данные по VIN</h3>
            <p style={styles.vinDesc}>Введите VIN-номер, чтобы получить информацию именно для вашего автомобиля:</p>
            <div style={styles.vinBenefits}>
              <div style={styles.vinBenefit}><span style={styles.vinCheck}>✓</span> Проверить отзывные кампании по вашему VIN</div>
              <div style={styles.vinBenefit}><span style={styles.vinCheck}>✓</span> Точный подбор запчастей под вашу комплектацию</div>
              <div style={styles.vinBenefit}><span style={styles.vinCheck}>✓</span> Скачать шаблон претензии (если применимо)</div>
              <div style={styles.vinBenefit}><span style={styles.vinCheck}>✓</span> Узнать ваши права по ЗоЗПП</div>
            </div>
            <div style={styles.vinInputSection}>
              <input type="text" style={styles.vinInputField} placeholder="Например: WAUZZZ8X1DA012345" maxLength={17} value={vinValue} onChange={(e) => setVinValue(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))} />
              <button style={styles.vinCheckButton} onClick={handleVinCheck}>Проверить</button>
            </div>
            <p style={styles.vinNote}>Это необязательно — приложение работает и без VIN. Но с ним информация будет точнее.</p>
            <button style={styles.vinSkip} onClick={() => setVinHidden(true)}>Пропустить</button>
          </div>
        </div>

        {/* VIN Modal */}
        <div style={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowVinModal(false)}>
          <div style={styles.modalContent}>
            <div style={styles.modalHandle} />
            <div style={styles.modalSuccessIcon}>✅</div>
            <h3 style={styles.modalTitle}>VIN распознан</h3>
            <div style={styles.modalCarInfo}>
              <div style={styles.modalCarRow}><span style={styles.modalLabel}>Модель</span><span style={styles.modalValue}>Hyundai Solaris</span></div>
              <div style={styles.modalCarRow}><span style={styles.modalLabel}>Дата производства</span><span style={styles.modalValue}>Июнь 2015</span></div>
              <div style={{ ...styles.modalCarRow, borderBottom: 'none' }}><span style={styles.modalLabel}>Страна сборки</span><span style={styles.modalValue}>Россия 🇷🇺</span></div>
            </div>
            <div style={styles.modalDivider} />
            <div style={styles.modalQuestion}>
              <h4 style={styles.modalQuestionTitle}>Как автомобиль попал в Россию?</h4>
              <div style={styles.originOptions}>
                <div style={styles.originOption} onClick={() => handleOriginSelect('official')}>
                  <div style={styles.originIcon}>🏢</div>
                  <div><strong style={styles.originTextStrong}>Официально продан в России</strong><span style={styles.originTextSpan}>Первый владелец купил у официального дилера</span></div>
                </div>
                <div style={styles.originOption} onClick={() => handleOriginSelect('imported')}>
                  <div style={styles.originIcon}>✈️</div>
                  <div><strong style={styles.originTextStrong}>Ввезён из-за рубежа</strong><span style={styles.originTextSpan}>Европа, США, Корея, ОАЭ и др.</span></div>
                </div>
              </div>
            </div>
            <div style={styles.tipBox}>
              <h4 style={styles.tipBoxTitle}>💡 Как узнать?</h4>
              <ul style={styles.tipBoxList}>
                <li style={styles.tipBoxItem}>ПТС: посмотрите графу «Страна вывоза» или первого собственника</li>
                <li style={styles.tipBoxItem}>Если первый владелец — юрлицо типа «Хёндэ Центр...» — скорее всего официальный</li>
                <li style={styles.tipBoxItem}>Если физлицо или «ИП Иванов» — вероятно привезён</li>
              </ul>
            </div>
            <button style={styles.modalSkip} onClick={handleDontKnow}>{showTip ? 'Всё равно не знаю' : 'Не знаю / Пропустить'}</button>
          </div>
        </div>

        {/* Official Results */}
        {vinResult === 'official' && (
          <div style={styles.personalizedSection}>
            <div style={styles.resultCard}>
              <div style={styles.resultHeader('warning')}><span style={styles.resultIcon}>⚠️</span><h4 style={styles.resultTitle}>Ваш автомобиль в зоне риска</h4></div>
              <div style={styles.resultBody}>
                <p style={styles.resultText}>Дата выпуска: <strong>июнь 2015</strong> — до исправления дефекта рулевой рейки.</p>
                <p style={styles.resultText}>Отзывная кампания <strong>HR-2017-042</strong> может быть применима к вашему VIN. Уточните у дилера.</p>
              </div>
            </div>
            <div style={styles.resultCard}>
              <div style={styles.resultHeader('info')}><span style={styles.resultIcon}>⚖️</span><h4 style={styles.resultTitle}>Ваши права</h4></div>
              <div style={styles.resultBody}>
                <p style={styles.resultText}>Автомобиль куплен у официального дилера — вы можете:</p>
                <div style={styles.rightsList}>
                  <div style={styles.rightsItem}><span style={styles.rightsNum}>1</span><p style={styles.rightsItemText}>Требовать бесплатный ремонт по отзывной кампании (даже после окончания гарантии)</p></div>
                  <div style={styles.rightsItem}><span style={styles.rightsNum}>2</span><p style={styles.rightsItemText}>При отказе — претензия по ЗоЗПП ст. 18, 19 (существенный недостаток)</p></div>
                </div>
                <button style={styles.resultBtn}>📄 Скачать шаблон претензии</button>
                <button style={styles.resultBtnSecondary}>📖 Подробнее о ваших правах</button>
              </div>
            </div>
            <div style={styles.resultCard}>
              <div style={styles.resultHeader('success')}><span style={styles.resultIcon}>🔩</span><h4 style={styles.resultTitle}>Запчасти под ваш VIN</h4></div>
              <div style={styles.resultBody}>
                <p style={styles.resultText}>Артикулы подобраны точно под вашу комплектацию:</p>
                <div style={styles.partVinItem}><span style={styles.partName}>Ремкомплект рулевой рейки</span><span style={styles.partNumber}>57700-1R000</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Imported Results */}
        {vinResult === 'imported' && (
          <div style={styles.personalizedSection}>
            <div style={styles.resultCard}>
              <div style={styles.resultHeader('neutral')}><span style={styles.resultIcon}>🌍</span><h4 style={styles.resultTitle}>Импортный автомобиль</h4></div>
              <div style={styles.resultBody}>
                <p style={styles.resultText}>Автомобили, ввезённые из-за рубежа, <strong>не участвуют</strong> в российских отзывных кампаниях.</p>
                <p style={styles.resultText}>Но вы можете проверить отзывные в стране происхождения:</p>
                <div style={styles.importLinks}>
                  <a href="#" style={styles.importLink}>🇰🇷 Проверить в Корее</a>
                  <a href="#" style={styles.importLink}>🇺🇸 Проверить в США (NHTSA)</a>
                  <a href="#" style={styles.importLink}>🇪🇺 Проверить в Европе</a>
                </div>
              </div>
            </div>
            <div style={styles.resultCard}>
              <div style={styles.resultHeader('success')}><span style={styles.resultIcon}>🔩</span><h4 style={styles.resultTitle}>Запчасти под ваш VIN</h4></div>
              <div style={styles.resultBody}>
                <p style={styles.resultText}>Артикулы подобраны точно под вашу комплектацию:</p>
                <div style={styles.partVinItem}><span style={styles.partName}>Ремкомплект рулевой рейки</span><span style={styles.partNumber}>57700-1R000</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssuesScreen;
