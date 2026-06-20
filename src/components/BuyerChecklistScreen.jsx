import React, { useMemo, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import Icon from './Icon';
import { recordTitle, isBodyRecord, getLinkedRecalls } from '../utils/issueHelpers';

// Чек-лист подбора б/у — что проверить при покупке именно этой конфигурации.
// Собирается из реальных болячек (critical/high) с «как проверить» из diagnostic.
// Спокойный тон: это места внимания, а не приговор.
const c = {
  bg: '#F7F8FA', card: '#FFFFFF', bg2: '#F1F5F9', border: '#E2E8F0',
  primary: '#1F4FD8', primaryLight: 'rgba(31,79,216,0.08)',
  success: '#1D9E75', successDark: '#0F6E56', successLight: 'rgba(29,158,117,0.10)',
  amber: '#BA7517', critical: '#E24B4A',
  t1: '#1E293B', t2: '#64748B', t3: '#94A3B8',
};

function howToCheck(issue) {
  const d = issue.diagnostic || {};
  return d.visual_check || d.instruction || issue.issue?.symptoms?.[0]?.description || issue.issue?.severity_reason || '';
}

function costRange(issue) {
  const wc = issue.consequences?.worst_case_cost_rub;
  if (!wc || wc.min == null) return null;
  const fmt = (n) => Math.round(n / 1000) + 'к';
  return wc.min === wc.max ? `до ${fmt(wc.max)} ₽` : `${fmt(wc.min)}–${fmt(wc.max)} ₽`;
}

export default function BuyerChecklistScreen() {
  const navigate = useNavigate();
  const { userCar, carDetails, issuesData, loading } = useCar();
  const [checked, setChecked] = useState(() => new Set());

  const items = useMemo(() => {
    if (!issuesData) return [];
    const order = { critical: 0, high: 1, medium: 2 };
    return (issuesData.systemic || [])
      .filter(i => !isBodyRecord(i) && ['critical', 'high', 'medium'].includes(i.issue?.severity))
      .sort((a, b) => (order[a.issue?.severity] ?? 9) - (order[b.issue?.severity] ?? 9));
  }, [issuesData]);

  const recalls = issuesData?.recalls || [];

  if (!loading && !userCar) return <Navigate to="/add-car" replace />;

  const toggle = (id) => setChecked(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const carLabel = carDetails ? `${carDetails.brand} ${carDetails.model_name}` : 'этой модели';
  const engineLabel = carDetails?.engines?.find(e => e.code === userCar?.engineCode)?.label || '';
  const doneCount = items.filter(i => checked.has(i.id)).length;

  return (
    <div style={s.container}>
      <button style={s.back} onClick={() => navigate('/services')} aria-label="Назад">
        <Icon name="arrowLeft" size={22} color={c.t1} />
      </button>

      <h1 style={s.h1}>Чек-лист покупки</h1>
      <p style={s.intro}>
        Что проверить перед покупкой {carLabel}{engineLabel ? ` · ${engineLabel}` : ''}.
        Отмечайте по ходу осмотра — это места внимания, а не приговор.
      </p>

      {items.length > 0 && (
        <div style={s.progress}>
          <div style={s.progressBar}><div style={{ ...s.progressFill, width: `${(doneCount / items.length) * 100}%` }} /></div>
          <span style={s.progressNum}>{doneCount} из {items.length}</span>
        </div>
      )}

      {/* Сначала — VIN / отзывные */}
      <div style={s.vinCard}>
        <div style={s.vinHead}>
          <Icon name="shield" size={20} color={c.primary} />
          <span style={s.vinTitle}>Сначала пробей VIN</span>
        </div>
        <div style={s.vinText}>
          {recalls.length > 0
            ? `По этому поколению есть отзывные кампании (${recalls.length}). Проверь по VIN у дилера Hyundai, отработаны ли они у конкретной машины.`
            : 'Проверь историю по VIN: пробег, ДТП, залоги, отзывные кампании у дилера.'}
        </div>
      </div>

      {/* Критичное — проверить */}
      {items.length === 0 ? (
        <div style={s.empty}>Список мест внимания для этой модели ещё собираем.</div>
      ) : (
        <div style={s.list}>
          {items.map((it) => {
            const on = checked.has(it.id);
            const tip = howToCheck(it);
            const cost = costRange(it);
            const sev = it.issue?.severity;
            return (
              <div key={it.id} style={s.item}>
                <button style={s.checkbox} onClick={() => toggle(it.id)} aria-label={on ? 'Снять отметку' : 'Отметить проверенным'}>
                  <span style={{ ...s.box, ...(on ? s.boxOn : {}) }}>{on && <Icon name="check" size={14} color="#fff" />}</span>
                </button>
                <div style={s.itemBody} onClick={() => navigate(`/issues/${it.id}`)}>
                  <div style={{ ...s.itemTitle, ...(on ? s.itemTitleDone : {}) }}>
                    <span style={{ ...s.sevDot, background: sev === 'critical' ? c.critical : sev === 'high' ? c.amber : c.t3 }} />
                    {recordTitle(it)}
                  </div>
                  {tip && <div style={s.itemTip}>{tip}</div>}
                  {cost && <div style={s.itemCost}>Ремонт: {cost}</div>}
                </div>
                <Icon name="arrowRight" size={16} color={c.t3} style={{ flexShrink: 0, alignSelf: 'center' }} />
              </div>
            );
          })}
        </div>
      )}

      <div style={s.note}>
        <Icon name="info" size={17} color={c.t3} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>У любой машины есть типичные места внимания. Спокойно проверьте их — и поймёте, стоит ли торговаться или искать дальше.</span>
      </div>
    </div>
  );
}

const s = {
  container: { padding: '16px', paddingBottom: '90px', background: c.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" },
  back: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 8px', marginLeft: '-4px' },
  h1: { fontSize: '22px', fontWeight: '600', color: c.t1, margin: '0 2px 6px' },
  intro: { fontSize: '14px', color: c.t2, lineHeight: 1.5, margin: '0 2px 16px' },

  progress: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  progressBar: { flex: 1, height: '6px', background: c.bg2, borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', background: c.success, borderRadius: '4px', transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1)' },
  progressNum: { fontSize: '13px', color: c.t2, flexShrink: 0, fontVariantNumeric: 'tabular-nums' },

  vinCard: { background: c.primaryLight, borderRadius: '14px', padding: '14px 16px', marginBottom: '16px' },
  vinHead: { display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '6px' },
  vinTitle: { fontSize: '15px', fontWeight: '500', color: c.primary },
  vinText: { fontSize: '13px', color: c.primary, opacity: 0.85, lineHeight: 1.5 },

  list: { background: c.card, border: `0.5px solid ${c.border}`, borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' },
  item: { display: 'flex', gap: '12px', padding: '14px 16px', borderBottom: `0.5px solid ${c.border}` },
  checkbox: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, alignSelf: 'flex-start', marginTop: '1px' },
  box: { width: '22px', height: '22px', borderRadius: '7px', border: `1.5px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.card },
  boxOn: { background: c.success, borderColor: c.success },
  itemBody: { flex: 1, minWidth: 0, cursor: 'pointer' },
  itemTitle: { display: 'flex', alignItems: 'baseline', gap: '8px', fontSize: '14px', fontWeight: '500', color: c.t1, lineHeight: 1.35 },
  itemTitleDone: { color: c.t3, textDecoration: 'line-through' },
  sevDot: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, transform: 'translateY(-1px)' },
  itemTip: { fontSize: '13px', color: c.t2, lineHeight: 1.45, marginTop: '5px' },
  itemCost: { fontSize: '12px', color: c.t3, marginTop: '4px' },

  empty: { fontSize: '14px', color: c.t2, textAlign: 'center', padding: '24px', fontStyle: 'italic' },
  note: { display: 'flex', gap: '9px', background: c.bg2, borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: c.t2, lineHeight: 1.5 },
};
