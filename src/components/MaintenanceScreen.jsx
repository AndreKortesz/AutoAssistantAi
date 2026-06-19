import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import { formatMileage, recordTitle } from '../utils/issueHelpers';
import Icon from './Icon';

// Простой экран регламента ТО: что и когда менять, из собранных данных модели.
const c = {
  bg: '#F7F8FA', card: '#FFFFFF', border: '#E2E8F0',
  primary: '#1F4FD8', amber: '#BA7517', success: '#1D9E75',
  t1: '#1E293B', t2: '#64748B', t3: '#94A3B8',
};

function intervalText(r) {
  const km = r.maintenance_interval_km;
  const mo = r.maintenance_interval_months;
  const parts = [];
  if (km) parts.push(`каждые ${new Intl.NumberFormat('ru-RU').format(km)} км`);
  if (mo) parts.push(`${mo} мес.`);
  return parts.join(' · ') || 'по регламенту';
}

export default function MaintenanceScreen() {
  const navigate = useNavigate();
  const { userCar, carDetails, issuesData, loading } = useCar();
  const mileage = userCar?.mileage ? parseInt(userCar.mileage) : 0;

  const items = useMemo(() => {
    if (!issuesData?.maintenance) return [];
    // дедуп по названию (в данных бывают дубли на разные двигатели)
    const seen = new Set();
    const list = [];
    for (const r of issuesData.maintenance) {
      const title = recordTitle(r);
      if (seen.has(title)) continue;
      seen.add(title);
      const interval = r.maintenance_interval_km;
      const nextDue = interval ? Math.ceil((mileage + 1) / interval) * interval : null;
      const remaining = nextDue != null ? nextDue - mileage : null;
      list.push({ id: r.id, title, interval: intervalText(r), nextDue, remaining });
    }
    // сначала те, у кого ближе срок
    list.sort((a, b) => (a.remaining ?? Infinity) - (b.remaining ?? Infinity));
    return list;
  }, [issuesData, mileage]);

  if (loading) return <div style={s.loading}>Загрузка...</div>;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')} aria-label="Назад">
          <Icon name="arrowLeft" size={20} color={c.primary} />
        </button>
        <div>
          <h1 style={s.title}>Регламент ТО</h1>
          {carDetails && (
            <div style={s.sub}>
              {carDetails.brand} {carDetails.model_name}{mileage ? ` · ${formatMileage(mileage)}` : ''}
            </div>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div style={s.empty}>
          <Icon name="clipboard" size={48} color={c.t3} />
          <div style={s.emptyTitle}>Регламент пока собирается</div>
          <div style={s.emptySub}>Для этой модели данные по ТО ещё не подключены.</div>
        </div>
      ) : (
        <div style={s.list}>
          {items.map(it => {
            const soon = it.remaining != null && it.remaining <= 3000;
            return (
              <div key={it.id} style={s.row}>
                <span style={{ ...s.dot, background: soon ? c.amber : c.primary }} />
                <div style={s.rowInfo}>
                  <div style={s.rowTitle}>{it.title}</div>
                  <div style={s.rowMeta}>{it.interval}</div>
                </div>
                <div style={s.rowRight}>
                  {it.nextDue != null ? (
                    <>
                      <div style={{ ...s.rowWhen, color: soon ? c.amber : c.t2 }}>
                        {soon ? 'Скоро' : `~${Math.round(it.nextDue / 1000)} тыс. км`}
                      </div>
                      <div style={s.rowKm}>через {new Intl.NumberFormat('ru-RU').format(it.remaining)} км</div>
                    </>
                  ) : (
                    <div style={s.rowKm}>по состоянию</div>
                  )}
                </div>
              </div>
            );
          })}
          <div style={s.note}>Интервалы — заводской регламент. В российских условиях (мороз, реагенты, пробки) масло и ATF часто меняют раньше.</div>
        </div>
      )}
      <div style={{ height: 90 }} />
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
  list: { padding: '12px' },
  row: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', marginBottom: '8px' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: '14px', fontWeight: '600', color: c.t1, lineHeight: 1.3 },
  rowMeta: { fontSize: '12px', color: c.t3, marginTop: '2px' },
  rowRight: { textAlign: 'right', flexShrink: 0 },
  rowWhen: { fontSize: '13px', fontWeight: '600' },
  rowKm: { fontSize: '11px', color: c.t3, marginTop: '2px' },
  note: { fontSize: '12px', color: c.t3, lineHeight: 1.5, padding: '8px 4px', fontStyle: 'italic' },
  empty: { padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  emptyTitle: { fontSize: '18px', fontWeight: '700', color: c.t1, marginTop: '8px' },
  emptySub: { fontSize: '14px', color: c.t2 },
};
