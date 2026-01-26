import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// AutoAssistantAi — Детальная страница болячки v2
// С табами Сервис/DIY, чеклистом, отзывами владельцев

const colors = {
  background: '#F7F8FA',
  cardBg: '#FFFFFF',
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

// Пример данных болячки
const defaultIssueData = {
  id: "mustang_6g_ecoboost_fuel_sensor",
  title: "Датчик давления топлива старой ревизии",
  severity: "critical",
  system: "Топливная система",
  
  car: {
    brand: "Ford",
    model: "Mustang",
    generation: "6G (S550)",
    engine: "2.3L EcoBoost",
    years: "2015–2023"
  },
  
  stats: {
    peakMileage: 40000,
    frequencyPercent: 35,
    diyTime: 30
  },
  
  recommendation: {
    title: "Рекомендуем проверить",
    text: "Проверять и менять датчик при покупке б/у, даже если симптомов нет.",
    conditions: [
      "При покупке автомобиля с пробегом",
      "Если появились симптомы из списка ниже"
    ]
  },
  
  consequences: {
    text: "Обеднение смеси может привести к задирам в цилиндрах. Ремонт двигателя: 150 000 – 300 000 ₽"
  },
  
  symptoms: [
    { description: "Плавающие обороты", conditions: "на холостом ходу" },
    { description: "Потеря мощности", conditions: "при разгоне под нагрузкой" },
    { description: "Двигатель глохнет", conditions: "спонтанно" }
  ],
  
  obdCodes: [
    { code: "P008A", description: "Давление топлива слишком низкое" },
    { code: "P0148", description: "Ошибка подачи топлива" },
    { code: "P018C", description: "Показания датчика вне допустимого диапазона" }
  ],
  
  cause: {
    primary: "Датчики первых ревизий имеют конструктивную особенность, из-за которой могут передавать в блок управления заниженные значения давления.",
    notCause: ["Топливный насос", "Форсунки", "Топливный фильтр"]
  },
  
  solutions: {
    service: {
      title: "Замена датчика на актуальную ревизию",
      description: "Мастер заменит датчик давления топлива на версию с исправленной конструкцией. Работа занимает около 20–30 минут.",
      time: "20–30 минут",
      cost: "500 – 1 500 ₽",
      where: "Любой сервис с опытом работы с Ford"
    },
    diy: {
      title: "Самостоятельная замена",
      description: "Датчик расположен в доступном месте перед ТНВД. Замена не требует специального оборудования.",
      difficulty: 2,
      difficultyLabel: "Несложно",
      time: "30–40 минут",
      tools: ["Ключ на 24", "Ключ на 12", "Ветошь", "Ёмкость для топлива"],
      warning: "Если датчик прикипел и не поддаётся — не прилагайте чрезмерных усилий. Есть риск повредить резьбу."
    }
  },
  
  parts: [
    {
      name: "Датчик давления топлива",
      partNumber: "BU5Z-9F972-B",
      revision: "rev.2",
      manufacturer: "Ford / Motorcraft (оригинал)",
      priceMin: 4500,
      priceMax: 6000,
      priceUsd: 55
    }
  ],
  
  reviews: [
    {
      car: "Mustang 2016",
      mileage: "45 000 км",
      status: "Проблема решена",
      text: "Заменил сам за полчаса. Обороты перестали плавать, машина поехала совсем по-другому."
    },
    {
      car: "Mustang 2017",
      mileage: "32 000 км",
      status: "Профилактика",
      text: "Поменял при покупке б/у, хотя симптомов не было. На старом датчике была первая ревизия."
    }
  ],
  
  relatedIssues: [
    { id: "oil_separator", title: "Маслоотделитель картерных газов", severity: "critical" },
    { id: "pcm_update", title: "Версия прошивки блока управления", severity: "critical" },
    { id: "purge_valve", title: "Клапан продувки адсорбера", severity: "high" }
  ],
  
  defectStatus: {
    classActions: [
      { country: "🇺🇸", name: "США", year: 2018, status: "won", result: "Расширение гарантии до 150k миль" }
    ],
    recalls: [
      { country: "🇺🇸", name: "США", code: "19V-287", year: 2019 },
      { country: "🇷🇺", name: "Россия", code: null }
    ]
  }
};

// Компонент секции
const Section = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div style={styles.section}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={styles.sectionHeader}
      >
        <span style={styles.sectionTitle}>
          {icon} {title}
        </span>
        <span style={{
          ...styles.chevron,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>▼</span>
      </button>
      {isOpen && <div style={styles.sectionContent}>{children}</div>}
    </div>
  );
};

// Чип компонент
const Chip = ({ children, variant = 'default' }) => {
  const variants = {
    default: { bg: colors.primaryLight, color: colors.primary },
    error: { bg: colors.criticalLight, color: colors.critical },
    success: { bg: colors.successLight, color: colors.success },
    warning: { bg: colors.warningLight, color: colors.warning }
  };
  const { bg, color } = variants[variant];
  
  return (
    <span style={{ ...styles.chip, background: bg, color }}>
      {children}
    </span>
  );
};

// Чеклист
const Checklist = ({ items: initialItems }) => {
  const [items, setItems] = useState(initialItems.map(item => ({ label: item, checked: false })));
  
  const toggleItem = (index) => {
    setItems(items.map((item, i) => 
      i === index ? { ...item, checked: !item.checked } : item
    ));
  };
  
  return (
    <div style={styles.checklist}>
      <div style={styles.checklistTitle}>📋 Ваш прогресс</div>
      {items.map((item, i) => (
        <div 
          key={i} 
          style={styles.checklistItem}
          onClick={() => toggleItem(i)}
        >
          <div style={{
            ...styles.checkbox,
            background: item.checked ? colors.success : 'transparent',
            borderColor: item.checked ? colors.success : colors.border
          }}>
            {item.checked && '✓'}
          </div>
          <span style={{
            ...styles.checklistLabel,
            textDecoration: item.checked ? 'line-through' : 'none',
            color: item.checked ? colors.textTertiary : colors.textPrimary
          }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function IssueDetailScreen({ issue = defaultIssueData }) {
  const navigate = useNavigate();
  const { issueId } = useParams();
  const [activeTab, setActiveTab] = useState('service');
  
  // TODO: В будущем загружать данные болячки по issueId
  // const issue = issuesDatabase.find(i => i.id === issueId) || defaultIssueData;
  
  const handleBack = () => {
    navigate('/issues');
  };
  
  const severityConfig = {
    critical: { label: 'Критично', color: colors.critical, bg: colors.criticalLight },
    high: { label: 'Важно', color: colors.warning, bg: colors.warningLight },
    medium: { label: 'Средне', color: colors.primary, bg: colors.primaryLight },
    low: { label: 'Низкий', color: colors.success, bg: colors.successLight }
  };
  
  const severity = severityConfig[issue.severity];
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={handleBack}>
          ← Назад
        </button>
        <button style={styles.moreButton}>⋯</button>
      </div>
      
      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroTop}>
          <span style={{
            ...styles.severityBadge,
            color: severity.color,
            background: severity.bg
          }}>
            🔴 {severity.label}
          </span>
          <span style={styles.systemTag}>{issue.system}</span>
        </div>
        
        <h1 style={styles.title}>{issue.title}</h1>
        
        <p style={styles.carInfo}>
          {issue.car.brand} {issue.car.model} {issue.car.generation} • {issue.car.engine} • {issue.car.years}
        </p>
        
        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>~{issue.stats.peakMileage / 1000}K км</span>
            <span style={styles.statLabel}>пик проявления</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statValue, color: colors.warning }}>
              {issue.stats.frequencyPercent}%
            </span>
            <span style={styles.statLabel}>владельцев</span>
          </div>
        </div>
      </div>
      
      {/* Recommendation Box */}
      <div style={styles.recommendationBox}>
        <span style={styles.recommendationIcon}>💡</span>
        <div>
          <span style={styles.recommendationTitle}>{issue.recommendation.title}</span>
          <span style={styles.recommendationText}>{issue.recommendation.text}</span>
        </div>
      </div>
      
      {/* Consequences Box */}
      <div style={styles.consequencesBox}>
        <span style={styles.recommendationIcon}>⚠️</span>
        <div>
          <span style={styles.consequencesTitle}>Что может случиться</span>
          <span style={styles.consequencesText}>{issue.consequences.text}</span>
        </div>
      </div>
      
      {/* Symptoms */}
      <Section title="Симптомы" icon="🔍" defaultOpen={true}>
        {issue.symptoms.map((symptom, i) => (
          <div key={i} style={styles.symptomRow}>
            <span style={styles.symptomBullet}>•</span>
            <span>
              {symptom.description}
              <span style={styles.symptomCondition}> — {symptom.conditions}</span>
            </span>
          </div>
        ))}
      </Section>
      
      {/* OBD Codes */}
      <Section title="Коды ошибок" icon="📟" defaultOpen={true}>
        <div style={styles.codesGrid}>
          {issue.obdCodes.map((code, i) => (
            <div key={i} style={styles.codeCard}>
              <span style={styles.codeValue}>{code.code}</span>
              <span style={styles.codeDesc}>{code.description}</span>
            </div>
          ))}
        </div>
      </Section>
      
      {/* Cause */}
      <Section title="Причина" icon="🎯" defaultOpen={true}>
        <p style={styles.causeText}>{issue.cause.primary}</p>
        <div style={styles.notCauseBox}>
          <span style={styles.notCauseTitle}>❌ Часто путают с:</span>
          <div>
            {issue.cause.notCause.map((item, i) => (
              <Chip key={i} variant="error">{item}</Chip>
            ))}
          </div>
        </div>
      </Section>
      
      {/* Solution with Tabs */}
      <Section title="Решение" icon="✅" defaultOpen={true}>
        {/* Tabs */}
        <div style={styles.solutionTabs}>
          <button 
            style={{
              ...styles.solutionTab,
              ...(activeTab === 'service' ? styles.solutionTabActive : {})
            }}
            onClick={() => setActiveTab('service')}
          >
            🔧 В сервисе
            <span style={styles.solutionTabHint}>рекомендуем</span>
          </button>
          <button 
            style={{
              ...styles.solutionTab,
              ...(activeTab === 'diy' ? styles.solutionTabActive : {})
            }}
            onClick={() => setActiveTab('diy')}
          >
            🛠 Своими руками
            <span style={styles.solutionTabHint}>для опытных</span>
          </button>
        </div>
        
        {/* Service Tab Content */}
        {activeTab === 'service' && (
          <div style={styles.solutionCard}>
            <div style={styles.solutionHeader}>
              <span style={styles.solutionTitle}>{issue.solutions.service.title}</span>
            </div>
            <p style={styles.solutionDesc}>{issue.solutions.service.description}</p>
            <div style={styles.solutionMeta}>
              <div style={styles.solutionMetaItem}>
                <span>⏱</span>
                <span>{issue.solutions.service.time} работы</span>
              </div>
              <div style={styles.solutionMetaItem}>
                <span>💰</span>
                <span>{issue.solutions.service.cost} за работу</span>
              </div>
              <div style={styles.solutionMetaItem}>
                <span>📍</span>
                <span>{issue.solutions.service.where}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* DIY Tab Content */}
        {activeTab === 'diy' && (
          <>
            <div style={styles.solutionCard}>
              <div style={styles.solutionHeader}>
                <span style={styles.solutionTitle}>{issue.solutions.diy.title}</span>
                <Chip variant="success">👍 {issue.solutions.diy.difficultyLabel}</Chip>
              </div>
              <p style={styles.solutionDesc}>{issue.solutions.diy.description}</p>
              <div style={styles.solutionMeta}>
                <div style={styles.solutionMetaItem}>
                  <span>⏱</span>
                  <span>{issue.solutions.diy.time}</span>
                </div>
                <div style={styles.solutionMetaItem}>
                  <span>📊</span>
                  <span>Сложность: {issue.solutions.diy.difficulty} из 5</span>
                </div>
              </div>
              <div style={styles.toolsList}>
                <div style={styles.toolsTitle}>🔧 Понадобятся:</div>
                <div style={styles.toolsItems}>
                  {issue.solutions.diy.tools.map((tool, i) => (
                    <span key={i} style={styles.toolChip}>{tool}</span>
                  ))}
                </div>
              </div>
            </div>
            
            {issue.solutions.diy.warning && (
              <div style={styles.diyWarning}>
                <span>⚠️</span>
                <span style={styles.diyWarningText}>{issue.solutions.diy.warning}</span>
              </div>
            )}
          </>
        )}
        
        {/* Progress Checklist */}
        <Checklist items={["Купить запчасть", "Заменить датчик", "Проверить — ошибок нет"]} />
      </Section>
      
      {/* Parts */}
      <Section title="Запчасти" icon="🔩" defaultOpen={true}>
        {issue.parts.map((part, i) => (
          <div key={i} style={styles.partCard}>
            <div style={styles.partHeader}>
              <span style={styles.partName}>{part.name}</span>
              <span style={styles.partRevision}>{part.revision}</span>
            </div>
            <div style={styles.partNumber}>
              <span style={styles.partNumberLabel}>Артикул:</span>
              <span style={styles.partNumberValue}>{part.partNumber}</span>
              <button 
                style={styles.copyButton}
                onClick={() => navigator.clipboard.writeText(part.partNumber)}
              >
                📋
              </button>
            </div>
            <div style={styles.partManufacturer}>{part.manufacturer}</div>
            <div style={styles.partPrice}>
              <span style={styles.priceRange}>
                {part.priceMin.toLocaleString()} – {part.priceMax.toLocaleString()} ₽
              </span>
              <span style={styles.priceUsd}>(~${part.priceUsd} в США)</span>
            </div>
          </div>
        ))}
        
        {/* CTA Buttons */}
        <div style={styles.ctaButtons}>
          <button style={styles.ctaPrimary}>🛒 Купить запчасть</button>
          <button style={styles.ctaSecondary}>📍 Найти сервис</button>
        </div>
      </Section>
      
      {/* Reviews */}
      <Section title="Отзывы владельцев" icon="💬" defaultOpen={true}>
        {issue.reviews.map((review, i) => (
          <div key={i} style={styles.reviewCard}>
            <div style={styles.reviewHeader}>
              <span style={styles.reviewMeta}>{review.car} • {review.mileage}</span>
              <span style={styles.reviewStatus}>✓ {review.status}</span>
            </div>
            <p style={styles.reviewText}>{review.text}</p>
          </div>
        ))}
      </Section>
      
      {/* Defect Status */}
      {issue.defectStatus && (
        <Section title="Статус дефекта" icon="⚖️" defaultOpen={false}>
          {issue.defectStatus.classActions?.length > 0 && (
            <div style={styles.statusBlock}>
              <div style={styles.statusBlockTitle}>Коллективные иски</div>
              {issue.defectStatus.classActions.map((action, i) => (
                <div key={i} style={styles.statusItem}>
                  <span style={styles.statusFlag}>{action.country}</span>
                  <div style={styles.statusInfo}>
                    <div style={styles.statusName}>{action.name} ({action.year})</div>
                    <div style={styles.statusResult}>{action.result}</div>
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    background: action.status === 'won' ? colors.successLight : colors.warningLight,
                    color: action.status === 'won' ? colors.success : colors.warning
                  }}>
                    {action.status === 'won' ? '✓ Выигран' : '⏳ В процессе'}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {issue.defectStatus.recalls?.length > 0 && (
            <div style={styles.statusBlock}>
              <div style={styles.statusBlockTitle}>Отзывные кампании</div>
              {issue.defectStatus.recalls.map((recall, i) => (
                <div key={i} style={styles.recallItem}>
                  <span style={styles.statusFlag}>{recall.country}</span>
                  <span style={styles.recallName}>{recall.name}</span>
                  <span style={styles.recallCode}>
                    {recall.code ? `${recall.code} (${recall.year})` : 'не проводилась'}
                  </span>
                  <span>{recall.code ? '✅' : '❌'}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* VIN Prompt */}
          <div style={styles.vinPrompt}>
            <div style={styles.vinPromptHeader}>
              <span style={styles.vinPromptIcon}>💡</span>
              <span style={styles.vinPromptTitle}>Хотите узнать больше?</span>
            </div>
            <p style={styles.vinPromptText}>
              Введите VIN — проверим, попадает ли ваше авто под отзывную кампанию.
            </p>
            <button style={styles.vinPromptButton}>Ввести VIN</button>
          </div>
        </Section>
      )}
      
      {/* Related Issues */}
      <Section title="Проверить заодно" icon="🔗" defaultOpen={false}>
        <p style={styles.relatedHint}>Эти узлы часто требуют внимания на том же пробеге:</p>
        {issue.relatedIssues.map((related, i) => (
          <div key={i} style={styles.relatedIssue}>
            <span style={{
              ...styles.relatedSeverity,
              background: severityConfig[related.severity].bg,
              color: severityConfig[related.severity].color
            }}>
              {related.severity === 'critical' ? '🔴' : '🟠'}
            </span>
            <span style={styles.relatedTitle}>{related.title}</span>
            <span style={styles.relatedArrow}>→</span>
          </div>
        ))}
      </Section>
      
      {/* Add to Journal Button */}
      <div style={{ padding: '0 20px 20px' }}>
        <button style={styles.journalButton}>
          📝 Добавить в журнал обслуживания
        </button>
      </div>
      
      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerTitle}>Источники информации</div>
        <div style={styles.footerText}>
          Данные собраны на основе анализа отзывов владельцев, технических бюллетеней и рекомендаций профильных сообществ.
        </div>
      </div>
      
      <div style={{ height: '100px' }} />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: colors.background,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: colors.cardBg,
    borderBottom: `1px solid ${colors.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: colors.primary,
    fontWeight: '500',
    cursor: 'pointer',
  },
  
  moreButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
  },
  
  hero: {
    padding: '20px',
    background: colors.cardBg,
    marginBottom: '8px',
  },
  
  heroTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  
  severityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  
  systemTag: {
    fontSize: '13px',
    color: colors.textSecondary,
  },
  
  title: {
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    lineHeight: 1.3,
  },
  
  carInfo: {
    fontSize: '14px',
    color: colors.textSecondary,
    margin: '0 0 16px 0',
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  
  statCard: {
    padding: '14px',
    background: colors.background,
    borderRadius: '12px',
    textAlign: 'center',
  },
  
  statValue: {
    fontSize: '18px',
    fontWeight: '700',
    display: 'block',
    marginBottom: '4px',
  },
  
  statLabel: {
    fontSize: '12px',
    color: colors.textTertiary,
  },
  
  recommendationBox: {
    display: 'flex',
    gap: '12px',
    padding: '16px 20px',
    background: colors.primaryLight,
    borderLeft: `4px solid ${colors.primary}`,
    marginBottom: '8px',
  },
  
  recommendationIcon: {
    fontSize: '20px',
  },
  
  recommendationTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.primary,
    display: 'block',
    marginBottom: '4px',
  },
  
  recommendationText: {
    fontSize: '14px',
    color: colors.textPrimary,
    lineHeight: 1.5,
  },
  
  consequencesBox: {
    display: 'flex',
    gap: '12px',
    padding: '16px 20px',
    background: colors.criticalLight,
    borderLeft: `4px solid ${colors.critical}`,
    marginBottom: '8px',
  },
  
  consequencesTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.critical,
    display: 'block',
    marginBottom: '4px',
  },
  
  consequencesText: {
    fontSize: '14px',
    color: colors.textPrimary,
  },
  
  section: {
    background: colors.cardBg,
    marginBottom: '8px',
  },
  
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '16px 20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  chevron: {
    fontSize: '12px',
    color: colors.textTertiary,
    transition: 'transform 0.2s ease',
  },
  
  sectionContent: {
    padding: '0 20px 20px',
  },
  
  symptomRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    fontSize: '15px',
  },
  
  symptomBullet: {
    color: colors.primary,
    fontWeight: '700',
  },
  
  symptomCondition: {
    color: colors.textSecondary,
  },
  
  codesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  
  codeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: colors.background,
    borderRadius: '8px',
  },
  
  codeValue: {
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: '700',
    color: colors.critical,
    background: colors.criticalLight,
    padding: '4px 8px',
    borderRadius: '4px',
  },
  
  codeDesc: {
    fontSize: '14px',
    color: colors.textSecondary,
  },
  
  causeText: {
    fontSize: '15px',
    lineHeight: 1.6,
    marginBottom: '16px',
  },
  
  notCauseBox: {
    padding: '12px',
    background: colors.criticalLight,
    borderRadius: '8px',
  },
  
  notCauseTitle: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: colors.critical,
    marginBottom: '8px',
  },
  
  chip: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    marginRight: '6px',
    marginBottom: '6px',
  },
  
  solutionTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  
  solutionTab: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    border: `2px solid ${colors.border}`,
    borderRadius: '10px',
    background: colors.cardBg,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease',
  },
  
  solutionTabActive: {
    borderColor: colors.primary,
    background: colors.primaryLight,
    color: colors.primary,
  },
  
  solutionTabHint: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '400',
    color: colors.textTertiary,
    marginTop: '2px',
  },
  
  solutionCard: {
    padding: '16px',
    background: colors.successLight,
    borderRadius: '12px',
    marginBottom: '12px',
  },
  
  solutionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  
  solutionTitle: {
    fontSize: '16px',
    fontWeight: '600',
  },
  
  solutionDesc: {
    fontSize: '14px',
    color: colors.textSecondary,
    marginBottom: '12px',
  },
  
  solutionMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  
  solutionMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: colors.textSecondary,
  },
  
  toolsList: {
    marginTop: '12px',
    padding: '12px',
    background: colors.cardBg,
    borderRadius: '8px',
  },
  
  toolsTitle: {
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  
  toolsItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  
  toolChip: {
    display: 'inline-block',
    padding: '4px 10px',
    background: colors.background,
    borderRadius: '6px',
    fontSize: '13px',
  },
  
  diyWarning: {
    display: 'flex',
    gap: '10px',
    padding: '12px',
    background: colors.warningLight,
    borderRadius: '8px',
    marginBottom: '16px',
  },
  
  diyWarningText: {
    fontSize: '13px',
    color: colors.textPrimary,
    lineHeight: 1.5,
  },
  
  checklist: {
    padding: '16px',
    background: colors.primaryLight,
    borderRadius: '12px',
  },
  
  checklistTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  
  checklistItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    cursor: 'pointer',
  },
  
  checkbox: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    border: `2px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '700',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  
  checklistLabel: {
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  
  partCard: {
    padding: '16px',
    background: colors.background,
    borderRadius: '12px',
    marginBottom: '12px',
  },
  
  partHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  
  partName: {
    fontSize: '15px',
    fontWeight: '600',
  },
  
  partRevision: {
    fontSize: '12px',
    color: colors.success,
    background: colors.successLight,
    padding: '2px 8px',
    borderRadius: '4px',
  },
  
  partNumber: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  
  partNumberLabel: {
    fontSize: '13px',
    color: colors.textTertiary,
  },
  
  partNumberValue: {
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: '600',
  },
  
  copyButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  
  partManufacturer: {
    fontSize: '13px',
    color: colors.textSecondary,
    marginBottom: '8px',
  },
  
  partPrice: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  
  priceRange: {
    fontSize: '16px',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  
  priceUsd: {
    fontSize: '13px',
    color: colors.textTertiary,
  },
  
  ctaButtons: {
    display: 'flex',
    gap: '10px',
  },
  
  ctaPrimary: {
    flex: 1,
    padding: '14px',
    background: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  
  ctaSecondary: {
    flex: 1,
    padding: '14px',
    background: colors.primaryLight,
    color: colors.primary,
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  
  reviewCard: {
    padding: '14px',
    background: colors.background,
    borderRadius: '10px',
    marginBottom: '10px',
  },
  
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  
  reviewMeta: {
    fontSize: '13px',
    color: colors.textTertiary,
  },
  
  reviewStatus: {
    fontSize: '12px',
    color: colors.success,
  },
  
  reviewText: {
    fontSize: '14px',
    lineHeight: 1.5,
    margin: 0,
  },
  
  statusBlock: {
    marginBottom: '16px',
  },
  
  statusBlockTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: colors.background,
    borderRadius: '10px',
    marginBottom: '8px',
  },
  
  statusFlag: {
    fontSize: '24px',
  },
  
  statusInfo: {
    flex: 1,
  },
  
  statusName: {
    fontSize: '14px',
    fontWeight: '600',
  },
  
  statusResult: {
    fontSize: '12px',
    color: colors.textSecondary,
  },
  
  statusBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  
  recallItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: colors.background,
    borderRadius: '8px',
    marginBottom: '6px',
  },
  
  recallName: {
    fontSize: '14px',
    fontWeight: '500',
    flex: 1,
  },
  
  recallCode: {
    fontSize: '12px',
    color: colors.textSecondary,
  },
  
  vinPrompt: {
    marginTop: '16px',
    padding: '16px',
    background: `linear-gradient(135deg, ${colors.primaryLight} 0%, rgba(31, 79, 216, 0.12) 100%)`,
    borderRadius: '12px',
    border: `1px dashed ${colors.primary}`,
  },
  
  vinPromptHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  
  vinPromptIcon: {
    fontSize: '18px',
  },
  
  vinPromptTitle: {
    fontSize: '14px',
    fontWeight: '700',
  },
  
  vinPromptText: {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.5,
    margin: '0 0 12px 0',
  },
  
  vinPromptButton: {
    width: '100%',
    padding: '12px',
    background: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  
  relatedHint: {
    fontSize: '13px',
    color: colors.textSecondary,
    marginBottom: '12px',
  },
  
  relatedIssue: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: colors.background,
    borderRadius: '10px',
    marginBottom: '8px',
    cursor: 'pointer',
  },
  
  relatedSeverity: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
  },
  
  relatedTitle: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '500',
  },
  
  relatedArrow: {
    color: colors.textTertiary,
  },
  
  journalButton: {
    width: '100%',
    padding: '16px',
    background: colors.cardBg,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  
  footer: {
    padding: '20px',
    background: colors.background,
  },
  
  footerTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  
  footerText: {
    fontSize: '12px',
    color: colors.textTertiary,
    lineHeight: 1.5,
  },
};
