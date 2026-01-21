import React, { useState, useMemo } from 'react';

// AutoAssistantAi — Журнал обслуживания
// История записей + быстрое добавление

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
  
  critical: '#DC2626',
  criticalLight: 'rgba(220, 38, 38, 0.08)',
  
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
};

// Данные автомобиля
const carData = {
  brand: 'Hyundai',
  model: 'Solaris',
  mileage: 87000,
  mileageConfidence: 'high',
};

// Форматирование пробега с ~
const formatMileage = (mileage) => {
  const rounded = Math.round(mileage / 1000) * 1000;
  return `~${rounded.toLocaleString('ru-RU')}`;
};

// Типы записей с иконками
const recordTypes = {
  maintenance: { icon: '🔧', label: 'ТО', color: colors.primary },
  repair: { icon: '🛠', label: 'Ремонт', color: colors.warning },
  consumables: { icon: '📦', label: 'Расходники', color: colors.textSecondary },
  diagnostics: { icon: '🔍', label: 'Диагностика', color: colors.primary },
  tires: { icon: '🛞', label: 'Шины', color: colors.textSecondary },
};

// Пресеты для быстрого выбора
const presets = [
  { type: 'maintenance', name: 'Замена масла ДВС' },
  { type: 'maintenance', name: 'Замена воздушного фильтра' },
  { type: 'maintenance', name: 'Замена салонного фильтра' },
  { type: 'maintenance', name: 'Замена свечей зажигания' },
  { type: 'maintenance', name: 'Замена тормозной жидкости' },
  { type: 'maintenance', name: 'Замена антифриза' },
  { type: 'consumables', name: 'Замена тормозных колодок' },
  { type: 'consumables', name: 'Замена тормозных дисков' },
  { type: 'consumables', name: 'Замена дворников' },
  { type: 'tires', name: 'Сезонная замена шин' },
  { type: 'tires', name: 'Балансировка колёс' },
  { type: 'diagnostics', name: 'Компьютерная диагностика' },
  { type: 'repair', name: 'Другое...' },
];

// История записей
const initialRecords = [
  {
    id: 1,
    type: 'maintenance',
    name: 'Замена масла ДВС',
    date: '2025-01-12',
    mileage: 85000,
    cost: 4200,
    location: 'AutoDoc Service',
    notes: 'Shell Helix HX8 5W-40',
  },
  {
    id: 2,
    type: 'maintenance',
    name: 'Замена свечей зажигания',
    date: '2024-11-15',
    mileage: 82000,
    cost: 2800,
    location: 'Сам',
    notes: 'NGK LZKR6B-10E',
  },
  {
    id: 3,
    type: 'tires',
    name: 'Сезонная замена шин',
    date: '2024-11-01',
    mileage: 81500,
    cost: 1600,
    location: 'Шиномонтаж на Ленина',
    notes: '',
  },
  {
    id: 4,
    type: 'maintenance',
    name: 'Замена воздушного фильтра',
    date: '2024-11-15',
    mileage: 82000,
    cost: 850,
    location: 'Сам',
    notes: '',
  },
  {
    id: 5,
    type: 'repair',
    name: 'Замена стоек стабилизатора',
    date: '2024-09-20',
    mileage: 78000,
    cost: 3500,
    location: 'Fit Service',
    notes: 'CTR CLKK-9',
  },
  {
    id: 6,
    type: 'maintenance',
    name: 'Замена масла ДВС',
    date: '2024-06-10',
    mileage: 70000,
    cost: 4000,
    location: 'AutoDoc Service',
    notes: '',
  },
  {
    id: 7,
    type: 'diagnostics',
    name: 'Компьютерная диагностика',
    date: '2024-06-10',
    mileage: 70000,
    cost: 1500,
    location: 'AutoDoc Service',
    notes: 'Ошибок не обнаружено',
  },
  {
    id: 8,
    type: 'consumables',
    name: 'Замена тормозных колодок',
    date: '2024-03-05',
    mileage: 65000,
    cost: 4500,
    location: 'Fit Service',
    notes: 'Передние, Sangsin SP1399',
  },
  {
    id: 9,
    type: 'tires',
    name: 'Сезонная замена шин',
    date: '2024-04-15',
    mileage: 66000,
    cost: 1600,
    location: 'Шиномонтаж на Ленина',
    notes: '',
  },
  {
    id: 10,
    type: 'maintenance',
    name: 'Замена масла ДВС',
    date: '2023-12-20',
    mileage: 55000,
    cost: 3800,
    location: 'Сам',
    notes: '',
  },
];

// Группировка записей по месяцам
const groupByMonth = (records) => {
  const groups = {};
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  records.forEach(record => {
    const date = new Date(record.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    
    if (!groups[key]) {
      groups[key] = { label, records: [] };
    }
    groups[key].records.push(record);
  });
  
  // Сортируем группы по дате (новые первые)
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, group]) => group);
};

// Форматирование даты
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

// Карточка записи
const RecordCard = ({ record }) => {
  const typeConfig = recordTypes[record.type];
  
  return (
    <div style={styles.recordCard}>
      <div style={styles.recordIcon}>{typeConfig.icon}</div>
      <div style={styles.recordContent}>
        <div style={styles.recordName}>{record.name}</div>
        <div style={styles.recordMeta}>
          {formatDate(record.date)} • {record.mileage.toLocaleString('ru-RU')} км
          {record.location && ` • ${record.location}`}
        </div>
        {record.notes && (
          <div style={styles.recordNotes}>{record.notes}</div>
        )}
      </div>
      <div style={styles.recordCost}>
        {record.cost.toLocaleString('ru-RU')} ₽
      </div>
    </div>
  );
};

// Модальное окно добавления записи
const AddRecordModal = ({ isOpen, onClose, onSave, currentMileage }) => {
  const [step, setStep] = useState('select'); // 'select' | 'form'
  const [formData, setFormData] = useState({
    type: 'maintenance',
    name: '',
    date: new Date().toISOString().split('T')[0],
    mileage: currentMileage.toString(),
    cost: '',
    location: '',
    locationCustom: '',
    notes: '',
  });
  const [showExtra, setShowExtra] = useState(false);

  if (!isOpen) return null;

  const handlePresetSelect = (preset) => {
    setFormData(prev => ({
      ...prev,
      type: preset.type,
      name: preset.name === 'Другое...' ? '' : preset.name,
    }));
    setStep('form');
  };

  const handleSave = () => {
    const newRecord = {
      id: Date.now(),
      type: formData.type,
      name: formData.name,
      date: formData.date,
      mileage: parseInt(formData.mileage),
      cost: parseInt(formData.cost) || 0,
      location: formData.location === 'custom' ? formData.locationCustom : formData.location,
      notes: formData.notes,
    };
    onSave(newRecord);
    // Сброс формы
    setStep('select');
    setFormData({
      type: 'maintenance',
      name: '',
      date: new Date().toISOString().split('T')[0],
      mileage: currentMileage.toString(),
      cost: '',
      location: '',
      locationCustom: '',
      notes: '',
    });
    setShowExtra(false);
  };

  const canSave = formData.name && formData.mileage;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <button 
            style={styles.modalBack}
            onClick={() => step === 'form' ? setStep('select') : onClose()}
          >
            {step === 'form' ? '←' : '✕'}
          </button>
          <span style={styles.modalTitle}>
            {step === 'select' ? 'Новая запись' : 'Детали'}
          </span>
          <div style={{ width: 36 }} />
        </div>

        {/* Content */}
        <div style={styles.modalContent}>
          {step === 'select' ? (
            <>
              {/* OCR кнопка */}
              <button style={styles.ocrButton}>
                <span style={styles.ocrIcon}>📷</span>
                <span style={styles.ocrText}>Сфотографировать чек</span>
                <span style={styles.ocrHint}>Заполним автоматически</span>
              </button>

              <div style={styles.divider}>
                <span style={styles.dividerText}>или выберите</span>
              </div>

              {/* Пресеты */}
              <div style={styles.presetsList}>
                {presets.map((preset, i) => (
                  <button
                    key={i}
                    style={styles.presetButton}
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <span style={styles.presetIcon}>
                      {recordTypes[preset.type].icon}
                    </span>
                    <span style={styles.presetName}>{preset.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Форма */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Что сделали *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Например: Замена масла ДВС"
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formLabel}>Пробег *</label>
                  <div style={styles.inputWithUnit}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.mileage}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        mileage: e.target.value.replace(/\D/g, '')
                      }))}
                      style={styles.formInput}
                    />
                    <span style={styles.inputUnit}>км</span>
                  </div>
                </div>

                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formLabel}>Стоимость</label>
                  <div style={styles.inputWithUnit}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.cost}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        cost: e.target.value.replace(/\D/g, '')
                      }))}
                      placeholder="0"
                      style={styles.formInput}
                    />
                    <span style={styles.inputUnit}>₽</span>
                  </div>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Где делали</label>
                <div style={styles.locationButtons}>
                  <button
                    style={{
                      ...styles.locationButton,
                      ...(formData.location === 'Сам' ? styles.locationButtonActive : {}),
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, location: 'Сам' }))}
                  >
                    Сам
                  </button>
                  <button
                    style={{
                      ...styles.locationButton,
                      ...(formData.location === 'custom' ? styles.locationButtonActive : {}),
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, location: 'custom' }))}
                  >
                    Сервис
                  </button>
                </div>
                {formData.location === 'custom' && (
                  <input
                    type="text"
                    value={formData.locationCustom}
                    onChange={e => setFormData(prev => ({ ...prev, locationCustom: e.target.value }))}
                    placeholder="Название сервиса"
                    style={{ ...styles.formInput, marginTop: 8 }}
                  />
                )}
              </div>

              {/* Дополнительно */}
              <button
                style={styles.extraToggle}
                onClick={() => setShowExtra(!showExtra)}
              >
                <span>{showExtra ? '▼' : '▶'} Дополнительно</span>
              </button>

              {showExtra && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Дата</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      style={styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Заметка</label>
                    <textarea
                      value={formData.notes}
                      onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Марка масла, артикул запчасти..."
                      style={styles.formTextarea}
                      rows={2}
                    />
                  </div>

                  <button style={styles.photoButton}>
                    📎 Прикрепить фото
                  </button>
                </>
              )}

              {/* Кнопка сохранения */}
              <button
                style={{
                  ...styles.saveButton,
                  opacity: canSave ? 1 : 0.5,
                }}
                onClick={handleSave}
                disabled={!canSave}
              >
                Сохранить запись
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function JournalScreen() {
  const [records, setRecords] = useState(initialRecords);
  const [selectedYear, setSelectedYear] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Фильтрация по году
  const filteredRecords = useMemo(() => {
    if (selectedYear === 'all') return records;
    return records.filter(r => new Date(r.date).getFullYear().toString() === selectedYear);
  }, [records, selectedYear]);

  // Группировка по месяцам
  const groupedRecords = useMemo(() => 
    groupByMonth(filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date))),
    [filteredRecords]
  );

  // Общая сумма
  const totalCost = useMemo(() => 
    filteredRecords.reduce((sum, r) => sum + r.cost, 0),
    [filteredRecords]
  );

  // Доступные годы
  const years = useMemo(() => {
    const uniqueYears = [...new Set(records.map(r => new Date(r.date).getFullYear()))];
    return uniqueYears.sort((a, b) => b - a);
  }, [records]);

  const handleAddRecord = (newRecord) => {
    setRecords(prev => [newRecord, ...prev]);
    setIsModalOpen(false);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton}>←</button>
        <div style={styles.headerCenter}>
          <div style={styles.headerTitle}>Журнал</div>
          <div style={styles.headerSubtitle}>
            {carData.brand} {carData.model} • {formatMileage(carData.mileage)} км
          </div>
        </div>
        <div style={styles.headerTotal}>
          <div style={styles.totalValue}>Σ {(totalCost / 1000).toFixed(1)}т</div>
        </div>
      </div>

      {/* Фильтр по годам */}
      <div style={styles.filters}>
        <button
          style={{
            ...styles.filterButton,
            ...(selectedYear === 'all' ? styles.filterButtonActive : {}),
          }}
          onClick={() => setSelectedYear('all')}
        >
          Всё
        </button>
        {years.map(year => (
          <button
            key={year}
            style={{
              ...styles.filterButton,
              ...(selectedYear === year.toString() ? styles.filterButtonActive : {}),
            }}
            onClick={() => setSelectedYear(year.toString())}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Список записей */}
      <div style={styles.content}>
        {groupedRecords.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📋</div>
            <div style={styles.emptyText}>Записей пока нет</div>
            <div style={styles.emptyHint}>Добавьте первую запись об обслуживании</div>
          </div>
        ) : (
          groupedRecords.map((group, i) => (
            <div key={i} style={styles.monthGroup}>
              <div style={styles.monthLabel}>{group.label}</div>
              {group.records.map(record => (
                <RecordCard key={record.id} record={record} />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Кнопка добавления */}
      <div style={styles.addButtonContainer}>
        <button 
          style={styles.addButton}
          onClick={() => setIsModalOpen(true)}
        >
          + Добавить запись
        </button>
      </div>

      {/* Модальное окно */}
      <AddRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddRecord}
        currentMileage={carData.mileage}
      />

    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    width: '100%',
    background: colors.background,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
    paddingBottom: '140px',
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

  headerTotal: {
    textAlign: 'right',
  },

  totalValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.primary,
  },

  // Filters
  filters: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    background: colors.cardBg,
    borderBottom: `1px solid ${colors.border}`,
    overflowX: 'auto',
  },

  filterButton: {
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '500',
    color: colors.textSecondary,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  filterButtonActive: {
    color: colors.primary,
    background: colors.primaryLight,
    borderColor: colors.primary,
  },

  // Content
  content: {
    padding: '12px',
  },

  monthGroup: {
    marginBottom: '16px',
  },

  monthLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.textTertiary,
    padding: '0 4px 8px',
  },

  // Record Card
  recordCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px',
    background: colors.cardBg,
    borderRadius: '12px',
    marginBottom: '8px',
    border: `1px solid ${colors.border}`,
  },

  recordIcon: {
    fontSize: '20px',
    lineHeight: 1,
    marginTop: '2px',
  },

  recordContent: {
    flex: 1,
    minWidth: 0,
  },

  recordName: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: '4px',
  },

  recordMeta: {
    fontSize: '12px',
    color: colors.textTertiary,
    lineHeight: 1.4,
  },

  recordNotes: {
    fontSize: '12px',
    color: colors.textSecondary,
    marginTop: '6px',
    padding: '6px 8px',
    background: colors.background,
    borderRadius: '6px',
  },

  recordCost: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
    whiteSpace: 'nowrap',
  },

  // Empty state
  empty: {
    textAlign: 'center',
    padding: '48px 24px',
  },

  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },

  emptyText: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: '4px',
  },

  emptyHint: {
    fontSize: '14px',
    color: colors.textTertiary,
  },

  // Add button
  addButtonContainer: {
    position: 'fixed',
    bottom: '90px',
    left: '12px',
    right: '12px',
    zIndex: 50,
  },

  addButton: {
    width: '100%',
    padding: '16px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#FFFFFF',
    background: colors.primary,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(31, 79, 216, 0.3)',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 200,
  },

  modal: {
    width: '100%',
    maxHeight: '90vh',
    background: colors.cardBg,
    borderRadius: '20px 20px 0 0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },

  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: `1px solid ${colors.border}`,
  },

  modalBack: {
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

  modalTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.textPrimary,
  },

  modalContent: {
    padding: '16px',
    overflowY: 'auto',
    flex: 1,
  },

  // OCR Button
  ocrButton: {
    width: '100%',
    padding: '20px',
    background: colors.primaryLight,
    border: `2px dashed ${colors.primary}`,
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },

  ocrIcon: {
    fontSize: '32px',
  },

  ocrText: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.primary,
  },

  ocrHint: {
    fontSize: '12px',
    color: colors.textTertiary,
  },

  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '20px 0',
  },

  dividerText: {
    fontSize: '12px',
    color: colors.textTertiary,
    background: colors.cardBg,
    padding: '0 8px',
    position: 'relative',
    zIndex: 1,
    width: '100%',
    textAlign: 'center',
  },

  // Presets
  presetsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  presetButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 14px',
    background: 'none',
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'left',
  },

  presetIcon: {
    fontSize: '18px',
  },

  presetName: {
    fontSize: '14px',
    color: colors.textPrimary,
  },

  // Form
  formGroup: {
    marginBottom: '16px',
  },

  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  formInput: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    color: colors.textPrimary,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    outline: 'none',
  },

  formRow: {
    display: 'flex',
    gap: '12px',
  },

  inputWithUnit: {
    position: 'relative',
  },

  inputUnit: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '14px',
    color: colors.textTertiary,
  },

  locationButtons: {
    display: 'flex',
    gap: '8px',
  },

  locationButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: '500',
    color: colors.textSecondary,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
  },

  locationButtonActive: {
    color: colors.primary,
    background: colors.primaryLight,
    borderColor: colors.primary,
  },

  extraToggle: {
    width: '100%',
    padding: '12px 0',
    fontSize: '13px',
    fontWeight: '500',
    color: colors.textSecondary,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },

  formTextarea: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    color: colors.textPrimary,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
  },

  photoButton: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    color: colors.textSecondary,
    background: 'none',
    border: `1px dashed ${colors.border}`,
    borderRadius: '10px',
    cursor: 'pointer',
    marginBottom: '16px',
  },

  saveButton: {
    width: '100%',
    padding: '16px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#FFFFFF',
    background: colors.primary,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    marginTop: '8px',
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
    input:focus, textarea:focus { border-color: #1F4FD8 !important; }
  `;
  document.head.appendChild(styleSheet);
}
