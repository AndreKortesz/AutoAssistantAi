import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import { estimateOwnership, OWNERSHIP_ASSUMPTIONS } from '../utils/issueHelpers';
import Icon from './Icon';

// Полная стоимость владения в год: обслуживание + топливо + налог + ОСАГО + шины.
// Всё, кроме обслуживания, — оценка из допущений (показаны внизу).
const c = {
  bg: '#F7F8FA', card: '#FFFFFF', border: '#E2E8F0',
  primary: '#1F4FD8', amber: '#BA7517', success: '#1D9E75',
  t1: '#1E293B', t2: '#64748B', t3: '#94A3B8',
};

const rub = (n) => (n == null ? '—' : new Intl.NumberFormat('ru-RU').format(n) + ' ₽');
const range = (min, max) => {
  if (min == null && max == null) return null;
  if (min === max || max == null) return rub(min);
  if (min == null) return rub(max);
  return `${new Intl.NumberFormat('ru-RU').format(min)} – ${rub(max)}`;
};

const SEG_COLORS = ['#1F4FD8', '#BA7517', '#1D9E75', '#7C5CD9', '#94A3B8'];

export default function CostScreen() {
  const navigate = useNavigate();
  const { carDetails, userCar, issuesData, loading } = useCar();

  if (loading) return <div style={s.loading}>Загрузка...</div>;

  const budget = issuesData?.annual_budget;
  const engine = carDetails?.engines?.find(e => e.code === userCar?.engineCode) || null;
  const own = estimateOwnership(budget, engine);
  const major = (issuesData?.major_expenses || []).filter(e => e.total_min != null || e.total_max != null);
  const a = OWNERSHIP_ASSUMPTIONS;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')} aria-label="Назад">
          <Icon name="arrowLeft" size={20} color={c.primary} />
        </button>
        <div>
          <h1 style={s.title}>Стоимость владения</h1>
          {carDetails && <div style={s.sub}>{carDetails.brand} {carDetails.model_name} · {a.annualKm.toLocaleString('ru-RU')} км/год</div>}
        </div>
      </div>

      {!budget && !engine ? (
        <div style={s.empty}>
          <Icon name="wallet" size={48} color={c.t3} />
          <div style={s.emptyTitle}>Расчёт пока собирается</div>
          <div style={s.emptySub}>Для этой модели данных по стоимости владения ещё нет.</div>
        </div>
      ) : (
        <div style={s.body}>
          {/* Итог за год + полоса-разбивка */}
          <div style={s.totalCard}>
            <div style={s.totalLabel}>Примерно в год</div>
            <div style={s.totalVal}>~{rub(own.total)}</div>
            <div style={s.totalPer}>≈ {rub(Math.round(own.total / 12))}/мес · {(own.total / a.annualKm).toFixed(1)} ₽/км</div>
            <div style={s.bar}>
              {own.items.map((it, i) => (
                <div key={it.key} style={{ width: `${(it.value / own.total) * 100}%`, background: SEG_COLORS[i % SEG_COLORS.length], height: '100%' }} />
              ))}
            </div>
            <div style={s.legend}>
              {own.items.map((it, i) => (
                <div key={it.key} style={s.legRow}>
                  <span style={{ ...s.legDot, background: SEG_COLORS[i % SEG_COLORS.length] }} />
                  <span style={s.legLabel}>{it.label}{it.kind === 'est' ? <span style={s.estMark}> · оценка</span> : null}</span>
                  <span style={s.legVal}>{rub(it.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Сценарии обслуживания */}
          {budget?.scenarios && (
            <>
              <div style={s.sectionTitle}>Обслуживание — сценарии</div>
              {[['minimum', 'Минимум', c.success], ['average', 'Средний', c.primary], ['maximum', 'Максимум', c.amber]].map(([k, label, col]) => {
                const d = budget.scenarios[k];
                if (!d) return null;
                return (
                  <div key={k} style={s.card}>
                    <div style={s.cardHead}>
                      <span style={{ ...s.dot, background: col }} />
                      <span style={s.cardLabel}>{label}</span>
                      <span style={s.cardTotal}>{rub(d.total)}</span>
                    </div>
                    <Row label="Плановое ТО" value={d.regular_to} />
                    <Row label="Расходники" value={d.wear_replacements} />
                    <Row label="Типичные ремонты" value={d.contingency} />
                    {d.description && <div style={s.cardNote}>{d.description}</div>}
                  </div>
                );
              })}
              {budget.with_amortization_5y && (
                <div style={s.amort}>
                  С учётом крупных трат на 5 лет — реально <b>{rub(budget.with_amortization_5y.min_per_year)} – {rub(budget.with_amortization_5y.max_per_year)}</b> в год по обслуживанию.
                </div>
              )}
            </>
          )}

          {/* Крупные разовые */}
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

          <div style={s.note}>
            «Оценка» — наш расчёт из допущений, не точные цены: пробег {a.annualKm.toLocaleString('ru-RU')} км/год,
            бензин ~{a.fuelPriceRub} ₽/л, ОСАГО ~{rub(a.osagoRub)} (зависит от стажа и региона),
            транспортный налог по ставкам региона «{a.taxRegion}». Обслуживание — из собранных данных по модели.
          </div>
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

  totalCard: { background: c.card, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '16px', marginBottom: '8px' },
  totalLabel: { fontSize: '13px', color: c.t2 },
  totalVal: { fontSize: '28px', fontWeight: '700', color: c.t1, lineHeight: 1.1, marginTop: '2px' },
  totalPer: { fontSize: '12px', color: c.t3, marginTop: '4px' },
  bar: { display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: c.bg, marginTop: '14px' },
  legend: { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
  legRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  legDot: { width: '8px', height: '8px', borderRadius: '2px', flexShrink: 0 },
  legLabel: { flex: 1, fontSize: '13px', color: c.t2 },
  estMark: { color: c.t3, fontStyle: 'italic' },
  legVal: { fontSize: '13px', fontWeight: '600', color: c.t1 },

  sectionTitle: { fontSize: '13px', fontWeight: '600', color: c.t2, margin: '16px 4px 8px' },
  card: { background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '14px', marginBottom: '8px' },
  cardHead: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  dot: { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0 },
  cardLabel: { flex: 1, fontSize: '14px', fontWeight: '600', color: c.t1 },
  cardTotal: { fontSize: '15px', fontWeight: '700', color: c.t1 },
  row: { display: 'flex', justifyContent: 'space-between', padding: '3px 0' },
  rowLabel: { fontSize: '13px', color: c.t2 },
  rowVal: { fontSize: '13px', fontWeight: '600', color: c.t1 },
  cardNote: { fontSize: '12px', color: c.t3, marginTop: '10px', lineHeight: 1.4, fontStyle: 'italic' },
  amort: { fontSize: '13px', color: c.t2, lineHeight: 1.5, padding: '12px 14px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', marginBottom: '8px' },
  majorRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${c.border}` },
  majorName: { fontSize: '13px', color: c.t1 },
  majorWhen: { fontSize: '11px', color: c.t3, marginTop: '2px' },
  majorCost: { fontSize: '13px', fontWeight: '600', color: c.t1, flexShrink: 0, whiteSpace: 'nowrap' },
  note: { fontSize: '12px', color: c.t3, lineHeight: 1.5, padding: '14px 4px 0', fontStyle: 'italic' },
  empty: { padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  emptyTitle: { fontSize: '18px', fontWeight: '700', color: c.t1, marginTop: '8px' },
  emptySub: { fontSize: '14px', color: c.t2 },
};
