import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// AutoAssistantAi — Экран болячек v3
// Упрощённые карточки с быстрыми метриками и одной кнопкой "Подробнее"

const colors = {
  background: '#F7F8FA',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  
  primary: '#1F4FD8',
  primaryLight: 'rgba(31, 79, 216, 0.08)',
  
  success: '#2E9E6F',
  successLight: 'rgba(46, 158, 111, 0.08)',
  successBorder: 'rgba(46, 158, 111, 0.2)',
  
  warning: '#D97706',
  warningLight: 'rgba(217, 119, 6, 0.08)',
  warningBorder: 'rgba(217, 119, 6, 0.2)',
  
  critical: '#DC2626',
  criticalLight: 'rgba(220, 38, 38, 0.08)',
  criticalBorder: 'rgba(220, 38, 38, 0.2)',
  
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
};

// Данные автомобиля
const carData = {
  brand: 'Hyundai',
  model: 'Solaris',
  year: 2015,
  engine: '1.6 (123 л.с.)',
  engineCode: 'G4FC',
  transmission: '6-АКПП',
  mileage: 87000,
  mileageConfidence: 'high',
};

// Болячки из базы данных (для Solaris)
const issuesDatabase = [
  {
    id: "solaris_steering_rack",
    name: "Стук рулевой рейки",
    category: "Ходовая",
    mileageStart: 25000,
    mileageEnd: 60000,
    probability: 45,
    severity: "medium",
    shortDesc: "Стук при вращении руля из-за износа пластиковых втулок.",
    description: "Конструктивный недостаток — большой зазор между упором и стопором. Пластиковые втулки быстро изнашиваются.",
    symptoms: ["Стук при вращении руля", "Люфт в рулевом"],
    solution: "Установка ремкомплекта рейки.",
    costMin: 3000,
    costMax: 15000,
    timeHours: "1-2",
    diyDifficulty: "medium", // easy | medium | hard
  },
  {
    id: "solaris_wheel_bearings",
    name: "Износ ступичных подшипников",
    category: "Ходовая",
    mileageStart: 15000,
    mileageEnd: 70000,
    probability: 35,
    severity: "medium",
    shortDesc: "Гул при движении, усиливается в поворотах.",
    description: "Передние ступичные подшипники изнашиваются раньше срока.",
    symptoms: ["Гул при движении", "Гул усиливается в поворотах"],
    solution: "Замена подшипников. Рекомендуют SKF вместо оригинала.",
    costMin: 2500,
    costMax: 8000,
    timeHours: "1-2",
    diyDifficulty: "medium",
  },
  {
    id: "solaris_gearbox_bearing",
    name: "Подшипник первичного вала КПП",
    category: "Коробка",
    mileageStart: 60000,
    mileageEnd: 120000,
    probability: 25,
    severity: "high",
    shortDesc: "Скрежет при переключении передач.",
    description: "Скрежет при переключении передач. Подшипник первичного вала изнашивается.",
    symptoms: ["Скрежет при переключении", "Шум на нейтрали"],
    solution: "Замена подшипника, в запущенных случаях — замена корпуса КПП.",
    costMin: 15000,
    costMax: 45000,
    timeHours: "3-5",
    diyDifficulty: "hard",
  },
  {
    id: "solaris_clutch_seal",
    name: "Сальник первичного вала КПП",
    category: "Коробка",
    mileageStart: 80000,
    mileageEnd: 150000,
    probability: 30,
    severity: "medium",
    shortDesc: "Течь сальника, масляные подтеки под КПП.",
    description: "Течь сальника замасливает маховик и диск сцепления.",
    symptoms: ["Масляные подтеки под КПП", "Пробуксовка сцепления"],
    solution: "Замена сальника и диска сцепления при необходимости.",
    costMin: 8000,
    costMax: 25000,
    timeHours: "2-4",
    diyDifficulty: "hard",
  },
  {
    id: "solaris_paint",
    name: "Слабое ЛКП",
    category: "Кузов",
    mileageStart: 30000,
    mileageEnd: 100000,
    probability: 50,
    severity: "low",
    shortDesc: "Тонкое покрытие, сколы появляются быстро.",
    description: "Тонкое лакокрасочное покрытие. Сколы появляются быстро.",
    symptoms: ["Сколы на капоте", "Ржавчина в местах сколов"],
    solution: "Антикоррозийная обработка, подкраска сколов.",
    costMin: 2000,
    costMax: 15000,
    timeHours: "1-3",
    diyDifficulty: "easy",
  },
  {
    id: "solaris_rear_suspension",
    name: "Мягкая задняя подвеска",
    category: "Ходовая",
    mileageStart: 40000,
    mileageEnd: 80000,
    probability: 40,
    severity: "low",
    shortDesc: "Раскачка кормы, пробои на неровностях.",
    description: "Задние стойки и пружины слишком мягкие, машина раскачивается.",
    symptoms: ["Раскачка кормы", "Пробои подвески"],
    solution: "Замена на усиленные амортизаторы и пружины.",
    costMin: 8000,
    costMax: 20000,
    timeHours: "2-3",
    diyDifficulty: "medium",
  },
  {
    id: "solaris_timing_chain",
    name: "Растяжение цепи ГРМ",
    category: "Двигатель",
    mileageStart: 120000,
    mileageEnd: 180000,
    probability: 60,
    severity: "critical",
    shortDesc: "Дизельный звук на холодную, ошибка по фазам.",
    description: "Цепь ГРМ на моторах Gamma растягивается и требует замены.",
    symptoms: ["Дизельный звук на холодную", "Ошибка по фазам"],
    solution: "Замена цепи, натяжителя, успокоителей.",
    costMin: 15000,
    costMax: 35000,
    timeHours: "4-6",
    diyDifficulty: "hard",
    urgentAttention: true, // Требует срочного внимания
  },
  {
    id: "solaris_stabilizer_links",
    name: "Стойки стабилизатора",
    category: "Ходовая",
    mileageStart: 50000,
    mileageEnd: 90000,
    probability: 70,
    severity: "low",
    shortDesc: "Стук на мелких неровностях.",
    description: "Расходник, изнашивается быстрее на плохих дорогах.",
    symptoms: ["Стук на мелких неровностях", "Стук при повороте руля стоя"],
    solution: "Замена стоек стабилизатора. Недорогой ремонт.",
    costMin: 2000,
    costMax: 5000,
    timeHours: "0.5-1",
    diyDifficulty: "easy",
  },
];

// Группировка болячек по актуальности
const categorizeIssues = (issues, currentMileage) => {
  const SOON_THRESHOLD = 15000;
  
  const active = [];
  const soon = [];
  const passed = [];
  const future = [];
  
  issues.forEach(issue => {
    if (currentMileage >= issue.mileageStart && currentMileage <= issue.mileageEnd) {
      active.push(issue);
    } else if (currentMileage < issue.mileageStart && (issue.mileageStart - currentMileage) <= SOON_THRESHOLD) {
      soon.push(issue);
    } else if (currentMileage > issue.mileageEnd) {
      passed.push(issue);
    } else {
      future.push(issue);
    }
  });
  
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortBySeverity = (a, b) => severityOrder[a.severity] - severityOrder[b.severity];
  
  return {
    active: active.sort(sortBySeverity),
    soon: soon.sort(sortBySeverity),
    passed: passed.sort(sortBySeverity),
    future: future.sort((a, b) => a.mileageStart - b.mileageStart),
  };
};

// Прогресс-бар пробега
const MileageProgress = ({ current, start, end }) => {
  const rangeStart = Math.max(0, start - 10000);
  const rangeEnd = end + 10000;
  const range = rangeEnd - rangeStart;
  
  const startPercent = ((start - rangeStart) / range) * 100;
  const endPercent = ((end - rangeStart) / range) * 100;
  const currentPercent = Math.min(100, Math.max(0, ((current - rangeStart) / range) * 100));
  
  const isInRange = current >= start && current <= end;
  const isPassed = current > end;
  
  return (
    <div style={styles.progressContainer}>
      <div style={styles.progressBar}>
        <div style={{
          ...styles.progressZone,
          left: `${startPercent}%`,
          width: `${endPercent - startPercent}%`,
          background: isPassed ? colors.successLight : colors.criticalLight,
        }} />
        <div style={{
          ...styles.progressMarker,
          left: `${currentPercent}%`,
          background: isInRange ? colors.critical : isPassed ? colors.success : colors.primary,
        }} />
      </div>
      <div style={styles.progressLabels}>
        <span style={styles.progressLabel}>{(start / 1000).toFixed(0)}K</span>
        <span style={{
          ...styles.progressCurrent,
          color: isInRange ? colors.critical : colors.textPrimary,
        }}>
          ← вы тут
        </span>
        <span style={styles.progressLabel}>{(end / 1000).toFixed(0)}K</span>
      </div>
    </div>
  );
};

// Конфиг сложности DIY
const difficultyConfig = {
  easy: { label: 'Просто', icon: '🟢' },
  medium: { label: 'Средне', icon: '🟡' },
  hard: { label: 'Сложно', icon: '🔴' },
};

// Карточка болячки (упрощённая)
const IssueCard = ({ issue, currentMileage, onNavigateToDetail }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const severityConfig = {
    critical: { color: colors.critical, bg: colors.criticalLight, border: colors.criticalBorder, label: 'Критично' },
    high: { color: colors.warning, bg: colors.warningLight, border: colors.warningBorder, label: 'Важно' },
    medium: { color: colors.primary, bg: colors.primaryLight, border: colors.primary, label: 'Средне' },
    low: { color: colors.success, bg: colors.successLight, border: colors.successBorder, label: 'Низкий' },
  };
  
  const severity = severityConfig[issue.severity];
  const difficulty = difficultyConfig[issue.diyDifficulty];
  
  const formatCost = (min, max) => {
    if (max >= 1000) {
      return `${Math.round(min/1000)}-${Math.round(max/1000)}K ₽`;
    }
    return `${min.toLocaleString('ru-RU')} – ${max.toLocaleString('ru-RU')} ₽`;
  };
  
  return (
    <div style={styles.issueCard}>
      {/* Header - всегда видим */}
      <button 
        style={styles.issueHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={styles.issueHeaderLeft}>
          <div style={{
            ...styles.severityDot,
            background: severity.color,
          }} />
          <div style={styles.issueHeaderInfo}>
            <span style={styles.issueName}>{issue.name}</span>
            <span style={styles.issueMeta}>
              {issue.category} • {issue.probability}% владельцев
            </span>
          </div>
        </div>
        <span style={{
          ...styles.issueToggle,
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>▼</span>
      </button>
      
      {/* Expanded body */}
      {isExpanded && (
        <div style={styles.issueBody}>
          {/* Шкала пробега */}
          <MileageProgress 
            current={currentMileage}
            start={issue.mileageStart}
            end={issue.mileageEnd}
          />
          
          {/* Краткое описание */}
          <p style={styles.issueDescription}>{issue.shortDesc || issue.description}</p>
          
          {/* Быстрые метрики */}
          <div style={styles.quickMetrics}>
            <div style={styles.metricItem}>
              <span style={styles.metricIcon}>⏱</span>
              <span style={styles.metricValue}>{issue.timeHours} ч</span>
            </div>
            <div style={styles.metricItem}>
              <span style={styles.metricIcon}>💰</span>
              <span style={styles.metricValue}>{formatCost(issue.costMin, issue.costMax)}</span>
            </div>
            <div style={styles.metricItem}>
              <span style={styles.metricIcon}>{difficulty.icon}</span>
              <span style={styles.metricValue}>{difficulty.label}</span>
            </div>
          </div>
          
          {/* Срочное внимание (вместо "Нельзя ехать") */}
          {issue.urgentAttention && (
            <div style={styles.urgentBox}>
              <span style={styles.urgentIcon}>⚠️</span>
              <span style={styles.urgentText}>Требует срочного внимания</span>
            </div>
          )}
          
          {/* Одна главная кнопка */}
          <button 
            style={styles.detailButton}
            onClick={() => onNavigateToDetail(issue.id)}
          >
            Подробнее и решения →
          </button>
        </div>
      )}
    </div>
  );
};

// Секция с болячками
const IssueSection = ({ title, issues, currentMileage, color, isOpen, onToggle, onNavigateToDetail }) => {
  if (issues.length === 0) return null;
  
  return (
    <div style={styles.section}>
      <button 
        style={{
          ...styles.sectionHeader,
          borderColor: color,
          background: `${color}08`,
        }}
        onClick={onToggle}
      >
        <div style={styles.sectionHeaderLeft}>
          <div style={{ ...styles.sectionDot, background: color }} />
          <span style={styles.sectionTitle}>{title}</span>
          <span style={{
            ...styles.sectionCount,
            background: `${color}15`,
            color: color,
          }}>{issues.length}</span>
        </div>
        <span style={{
          ...styles.sectionToggle,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>▼</span>
      </button>
      
      {isOpen && (
        <div style={styles.sectionContent}>
          {issues.map(issue => (
            <IssueCard 
              key={issue.id}
              issue={issue}
              currentMileage={currentMileage}
              onNavigateToDetail={onNavigateToDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function IssuesScreen() {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState({
    active: true,
    soon: true,
    passed: false,
    future: false,
  });
  
  const categorizedIssues = useMemo(() => 
    categorizeIssues(issuesDatabase, carData.mileage),
    [carData.mileage]
  );
  
  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const handleNavigateToDetail = (issueId) => {
    navigate(`/issues/${issueId}`);
  };
  
  const totalActive = categorizedIssues.active.length + categorizedIssues.soon.length;
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <h1 style={styles.headerTitle}>Болячки {carData.brand} {carData.model}</h1>
          <p style={styles.headerSubtitle}>
            {carData.engine} {carData.transmission} • ~{(carData.mileage / 1000).toFixed(0)} тыс. км
          </p>
        </div>
      </div>
      
      {/* Intro */}
      <div style={styles.intro}>
        <span style={styles.introIcon}>💡</span>
        <span style={styles.introText}>
          Показываем болячки, актуальные для вашего пробега. Не все проблемы случатся — это статистика по модели.
        </span>
      </div>
      
      {/* Summary */}
      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryValue}>{totalActive}</span>
          <span style={styles.summaryLabel}>актуально сейчас</span>
        </div>
        <div style={styles.summaryDivider} />
        <div style={styles.summaryItem}>
          <span style={styles.summaryValue}>{categorizedIssues.future.length}</span>
          <span style={styles.summaryLabel}>в будущем</span>
        </div>
        <div style={styles.summaryDivider} />
        <div style={styles.summaryItem}>
          <span style={styles.summaryValue}>{categorizedIssues.passed.length}</span>
          <span style={styles.summaryLabel}>уже прошли</span>
        </div>
      </div>
      
      {/* Sections */}
      <div style={styles.sections}>
        <IssueSection
          title="Актуально сейчас"
          issues={categorizedIssues.active}
          currentMileage={carData.mileage}
          color={colors.critical}
          isOpen={openSections.active}
          onToggle={() => toggleSection('active')}
          onNavigateToDetail={handleNavigateToDetail}
        />
        
        <IssueSection
          title="Скоро станет актуальным"
          issues={categorizedIssues.soon}
          currentMileage={carData.mileage}
          color={colors.warning}
          isOpen={openSections.soon}
          onToggle={() => toggleSection('soon')}
          onNavigateToDetail={handleNavigateToDetail}
        />
        
        <IssueSection
          title="Уже прошли по пробегу"
          issues={categorizedIssues.passed}
          currentMileage={carData.mileage}
          color={colors.success}
          isOpen={openSections.passed}
          onToggle={() => toggleSection('passed')}
          onNavigateToDetail={handleNavigateToDetail}
        />
        
        <IssueSection
          title="В будущем"
          issues={categorizedIssues.future}
          currentMileage={carData.mileage}
          color={colors.textTertiary}
          isOpen={openSections.future}
          onToggle={() => toggleSection('future')}
          onNavigateToDetail={handleNavigateToDetail}
        />
      </div>
      
      {/* Spacer for bottom nav */}
      <div style={{ height: '100px' }} />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: colors.background,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
  },
  
  // Header
  header: {
    padding: '16px 20px',
    background: colors.cardBg,
    borderBottom: `1px solid ${colors.border}`,
  },
  
  headerInfo: {},
  
  headerTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: colors.textPrimary,
    margin: 0,
  },
  
  headerSubtitle: {
    fontSize: '14px',
    color: colors.textSecondary,
    margin: '4px 0 0',
  },
  
  // Intro
  intro: {
    display: 'flex',
    gap: '12px',
    padding: '14px 16px',
    margin: '12px',
    background: colors.primaryLight,
    borderRadius: '12px',
  },
  
  introIcon: {
    fontSize: '18px',
  },
  
  introText: {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  
  // Summary
  summary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '16px',
    margin: '0 12px 12px',
    background: colors.cardBg,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  },
  
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  
  summaryValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  
  summaryLabel: {
    fontSize: '11px',
    color: colors.textTertiary,
  },
  
  summaryDivider: {
    width: '1px',
    height: '32px',
    background: colors.border,
  },
  
  // Sections
  sections: {
    padding: '0 12px',
  },
  
  section: {
    marginBottom: '12px',
  },
  
  sectionHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    background: colors.cardBg,
    border: `1px solid`,
    borderRadius: '12px',
    cursor: 'pointer',
  },
  
  sectionHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  
  sectionDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  sectionCount: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  
  sectionToggle: {
    fontSize: '10px',
    color: colors.textTertiary,
    transition: 'transform 0.2s ease',
  },
  
  sectionContent: {
    marginTop: '8px',
  },
  
  // Issue Card
  issueCard: {
    background: colors.cardBg,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    marginBottom: '8px',
    overflow: 'hidden',
  },
  
  issueHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  
  issueHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  
  severityDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  
  issueHeaderInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  
  issueName: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  issueMeta: {
    fontSize: '12px',
    color: colors.textTertiary,
  },
  
  issueToggle: {
    fontSize: '10px',
    color: colors.textTertiary,
    transition: 'transform 0.2s ease',
  },
  
  issueBody: {
    padding: '0 14px 14px',
    borderTop: `1px solid ${colors.border}`,
  },
  
  // Progress
  progressContainer: {
    marginTop: '14px',
    marginBottom: '14px',
  },
  
  progressBar: {
    position: 'relative',
    height: '8px',
    background: colors.border,
    borderRadius: '4px',
    marginBottom: '6px',
  },
  
  progressZone: {
    position: 'absolute',
    top: 0,
    height: '100%',
    borderRadius: '4px',
  },
  
  progressMarker: {
    position: 'absolute',
    top: '-3px',
    width: '4px',
    height: '14px',
    borderRadius: '2px',
    marginLeft: '-2px',
  },
  
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  progressLabel: {
    fontSize: '10px',
    color: colors.textTertiary,
  },
  
  progressCurrent: {
    fontSize: '11px',
    fontWeight: '500',
  },
  
  issueDescription: {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.5,
    margin: '0 0 14px',
  },
  
  // Quick Metrics
  quickMetrics: {
    display: 'flex',
    gap: '12px',
    marginBottom: '14px',
  },
  
  metricItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: colors.background,
    borderRadius: '8px',
  },
  
  metricIcon: {
    fontSize: '14px',
  },
  
  metricValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  // Urgent Box (вместо "Нельзя ехать")
  urgentBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: colors.warningLight,
    borderRadius: '8px',
    marginBottom: '14px',
  },
  
  urgentIcon: {
    fontSize: '16px',
  },
  
  urgentText: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.warning,
  },
  
  // Detail Button
  detailButton: {
    width: '100%',
    padding: '14px',
    background: colors.primary,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

// Global styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    button:active { opacity: 0.8; }
  `;
  document.head.appendChild(styleSheet);
}
