import React, { useState, useMemo } from 'react';

// AutoAssistantAi — Форма добавления автомобиля
// Каскадные селекты: марка → модель → год → двигатель → КПП

const colors = {
  background: '#F7F8FA',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  primary: '#1F4FD8',
  primaryLight: 'rgba(31, 79, 216, 0.08)',
  success: '#2E9E6F',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
};

// Упрощённая база данных для MVP
const carsData = {
  brands: [
    { id: 'hyundai', name: 'Hyundai' },
    { id: 'kia', name: 'Kia' },
    { id: 'volkswagen', name: 'Volkswagen' },
    { id: 'toyota', name: 'Toyota' },
    { id: 'skoda', name: 'Škoda' },
  ],
  
  models: {
    hyundai: [
      { id: 'solaris', name: 'Solaris', generations: ['I (2011-2017)', 'II (2017-н.в.)'] },
      { id: 'creta', name: 'Creta', generations: ['I (2016-2021)', 'II (2021-н.в.)'] },
      { id: 'tucson', name: 'Tucson', generations: ['III (2015-2020)', 'IV (2020-н.в.)'] },
    ],
    kia: [
      { id: 'rio', name: 'Rio', generations: ['III (2011-2017)', 'IV (2017-н.в.)'] },
      { id: 'ceed', name: 'Ceed', generations: ['II (2012-2018)', 'III (2018-н.в.)'] },
      { id: 'sportage', name: 'Sportage', generations: ['IV (2016-2021)', 'V (2021-н.в.)'] },
    ],
    volkswagen: [
      { id: 'polo', name: 'Polo', generations: ['V (2009-2017)', 'VI (2020-н.в.)'] },
      { id: 'tiguan', name: 'Tiguan', generations: ['I (2007-2016)', 'II (2016-н.в.)'] },
    ],
    toyota: [
      { id: 'camry', name: 'Camry', generations: ['XV50 (2011-2017)', 'XV70 (2017-н.в.)'] },
      { id: 'rav4', name: 'RAV4', generations: ['IV (2013-2019)', 'V (2019-н.в.)'] },
      { id: 'corolla', name: 'Corolla', generations: ['E180 (2013-2019)', 'E210 (2019-н.в.)'] },
    ],
    skoda: [
      { id: 'octavia', name: 'Octavia', generations: ['A7 (2013-2020)', 'A8 (2020-н.в.)'] },
      { id: 'rapid', name: 'Rapid', generations: ['I (2012-2020)', 'II (2020-н.в.)'] },
    ],
  },
  
  engines: {
    // Hyundai Solaris
    'hyundai_solaris_I (2011-2017)': [
      { id: 'g4fa', name: '1.4 (107 л.с.)', code: 'G4FA' },
      { id: 'g4fc', name: '1.6 (123 л.с.)', code: 'G4FC' },
    ],
    'hyundai_solaris_II (2017-н.в.)': [
      { id: 'g4lc', name: '1.4 (100 л.с.)', code: 'G4LC' },
      { id: 'g4fg', name: '1.6 (123 л.с.)', code: 'G4FG' },
    ],
    // Hyundai Creta
    'hyundai_creta_I (2016-2021)': [
      { id: 'g4fg', name: '1.6 (123 л.с.)', code: 'G4FG' },
      { id: 'g4na', name: '2.0 (150 л.с.)', code: 'G4NA' },
    ],
    'hyundai_creta_II (2021-н.в.)': [
      { id: 'g4fv', name: '1.6 (123 л.с.)', code: 'G4FV' },
      { id: 'g4nl', name: '2.0 (150 л.с.)', code: 'G4NL' },
    ],
    // Hyundai Tucson
    'hyundai_tucson_III (2015-2020)': [
      { id: 'g4fj', name: '1.6T (177 л.с.)', code: 'G4FJ' },
      { id: 'g4na', name: '2.0 (150 л.с.)', code: 'G4NA' },
    ],
    'hyundai_tucson_IV (2020-н.в.)': [
      { id: 'g4fv', name: '1.6T (180 л.с.)', code: 'G4FV' },
      { id: 'g4nl', name: '2.0 (150 л.с.)', code: 'G4NL' },
      { id: 'g4fph', name: '1.6T Hybrid (230 л.с.)', code: 'G4FPH' },
    ],
    // Kia Rio
    'kia_rio_III (2011-2017)': [
      { id: 'g4fa', name: '1.4 (107 л.с.)', code: 'G4FA' },
      { id: 'g4fc', name: '1.6 (123 л.с.)', code: 'G4FC' },
    ],
    'kia_rio_IV (2017-н.в.)': [
      { id: 'g4lc', name: '1.4 (100 л.с.)', code: 'G4LC' },
      { id: 'g4fg', name: '1.6 (123 л.с.)', code: 'G4FG' },
    ],
    // Kia Ceed
    'kia_ceed_II (2012-2018)': [
      { id: 'g4fg', name: '1.6 (130 л.с.)', code: 'G4FG' },
      { id: 'g4fj', name: '1.6T (204 л.с.)', code: 'G4FJ' },
    ],
    'kia_ceed_III (2018-н.в.)': [
      { id: 'g4fv', name: '1.6 (128 л.с.)', code: 'G4FV' },
      { id: 'g4fj', name: '1.6T (204 л.с.)', code: 'G4FJ' },
    ],
    // Kia Sportage
    'kia_sportage_IV (2016-2021)': [
      { id: 'g4fj', name: '1.6T (177 л.с.)', code: 'G4FJ' },
      { id: 'g4na', name: '2.0 (150 л.с.)', code: 'G4NA' },
    ],
    'kia_sportage_V (2021-н.в.)': [
      { id: 'g4fv', name: '1.6T (180 л.с.)', code: 'G4FV' },
      { id: 'g4nl', name: '2.0 (150 л.с.)', code: 'G4NL' },
    ],
    // Volkswagen Polo
    'volkswagen_polo_V (2009-2017)': [
      { id: 'cfna', name: '1.6 (105 л.с.)', code: 'CFNA' },
    ],
    'volkswagen_polo_VI (2020-н.в.)': [
      { id: 'cwva', name: '1.6 (110 л.с.)', code: 'CWVA' },
    ],
    // Volkswagen Tiguan
    'volkswagen_tiguan_I (2007-2016)': [
      { id: 'cawa', name: '2.0 TSI (170 л.с.)', code: 'CAWA' },
      { id: 'cffb', name: '2.0 TDI (140 л.с.)', code: 'CFFB' },
    ],
    'volkswagen_tiguan_II (2016-н.в.)': [
      { id: 'czpa', name: '1.4 TSI (150 л.с.)', code: 'CZPA' },
      { id: 'czda', name: '2.0 TSI (180 л.с.)', code: 'CZDA' },
    ],
    // Toyota Camry
    'toyota_camry_XV50 (2011-2017)': [
      { id: '2arfe', name: '2.5 (181 л.с.)', code: '2AR-FE' },
      { id: '2grfe', name: '3.5 V6 (249 л.с.)', code: '2GR-FE' },
    ],
    'toyota_camry_XV70 (2017-н.в.)': [
      { id: 'a25afks', name: '2.5 (209 л.с.)', code: 'A25A-FKS' },
      { id: '2grfks', name: '3.5 V6 (249 л.с.)', code: '2GR-FKS' },
    ],
    // Toyota RAV4
    'toyota_rav4_IV (2013-2019)': [
      { id: '3zrfae', name: '2.0 (146 л.с.)', code: '3ZR-FAE' },
      { id: '2arfe', name: '2.5 (180 л.с.)', code: '2AR-FE' },
    ],
    'toyota_rav4_V (2019-н.в.)': [
      { id: 'm20afks', name: '2.0 (149 л.с.)', code: 'M20A-FKS' },
      { id: 'a25afxs', name: '2.5 Hybrid (222 л.с.)', code: 'A25A-FXS' },
    ],
    // Toyota Corolla
    'toyota_corolla_E180 (2013-2019)': [
      { id: '1zrfe', name: '1.6 (122 л.с.)', code: '1ZR-FE' },
      { id: '2zrfe', name: '1.8 (140 л.с.)', code: '2ZR-FE' },
    ],
    'toyota_corolla_E210 (2019-н.в.)': [
      { id: '1zrfe', name: '1.6 (122 л.с.)', code: '1ZR-FE' },
      { id: '2zrfxe', name: '1.8 Hybrid (122 л.с.)', code: '2ZR-FXE' },
    ],
    // Skoda Octavia
    'skoda_octavia_A7 (2013-2020)': [
      { id: 'chpa', name: '1.4 TSI (150 л.с.)', code: 'CHPA' },
      { id: 'czda', name: '2.0 TSI (190 л.с.)', code: 'CZDA' },
    ],
    'skoda_octavia_A8 (2020-н.в.)': [
      { id: 'dkrf', name: '1.4 TSI (150 л.с.)', code: 'DKRF' },
      { id: 'dnf', name: '2.0 TSI (190 л.с.)', code: 'DNF' },
    ],
    // Skoda Rapid
    'skoda_rapid_I (2012-2020)': [
      { id: 'cfna', name: '1.6 (105 л.с.)', code: 'CFNA' },
      { id: 'cwva', name: '1.6 (110 л.с.)', code: 'CWVA' },
    ],
    'skoda_rapid_II (2020-н.в.)': [
      { id: 'cwva', name: '1.6 (110 л.с.)', code: 'CWVA' },
    ],
  },
  
  transmissions: {
    // Hyundai/Kia базовые
    'g4fa': [
      { id: 'mt5', name: '5-МКПП' },
      { id: 'at4', name: '4-АКПП' },
      { id: 'at6', name: '6-АКПП' },
    ],
    'g4fc': [
      { id: 'mt6', name: '6-МКПП' },
      { id: 'at6', name: '6-АКПП' },
    ],
    'g4lc': [
      { id: 'mt6', name: '6-МКПП' },
      { id: 'at6', name: '6-АКПП' },
    ],
    'g4fg': [
      { id: 'mt6', name: '6-МКПП' },
      { id: 'at6', name: '6-АКПП' },
    ],
    // Hyundai/Kia старшие
    'g4na': [
      { id: 'mt6', name: '6-МКПП' },
      { id: 'at6', name: '6-АКПП' },
    ],
    'g4nl': [
      { id: 'ivt', name: 'IVT (вариатор)' },
      { id: 'at8', name: '8-АКПП' },
    ],
    'g4fv': [
      { id: 'mt6', name: '6-МКПП' },
      { id: 'at6', name: '6-АКПП' },
      { id: 'ivt', name: 'IVT (вариатор)' },
    ],
    'g4fj': [
      { id: 'mt6', name: '6-МКПП' },
      { id: 'dct7', name: '7-DCT (робот)' },
    ],
    'g4fph': [
      { id: 'at6', name: '6-АКПП' },
    ],
    // Volkswagen
    'cfna': [
      { id: 'mt5', name: '5-МКПП' },
      { id: 'at6', name: '6-АКПП (Aisin)' },
    ],
    'cwva': [
      { id: 'mt5', name: '5-МКПП' },
      { id: 'at6', name: '6-АКПП (Aisin)' },
    ],
    'cawa': [
      { id: 'mt6', name: '6-МКПП' },
      { id: 'dsg6', name: 'DSG-6 (робот)' },
    ],
    'cffb': [
      { id: 'mt6', name: '6-МКПП' },
      { id: 'dsg6', name: 'DSG-6 (робот)' },
    ],
    'czpa': [
      { id: 'mt6', name: '6-МКПП' },
      { id: 'dsg7', name: 'DSG-7 (робот)' },
    ],
    'czda': [
      { id: 'dsg6', name: 'DSG-6 (робот)' },
      { id: 'dsg7', name: 'DSG-7 (робот)' },
    ],
    // Toyota
    '2arfe': [
      { id: 'at6', name: '6-АКПП' },
    ],
    '2grfe': [
      { id: 'at6', name: '6-АКПП' },
    ],
    'a25afks': [
      { id: 'at8', name: '8-АКПП' },
    ],
    '2grfks': [
      { id: 'at8', name: '8-АКПП' },
    ],
    '3zrfae': [
      { id: 'cvt', name: 'CVT (вариатор)' },
    ],
    'm20afks': [
      { id: 'cvt', name: 'CVT (вариатор)' },
    ],
    'a25afxs': [
      { id: 'ecvt', name: 'E-CVT (гибрид)' },
    ],
    '1zrfe': [
      { id: 'mt6', name: '6-МКПП' },
      { id: 'cvt', name: 'CVT (вариатор)' },
    ],
    '2zrfe': [
      { id: 'cvt', name: 'CVT (вариатор)' },
    ],
    '2zrfxe': [
      { id: 'ecvt', name: 'E-CVT (гибрид)' },
    ],
    // Skoda
    'chpa': [
      { id: 'mt6', name: '6-МКПП' },
      { id: 'dsg7', name: 'DSG-7 (робот)' },
    ],
    'dkrf': [
      { id: 'mt6', name: '6-МКПП' },
      { id: 'dsg7', name: 'DSG-7 (робот)' },
    ],
    'dnf': [
      { id: 'dsg7', name: 'DSG-7 (робот)' },
    ],
  },
};

// Генерация годов из строки поколения
const parseYears = (generation) => {
  const match = generation.match(/\((\d{4})-(\d{4}|н\.в\.)\)/);
  if (!match) return [];
  
  const startYear = parseInt(match[1]);
  const endYear = match[2] === 'н.в.' ? new Date().getFullYear() : parseInt(match[2]);
  
  const years = [];
  for (let y = endYear; y >= startYear; y--) {
    years.push(y);
  }
  return years;
};

// Компонент выбора (селект)
const SelectField = ({ label, value, options, onChange, placeholder, disabled }) => (
  <div style={styles.field}>
    <label style={styles.label}>{label}</label>
    <div style={{
      ...styles.selectWrapper,
      opacity: disabled ? 0.5 : 1,
    }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={styles.select}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id || opt} value={opt.id || opt}>
            {opt.name || opt}
          </option>
        ))}
      </select>
      <span style={styles.selectArrow}>▼</span>
    </div>
  </div>
);

// Компонент ввода пробега
const MileageInput = ({ value, onChange }) => (
  <div style={styles.field}>
    <label style={styles.label}>Пробег (примерно)</label>
    <div style={styles.mileageWrapper}>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        placeholder="87000"
        style={styles.mileageInput}
      />
      <span style={styles.mileageUnit}>км</span>
    </div>
    <span style={styles.hint}>Точность не обязательна — мы работаем с диапазонами</span>
  </div>
);

export default function AddCarForm({ onComplete }) {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    generation: '',
    year: '',
    engine: '',
    transmission: '',
    mileage: '',
  });

  // Каскадная логика
  const models = useMemo(() => {
    return formData.brand ? carsData.models[formData.brand] || [] : [];
  }, [formData.brand]);

  const generations = useMemo(() => {
    const model = models.find(m => m.id === formData.model);
    return model ? model.generations : [];
  }, [models, formData.model]);

  const years = useMemo(() => {
    return formData.generation ? parseYears(formData.generation) : [];
  }, [formData.generation]);

  const engines = useMemo(() => {
    const key = `${formData.brand}_${formData.model}_${formData.generation}`;
    return carsData.engines[key] || [];
  }, [formData.brand, formData.model, formData.generation]);

  const transmissions = useMemo(() => {
    return formData.engine ? carsData.transmissions[formData.engine] || [] : [];
  }, [formData.engine]);

  // Обработчики изменений с сбросом зависимых полей
  const handleBrandChange = (value) => {
    setFormData({
      brand: value,
      model: '',
      generation: '',
      year: '',
      engine: '',
      transmission: '',
      mileage: formData.mileage,
    });
  };

  const handleModelChange = (value) => {
    setFormData({
      ...formData,
      model: value,
      generation: '',
      year: '',
      engine: '',
      transmission: '',
    });
  };

  const handleGenerationChange = (value) => {
    setFormData({
      ...formData,
      generation: value,
      year: '',
      engine: '',
      transmission: '',
    });
  };

  const handleYearChange = (value) => {
    setFormData({
      ...formData,
      year: value,
    });
  };

  const handleEngineChange = (value) => {
    setFormData({
      ...formData,
      engine: value,
      transmission: '',
    });
  };

  const handleTransmissionChange = (value) => {
    setFormData({
      ...formData,
      transmission: value,
    });
  };

  const handleMileageChange = (value) => {
    setFormData({
      ...formData,
      mileage: value,
    });
  };

  // Валидация
  const isValid = formData.brand && formData.model && formData.generation && 
                  formData.year && formData.engine && formData.transmission && 
                  formData.mileage;

  const handleSubmit = () => {
    if (isValid) {
      // Сохраняем данные (потом можно в localStorage или контекст)
      console.log('Car data:', formData);
      onComplete(formData);
    }
  };

  // Прогресс заполнения
  const filledFields = [
    formData.brand,
    formData.model,
    formData.generation,
    formData.year,
    formData.engine,
    formData.transmission,
    formData.mileage,
  ].filter(Boolean).length;
  
  const progress = (filledFields / 7) * 100;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>AAA</div>
        <div>
          <h1 style={styles.title}>Добавьте ваш автомобиль</h1>
          <p style={styles.subtitle}>Чем точнее данные — тем полезнее рекомендации</p>
        </div>
      </div>

      {/* Прогресс */}
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <span style={styles.progressText}>{filledFields} из 7</span>
      </div>

      {/* Форма */}
      <div style={styles.form}>
        <SelectField
          label="Марка"
          value={formData.brand}
          options={carsData.brands}
          onChange={handleBrandChange}
          placeholder="Выберите марку"
        />

        <SelectField
          label="Модель"
          value={formData.model}
          options={models}
          onChange={handleModelChange}
          placeholder="Выберите модель"
          disabled={!formData.brand}
        />

        <SelectField
          label="Поколение"
          value={formData.generation}
          options={generations.map(g => ({ id: g, name: g }))}
          onChange={handleGenerationChange}
          placeholder="Выберите поколение"
          disabled={!formData.model}
        />

        <SelectField
          label="Год выпуска"
          value={formData.year}
          options={years.map(y => ({ id: y.toString(), name: y.toString() }))}
          onChange={handleYearChange}
          placeholder="Выберите год"
          disabled={!formData.generation}
        />

        <SelectField
          label="Двигатель"
          value={formData.engine}
          options={engines}
          onChange={handleEngineChange}
          placeholder="Выберите двигатель"
          disabled={!formData.year}
        />

        <SelectField
          label="Коробка передач"
          value={formData.transmission}
          options={transmissions}
          onChange={handleTransmissionChange}
          placeholder="Выберите КПП"
          disabled={!formData.engine}
        />

        <MileageInput
          value={formData.mileage}
          onChange={handleMileageChange}
        />
      </div>

      {/* Кнопка */}
      <button
        style={{
          ...styles.submitButton,
          opacity: isValid ? 1 : 0.5,
        }}
        onClick={handleSubmit}
        disabled={!isValid}
      >
        Продолжить
      </button>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: colors.background,
    padding: '24px',
    paddingBottom: '100px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
  },

  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '24px',
  },

  logo: {
    width: '48px',
    height: '48px',
    background: colors.primary,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: '700',
    flexShrink: 0,
  },

  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: colors.textPrimary,
    margin: '0 0 4px',
  },

  subtitle: {
    fontSize: '14px',
    color: colors.textSecondary,
    margin: 0,
  },

  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },

  progressBar: {
    flex: 1,
    height: '6px',
    background: colors.border,
    borderRadius: '3px',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    background: colors.primary,
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },

  progressText: {
    fontSize: '13px',
    color: colors.textTertiary,
    whiteSpace: 'nowrap',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.textSecondary,
  },

  selectWrapper: {
    position: 'relative',
  },

  select: {
    width: '100%',
    padding: '14px 40px 14px 16px',
    fontSize: '16px',
    color: colors.textPrimary,
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    appearance: 'none',
    cursor: 'pointer',
    outline: 'none',
  },

  selectArrow: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '12px',
    color: colors.textTertiary,
    pointerEvents: 'none',
  },

  mileageWrapper: {
    position: 'relative',
  },

  mileageInput: {
    width: '100%',
    padding: '14px 50px 14px 16px',
    fontSize: '16px',
    color: colors.textPrimary,
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    outline: 'none',
  },

  mileageUnit: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '14px',
    color: colors.textTertiary,
  },

  hint: {
    fontSize: '12px',
    color: colors.textTertiary,
  },

  submitButton: {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    right: '24px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
    background: colors.primary,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
};
