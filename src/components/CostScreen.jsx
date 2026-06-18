import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import { formatMileage } from '../utils/issueHelpers';
import Icon from './Icon';

// Детальный расчёт стоимости владения: 3 сценария в год + крупные разовые траты.
const c = {
  bg: '#F7F8FA', card: '#FFFFFF', border: '#E2E8F0',
  primary: '#1F4FD8', amber: '#BA7517', success: '#1D9E75',
  t1: '#1E293B', t2: '#64748B', t3: '#94A3B8',
};

const rub = (n) => (n == null ? '—' : new Intl.NumberFormat('ru-RU').format(n) + ' ₽');

function range(min, max) {
  if (min == null && max == null) return null;
  if (min === max || max == null) return rub(min);
  if (min == null) return rub(max);
  return `${new Intl.NumberFormat('ru-RU').format(min)} – ${rub(max)}`;
}

const SCENARIOS = [
  { key: 'minimum', label: 'Минимум', color: c.success },
  { key: 'average', label: 'Средний', color: c.primary },
  { key: 'maximum', label: 'Максимум', color: c.amber },
];

export default function CostScreen() {
  const navigate = useNavigate();
  const { carDetails, issuesData, loading } = useCar();

  if (loading) return <div style={s.loading}>Загрузка...</div>;

  const budget = issuesData?.annual_budget;
  const scenarios = budget?.scenarios || {};
  const major = (issuesData?.major_expenses || []).filter(e => e.total_min != null || e.total_max != null);

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')} aria-label="Назад">
          <Icon name="arrowLeft" size={20} color={c.primary} />
        </button>
        <div>
          <h1 style={s.title}>Стоимость владения</h1>
          {carDetails && <div style={s.sub}>{carDetails.brand} {carDetails.model_name} · 15 000 км/год</div>}
        </div>
      </div>

      {!budget ? (
        <div style={s.empty}>
          <Icon name="wallet" size={48} color={c.t3} />
          <div style={s.emptyTitle}>Расчёт пока собирается</div>
          <div style={s.emptySub}>Для этой модели данные по стоимости владения ещё не подключены.</div>
        </div>
      ) : (
        <div style={s.body}>
          <div style={s.sectionTitle}>Расходы в год</div>
          {SCENARIOS.map(sc => {
            const d = scenarios[sc.key];
            if (!d) return null;
            return (
              <div key={sc.key} style={s.card}>
                <div style={s.cardHead}>
                  <span style={{ ...s.dot, background: sc.color }} />
                  <span style={s.cardLabel}>{sc.label}</span>
                  <span style={s.cardTotal}>{rub(d.total)}</span>
                </div>
                <div style={s.cardRows}>
                  <Row label="Плановое ТО" value={d.regular_to} />
                  <Row label="Расходники" value={d.wear_replacements} />
                  <Row label="Типичные ремонты" value={d.contingency} />
                </div>
                {d.description && <div style={s.cardNote}>{d.description}</div>}
              </div>
            );
          })}

          {budget.with_amortization_5y && (
            <div style={s.amort}>
              С учётом крупных трат на 5 лет — реально <b>{rub(budget.with_amortization_5y.min_per_year)} – {rub(budget.with_amortization_5y.max_per_year)}</b> в год.
              {budget.with_amortization_5y.description ? ` ${budget.with_amortization_5y.description}` : ''}
            </div>
          )}

          {major.length > 0 && (
            <>
              <div style={{ ...s.sectionTitle, marginTop: '20px' }}>Крупные разовые траты</div>
              <div style={s.card}>
                {major.map((e, i) => {
                  const when = e.when_km != null ? `~${Math.round(e.when_km / 1000)} тыс. км`
                    : (e.when_km_min != null ? `${Math.round(e.when_km_min / 1000)}–${Math.round((e.when_km_max || e.when_km_min) / 1000)} тыс. км` : null);
                  return (
                    <div key={i} style={s.majorRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.majorName}>{e.item}</div>
                        {when && <div style={s.majorWhen}>{when}</div>}
                      </div>
                      <div style={s.majorCost}>{range(e.total_min, e.total_max)}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div style={s.note}>Оценка для пробега 15 000 км/год по российским ценам. Реальные расходы зависят от стиля езды, региона и того, делаете ли часть работ сами.</div>
        </div>
      )}
      <div style={{ height: 90 }} />
    </div>
  );
}

function Row({ label, value }) {
  if (value == null) return null;
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={s.rowVal}>{rub(value)}</span>
    </div>
  );
}

const s = {
  container: { background: c.bg, minHeight: '100vh', paddingBottom: '100px', fontFamily: 'Inter, system-ui, sans-serif' },
  loading: { padding: '40px', textAlign: 'center', color: c.t2 },
  header: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: c.card, borderBottom: `1px solid ${c.border}`, position: 'sticky', top: 0, zIndex: 10 },
  back: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' },
  title: { fontSize: '18px', fontWeight: '700', color: c.t1, margin: 0 },
  sub: { fontSize: '13px', color: c.t2, marginTop: '2px' },
  body: { padding: '12px' },
  sectionTitle: { fontSize: '13px', fontWeight: '600', color: c.t2, margin: '4px 4px 8px' },
  card: { background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '14px', marginBottom: '8px' },
  cardHead: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  dot: { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0 },
  cardLabel: { flex: 1, fontSize: '14px', fontWeight: '600', color: c.t1 },
  cardTotal: { fontSize: '15px', fontWeight: '700', color: c.t1 },
  cardRows: { display: 'flex', flexDirection: 'column', gap: '6px' },
  row: { display: 'flex', justifyContent: 'space-between' },
  rowLabel: { fontSize: '13px', color: c.t2 },
  rowVal: { fontSize: '13px', fontWeight: '600', color: c.t1 },
  cardNote: { fontSize: '12px', color: c.t3, marginTop: '10px', lineHeight: 1.4, fontStyle: 'italic' },
  amort: { fontSize: '13px', color: c.t2, lineHeight: 1.5, padding: '12px 14px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', marginBottom: '8px' },
  majorRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${c.border}` },
  majorName: { fontSize: '13px', color: c.t1 },
  majorWhen: { fontSize: '11px', color: c.t3, marginTop: '2px' },
  majorCost: { fontSize: '13px', fontWeight: '600', color: c.t1, flexShrink: 0, whiteSpace: 'nowrap' },
  note: { fontSize: '12px', color: c.t3, lineHeight: 1.5, padding: '12px 4px', fontStyle: 'italic' },
  empty: { padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  emptyTitle: { fontSize: '18px', fontWeight: '700', color: c.t1, marginTop: '8px' },
  emptySub: { fontSize: '14px', color: c.t2 },
};
