import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import * as dataService from '../services/dataService';

// AutoAssistantAi — Форма добавления автомобиля
// Каскадные селекты: марка → модель → поколение → двигатель → коробка → год → пробег
// Данные из catalog.json

const colors = {
  background: '#F7F8FA',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  primary: '#1F4FD8',
  primaryLight: 'rgba(31, 79, 216, 0.08)',
  success: '#2E9E6F',
  warning: '#D97706',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
};

function SelectField({ label, value, options, onChange, placeholder, disabled, hint }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <div style={styles.selectWrapper}>
        <select
          style={{
            ...styles.select,
            ...(disabled ? styles.selectDisabled : {}),
          }}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
        <span style={styles.selectArrow}>▼</span>
      </div>
      {hint && <span style={styles.hint}>{hint}</span>}
    </div>
  );
}

function MileageInput({ value, onChange }) {
  const handleChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '');
    onChange(cleaned);
  };
  
  const formatted = value ? new Intl.NumberFormat('ru-RU').format(value) : '';
  
  return (
    <div style={styles.field}>
      <label style={styles.label}>Текущий пробег</label>
      <div style={styles.mileageWrapper}>
        <input
          type="text"
          inputMode="numeric"
          style={styles.mileageInput}
          value={formatted}
          onChange={handleChange}
          placeholder="Например, 87 500"
          maxLength="10"
        />
        <span style={styles.mileageUnit}>км</span>
      </div>
      <span style={styles.hint}>Можно посмотреть на одометре</span>
    </div>
  );
}

export default function AddCarForm() {
  const navigate = useNavigate();
  const { saveCar } = useCar();
  
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    brandId: '',
    modelName: '',
    modelId: '',
    engineCode: '',
    transmissionCode: '',
    year: '',
    mileage: '',
  });

  useEffect(() => {
    let mounted = true;
    dataService.getCatalog()
      .then(data => {
        if (mounted) {
          setCatalog(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load catalog:', err);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const brands = useMemo(() => {
    if (!catalog) return [];
    return catalog.brands.map(b => ({ id: b.id, name: b.name }));
  }, [catalog]);

  const modelNames = useMemo(() => {
    if (!catalog || !formData.brandId) return [];
    const brand = catalog.brands.find(b => b.id === formData.brandId);
    if (!brand) return [];
    const unique = [...new Set(brand.models.map(m => m.model_name))];
    return unique.map(name => ({ id: name, name }));
  }, [catalog, formData.brandId]);

  const generations = useMemo(() => {
    if (!catalog || !formData.brandId || !formData.modelName) return [];
    const brand = catalog.brands.find(b => b.id === formData.brandId);
    if (!brand) return [];
    return brand.models
      .filter(m => m.model_name === formData.modelName)
      .map(m => ({ id: m.id, name: m.generation_label }));
  }, [catalog, formData.brandId, formData.modelName]);

  const currentModel = useMemo(() => {
    if (!catalog || !formData.modelId) return null;
    for (const brand of catalog.brands) {
      const m = brand.models.find(model => model.id === formData.modelId);
      if (m) return m;
    }
    return null;
  }, [catalog, formData.modelId]);

  const engines = useMemo(() => {
    if (!currentModel) return [];
    return currentModel.engines.map(e => ({ id: e.code, name: e.label }));
  }, [currentModel]);

  const transmissions = useMemo(() => {
    if (!currentModel) return [];
    let allowedCodes = currentModel.transmissions.map(t => t.code);
    if (formData.engineCode && currentModel.engine_transmission_compat) {
      const compat = currentModel.engine_transmission_compat.find(
        c => c.engine === formData.engineCode
      );
      if (compat) allowedCodes = compat.transmissions;
    }
    return currentModel.transmissions
      .filter(t => allowedCodes.includes(t.code))
      .map(t => ({ id: t.code, name: t.label }));
  }, [currentModel, formData.engineCode]);

  const years = useMemo(() => {
    if (!currentModel) return [];
    const list = [];
    const end = currentModel.year_end || new Date().getFullYear();
    for (let y = end; y >= currentModel.year_start; y--) list.push(y);
    return list.map(y => ({ id: y.toString(), name: y.toString() }));
  }, [currentModel]);

  const handleBrand = (id) => {
    setFormData({ brandId: id, modelName: '', modelId: '', engineCode: '', transmissionCode: '', year: '', mileage: formData.mileage });
  };
  const handleModelName = (name) => {
    setFormData(prev => ({ ...prev, modelName: name, modelId: '', engineCode: '', transmissionCode: '', year: '' }));
  };
  const handleGeneration = (id) => {
    setFormData(prev => ({ ...prev, modelId: id, engineCode: '', transmissionCode: '', year: '' }));
  };
  const handleEngine = (code) => {
    setFormData(prev => ({ ...prev, engineCode: code, transmissionCode: '' }));
  };
  const handleTransmission = (code) => {
    setFormData(prev => ({ ...prev, transmissionCode: code }));
  };
  const handleYear = (year) => {
    setFormData(prev => ({ ...prev, year }));
  };
  const handleMileage = (mileage) => {
    setFormData(prev => ({ ...prev, mileage }));
  };

  const filledFields = [
    formData.brandId,
    formData.modelName,
    formData.modelId,
    formData.engineCode,
    formData.transmissionCode,
    formData.year,
    formData.mileage,
  ].filter(Boolean).length;
  const totalFields = 7;
  const progress = (filledFields / totalFields) * 100;
  const isComplete = filledFields === totalFields;

  const handleSubmit = async () => {
    if (!isComplete) return;
    const ok = await saveCar({
      modelId: formData.modelId,
      engineCode: formData.engineCode,
      transmissionCode: formData.transmissionCode,
      year: formData.year,
      mileage: formData.mileage,
    });
    if (ok) navigate('/dashboard');
    else alert('Не удалось сохранить данные. Попробуйте ещё раз.');
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: colors.textSecondary }}>Загрузка...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>AAA</div>
        <div>
          <h1 style={styles.title}>Добавьте ваш автомобиль</h1>
          <p style={styles.subtitle}>Чем точнее данные — тем полезнее рекомендации</p>
        </div>
      </div>

      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <span style={styles.progressText}>{filledFields} из {totalFields}</span>
      </div>

      <div style={styles.form}>
        <SelectField
          label="Марка"
          value={formData.brandId}
          options={brands}
          onChange={handleBrand}
          placeholder="Выберите марку"
        />
        <SelectField
          label="Модель"
          value={formData.modelName}
          options={modelNames}
          onChange={handleModelName}
          placeholder="Выберите модель"
          disabled={!formData.brandId}
        />
        <SelectField
          label="Поколение"
          value={formData.modelId}
          options={generations}
          onChange={handleGeneration}
          placeholder="Выберите поколение"
          disabled={!formData.modelName}
        />
        <SelectField
          label="Двигатель"
          value={formData.engineCode}
          options={engines}
          onChange={handleEngine}
          placeholder="Выберите двигатель"
          disabled={!formData.modelId}
          hint={!formData.modelId ? null : 'Указано в ПТС или СТС'}
        />
        <SelectField
          label="Коробка передач"
          value={formData.transmissionCode}
          options={transmissions}
          onChange={handleTransmission}
          placeholder="Выберите КПП"
          disabled={!formData.engineCode}
        />
        <SelectField
          label="Год выпуска"
          value={formData.year}
          options={years}
          onChange={handleYear}
          placeholder="Выберите год"
          disabled={!formData.transmissionCode}
        />
        <MileageInput value={formData.mileage} onChange={handleMileage} />
        <div style={{ height: '120px' }} />
      </div>

      <button
        style={{
          ...styles.submitButton,
          ...(isComplete ? {} : styles.submitButtonDisabled),
        }}
        onClick={handleSubmit}
        disabled={!isComplete}
      >
        {isComplete ? 'Готово' : `Заполните все поля (${filledFields} из ${totalFields})`}
      </button>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: colors.background,
    padding: '24px',
    paddingBottom: '120px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  header: { display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' },
  logo: { width: '48px', height: '48px', background: colors.primary, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '16px', fontWeight: '700', flexShrink: 0 },
  title: { fontSize: '20px', fontWeight: '700', color: colors.textPrimary, margin: '0 0 4px' },
  subtitle: { fontSize: '14px', color: colors.textSecondary, margin: 0 },
  progressContainer: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
  progressBar: { flex: 1, height: '6px', background: colors.border, borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', background: colors.primary, borderRadius: '3px', transition: 'width 0.3s ease' },
  progressText: { fontSize: '13px', color: colors.textTertiary, whiteSpace: 'nowrap' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: colors.textSecondary },
  selectWrapper: { position: 'relative' },
  select: { width: '100%', padding: '14px 40px 14px 16px', fontSize: '16px', color: colors.textPrimary, background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px', appearance: 'none', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' },
  selectDisabled: { background: colors.background, color: colors.textTertiary, cursor: 'not-allowed' },
  selectArrow: { position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: colors.textTertiary, pointerEvents: 'none' },
  mileageWrapper: { position: 'relative' },
  mileageInput: { width: '100%', padding: '14px 50px 14px 16px', fontSize: '16px', color: colors.textPrimary, background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px', outline: 'none', fontFamily: 'inherit' },
  mileageUnit: { position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: colors.textTertiary },
  hint: { fontSize: '12px', color: colors.textTertiary },
  submitButton: { position: 'fixed', bottom: '24px', left: '24px', right: '24px', padding: '16px', fontSize: '16px', fontWeight: '600', color: '#FFFFFF', background: colors.primary, border: 'none', borderRadius: '12px', cursor: 'pointer' },
  submitButtonDisabled: { background: colors.border, color: colors.textTertiary, cursor: 'not-allowed' },
};
