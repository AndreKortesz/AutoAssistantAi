import React, { useState } from 'react';

// AutoAssistantAi — Dashboard v2
// 5 систем с пиктограммами + «Что снижает индекс» под основным числом

// Цветовая схема
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
  generation: 'I (RB)',
  year: 2015,
  engine: '1.6 (123 л.с.)',
  engineCode: 'G4FC',
  transmission: '6-АКПП',
  mileage: 87000,
  mileageConfidence: 'high', // 'high' | 'medium' | 'low'
  mileageLastUpdated: '2025-01-12', // дата последнего обновления
  
  healthIndex: {
    total: 74,
    trend: +3,
    
    // 5 систем
    systems: {
      engine: { value: 78, label: 'Двигатель' },
      transmission: { value: 82, label: 'Коробка' },
      suspension: { value: 64, label: 'Ходовая' },
      brakes: { value: 45, label: 'Тормоза' },
      body: { value: 71, label: 'Кузов' },
    },
    
    // Что снижает индекс (топ-3)
    issues: [
      { label: 'Тормозная жидкость', impact: -12, system: 'brakes' },
      { label: 'Втулки стабилизатора', impact: -5, system: 'suspension' },
      { label: 'Сколы на капоте', impact: -4, system: 'body' },
    ],
  },
  
  alerts: [
    {
      id: 1,
      type: 'critical',
      title: 'Тормозная жидкость',
      description: 'Не менялась более 4 лет. Гигроскопична — накапливает воду, снижает эффективность торможения.',
      impact: -12,
      action: 'Заменить',
      cost: '1 500 – 2 500 ₽',
    },
    {
      id: 2,
      type: 'warning',
      title: 'Втулки стабилизатора',
      description: 'Типичная болячка Solaris. Ресурс ~60 тыс. км, у вас пробег 87 тыс.',
      impact: -5,
      action: 'Проверить',
      cost: '2 000 – 4 000 ₽',
    },
    {
      id: 3,
      type: 'warning',
      title: 'Сколы ЛКП на капоте',
      description: 'Тонкое ЛКП — особенность модели. Без обработки возможна коррозия.',
      impact: -4,
      action: 'Обработать',
      cost: '500 – 2 000 ₽',
    },
  ],
  
  recentServices: [
    { id: 1, date: '12.01.2025', title: 'Замена масла ДВС', mileage: 85000, cost: 4200 },
    { id: 2, date: '15.11.2024', title: 'Замена свечей', mileage: 82000, cost: 2800 },
  ],
  
  forecast: {
    next12months: 64000,
    required: 28000,
    probable: 24000,
    risks: 12000,
  },
};

// Конфигурация уровня уверенности пробега
const mileageConfidenceConfig = {
  high: { 
    label: 'Точность высокая', 
    color: colors.success,
    icon: '✓',
    description: 'Данные недавно обновлены'
  },
  medium: { 
    label: 'Точность средняя', 
    color: colors.warning,
    icon: '~',
    description: 'Оценка на основе среднего пробега'
  },
  low: { 
    label: 'Требует уточнения', 
    color: colors.textTertiary,
    icon: '?',
    description: 'Давно не обновлялся'
  },
};

// Форматирование пробега с ~
const formatMileage = (mileage, showApprox = true) => {
  const rounded = Math.round(mileage / 1000) * 1000;
  const formatted = rounded.toLocaleString('ru-RU');
  return showApprox ? `~${formatted}` : formatted;
};

// Эмоциональный статус по индексу
const getHealthStatus = (value) => {
  if (value >= 85) return { 
    label: 'отличное состояние', 
    meaning: 'Всё в порядке. Плановых работ минимум.',
    color: colors.success 
  };
  if (value >= 70) return { 
    label: 'хорошее состояние', 
    meaning: 'Можно ездить спокойно. Следите за рекомендациями.',
    color: colors.success 
  };
  if (value >= 50) return { 
    label: 'требует внимания', 
    meaning: 'Есть вопросы, которые лучше не откладывать.',
    color: colors.warning 
  };
  return { 
    label: 'нужен ремонт', 
    meaning: 'Рекомендуем заняться обслуживанием в ближайшее время.',
    color: colors.critical 
  };
};

// Круговой прогресс
const CircularProgress = ({ value, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  const getColor = (val) => {
    if (val >= 70) return colors.success;
    if (val >= 50) return colors.warning;
    return colors.critical;
  };
  
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colors.border}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={getColor(value)}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
};

// Карточка системы — без иконки, только число и название
const SystemCard = ({ systemKey, data }) => {
  const { value, label } = data;
  
  const getColorScheme = (val) => {
    if (val >= 70) return { bg: colors.successLight, text: colors.success, border: colors.successBorder };
    if (val >= 50) return { bg: colors.warningLight, text: colors.warning, border: colors.warningBorder };
    return { bg: colors.criticalLight, text: colors.critical, border: colors.criticalBorder };
  };
  
  const colorScheme = getColorScheme(value);
  
  return (
    <div style={{
      ...styles.systemCard,
      background: colorScheme.bg,
      borderColor: colorScheme.border,
    }}>
      <div style={{ ...styles.systemValue, color: colorScheme.text }}>{value}</div>
      <div style={styles.systemLabel}>{label}</div>
    </div>
  );
};

// Карточка предупреждения
const AlertCard = ({ alert }) => {
  const typeStyles = {
    critical: { bg: colors.criticalLight, border: colors.criticalBorder, dot: colors.critical },
    warning: { bg: colors.warningLight, border: colors.warningBorder, dot: colors.warning },
  };
  
  const style = typeStyles[alert.type];
  
  return (
    <div style={{
      ...styles.alertCard,
      background: style.bg,
      borderColor: style.border,
    }}>
      <div style={styles.alertHeader}>
        <div style={{ ...styles.alertDot, background: style.dot }} />
        <span style={styles.alertTitle}>{alert.title}</span>
        <span style={{ ...styles.alertImpact, color: style.dot }}>{alert.impact}%</span>
      </div>
      <p style={styles.alertDescription}>{alert.description}</p>
      <div style={styles.alertFooter}>
        <span style={styles.alertCost}>{alert.cost}</span>
        <button style={{ ...styles.alertButton, color: style.dot, borderColor: style.dot }}>
          {alert.action}
        </button>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [issuesOpen, setIssuesOpen] = useState(false);
  const { healthIndex } = carData;
  
  // Сортируем системы по значению (проблемные первые)
  const sortedSystems = Object.entries(healthIndex.systems)
    .sort(([, a], [, b]) => a.value - b.value);

  // Общий impact
  const totalImpact = healthIndex.issues.reduce((sum, i) => sum + i.impact, 0);
  
  // Эмоциональный статус
  const status = getHealthStatus(healthIndex.total);
  
  // Конфиг уверенности пробега
  const confidenceConfig = mileageConfidenceConfig[carData.mileageConfidence];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <img src="/logo-aaa.svg" alt="AAA" style={styles.headerLogo} />
        <div style={styles.headerCenter}>
          <div style={styles.carName}>{carData.brand} {carData.model}</div>
          <div style={styles.carDetails}>{carData.engine} • {carData.transmission}</div>
        </div>
        <div style={styles.mileage}>{formatMileage(carData.mileage)} км</div>
      </div>

      {/* Главная карточка — Индекс здоровья */}
      <div style={styles.healthCard}>
        <div style={styles.healthMain}>
          {/* Круговой индикатор */}
          <div style={styles.healthCircleContainer}>
            <CircularProgress value={healthIndex.total} size={100} strokeWidth={7} />
            <div style={styles.healthValueContainer}>
              <div style={styles.healthValue}>{healthIndex.total}</div>
              <div style={styles.healthValueLabel}>из 100</div>
            </div>
          </div>
          
          {/* Инфо справа */}
          <div style={styles.healthInfo}>
            {/* Эмоциональный статус */}
            <div style={{ ...styles.healthStatus, color: status.color }}>
              {status.label}
            </div>
            
            {/* Что это значит */}
            <div style={styles.healthMeaning}>
              {status.meaning}
            </div>
            
            {/* Тренд — человеческим языком */}
            {healthIndex.trend !== 0 && (
              <div style={{
                ...styles.healthTrend,
                color: healthIndex.trend > 0 ? colors.success : colors.critical,
              }}>
                {healthIndex.trend > 0 
                  ? '↑ Состояние улучшилось за месяц' 
                  : '↓ Состояние ухудшилось за месяц'
                }
              </div>
            )}
          </div>
        </div>
        
        {/* Сравнение с другими */}
        <div style={styles.comparison}>
          Лучше, чем у 62% автомобилей с таким же пробегом
        </div>
        
        {/* Индикатор точности пробега */}
        <div style={styles.mileageConfidence}>
          <div style={styles.mileageConfidenceLeft}>
            <span style={{
              ...styles.mileageConfidenceIcon,
              color: confidenceConfig.color,
            }}>
              {confidenceConfig.icon}
            </span>
            <span style={styles.mileageConfidenceText}>
              Пробег {formatMileage(carData.mileage)} км
            </span>
          </div>
          <span style={{
            ...styles.mileageConfidenceLabel,
            color: confidenceConfig.color,
          }}>
            {confidenceConfig.label}
          </span>
        </div>

        {/* Аккордеон «Что снижает» */}
        <div style={styles.issuesAccordion}>
          <button 
            onClick={() => setIssuesOpen(!issuesOpen)}
            style={styles.issuesToggle}
          >
            <div style={styles.issuesToggleLeft}>
              <div style={styles.issuesToggleDot} />
              <span style={styles.issuesToggleText}>Что снижает индекс ({totalImpact}%)</span>
            </div>
            <span style={{
              ...styles.issuesToggleArrow,
              transform: issuesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>
              ▼
            </span>
          </button>
          
          <div style={{
            ...styles.issuesContent,
            maxHeight: issuesOpen ? '250px' : '0',
            opacity: issuesOpen ? 1 : 0,
          }}>
            <div style={styles.issuesList}>
              <div style={styles.issuesHint}>
                Не критично сейчас, но важно запланировать
              </div>
              {healthIndex.issues.map((issue, i) => (
                <div 
                  key={i} 
                  style={{
                    ...styles.issueItem,
                    ...(i === healthIndex.issues.length - 1 ? styles.issueItemLast : {}),
                  }}
                >
                  <span style={styles.issueLabel}>{issue.label}</span>
                  <span style={styles.issueImpact}>{issue.impact}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 5 систем — центрированные */}
        <div style={styles.systemsGrid}>
          {sortedSystems.map(([key, system]) => (
            <SystemCard key={key} systemKey={key} data={system} />
          ))}
        </div>
      </div>

      {/* Предупреждения */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Требует внимания</h2>
          <span style={styles.sectionBadge}>{carData.alerts.length}</span>
        </div>
        
        <div style={styles.alertsList}>
          {carData.alerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </div>

      {/* Прогноз расходов */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Прогноз на 12 месяцев</h2>
        
        <div style={styles.forecastCard}>
          <div style={styles.forecastTotal}>
            <span style={styles.forecastTotalValue}>
              ≈ {carData.forecast.next12months.toLocaleString('ru-RU')} ₽
            </span>
            <span style={styles.forecastTotalLabel}>ожидаемые расходы</span>
          </div>
          
          <div style={styles.forecastBreakdown}>
            <div style={styles.forecastItem}>
              <div style={styles.forecastBar}>
                <div style={{
                  ...styles.forecastBarFill,
                  width: `${(carData.forecast.required / carData.forecast.next12months) * 100}%`,
                  background: colors.primary,
                }} />
              </div>
              <div style={styles.forecastItemInfo}>
                <span style={styles.forecastItemLabel}>Обязательные</span>
                <span style={styles.forecastItemValue}>{carData.forecast.required.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
            
            <div style={styles.forecastItem}>
              <div style={styles.forecastBar}>
                <div style={{
                  ...styles.forecastBarFill,
                  width: `${(carData.forecast.probable / carData.forecast.next12months) * 100}%`,
                  background: colors.warning,
                }} />
              </div>
              <div style={styles.forecastItemInfo}>
                <span style={styles.forecastItemLabel}>Вероятные</span>
                <span style={styles.forecastItemValue}>{carData.forecast.probable.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
            
            <div style={styles.forecastItem}>
              <div style={styles.forecastBar}>
                <div style={{
                  ...styles.forecastBarFill,
                  width: `${(carData.forecast.risks / carData.forecast.next12months) * 100}%`,
                  background: colors.critical,
                }} />
              </div>
              <div style={styles.forecastItemInfo}>
                <span style={styles.forecastItemLabel}>Риски</span>
                <span style={styles.forecastItemValue}>{carData.forecast.risks.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Журнал */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Журнал</h2>
          <button style={styles.sectionLink}>Все записи →</button>
        </div>
        
        <div style={styles.servicesList}>
          {carData.recentServices.map(service => (
            <div key={service.id} style={styles.serviceItem}>
              <div style={styles.serviceIcon}>✓</div>
              <div style={styles.serviceInfo}>
                <div style={styles.serviceTitle}>{service.title}</div>
                <div style={styles.serviceMeta}>
                  {service.date} • {service.mileage.toLocaleString('ru-RU')} км
                </div>
              </div>
              <div style={styles.serviceCost}>{service.cost.toLocaleString('ru-RU')} ₽</div>
            </div>
          ))}
        </div>
        
        <button style={styles.addButton}>+ Добавить запись</button>
      </div>

    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    width: '100%',
    background: colors.background,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
    paddingBottom: '100px',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: colors.cardBg,
    borderBottom: `1px solid ${colors.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },

  headerLogo: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
  },

  headerCenter: {
    textAlign: 'center',
    flex: 1,
    padding: '0 12px',
  },

  carName: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.textPrimary,
  },

  carDetails: {
    fontSize: '12px',
    color: colors.textTertiary,
    marginTop: '1px',
  },

  mileage: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Health Card
  healthCard: {
    margin: '12px',
    padding: '16px',
    background: colors.cardBg,
    borderRadius: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },

  healthMain: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },

  healthCircleContainer: {
    position: 'relative',
    width: '100px',
    height: '100px',
    flexShrink: 0,
  },

  healthValueContainer: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  healthValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 1,
  },

  healthValueLabel: {
    fontSize: '11px',
    color: colors.textTertiary,
    marginTop: '2px',
  },

  healthInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  healthStatus: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px',
    textTransform: 'capitalize',
  },

  healthMeaning: {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.4,
    marginBottom: '8px',
  },

  healthTrend: {
    fontSize: '12px',
    fontWeight: '500',
  },

  comparison: {
    fontSize: '12px',
    color: colors.textSecondary,
    textAlign: 'center',
    padding: '10px 0',
    marginBottom: '8px',
    borderTop: `1px dashed ${colors.border}`,
  },

  mileageConfidence: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: colors.background,
    borderRadius: '10px',
    marginBottom: '12px',
  },

  mileageConfidenceLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  mileageConfidenceIcon: {
    fontSize: '14px',
    fontWeight: '600',
  },

  mileageConfidenceText: {
    fontSize: '13px',
    color: colors.textPrimary,
  },

  mileageConfidenceLabel: {
    fontSize: '11px',
    fontWeight: '500',
  },

  // Аккордеон «Что снижает»
  issuesAccordion: {
    marginBottom: '16px',
  },

  issuesToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '10px 12px',
    background: colors.criticalLight,
    border: `1px solid ${colors.criticalBorder}`,
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  issuesToggleLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  issuesToggleDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: colors.critical,
  },

  issuesToggleText: {
    fontSize: '13px',
    fontWeight: '500',
    color: colors.textPrimary,
  },

  issuesToggleArrow: {
    fontSize: '12px',
    color: colors.textSecondary,
    transition: 'transform 0.2s ease',
  },

  issuesContent: {
    overflow: 'hidden',
    transition: 'all 0.25s ease',
  },

  issuesList: {
    padding: '12px 14px',
    background: 'rgba(220, 38, 38, 0.03)',
    borderRadius: '0 0 10px 10px',
    marginTop: '-1px',
    border: `1px solid ${colors.criticalBorder}`,
    borderTop: 'none',
  },

  issuesHint: {
    fontSize: '12px',
    color: colors.textSecondary,
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: `1px dashed ${colors.border}`,
  },

  issueItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    padding: '6px 0',
    borderBottom: `1px solid ${colors.criticalBorder}`,
  },

  issueItemLast: {
    borderBottom: 'none',
  },

  issueLabel: {
    color: colors.textPrimary,
  },

  issueImpact: {
    color: colors.critical,
    fontWeight: '600',
  },

  // Systems Grid — 5 карточек, 2 колонки
  systemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },

  systemCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '14px 8px',
    borderRadius: '12px',
    border: '1px solid',
    textAlign: 'center',
  },

  systemValue: {
    fontSize: '20px',
    fontWeight: '700',
    lineHeight: 1,
  },

  systemLabel: {
    fontSize: '11px',
    color: colors.textSecondary,
  },

  // Sections
  section: {
    margin: '12px',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },

  sectionTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: colors.textPrimary,
    margin: 0,
  },

  sectionBadge: {
    background: colors.criticalLight,
    color: colors.critical,
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '12px',
  },

  sectionLink: {
    background: 'none',
    border: 'none',
    color: colors.primary,
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },

  // Alerts
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  alertCard: {
    padding: '14px',
    borderRadius: '14px',
    border: '1px solid',
  },

  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },

  alertDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },

  alertTitle: {
    flex: 1,
    fontSize: '15px',
    fontWeight: '600',
    color: colors.textPrimary,
  },

  alertImpact: {
    fontSize: '13px',
    fontWeight: '600',
  },

  alertDescription: {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.5,
    margin: '0 0 12px 0',
  },

  alertFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  alertCost: {
    fontSize: '13px',
    color: colors.textSecondary,
  },

  alertButton: {
    background: 'none',
    border: '1.5px solid',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // Forecast
  forecastCard: {
    padding: '16px',
    background: colors.cardBg,
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },

  forecastTotal: {
    textAlign: 'center',
    marginBottom: '16px',
    paddingBottom: '14px',
    borderBottom: `1px solid ${colors.border}`,
  },

  forecastTotalValue: {
    display: 'block',
    fontSize: '26px',
    fontWeight: '700',
    color: colors.textPrimary,
  },

  forecastTotalLabel: {
    fontSize: '12px',
    color: colors.textTertiary,
  },

  forecastBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  forecastItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  forecastBar: {
    height: '6px',
    background: colors.border,
    borderRadius: '3px',
    overflow: 'hidden',
  },

  forecastBarFill: {
    height: '100%',
    borderRadius: '3px',
  },

  forecastItemInfo: {
    display: 'flex',
    justifyContent: 'space-between',
  },

  forecastItemLabel: {
    fontSize: '12px',
    color: colors.textSecondary,
  },

  forecastItemValue: {
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Services
  servicesList: {
    background: colors.cardBg,
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },

  serviceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderBottom: `1px solid ${colors.border}`,
  },

  serviceIcon: {
    width: '32px',
    height: '32px',
    background: colors.successLight,
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.success,
    fontSize: '14px',
    fontWeight: '600',
  },

  serviceInfo: {
    flex: 1,
  },

  serviceTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: colors.textPrimary,
  },

  serviceMeta: {
    fontSize: '12px',
    color: colors.textTertiary,
    marginTop: '1px',
  },

  serviceCost: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
  },

  addButton: {
    width: '100%',
    padding: '14px',
    marginTop: '10px',
    background: colors.cardBg,
    border: `1.5px dashed ${colors.border}`,
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    color: colors.primary,
    cursor: 'pointer',
  },

  // Bottom Navigation
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    padding: '6px 12px 24px',
    background: colors.cardBg,
    borderTop: `1px solid ${colors.border}`,
  },

  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '8px 14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '12px',
  },

  navItemActive: {
    background: colors.primaryLight,
  },

  navIcon: {
    fontSize: '20px',
  },

  navLabel: {
    fontSize: '10px',
    fontWeight: '500',
    color: colors.textSecondary,
  },
};

// Global styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    button:hover { opacity: 0.9; }
    button:active { transform: scale(0.98); }
  `;
  document.head.appendChild(styleSheet);
}
