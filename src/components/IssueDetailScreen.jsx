import React, { useState } from 'react';

const IssueDetailScreen = ({ issue, car, onBack }) => {
  const [activeTab, setActiveTab] = useState('service');
  const [expandedSections, setExpandedSections] = useState({
    symptoms: true,
    obdCodes: true,
    cause: true,
    solution: true,
    reviews: false
  });
  const [vinValue, setVinValue] = useState('');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const styles = {
    container: { background: '#F7F8FA', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100 },
    backButton: { background: 'none', border: 'none', fontSize: '16px', color: '#1F4FD8', cursor: 'pointer', fontWeight: '500' },
    shareButton: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' },
    hero: { padding: '20px', background: '#FFFFFF' },
    heroTop: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
    severityBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: 'rgba(220, 38, 38, 0.08)', color: '#DC2626' },
    systemTag: { fontSize: '13px', color: '#64748B', background: '#F7F8FA', padding: '4px 10px', borderRadius: '6px' },
    title: { fontSize: '22px', fontWeight: '700', color: '#1E293B', lineHeight: '1.3', marginBottom: '8px' },
    carInfo: { fontSize: '14px', color: '#64748B', marginBottom: '16px' },
    statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    statCard: { padding: '14px', background: '#F7F8FA', borderRadius: '12px', textAlign: 'center' },
    statValue: { display: 'block', fontSize: '18px', fontWeight: '700', color: '#1E293B' },
    statLabel: { fontSize: '12px', color: '#94A3B8' },
    recommendationBox: { display: 'flex', gap: '12px', padding: '16px 20px', background: 'rgba(31, 79, 216, 0.08)', borderLeft: '4px solid #1F4FD8' },
    consequencesBox: { display: 'flex', gap: '12px', padding: '16px 20px', background: 'rgba(217, 119, 6, 0.08)', borderLeft: '4px solid #D97706' },
    boxIcon: { fontSize: '18px', flexShrink: 0 },
    boxTitle: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#1F4FD8', marginBottom: '4px' },
    consequencesTitle: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#D97706', marginBottom: '4px' },
    boxText: { fontSize: '14px', color: '#64748B', lineHeight: '1.5' },
    section: { background: '#FFFFFF', marginTop: '8px' },
    sectionHeader: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' },
    sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#1E293B' },
    chevron: (open) => ({ fontSize: '10px', color: '#94A3B8', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }),
    sectionContent: (open) => ({ padding: open ? '0 20px 20px' : '0', display: open ? 'block' : 'none' }),
    symptomRow: { display: 'flex', gap: '8px', marginBottom: '10px' },
    symptomBullet: { color: '#1F4FD8', fontWeight: '700' },
    symptomText: { fontSize: '15px', color: '#1E293B', lineHeight: '1.5' },
    symptomCondition: { color: '#64748B' },
    obdCodes: { display: 'flex', flexDirection: 'column', gap: '8px' },
    obdCodeItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F7F8FA', borderRadius: '8px' },
    obdCode: { fontFamily: 'monospace', fontSize: '15px', fontWeight: '700', color: '#DC2626', background: 'rgba(220, 38, 38, 0.08)', padding: '4px 10px', borderRadius: '6px' },
    obdDesc: { fontSize: '13px', color: '#64748B', flex: 1 },
    causeText: { fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '16px' },
    notCauseBlock: { padding: '14px', background: 'rgba(220, 38, 38, 0.08)', borderRadius: '10px', border: '1px solid rgba(220, 38, 38, 0.2)' },
    notCauseTitle: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#DC2626', marginBottom: '10px' },
    notCauseList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    notCauseItem: { fontSize: '13px', color: '#1E293B', background: '#FFFFFF', padding: '6px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' },
    solutionTabs: { display: 'flex', gap: '8px', marginBottom: '16px' },
    solutionTab: (active) => ({ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 12px', background: active ? 'rgba(31, 79, 216, 0.08)' : '#F7F8FA', border: `2px solid ${active ? '#1F4FD8' : '#E2E8F0'}`, borderRadius: '12px', cursor: 'pointer' }),
    tabIcon: { fontSize: '18px' },
    tabText: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
    tabLabel: { fontSize: '14px', fontWeight: '600', color: '#1E293B' },
    tabHint: { fontSize: '11px', color: '#94A3B8' },
    solutionCard: { padding: '16px', background: 'rgba(46, 158, 111, 0.08)', borderRadius: '12px' },
    solutionTitle: { fontSize: '16px', fontWeight: '600', color: '#1E293B', marginBottom: '8px' },
    solutionDesc: { fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '16px' },
    solutionMeta: { display: 'flex', gap: '16px', marginBottom: '16px' },
    metaItem: { display: 'flex', alignItems: 'center', gap: '6px' },
    metaIcon: { fontSize: '14px' },
    metaText: { fontSize: '14px', fontWeight: '600', color: '#1E293B' },
    difficultyContainer: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
    difficultyLabel: { fontSize: '13px', color: '#64748B' },
    difficultyDots: { display: 'flex', gap: '4px' },
    difficultyDot: (filled) => ({ width: '8px', height: '8px', borderRadius: '50%', background: filled ? '#D97706' : '#E2E8F0' }),
    difficultyText: { fontSize: '13px', fontWeight: '600', color: '#1E293B' },
    toolsSection: { marginBottom: '16px' },
    toolsTitle: { fontSize: '13px', color: '#64748B', marginBottom: '8px', display: 'block' },
    toolsList: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    toolChip: { fontSize: '12px', padding: '6px 10px', background: '#FFFFFF', borderRadius: '6px', color: '#1E293B' },
    warningBox: { display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: 'rgba(217, 119, 6, 0.08)', borderRadius: '8px', marginBottom: '16px' },
    warningIcon: { fontSize: '14px' },
    warningText: { fontSize: '13px', color: '#1E293B', lineHeight: '1.4' },
    partsInDiy: { marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' },
    partsInDiyTitle: { fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' },
    vinPrompt: { padding: '14px', background: '#FFFFFF', borderRadius: '10px', border: '1px dashed #1F4FD8', marginBottom: '12px' },
    vinHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
    vinIcon: { fontSize: '16px' },
    vinTitle: { fontSize: '14px', fontWeight: '600', color: '#1E293B' },
    vinText: { fontSize: '13px', color: '#64748B', marginBottom: '10px' },
    vinInputRow: { display: 'flex', gap: '8px' },
    vinInput: { flex: 1, padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', textTransform: 'uppercase' },
    vinButton: { padding: '10px 16px', background: '#1F4FD8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    partCard: { padding: '14px', background: '#F7F8FA', borderRadius: '10px', marginBottom: '10px' },
    partHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    partName: { fontSize: '14px', fontWeight: '600', color: '#1E293B' },
    partRevision: { fontSize: '11px', color: '#2E9E6F', background: 'rgba(46, 158, 111, 0.08)', padding: '2px 8px', borderRadius: '4px' },
    partNumber: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
    partNumberLabel: { fontSize: '12px', color: '#94A3B8' },
    partNumberValue: { fontFamily: 'monospace', fontSize: '13px', fontWeight: '600', color: '#1E293B' },
    copyButton: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' },
    partManufacturer: { fontSize: '12px', color: '#64748B', marginBottom: '6px' },
    priceRange: { fontSize: '15px', fontWeight: '700', color: '#1E293B', marginBottom: '10px', display: 'block' },
    alternativesSection: { paddingTop: '10px', borderTop: '1px solid #E2E8F0' },
    alternativesLabel: { fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '6px' },
    alternativesList: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    alternativeChip: { fontSize: '11px', padding: '4px 8px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', color: '#64748B' },
    ctaPrimary: { width: '100%', padding: '16px', background: '#1F4FD8', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '16px' },
    ctaBuy: { width: '100%', padding: '14px', background: '#2E9E6F', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '12px' },
    whereBox: { padding: '12px', background: '#FFFFFF', borderRadius: '8px' },
    whereLabel: { fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' },
    whereText: { fontSize: '14px', color: '#1E293B' },
    reviewCard: { padding: '14px', background: '#F7F8FA', borderRadius: '10px', marginBottom: '10px' },
    reviewHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
    reviewMeta: { fontSize: '13px', color: '#94A3B8' },
    reviewStatus: { fontSize: '12px', color: '#2E9E6F' },
    reviewText: { fontSize: '14px', lineHeight: '1.5', color: '#1E293B' },
    bottomActions: { padding: '20px', background: '#FFFFFF', marginTop: '8px' },
    journalButton: { width: '100%', padding: '14px', background: '#FFFFFF', color: '#1F4FD8', border: '2px solid #1F4FD8', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' },
    secondaryRow: { display: 'flex', gap: '12px' },
    secondaryButton: { flex: 1, padding: '12px', background: '#F7F8FA', color: '#64748B', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
    footer: { padding: '20px', background: '#F7F8FA' },
    footerText: { fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>← Назад</button>
        <button style={styles.shareButton}>↗</button>
      </div>

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroTop}>
          <span style={styles.severityBadge}>🔴 Критично</span>
          <span style={styles.systemTag}>{issue?.system || 'Топливная система'}</span>
        </div>
        <h1 style={styles.title}>{issue?.name || 'Датчик давления топлива старой ревизии'}</h1>
        <p style={styles.carInfo}>{car?.brand || 'Ford'} {car?.model || 'Mustang 6G (S550)'} • {car?.engine || '2.3L EcoBoost'} • 2015–2023</p>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>~40K км</span>
            <span style={styles.statLabel}>пик проявления</span>
          </div>
          <div style={styles.statCard}>
            <span style={{...styles.statValue, color: '#D97706'}}>35%</span>
            <span style={styles.statLabel}>владельцев</span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div style={styles.recommendationBox}>
        <span style={styles.boxIcon}>💡</span>
        <div>
          <span style={styles.boxTitle}>Рекомендуем проверить</span>
          <span style={styles.boxText}>Проверять и менять датчик при покупке б/у, даже если симптомов нет.</span>
        </div>
      </div>

      {/* Consequences */}
      <div style={styles.consequencesBox}>
        <span style={styles.boxIcon}>⚠️</span>
        <div>
          <span style={styles.consequencesTitle}>Возможные последствия</span>
          <span style={styles.boxText}>Обеднение смеси может привести к задирам в цилиндрах. Ремонт двигателя: 150 000 – 300 000 ₽</span>
        </div>
      </div>

      {/* Симптомы */}
      <div style={styles.section}>
        <button style={styles.sectionHeader} onClick={() => toggleSection('symptoms')}>
          <span style={styles.sectionTitle}>🔍 Симптомы</span>
          <span style={styles.chevron(expandedSections.symptoms)}>▼</span>
        </button>
        <div style={styles.sectionContent(expandedSections.symptoms)}>
          <div style={styles.symptomRow}><span style={styles.symptomBullet}>•</span><span style={styles.symptomText}>Плавающие обороты<span style={styles.symptomCondition}> — на холостом ходу</span></span></div>
          <div style={styles.symptomRow}><span style={styles.symptomBullet}>•</span><span style={styles.symptomText}>Потеря мощности<span style={styles.symptomCondition}> — при разгоне под нагрузкой</span></span></div>
          <div style={styles.symptomRow}><span style={styles.symptomBullet}>•</span><span style={styles.symptomText}>Двигатель глохнет<span style={styles.symptomCondition}> — спонтанно</span></span></div>
        </div>
      </div>

      {/* Коды ошибок OBD */}
      <div style={styles.section}>
        <button style={styles.sectionHeader} onClick={() => toggleSection('obdCodes')}>
          <span style={styles.sectionTitle}>📟 Коды ошибок</span>
          <span style={styles.chevron(expandedSections.obdCodes)}>▼</span>
        </button>
        <div style={styles.sectionContent(expandedSections.obdCodes)}>
          <div style={styles.obdCodes}>
            <div style={styles.obdCodeItem}><span style={styles.obdCode}>P008A</span><span style={styles.obdDesc}>Давление топлива слишком низкое</span></div>
            <div style={styles.obdCodeItem}><span style={styles.obdCode}>P0148</span><span style={styles.obdDesc}>Ошибка подачи топлива</span></div>
            <div style={styles.obdCodeItem}><span style={styles.obdCode}>P018C</span><span style={styles.obdDesc}>Показания датчика вне допустимого диапазона</span></div>
          </div>
        </div>
      </div>

      {/* Причина */}
      <div style={styles.section}>
        <button style={styles.sectionHeader} onClick={() => toggleSection('cause')}>
          <span style={styles.sectionTitle}>🔧 Причина</span>
          <span style={styles.chevron(expandedSections.cause)}>▼</span>
        </button>
        <div style={styles.sectionContent(expandedSections.cause)}>
          <p style={styles.causeText}>Датчики первых ревизий имеют конструктивную особенность, из-за которой могут передавать в блок управления заниженные значения давления.</p>
          <div style={styles.notCauseBlock}>
            <div style={styles.notCauseTitle}><span>❌</span><span>Часто путают с:</span></div>
            <div style={styles.notCauseList}>
              <span style={styles.notCauseItem}>Топливный насос</span>
              <span style={styles.notCauseItem}>Форсунки</span>
              <span style={styles.notCauseItem}>Топливный фильтр</span>
            </div>
          </div>
        </div>
      </div>

      {/* Решение */}
      <div style={styles.section}>
        <button style={styles.sectionHeader} onClick={() => toggleSection('solution')}>
          <span style={styles.sectionTitle}>✅ Решение</span>
          <span style={styles.chevron(expandedSections.solution)}>▼</span>
        </button>
        <div style={styles.sectionContent(expandedSections.solution)}>
          {/* Табы */}
          <div style={styles.solutionTabs}>
            <button style={styles.solutionTab(activeTab === 'service')} onClick={() => setActiveTab('service')}>
              <span style={styles.tabIcon}>🔧</span>
              <div style={styles.tabText}><span style={styles.tabLabel}>В сервисе</span><span style={styles.tabHint}>рекомендуем</span></div>
            </button>
            <button style={styles.solutionTab(activeTab === 'diy')} onClick={() => setActiveTab('diy')}>
              <span style={styles.tabIcon}>🛠</span>
              <div style={styles.tabText}><span style={styles.tabLabel}>Своими руками</span><span style={styles.tabHint}>для опытных</span></div>
            </button>
          </div>

          {/* Контент "В сервисе" */}
          {activeTab === 'service' && (
            <div style={styles.solutionCard}>
              <h3 style={styles.solutionTitle}>Замена датчика на актуальную ревизию</h3>
              <p style={styles.solutionDesc}>Мастер заменит датчик давления топлива на версию с исправленной конструкцией. Работа занимает 20–30 минут.</p>
              <div style={styles.solutionMeta}>
                <div style={styles.metaItem}><span style={styles.metaIcon}>⏱</span><span style={styles.metaText}>20–30 минут</span></div>
                <div style={styles.metaItem}><span style={styles.metaIcon}>💰</span><span style={styles.metaText}>500 – 1 500 ₽</span></div>
              </div>
              <div style={styles.whereBox}>
                <span style={styles.whereLabel}>Где делать:</span>
                <span style={styles.whereText}>Любой сервис с опытом работы с Ford</span>
              </div>
              <button style={styles.ctaPrimary}>📍 Записаться в сервис</button>
            </div>
          )}

          {/* Контент "Своими руками" */}
          {activeTab === 'diy' && (
            <div style={styles.solutionCard}>
              <h3 style={styles.solutionTitle}>Самостоятельная замена</h3>
              <p style={styles.solutionDesc}>Датчик расположен в доступном месте перед ТНВД. Замена не требует специального оборудования.</p>
              <div style={styles.solutionMeta}>
                <div style={styles.metaItem}><span style={styles.metaIcon}>⏱</span><span style={styles.metaText}>30–40 минут</span></div>
              </div>
              <div style={styles.difficultyContainer}>
                <span style={styles.difficultyLabel}>Сложность:</span>
                <div style={styles.difficultyDots}>
                  <div style={styles.difficultyDot(true)}></div>
                  <div style={styles.difficultyDot(false)}></div>
                  <div style={styles.difficultyDot(false)}></div>
                </div>
                <span style={styles.difficultyText}>Несложно</span>
              </div>
              <div style={styles.toolsSection}>
                <span style={styles.toolsTitle}>Инструменты:</span>
                <div style={styles.toolsList}>
                  <span style={styles.toolChip}>Ключ на 24</span>
                  <span style={styles.toolChip}>Ключ на 12</span>
                  <span style={styles.toolChip}>Ветошь</span>
                  <span style={styles.toolChip}>Ёмкость для топлива</span>
                </div>
              </div>
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}>⚠️</span>
                <span style={styles.warningText}>Если датчик прикипел и не поддаётся — не прилагайте чрезмерных усилий. Есть риск повредить резьбу.</span>
              </div>

              {/* Запчасти */}
              <div style={styles.partsInDiy}>
                <div style={styles.partsInDiyTitle}>🔩 Запчасти</div>
                
                <div style={styles.vinPrompt}>
                  <div style={styles.vinHeader}><span style={styles.vinIcon}>🔍</span><span style={styles.vinTitle}>Уточнить по VIN</span></div>
                  <p style={styles.vinText}>Введите VIN для точных артикулов под ваш автомобиль</p>
                  <div style={styles.vinInputRow}>
                    <input type="text" style={styles.vinInput} placeholder="1FA6P8TH8H5123456" maxLength={17} value={vinValue} onChange={(e) => setVinValue(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))} />
                    <button style={styles.vinButton}>Найти</button>
                  </div>
                </div>

                <div style={styles.partCard}>
                  <div style={styles.partHeader}>
                    <span style={styles.partName}>Датчик давления топлива</span>
                    <span style={styles.partRevision}>rev.2</span>
                  </div>
                  <div style={styles.partNumber}>
                    <span style={styles.partNumberLabel}>Артикул:</span>
                    <span style={styles.partNumberValue}>BU5Z-9F972-B</span>
                    <button style={styles.copyButton}>📋</button>
                  </div>
                  <p style={styles.partManufacturer}>Ford / Motorcraft (оригинал)</p>
                  <span style={styles.priceRange}>4 500 – 6 000 ₽</span>
                  <div style={styles.alternativesSection}>
                    <span style={styles.alternativesLabel}>Альтернативы:</span>
                    <div style={styles.alternativesList}>
                      <span style={styles.alternativeChip}>Bosch</span>
                      <span style={styles.alternativeChip}>Delphi</span>
                    </div>
                  </div>
                </div>

                <button style={styles.ctaBuy}>🛒 Купить запчасть</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Отзывы */}
      <div style={styles.section}>
        <button style={styles.sectionHeader} onClick={() => toggleSection('reviews')}>
          <span style={styles.sectionTitle}>💬 Отзывы владельцев</span>
          <span style={styles.chevron(expandedSections.reviews)}>▼</span>
        </button>
        <div style={styles.sectionContent(expandedSections.reviews)}>
          <div style={styles.reviewCard}>
            <div style={styles.reviewHeader}>
              <span style={styles.reviewMeta}>Mustang 2016 • 45 000 км</span>
              <span style={styles.reviewStatus}>✓ Проблема решена</span>
            </div>
            <p style={styles.reviewText}>Заменил сам за полчаса. Обороты перестали плавать, машина поехала совсем по-другому.</p>
          </div>
          <div style={styles.reviewCard}>
            <div style={styles.reviewHeader}>
              <span style={styles.reviewMeta}>Mustang 2017 • 32 000 км</span>
              <span style={styles.reviewStatus}>✓ Профилактика</span>
            </div>
            <p style={styles.reviewText}>Поменял при покупке б/у, хотя симптомов не было. На старом датчике была первая ревизия.</p>
          </div>
        </div>
      </div>

      {/* Нижние действия */}
      <div style={styles.bottomActions}>
        <button style={styles.journalButton}><span>📝</span><span>Добавить в журнал обслуживания</span></button>
        <div style={styles.secondaryRow}>
          <button style={styles.secondaryButton}>💾 Сохранить</button>
          <button style={styles.secondaryButton}>↗ Поделиться</button>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>Информация основана на данных от владельцев и официальных источниках. Рекомендуем проверять актуальность цен и наличие запчастей.</p>
      </div>

      <div style={{height: '40px'}}></div>
    </div>
  );
};

export default IssueDetailScreen;
