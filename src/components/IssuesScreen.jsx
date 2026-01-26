import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// AutoAssistantAi — Экран болячек
// Группировка по актуальности относительно текущего пробега

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
  year: 2015,
  engine: '1.6 (123 л.с.)',
  engineCode: 'G4FC',
  transmission: '6-АКПП',
  mileage: 87000,
  mileageConfidence: 'high',
};

// Форматирование пробега с ~
const formatMileage = (mileage) => {
  const rounded = Math.round(mileage / 1000) * 1000;
  return `~${rounded.toLocaleString('ru-RU')}`;
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
    description: "Конструктивный недостаток — большой зазор между упором и стопором. Пластиковые втулки быстро изнашиваются.",
    symptoms: ["Стук при вращении руля", "Люфт в рулевом"],
    solution: "Установка ремкомплекта рейки.",
    costMin: 3000,
    costMax: 15000,
    canDrive: true,
    ignoreRisk: "Ускоренный износ рейки, дорогой ремонт",
    // Статус дефекта (опционально)
    defectStatus: {
      classActions: [
        { country: "🇰🇷", name: "Корея", year: 2017, status: "won", result: "Бесплатная замена" },
      ],
      recalls: [
        { country: "🇰🇷", name: "Корея", code: "HR-2017-042", year: 2017 },
        { country: "🇷🇺", name: "Россия", code: null },
      ],
    },
  },
  {
    id: "solaris_wheel_bearings",
    name: "Износ ступичных подшипников",
    category: "Ходовая",
    mileageStart: 15000,
    mileageEnd: 70000,
    probability: 35,
    severity: "medium",
    description: "Передние ступичные подшипники изнашиваются раньше срока.",
    symptoms: ["Гул при движении", "Гул усиливается в поворотах"],
    solution: "Замена подшипников. Рекомендуют SKF вместо оригинала.",
    costMin: 2500,
    costMax: 8000,
    canDrive: true,
    ignoreRisk: "Заклинивание колеса на ходу",
  },
  {
    id: "solaris_gearbox_bearing",
    name: "Подшипник первичного вала КПП",
    category: "Коробка",
    mileageStart: 60000,
    mileageEnd: 120000,
    probability: 25,
    severity: "high",
    description: "Скрежет при переключении передач. Подшипник первичного вала изнашивается.",
    symptoms: ["Скрежет при переключении", "Шум на нейтрали"],
    solution: "Замена подшипника, в запущенных случаях — замена корпуса КПП.",
    costMin: 15000,
    costMax: 45000,
    canDrive: true,
    ignoreRisk: "Разрушение КПП, ремонт до 100 000 ₽",
    defectStatus: {
      classActions: [
        { country: "🇺🇸", name: "США", year: 2018, status: "won", result: "Расширение гарантии до 150k миль" },
        { country: "🇦🇺", name: "Австралия", year: 2019, status: "settlement", result: "Компенсация AUD $800–1,500" },
      ],
      recalls: [
        { country: "🇺🇸", name: "США", code: "19V-287", year: 2019 },
        { country: "🇷🇺", name: "Россия", code: null },
      ],
    },
  },
  {
    id: "solaris_clutch_seal",
    name: "Сальник первичного вала КПП",
    category: "Коробка",
    mileageStart: 80000,
    mileageEnd: 150000,
    probability: 30,
    severity: "medium",
    description: "Течь сальника замасливает маховик и диск сцепления.",
    symptoms: ["Масляные подтеки под КПП", "Пробуксовка сцепления"],
    solution: "Замена сальника и диска сцепления при необходимости.",
    costMin: 8000,
    costMax: 25000,
    canDrive: true,
    ignoreRisk: "Полная замена сцепления",
  },
  {
    id: "solaris_paint",
    name: "Слабое ЛКП",
    category: "Кузов",
    mileageStart: 30000,
    mileageEnd: 100000,
    probability: 50,
    severity: "low",
    description: "Тонкое лакокрасочное покрытие. Сколы появляются быстро.",
    symptoms: ["Сколы на капоте", "Ржавчина в местах сколов"],
    solution: "Антикоррозийная обработка, подкраска сколов.",
    costMin: 2000,
    costMax: 15000,
    canDrive: true,
    ignoreRisk: "Коррозия кузова",
  },
  {
    id: "solaris_rear_suspension",
    name: "Мягкая задняя подвеска",
    category: "Ходовая",
    mileageStart: 40000,
    mileageEnd: 80000,
    probability: 40,
    severity: "low",
    description: "Задние стойки и пружины слишком мягкие, машина раскачивается.",
    symptoms: ["Раскачка кормы", "Пробои подвески"],
    solution: "Замена на усиленные амортизаторы и пружины.",
    costMin: 8000,
    costMax: 20000,
    canDrive: true,
    ignoreRisk: "Ухудшение управляемости",
  },
  {
    id: "solaris_timing_chain",
    name: "Растяжение цепи ГРМ",
    category: "Двигатель",
    mileageStart: 120000,
    mileageEnd: 180000,
    probability: 60,
    severity: "critical",
    description: "Цепь ГРМ на моторах Gamma растягивается и требует замены.",
    symptoms: ["Дизельный звук на холодную", "Ошибка по фазам"],
    solution: "Замена цепи, натяжителя, успокоителей.",
    costMin: 15000,
    costMax: 35000,
    canDrive: false,
    ignoreRisk: "Перескок цепи, загиб клапанов — ремонт 80-150 тыс.",
    defectStatus: {
      classActions: [],
      recalls: [
        { country: "🇰🇷", name: "Корея", code: "2015-HMC-017", year: 2015 },
        { country: "🇺🇸", name: "США", code: "17V-089", year: 2017 },
        { country: "🇷🇺", name: "Россия", code: null },
      ],
    },
  },
  {
    id: "solaris_stabilizer_links",
    name: "Стойки стабилизатора",
    category: "Ходовая",
    mileageStart: 50000,
    mileageEnd: 90000,
    probability: 70,
    severity: "low",
    description: "Расходник, изнашивается быстрее на плохих дорогах.",
    symptoms: ["Стук на мелких неровностях", "Стук при повороте руля стоя"],
    solution: "Замена стоек стабилизатора. Недорогой ремонт.",
    costMin: 2000,
    costMax: 5000,
    canDrive: true,
    ignoreRisk: "Ухудшение управляемости в поворотах",
  },
];

// Группировка болячек по актуальности
const categorizeIssues = (issues, currentMileage) => {
  const SOON_THRESHOLD = 15000; // "Скоро" — если до начала < 15000 км
  
  const active = [];    // Пробег внутри диапазона
  const soon = [];      // До начала осталось < 15000 км
  const passed = [];    // Пробег уже выше конца диапазона
  const future = [];    // Далеко в будущем
  
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
  
  // Сортируем по severity
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
  // Расширяем диапазон для визуализации
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
        {/* Зона риска */}
        <div style={{
          ...styles.progressZone,
          left: `${startPercent}%`,
          width: `${endPercent - startPercent}%`,
          background: isPassed ? colors.successLight : colors.criticalLight,
        }} />
        {/* Текущая позиция */}
        <div style={{
          ...styles.progressMarker,
          left: `${currentPercent}%`,
          background: isInRange ? colors.critical : isPassed ? colors.success : colors.primary,
        }} />
      </div>
      <div style={styles.progressLabels}>
        <span style={styles.progressLabel}>{(start / 1000).toFixed(0)} тыс</span>
        <span style={{
          ...styles.progressCurrent,
          color: isInRange ? colors.critical : colors.textPrimary,
        }}>
          ~{(current / 1000).toFixed(0)} тыс
        </span>
        <span style={styles.progressLabel}>{(end / 1000).toFixed(0)} тыс</span>
      </div>
    </div>
  );
};

// Проверка наличия исков/отзывных
const hasClassActions = (issue) => issue.defectStatus?.classActions?.length > 0;
const hasRecalls = (issue) => issue.defectStatus?.recalls?.some(r => r.code !== null);

// Блок статуса дефекта (иски и отзывные)
const DefectStatusBlock = ({ defectStatus }) => {
  if (!defectStatus) return null;
  
  const { classActions = [], recalls = [] } = defectStatus;
  const hasActions = classActions.length > 0;
  const hasValidRecalls = recalls.some(r => r.code !== null);
  
  if (!hasActions && !hasValidRecalls) return null;
  
  const statusStyles = {
    won: { bg: colors.successLight, color: colors.success, label: '✓ Выигран' },
    settlement: { bg: colors.warningLight, color: colors.warning, label: '🤝 Соглашение' },
    lost: { bg: colors.criticalLight, color: colors.critical, label: '✗ Проигран' },
  };
  
  return (
    <div style={defectStatusStyles.container}>
      {/* Коллективные иски */}
      {hasActions && (
        <div style={defectStatusStyles.block}>
          <div style={defectStatusStyles.blockHeader}>
            <span style={defectStatusStyles.blockIcon}>⚖️</span>
            <span style={defectStatusStyles.blockTitle}>Коллективные иски</span>
          </div>
          {classActions.map((action, i) => (
            <div key={i} style={defectStatusStyles.item}>
              <div style={defectStatusStyles.itemLeft}>
                <span style={defectStatusStyles.flag}>{action.country}</span>
                <div style={defectStatusStyles.itemInfo}>
                  <div style={defectStatusStyles.itemName}>{action.name} ({action.year})</div>
                  <div style={defectStatusStyles.itemResult}>{action.result}</div>
                </div>
              </div>
              <span style={{
                ...defectStatusStyles.statusBadge,
                background: statusStyles[action.status].bg,
                color: statusStyles[action.status].color,
              }}>
                {statusStyles[action.status].label}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Отзывные кампании */}
      {hasValidRecalls && (
        <div style={defectStatusStyles.block}>
          <div style={defectStatusStyles.blockHeader}>
            <span style={defectStatusStyles.blockIcon}>📋</span>
            <span style={defectStatusStyles.blockTitle}>Отзывные кампании</span>
          </div>
          {recalls.map((recall, i) => (
            <div key={i} style={defectStatusStyles.recallItem}>
              <span style={defectStatusStyles.flag}>{recall.country}</span>
              <span style={defectStatusStyles.recallName}>{recall.name}</span>
              <span style={defectStatusStyles.recallCode}>
                {recall.code ? `${recall.code} (${recall.year})` : 'не проводилась'}
              </span>
              <span style={defectStatusStyles.recallStatus}>
                {recall.code ? '✅' : '❌'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Стили для блока статуса дефекта
const defectStatusStyles = {
  container: {
    marginBottom: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  block: {
    background: colors.primaryLight,
    borderRadius: '10px',
    padding: '12px',
  },
  blockHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '10px',
  },
  blockIcon: {
    fontSize: '14px',
  },
  blockTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    background: colors.cardBg,
    borderRadius: '8px',
    marginBottom: '6px',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  flag: {
    fontSize: '18px',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  itemName: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemResult: {
    fontSize: '11px',
    color: colors.textSecondary,
  },
  statusBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  recallItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    background: colors.cardBg,
    borderRadius: '8px',
    marginBottom: '4px',
  },
  recallName: {
    fontSize: '13px',
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  recallCode: {
    fontSize: '11px',
    color: colors.textSecondary,
  },
  recallStatus: {
    fontSize: '14px',
  },
};

// Карточка болячки
const IssueCard = ({ issue, currentMileage, status, onNavigateToDetail }) => {
  const [expanded, setExpanded] = useState(false);
  
  const severityConfig = {
    critical: { color: colors.critical, label: 'Критично', bg: colors.criticalLight },
    high: { color: colors.critical, label: 'Важно', bg: colors.criticalLight },
    medium: { color: colors.warning, label: 'Средне', bg: colors.warningLight },
    low: { color: colors.textSecondary, label: 'Низкий', bg: colors.primaryLight },
  };
  
  const config = severityConfig[issue.severity];
  
  return (
    <div style={styles.issueCard}>
      <button 
        onClick={() => setExpanded(!expanded)}
        style={styles.issueHeader}
      >
        <div style={styles.issueHeaderLeft}>
          <div style={{ ...styles.severityDot, background: config.color }} />
          <div style={styles.issueHeaderText}>
            <div style={styles.issueName}>{issue.name}</div>
            <div style={styles.issueCategory}>{issue.category} • {issue.probability}% авто</div>
          </div>
        </div>
        <div style={styles.issueHeaderRight}>
          {/* Иконки статуса */}
          {(hasClassActions(issue) || hasRecalls(issue)) && (
            <div style={styles.statusIcons}>
              {hasClassActions(issue) && (
                <span style={styles.statusIcon} title="Есть выигранные иски">⚖️</span>
              )}
              {hasRecalls(issue) && (
                <span style={styles.statusIcon} title="Есть отзывные кампании">📋</span>
              )}
            </div>
          )}
          <span style={{
            ...styles.issueToggle,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>▼</span>
        </div>
      </button>
      
      {expanded && (
        <div style={styles.issueBody}>
          {/* Блок статуса дефекта (иски, отзывные) */}
          <DefectStatusBlock defectStatus={issue.defectStatus} />
          
          {/* Прогресс-бар пробега */}
          {status !== 'passed' && (
            <MileageProgress 
              current={currentMileage} 
              start={issue.mileageStart} 
              end={issue.mileageEnd} 
            />
          )}
          
          {/* Описание */}
          <p style={styles.issueDescription}>{issue.description}</p>
          
          {/* Симптомы */}
          <div style={styles.issueSection}>
            <div style={styles.issueSectionTitle}>Как распознать:</div>
            <div style={styles.symptomsList}>
              {issue.symptoms.map((symptom, i) => (
                <span key={i} style={styles.symptomTag}>{symptom}</span>
              ))}
            </div>
          </div>
          
          {/* Решение */}
          <div style={styles.issueSection}>
            <div style={styles.issueSectionTitle}>Что делать:</div>
            <p style={styles.issueSectionText}>{issue.solution}</p>
          </div>
          
          {/* Стоимость и предупреждение */}
          <div style={styles.issueFooter}>
            <div style={styles.issueCost}>
              {issue.costMin.toLocaleString('ru-RU')} – {issue.costMax.toLocaleString('ru-RU')} ₽
            </div>
            {!issue.canDrive && (
              <div style={styles.issueWarning}>⛔ Нельзя ехать</div>
            )}
          </div>
          
          {/* Риск игнорирования */}
          {issue.ignoreRisk && (
            <div style={styles.ignoreRisk}>
              <span style={styles.ignoreRiskLabel}>Если игнорировать:</span>
              <span style={styles.ignoreRiskText}>{issue.ignoreRisk}</span>
            </div>
          )}
          
          {/* Кнопки действий */}
          <div style={styles.actionButtons}>
            <button 
              style={styles.actionButtonPrimary}
              onClick={() => onNavigateToDetail(issue.id)}
            >
              <span>Подробнее →</span>
            </button>
            <div style={styles.actionButtonsRow}>
              <button style={styles.actionButtonSecondary}>
                <span style={styles.actionButtonIcon}>🔧</span>
                <span>В сервис</span>
              </button>
              <button style={styles.actionButtonSecondary}>
                <span style={styles.actionButtonIcon}>🛒</span>
                <span>Запчасти</span>
              </button>
            </div>
          </div>
          
          {/* VIN промпт — показываем только если есть defectStatus */}
          {issue.defectStatus && (
            <div style={styles.vinPrompt}>
              <div style={styles.vinPromptHeader}>
                <span style={styles.vinPromptIcon}>💡</span>
                <span style={styles.vinPromptTitle}>Хотите узнать больше?</span>
              </div>
              <p style={styles.vinPromptText}>
                Введите VIN — проверим, попадает ли ваше авто под отзывную кампанию и какие у вас права.
              </p>
              <button style={styles.vinPromptButton}>
                Ввести VIN
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Секция с болячками
const IssueSection = ({ title, hint, issues, currentMileage, status, color, defaultOpen = false, onNavigateToDetail }) => {
  const [open, setOpen] = useState(defaultOpen);
  
  if (issues.length === 0) return null;
  
  return (
    <div style={styles.section}>
      <button 
        onClick={() => setOpen(!open)}
        style={{
          ...styles.sectionHeader,
          borderColor: color,
          background: `${color}10`,
        }}
      >
        <div style={styles.sectionHeaderLeft}>
          <div style={{ ...styles.sectionDot, background: color }} />
          <span style={styles.sectionTitle}>{title}</span>
          <span style={styles.sectionCount}>{issues.length}</span>
        </div>
        <span style={{
          ...styles.sectionArrow,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>▼</span>
      </button>
      
      {open && (
        <div style={styles.sectionContent}>
          {hint && <div style={styles.sectionHint}>{hint}</div>}
          {issues.map(issue => (
            <IssueCard 
              key={issue.id} 
              issue={issue} 
              currentMileage={currentMileage}
              status={status}
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
  
  const categorized = useMemo(() => 
    categorizeIssues(issuesDatabase, carData.mileage),
    [carData.mileage]
  );

  const handleNavigateToDetail = (issueId) => {
    navigate(`/issues/${issueId}`);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton}>←</button>
        <div style={styles.headerCenter}>
          <div style={styles.headerTitle}>Болячки {carData.brand} {carData.model}</div>
          <div style={styles.headerSubtitle}>{carData.engine} • {formatMileage(carData.mileage)} км</div>
        </div>
        <div style={styles.headerRight} />
      </div>

      {/* Контент */}
      <div style={styles.content}>
        {/* Пояснение */}
        <div style={styles.intro}>
          <div style={styles.introIcon}>💡</div>
          <div style={styles.introText}>
            Показываем болячки, актуальные для вашего пробега. Не все проблемы случатся — это статистика по модели.
          </div>
        </div>

        {/* Легенда иконок */}
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <span style={styles.legendIcon}>⚖️</span>
            <span style={styles.legendText}>Коллективные иски</span>
          </div>
          <div style={styles.legendItem}>
            <span style={styles.legendIcon}>📋</span>
            <span style={styles.legendText}>Отзывные кампании</span>
          </div>
        </div>

        {/* Актуально сейчас */}
        <IssueSection
          title="Актуально сейчас"
          hint="Ваш пробег в зоне риска. Обратите внимание на симптомы."
          issues={categorized.active}
          currentMileage={carData.mileage}
          status="active"
          color={colors.critical}
          defaultOpen={true}
          onNavigateToDetail={handleNavigateToDetail}
        />

        {/* Скоро */}
        <IssueSection
          title="Скоро"
          hint="Появится в ближайшие 15 000 км. Можно подготовиться."
          issues={categorized.soon}
          currentMileage={carData.mileage}
          status="soon"
          color={colors.warning}
          defaultOpen={categorized.active.length === 0}
          onNavigateToDetail={handleNavigateToDetail}
        />

        {/* Пройдено */}
        <IssueSection
          title="Пройдено"
          hint="Типичный пробег для этих проблем уже позади. Если не чинили — проверьте."
          issues={categorized.passed}
          currentMileage={carData.mileage}
          status="passed"
          color={colors.success}
          onNavigateToDetail={handleNavigateToDetail}
        />

        {/* Все болячки */}
        {categorized.future.length > 0 && (
          <IssueSection
            title="В будущем"
            hint="Появится при большем пробеге."
            issues={categorized.future}
            currentMileage={carData.mileage}
            status="future"
            color={colors.textTertiary}
            onNavigateToDetail={handleNavigateToDetail}
          />
        )}
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

  backButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: colors.textPrimary,
    cursor: 'pointer',
  },

  headerCenter: {
    flex: 1,
    textAlign: 'center',
  },

  headerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.textPrimary,
  },

  headerSubtitle: {
    fontSize: '12px',
    color: colors.textTertiary,
    marginTop: '2px',
  },

  headerRight: {
    width: '36px',
  },

  content: {
    padding: '12px',
  },

  intro: {
    display: 'flex',
    gap: '12px',
    padding: '14px',
    background: colors.primaryLight,
    borderRadius: '12px',
    marginBottom: '16px',
    alignItems: 'flex-start',
  },

  introIcon: {
    fontSize: '20px',
    lineHeight: 1,
  },

  introText: {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.5,
  },

  legend: {
    display: 'flex',
    gap: '16px',
    padding: '10px 14px',
    background: colors.cardBg,
    borderRadius: '10px',
    marginBottom: '16px',
    border: `1px solid ${colors.border}`,
  },

  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  legendIcon: {
    fontSize: '14px',
  },

  legendText: {
    fontSize: '12px',
    color: colors.textSecondary,
  },

  // Sections
  section: {
    marginBottom: '12px',
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '12px 14px',
    border: '1px solid',
    borderRadius: '12px',
    cursor: 'pointer',
    background: colors.cardBg,
  },

  sectionHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  sectionDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },

  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.textPrimary,
  },

  sectionCount: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.textTertiary,
    background: colors.border,
    padding: '2px 8px',
    borderRadius: '10px',
  },

  sectionArrow: {
    fontSize: '12px',
    color: colors.textTertiary,
    transition: 'transform 0.2s ease',
  },

  sectionContent: {
    marginTop: '8px',
  },

  sectionHint: {
    fontSize: '12px',
    color: colors.textSecondary,
    padding: '0 4px 10px',
    lineHeight: 1.4,
  },

  // Issue Card
  issueCard: {
    background: colors.cardBg,
    borderRadius: '12px',
    marginBottom: '8px',
    overflow: 'hidden',
    border: `1px solid ${colors.border}`,
  },

  issueHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
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
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },

  issueHeaderText: {
    flex: 1,
  },

  issueName: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: '2px',
  },

  issueCategory: {
    fontSize: '12px',
    color: colors.textTertiary,
  },

  issueHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  statusIcons: {
    display: 'flex',
    gap: '4px',
  },

  statusIcon: {
    width: '26px',
    height: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    background: colors.primaryLight,
    borderRadius: '6px',
  },

  issueToggle: {
    fontSize: '10px',
    color: colors.textTertiary,
    transition: 'transform 0.2s ease',
  },

  issueBody: {
    padding: '0 14px 14px',
    borderTop: `1px solid ${colors.border}`,
    marginTop: '-1px',
    paddingTop: '14px',
  },

  // Progress
  progressContainer: {
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
    fontWeight: '600',
  },

  progressCurrentPrefix: {
    fontSize: '10px',
    fontWeight: '400',
    marginRight: '1px',
  },

  issueDescription: {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.5,
    margin: '0 0 12px',
  },

  issueSection: {
    marginBottom: '12px',
  },

  issueSectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },

  issueSectionText: {
    fontSize: '13px',
    color: colors.textPrimary,
    lineHeight: 1.5,
    margin: 0,
  },

  symptomsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },

  symptomTag: {
    fontSize: '12px',
    color: colors.textPrimary,
    background: colors.warningLight,
    padding: '4px 10px',
    borderRadius: '6px',
  },

  issueFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: `1px solid ${colors.border}`,
  },

  issueCost: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
  },

  issueWarning: {
    fontSize: '12px',
    fontWeight: '600',
    color: colors.critical,
    background: colors.criticalLight,
    padding: '4px 10px',
    borderRadius: '6px',
  },

  ignoreRisk: {
    marginTop: '12px',
    padding: '10px 12px',
    background: colors.criticalLight,
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  ignoreRiskLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: colors.critical,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },

  ignoreRiskText: {
    fontSize: '12px',
    color: colors.textPrimary,
    lineHeight: 1.4,
  },

  // Action Buttons
  actionButtons: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  actionButtonPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
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

  actionButtonsRow: {
    display: 'flex',
    gap: '8px',
  },

  actionButtonSecondary: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 10px',
    background: colors.primaryLight,
    color: colors.primary,
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  actionButtonIcon: {
    fontSize: '16px',
  },

  // VIN Prompt
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
    color: colors.textPrimary,
  },

  vinPromptText: {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.5,
    margin: '0 0 12px',
  },

  vinPromptButton: {
    width: '100%',
    padding: '12px',
    background: colors.primary,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
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
    button:active { opacity: 0.8; }
  `;
  document.head.appendChild(styleSheet);
}
