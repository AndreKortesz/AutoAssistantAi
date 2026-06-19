import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import { recordTitle, recordSystem, wearStatus, isBodyRecord, formatMileage } from '../utils/issueHelpers';
import Icon from './Icon';

// Вкладка «ТО и расходники»: Регламент (по графику) + Износ (по состоянию/пробегу).
const c = {
  bg: '#F7F8FA', card: '#FFFFFF', border: '#E2E8F0',
  primary: '#1F4FD8', amber: '#BA7517', success: '#1D9E75',
  t1: '#1E293B', t2: '#64748B', t3: '#94A3B8',
};

const STATE_META = {
  overdue: { word: 'просрочено', color: c.amber, dot: c.amber, rank: 0 },
  now: { word: 'пора', color: c.amber, dot: c.amber, rank: 1 },
  soon: { word: 'скоро', color: c.t2, dot: c.t3, rank: 2 },
  early: { word: 'по плану', color: c.t3, dot: c.t3, rank: 3 },
};

function maintItem(r, mileage) {
  const interval = r.maintenance_interval_km;
  if (!interval) {
    // только по времени (например, тормозная жидкость каждые 2 года)
    return { id: r.id, title: recordTitle(r), sub: r.maintenance_interval_months ? `каждые ${r.maintenance_interval_months} мес.` : 'по регламенту', state: 'soon', rightTop: '—', rightBot: 'по времени', rank: 2 };
  }
  const nextDue = Math.ceil((mileage + 1) / interval) * interval;
  const remaining = nextDue - mileage;
  const state = remaining <= 3000 ? 'now' : (remaining <= 8000 ? 'soon' : 'early');
  const meta = STATE_META[state];
  return {
    id: r.id, title: recordTitle(r),
    sub: `каждые ${new Intl.NumberFormat('ru-RU').format(interval)} км${r.maintenance_interval_months ? ` · ${r.maintenance_interval_months} мес.` : ''}`,
    state, rightTop: meta.word === 'по плану' ? `~${Math.round(nextDue / 1000)} тыс.` : meta.word,
    rightBot: `через ${new Intl.NumberFormat('ru-RU').format(remaining)} км`, rank: meta.rank, color: meta.color, dot: meta.dot,
  };
}

function Row({ it, onOpen }) {
  const meta = STATE_META[it.state] || STATE_META.early;
  return (
    <button style={s.row} onClick={onOpen}>
      <span style={{ ...s.dot, background: it.dot || meta.dot }} />
      <div style={s.info}>
        <div style={s.title}>{it.title}</div>
        <div style={s.sub}>{it.sub}</div>
      </div>
      <div style={s.right}>
        <div style={{ ...s.rightTop, color: it.color || meta.color }}>{it.rightTop}</div>
        {it.rightBot && <div style={s.rightBot}>{it.rightBot}</div>}
      </div>
      <Icon name="arrowRight" size={16} color={c.t3} />
    </button>
  );
}

export default function MaintenanceTab() {
  const navigate = useNavigate();
  const { issuesData } = useCar();
  const { userCar } = useCar();
  const mileage = userCar?.mileage ? parseInt(userCar.mileage) : 0;
  const fixedIssueIds = useCar().fixedIssueIds || [];
  const [showAll, setShowAll] = useState(false);

  const maint = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const r of issuesData?.maintenance || []) {
      const t = recordTitle(r);
      if (seen.has(t)) continue;
      seen.add(t);
      list.push(maintItem(r, mileage));
    }
    return list.sort((a, b) => a.rank - b.rank);
  }, [issuesData, mileage]);

  const wear = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const r of issuesData?.wear || []) {
      if (isBodyRecord(r)) continue;
      const t = recordTitle(r);
      if (seen.has(t)) continue;
      seen.add(t);
      const st = wearStatus(r, mileage, fixedIssueIds);
      const meta = STATE_META[st.state];
      list.push({
        id: r.id, title: t, sub: systemLabel(recordSystem(r)),
        state: st.state, rank: meta.rank, color: meta.color, dot: meta.dot,
        rightTop: meta.word,
        rightBot: st.dueKm ? (st.state === 'now' || st.state === 'overdue' ? `ресурс ~${Math.round(st.dueKm / 1000)} тыс.` : `~${Math.round(st.dueKm / 1000)} тыс.`) : null,
      });
    }
    return list.sort((a, b) => a.rank - b.rank);
  }, [issuesData, mileage, fixedIssueIds]);

  const visible = (list) => showAll ? list : list.filter(x => x.state !== 'early');
  const hiddenCount = maint.filter(x => x.state === 'early').length + wear.filter(x => x.state === 'early').length;

  const mVis = visible(maint), wVis = visible(wear);

  return (
    <div style={s.wrap}>
      <div style={s.subHead}>
        <Icon name="calendar" size={20} color={c.t2} strokeWidth={1.7} />
        <div>
          <div style={s.subTitle}>Регламент — строго по графику</div>
          <div style={s.subSub}>меняется по пробегу, не глядя на состояние</div>
        </div>
      </div>
      {mVis.length === 0 ? <div style={s.empty}>На вашем пробеге по регламенту ничего срочного.</div>
        : mVis.map(it => <Row key={it.id} it={it} onOpen={() => navigate(`/issues/${it.id}`)} />)}

      <div style={{ ...s.subHead, marginTop: '22px' }}>
        <Icon name="gauge" size={20} color={c.t2} strokeWidth={1.7} />
        <div>
          <div style={s.subTitle}>Износ — по состоянию и пробегу</div>
          <div style={s.subSub}>ходит по-разному, смотрят по факту</div>
        </div>
      </div>
      {wVis.length === 0 ? <div style={s.empty}>На вашем пробеге расходники по износу пока не требуют внимания.</div>
        : wVis.map(it => <Row key={it.id} it={it} onOpen={() => navigate(`/issues/${it.id}`)} />)}

      {hiddenCount > 0 && (
        <button style={s.showAll} onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Скрыть то, что ещё рано' : `Показать всё, что впереди (${hiddenCount})`}
          <Icon name="chevronDown" size={15} color={c.t2} style={{ transform: showAll ? 'rotate(180deg)' : 'none' }} />
        </button>
      )}

      <div style={s.note}>Интервалы — заводской регламент. В РФ-условиях (мороз, реагенты, пробки) масло и ATF часто меняют раньше. Отметка в журнале сдвигает следующий срок от факта замены.</div>
    </div>
  );
}

function systemLabel(sys) {
  const map = { engine: 'Двигатель', transmission: 'Коробка', suspension: 'Подвеска', steering: 'Рулевое', brakes: 'Тормоза', cooling: 'Охлаждение', fuel: 'Топливная', exhaust: 'Выхлоп', electrical: 'Электрика', interior: 'Салон', climate: 'Климат', ignition: 'Зажигание' };
  return map[sys] || 'Прочее';
}

const s = {
  wrap: { padding: '12px' },
  subHead: { display: 'flex', alignItems: 'center', gap: '10px', margin: '0 2px 10px' },
  subTitle: { fontSize: '16px', fontWeight: '700', color: c.t1 },
  subSub: { fontSize: '13px', color: c.t3, marginTop: '1px' },
  row: { width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 16px', background: c.card, borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '8px' },
  dot: { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: '15px', fontWeight: '600', color: c.t1, lineHeight: 1.3 },
  sub: { fontSize: '13px', color: c.t3, marginTop: '2px' },
  right: { textAlign: 'right', flexShrink: 0 },
  rightTop: { fontSize: '13px', fontWeight: '600' },
  rightBot: { fontSize: '11px', color: c.t3, marginTop: '2px' },
  empty: { fontSize: '13px', color: c.t2, padding: '8px 4px 4px', fontStyle: 'italic' },
  showAll: { width: '100%', marginTop: '8px', padding: '11px', borderRadius: '10px', background: 'none', border: `1px solid ${c.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', color: c.t2, fontFamily: 'inherit' },
  note: { fontSize: '12px', color: c.t3, lineHeight: 1.5, padding: '14px 4px 0', fontStyle: 'italic' },
};
