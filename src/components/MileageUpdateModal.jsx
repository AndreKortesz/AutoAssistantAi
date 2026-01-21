import React, { useState } from 'react';

// AutoAssistantAi — Компонент мягкого уточнения пробега
// Не требует точного числа, работает с диапазонами

// Цветовая схема
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
  
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
};

// Генерация диапазонов на основе текущего пробега
const generateRanges = (currentMileage) => {
  // Округляем до 5 тысяч
  const base = Math.floor(currentMileage / 5000) * 5000;
  
  return [
    { id: 1, min: base - 5000, max: base, label: `${(base - 5000) / 1000}–${base / 1000} тыс` },
    { id: 2, min: base, max: base + 5000, label: `${base / 1000}–${(base + 5000) / 1000} тыс` },
    { id: 3, min: base + 5000, max: base + 10000, label: `${(base + 5000) / 1000}–${(base + 10000) / 1000} тыс` },
    { id: 4, min: base + 10000, max: base + 15000, label: `${(base + 10000) / 1000}–${(base + 15000) / 1000} тыс` },
  ];
};

// Компонент модального окна уточнения пробега
const MileageUpdateModal = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  currentMileage = 87000,
  lastUpdated = '12 января',
}) => {
  const [selectedRange, setSelectedRange] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualValue, setManualValue] = useState('');
  
  const ranges = generateRanges(currentMileage);
  
  if (!isOpen) return null;
  
  const handleConfirm = () => {
    if (selectedRange) {
      // Берём середину диапазона
      const range = ranges.find(r => r.id === selectedRange);
      const newMileage = (range.min + range.max) / 2;
      onUpdate({ 
        mileage: newMileage, 
        confidence: 'high',
        source: 'user_range'
      });
    } else if (manualValue) {
      onUpdate({ 
        mileage: parseInt(manualValue), 
        confidence: 'high',
        source: 'user_exact'
      });
    }
    onClose();
  };
  
  const handleSkip = () => {
    onUpdate({ 
      mileage: currentMileage, 
      confidence: 'medium',
      source: 'skipped'
    });
    onClose();
  };
  
  const handleDontKnow = () => {
    onUpdate({ 
      mileage: currentMileage + 2500, // Добавляем средний прирост
      confidence: 'low',
      source: 'estimated'
    });
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>📍</div>
          <h2 style={styles.title}>Уточним пробег?</h2>
          <p style={styles.subtitle}>
            Последнее обновление: {lastUpdated}
          </p>
        </div>
        
        {/* Пояснение */}
        <div style={styles.hint}>
          <span style={styles.hintIcon}>💡</span>
          <span style={styles.hintText}>
            Точный пробег не обязателен — диапазона достаточно для расчётов
          </span>
        </div>
        
        {/* Выбор диапазона */}
        {!showManualInput ? (
          <>
            <div style={styles.question}>
              Примерно какой сейчас пробег?
            </div>
            
            <div style={styles.rangesGrid}>
              {ranges.map(range => (
                <button
                  key={range.id}
                  style={{
                    ...styles.rangeButton,
                    ...(selectedRange === range.id ? styles.rangeButtonSelected : {}),
                  }}
                  onClick={() => setSelectedRange(range.id)}
                >
                  <span style={styles.rangeLabel}>{range.label}</span>
                  <span style={styles.rangeKm}>км</span>
                </button>
              ))}
            </div>
            
            {/* Дополнительные опции */}
            <div style={styles.extraOptions}>
              <button 
                style={styles.linkButton}
                onClick={() => setShowManualInput(true)}
              >
                Ввести точный пробег
              </button>
              <button 
                style={styles.linkButton}
                onClick={handleDontKnow}
              >
                Не знаю
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Ручной ввод */}
            <div style={styles.manualInput}>
              <label style={styles.inputLabel}>Текущий пробег</label>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={manualValue}
                  onChange={e => setManualValue(e.target.value.replace(/\D/g, ''))}
                  placeholder={currentMileage.toString()}
                  style={styles.input}
                  autoFocus
                />
                <span style={styles.inputUnit}>км</span>
              </div>
            </div>
            
            <button 
              style={styles.linkButton}
              onClick={() => {
                setShowManualInput(false);
                setManualValue('');
              }}
            >
              ← Выбрать диапазон
            </button>
          </>
        )}
        
        {/* Кнопки действий */}
        <div style={styles.actions}>
          <button 
            style={styles.skipButton}
            onClick={handleSkip}
          >
            Пропустить
          </button>
          <button 
            style={{
              ...styles.confirmButton,
              opacity: (selectedRange || manualValue) ? 1 : 0.5,
            }}
            onClick={handleConfirm}
            disabled={!selectedRange && !manualValue}
          >
            Подтвердить
          </button>
        </div>
        
        {/* Успокаивающее сообщение */}
        <div style={styles.footer}>
          Мы оцениваем пробег автоматически и уточняем только когда это важно
        </div>
      </div>
    </div>
  );
};

// Компонент кнопки-триггера для вызова модалки (для интеграции в дашборд)
const MileageConfidenceButton = ({ 
  mileage, 
  confidence, 
  onClick 
}) => {
  const confidenceConfig = {
    high: { 
      label: 'Точность высокая', 
      color: colors.success,
      icon: '✓',
      clickable: false,
    },
    medium: { 
      label: 'Уточнить?', 
      color: colors.warning,
      icon: '~',
      clickable: true,
    },
    low: { 
      label: 'Уточнить пробег', 
      color: colors.textTertiary,
      icon: '?',
      clickable: true,
    },
  };
  
  const config = confidenceConfig[confidence];
  
  const formatMileage = (m) => {
    const rounded = Math.round(m / 1000) * 1000;
    return `~${rounded.toLocaleString('ru-RU')}`;
  };
  
  return (
    <button 
      style={{
        ...styles.confidenceButton,
        cursor: config.clickable ? 'pointer' : 'default',
      }}
      onClick={config.clickable ? onClick : undefined}
    >
      <div style={styles.confidenceLeft}>
        <span style={{
          ...styles.confidenceIcon,
          color: config.color,
        }}>
          {config.icon}
        </span>
        <span style={styles.confidenceText}>
          Пробег {formatMileage(mileage)} км
        </span>
      </div>
      <span style={{
        ...styles.confidenceLabel,
        color: config.color,
        textDecoration: config.clickable ? 'underline' : 'none',
      }}>
        {config.label}
      </span>
    </button>
  );
};

// Демо-компонент для показа работы
export default function MileageUpdateDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [carData, setCarData] = useState({
    mileage: 87000,
    confidence: 'medium', // Показываем medium для демонстрации
    lastUpdated: '12 января',
  });
  
  const handleUpdate = (data) => {
    setCarData(prev => ({
      ...prev,
      mileage: data.mileage,
      confidence: data.confidence,
      lastUpdated: 'только что',
    }));
    console.log('Пробег обновлён:', data);
  };
  
  return (
    <div style={styles.demoContainer}>
      <div style={styles.demoCard}>
        <h3 style={styles.demoTitle}>Индикатор пробега</h3>
        <p style={styles.demoSubtitle}>
          Нажмите, если confidence = medium или low
        </p>
        
        <MileageConfidenceButton
          mileage={carData.mileage}
          confidence={carData.confidence}
          onClick={() => setIsModalOpen(true)}
        />
        
        {/* Переключатели для демо */}
        <div style={styles.demoControls}>
          <span style={styles.demoLabel}>Тест уровней:</span>
          <button 
            style={{
              ...styles.demoButton,
              background: carData.confidence === 'high' ? colors.successLight : colors.background,
            }}
            onClick={() => setCarData(prev => ({ ...prev, confidence: 'high' }))}
          >
            High
          </button>
          <button 
            style={{
              ...styles.demoButton,
              background: carData.confidence === 'medium' ? colors.warningLight : colors.background,
            }}
            onClick={() => setCarData(prev => ({ ...prev, confidence: 'medium' }))}
          >
            Medium
          </button>
          <button 
            style={{
              ...styles.demoButton,
              background: carData.confidence === 'low' ? colors.primaryLight : colors.background,
            }}
            onClick={() => setCarData(prev => ({ ...prev, confidence: 'low' }))}
          >
            Low
          </button>
        </div>
      </div>
      
      <MileageUpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdate}
        currentMileage={carData.mileage}
        lastUpdated={carData.lastUpdated}
      />
    </div>
  );
}

// Экспортируем компоненты для использования в других экранах
export { MileageUpdateModal, MileageConfidenceButton };

const styles = {
  // Overlay
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    zIndex: 1000,
  },
  
  // Modal
  modal: {
    width: '100%',
    maxWidth: '360px',
    background: colors.cardBg,
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
  },
  
  // Header
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  
  headerIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: colors.textPrimary,
    margin: '0 0 4px',
  },
  
  subtitle: {
    fontSize: '13px',
    color: colors.textTertiary,
    margin: 0,
  },
  
  // Hint
  hint: {
    display: 'flex',
    gap: '10px',
    padding: '12px 14px',
    background: colors.primaryLight,
    borderRadius: '12px',
    marginBottom: '20px',
    alignItems: 'flex-start',
  },
  
  hintIcon: {
    fontSize: '16px',
    lineHeight: 1.4,
  },
  
  hintText: {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.4,
  },
  
  // Question
  question: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: '12px',
    textAlign: 'center',
  },
  
  // Ranges
  rangesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '16px',
  },
  
  rangeButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 12px',
    background: colors.background,
    border: `2px solid ${colors.border}`,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  
  rangeButtonSelected: {
    background: colors.primaryLight,
    borderColor: colors.primary,
  },
  
  rangeLabel: {
    fontSize: '17px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  rangeKm: {
    fontSize: '12px',
    color: colors.textTertiary,
    marginTop: '2px',
  },
  
  // Extra options
  extraOptions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  
  linkButton: {
    background: 'none',
    border: 'none',
    fontSize: '13px',
    color: colors.primary,
    cursor: 'pointer',
    padding: '4px 0',
  },
  
  // Manual input
  manualInput: {
    marginBottom: '16px',
  },
  
  inputLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  
  inputWrapper: {
    position: 'relative',
  },
  
  input: {
    width: '100%',
    padding: '14px 50px 14px 16px',
    fontSize: '18px',
    fontWeight: '600',
    color: colors.textPrimary,
    background: colors.background,
    border: `2px solid ${colors.border}`,
    borderRadius: '12px',
    outline: 'none',
    textAlign: 'center',
  },
  
  inputUnit: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '14px',
    color: colors.textTertiary,
  },
  
  // Actions
  actions: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
  },
  
  skipButton: {
    flex: 1,
    padding: '14px',
    fontSize: '15px',
    fontWeight: '500',
    color: colors.textSecondary,
    background: colors.background,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  
  confirmButton: {
    flex: 2,
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#FFFFFF',
    background: colors.primary,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  
  // Footer
  footer: {
    fontSize: '11px',
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 1.4,
  },
  
  // Confidence button (для интеграции в дашборд)
  confidenceButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '12px 14px',
    background: colors.background,
    border: 'none',
    borderRadius: '10px',
  },
  
  confidenceLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  
  confidenceIcon: {
    fontSize: '14px',
    fontWeight: '600',
  },
  
  confidenceText: {
    fontSize: '13px',
    color: colors.textPrimary,
  },
  
  confidenceLabel: {
    fontSize: '12px',
    fontWeight: '500',
  },
  
  // Demo
  demoContainer: {
    minHeight: '100vh',
    background: colors.background,
    padding: '24px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
  },
  
  demoCard: {
    background: colors.cardBg,
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  
  demoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.textPrimary,
    margin: '0 0 4px',
  },
  
  demoSubtitle: {
    fontSize: '13px',
    color: colors.textTertiary,
    margin: '0 0 16px',
  },
  
  demoControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: `1px solid ${colors.border}`,
  },
  
  demoLabel: {
    fontSize: '12px',
    color: colors.textTertiary,
  },
  
  demoButton: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    color: colors.textPrimary,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

// Global styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    button:active { opacity: 0.8; }
    input:focus { border-color: #1F4FD8 !important; }
  `;
  document.head.appendChild(styleSheet);
}
