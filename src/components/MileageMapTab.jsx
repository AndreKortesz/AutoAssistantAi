import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import { recordTitle, recordSystem, isBodyRecord, severityColor } from '../utils/issueHelpers';

// Вкладка «Карта»: вертикальный таймлайн «дорога вперёд» по пробегу.
const c = {
  bg: '#F7F8FA', card: '#FFFFFF', border: '#E2E8F0',
  primary: '#1F4FD8', amber: '#BA7517', success: '#1D9E75', t1: '#1E293B', t2: '#64748B', t3: '#94A3B8',
};

export default function MileageMapTab() {
  const { issuesData, userCar } = useCar();
  const navigate = useNavigate();
  const mileage = userCar?.mileage ? parseInt(userCar.mileage) : 0;

  const points = useMemo(() => {
    if (!issuesData) return [];
    const pts = [];
    for (const r of issuesData.systemic || []) {
      if (isBodyRecord(r)) continue;
      const km = r.mileage?.typical_start_km ?? r.mileage?.peak_km;
      if (km == null) continue;
      pts.push({ id: r.id, km, title: recordTitle(r), color: severityColor(r.issue?.severity), kind: 'issue', tappable: true });
    }
    for (const r of issuesData.maintenance || []) {
      const iv = r.maintenance_interval_km;
      if (!iv) continue;
      const next = Math.ceil((mileage + 1) / iv) * iv;
      pts.push({ id: r.id + '_m', km: next, title: recordTitle(r), color: c.primary, kind: 'to' });
    }
    for (const r of issuesData.wear || []) {
      if (isBodyRecord(r)) continue;
      const wr = r.wear_interval_km;
      const km = (wr && typeof wr === 'object' ? wr.min : wr) ?? r.mileage?.typical_start_km;
      if (km == null) continue;
      pts.push({ id: r.id + '_w', km, title: recordTitle(r), color: c.amber, kind: 'wear' });
    }
    pts.push({ id: '__here__', km: mileage, title: 'Вы здесь', here: true });
    return pts.sort((a, b) => a.km - b.km);
  }, [issuesData, mileage]);

  if (!issuesData?.hasData) {
    return <div style={s.empty}>Карта появится, когда подключим данные по этой модели.</div>;
  }

  return (
    <div style={s.wrap}>
      <div style={s.intro}>Дорога вперёд по пробегу: что уже позади и что ждёт — с расстоянием до события. Не список проблем, а план.</div>
      <div style={s.timeline}>
        {points.map((p) => {
          const past = !p.here && p.km < mileage;
          return (
            <div
              key={p.id}
              style={{ ...s.point, ...(p.tappable ? { cursor: 'pointer' } : {}) }}
              onClick={p.tappable ? () => navigate(`/issues/${p.id}`) : undefined}
            >
              <div style={s.km}>{Math.round(p.km / 1000)} тыс.</div>
              <div style={s.lineCol}>
                <div style={{ ...s.dot, ...(p.here ? s.dotHere : { background: past ? c.success : p.color }) }} />
              </div>
              <div style={{ ...s.label, ...(p.here ? s.labelHere : past ? { color: c.t3 } : {}) }}>
                {p.title}
                {!p.here && (
                  <span style={s.dist}>{past ? ' · позади' : ` · через ${Math.round((p.km - mileage) / 1000)} тыс.`}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  wrap: { padding: '12px' },
  intro: { fontSize: '13px', color: c.t2, lineHeight: 1.5, padding: '4px 4px 14px' },
  timeline: { position: 'relative', borderLeft: `2px solid ${c.border}`, marginLeft: '60px', paddingLeft: '0' },
  point: { display: 'flex', alignItems: 'center', gap: '0', padding: '8px 0', position: 'relative' },
  km: { position: 'absolute', left: '-60px', width: '52px', textAlign: 'right', fontSize: '12px', color: c.t3, fontVariantNumeric: 'tabular-nums' },
  lineCol: { width: '0', display: 'flex', justifyContent: 'center' },
  dot: { width: '11px', height: '11px', borderRadius: '50%', marginLeft: '-7px', border: `2px solid ${c.bg}`, flexShrink: 0 },
  dotHere: { width: '15px', height: '15px', marginLeft: '-9px', background: c.primary, boxShadow: '0 0 0 4px rgba(31,79,216,0.15)' },
  label: { fontSize: '13px', color: c.t1, paddingLeft: '14px', lineHeight: 1.35 },
  labelHere: { fontWeight: '700', color: c.primary, paddingLeft: '16px' },
  dist: { color: c.t3, fontSize: '12px' },
  empty: { padding: '40px 24px', textAlign: 'center', color: c.t2, fontSize: '14px' },
};
