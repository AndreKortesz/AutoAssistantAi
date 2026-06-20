import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { trackServiceInterest, isNotified } from '../services/serviceAnalytics';

// Раздел «Сервисы» — витрина услуг (все пока заглушки «скоро» + сбор интереса).
// Светлый стиль, единый с приложением. НЕ тёмная тема. Иконки сервисов — info-цвет.
const c = {
  bg: '#F7F8FA', card: '#FFFFFF', bg2: '#F1F5F9', border: '#E2E8F0',
  primary: '#1F4FD8', primaryLight: 'rgba(31,79,216,0.08)',
  success: '#1D9E75', successDark: '#0F6E56', successLight: 'rgba(29,158,117,0.10)',
  t1: '#1E293B', t2: '#64748B', t3: '#94A3B8',
};

// Кнопка «Уведомить» → событие интереса + состояние «Уведомим ✓» (в рамках сессии не жмётся повторно).
function NotifyButton({ serviceId, full }) {
  const [done, setDone] = useState(() => isNotified(serviceId));
  const onClick = (e) => {
    e.stopPropagation();
    if (done) return;
    trackServiceInterest(serviceId);
    setDone(true);
  };
  return (
    <button
      style={{ ...s.notify, ...(full ? { width: '100%' } : {}), ...(done ? s.notifyDone : {}) }}
      onClick={onClick}
      aria-label={done ? 'Уведомим о запуске' : 'Уведомить, когда сервис заработает'}
    >
      <Icon name={done ? 'check' : 'bell'} size={14} color={done ? c.success : c.primary} />
      {done ? 'Уведомим' : 'Уведомить'}
    </button>
  );
}

// Строка-сервис в списке (блоки 1 и 2). Тап по «скоро»-строке = интерес.
function ListRow({ icon, title, serviceId, doneFeature, onOpen, last }) {
  const [notified, setNotified] = useState(() => (serviceId ? isNotified(serviceId) : false));
  const handle = () => {
    if (doneFeature) { onOpen?.(); return; }
    if (!notified) { trackServiceInterest(serviceId); setNotified(true); }
  };
  return (
    <button style={{ ...s.row, ...(last ? {} : s.rowBorder) }} onClick={handle} aria-label={title}>
      <Icon name={icon} size={20} color={c.primary} />
      <span style={s.rowTitle}>{title}</span>
      {doneFeature
        ? <span style={s.doneTag}>готово</span>
        : <span style={notified ? s.notifiedTag : s.soonInline}>{notified ? 'Уведомим ✓' : 'скоро'}</span>}
    </button>
  );
}

// Карточка-заглушка в сетке (блок 3).
function GridCard({ icon, title, serviceId, special, onClick }) {
  return (
    <div style={{ ...s.gridCard, ...(special ? { background: c.bg2 } : {}) }} onClick={onClick}>
      <span style={s.soonTag}>скоро</span>
      <Icon name={icon} size={25} color={c.primary} />
      <div style={s.gridTitle}>{title}</div>
      {serviceId && <NotifyButton serviceId={serviceId} full />}
    </div>
  );
}

export default function ServicesScreen() {
  const navigate = useNavigate();
  const [roadOpen, setRoadOpen] = useState(false);

  const roadSubs = [
    { id: 'road_tow', icon: 'truck', title: 'Эвакуатор' },
    { id: 'road_jump', icon: 'battery', title: 'Прикурить / сел аккумулятор' },
    { id: 'road_unlock', icon: 'key', title: 'Вскрытие / закрыл ключи' },
    { id: 'road_fuel', icon: 'fuel', title: 'Закончилось топливо' },
    { id: 'road_accident', icon: 'alert', title: 'Аварийный комиссар при ДТП' },
  ];

  const ownerGrid = [
    { id: 'osago', icon: 'shield', title: 'ОСАГО и КАСКО' },
    { id: 'service_search', icon: 'wrench', title: 'Автосервисы' },
    { id: 'parts', icon: 'settings', title: 'Запчасти' },
    { id: 'tire_detail', icon: 'droplet', title: 'Шиномонтаж и детейлинг' },
    { id: 'legal', icon: 'gavel', title: 'Юридическая помощь' },
  ];

  return (
    <div style={s.container}>
      <h1 style={s.h1}>Сервисы</h1>

      {/* Блок 0 — промо-баннер */}
      <div style={s.promo}>
        <div style={s.promoText}>
          <div style={s.promoTitle}>Всё для машины — в одном месте</div>
          <div style={s.promoSub}>Эвакуатор, страховка, эксперт и сервисы. Запускаем с проверенными партнёрами.</div>
        </div>
        <Icon name="store" size={40} color={c.primary} style={{ opacity: 0.45, flexShrink: 0 }} />
      </div>

      {/* Блок 1 — Помощь в дороге (раскрывается) */}
      <button style={s.roadHead} onClick={() => setRoadOpen(o => !o)} aria-expanded={roadOpen}>
        <div style={s.roadIconBox}><Icon name="lifebuoy" size={22} color={c.primary} /></div>
        <div style={s.roadInfo}>
          <div style={s.roadTitle}>Помощь в дороге</div>
          <div style={s.roadSub}>Эвакуатор, прикурить, вскрытие, топливо, ДТП</div>
        </div>
        <Icon name="chevronDown" size={18} color={c.primary} style={{ transform: roadOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>
      {roadOpen && (
        <div style={s.listCard}>
          {roadSubs.map((r, i) => (
            <ListRow key={r.id} icon={r.icon} title={r.title} serviceId={r.id} last={i === roadSubs.length - 1} />
          ))}
        </div>
      )}

      {/* Блок 2 — Выбираете машину? */}
      <div style={s.subHead}><Icon name="cart" size={17} color={c.t2} /><span style={s.subHeadText}>Выбираете машину?</span></div>
      <div style={s.listCard}>
        <ListRow icon="check" title="Чек-лист подбора б/у" doneFeature onOpen={() => navigate('/issues')} />
        <ListRow icon="search" title="Проверка истории" serviceId="history_check" />
        <ListRow icon="user" title="Выездной эксперт" serviceId="field_expert" />
        <ListRow icon="clipboard" title="Объявления с болячками" serviceId="listings" last />
      </div>

      {/* Блок 3 — Уже есть машина */}
      <div style={s.subHead}><Icon name="car" size={17} color={c.t2} /><span style={s.subHeadText}>Уже есть машина</span></div>
      <div style={s.grid}>
        {ownerGrid.map(g => <GridCard key={g.id} icon={g.icon} title={g.title} serviceId={g.id} />)}
        <GridCard icon="dots" title="Все сервисы" special onClick={() => trackServiceInterest('all_services')} />
      </div>

      {/* Плашка-пояснение */}
      <div style={s.note}>
        <Icon name="info" size={17} color={c.t3} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Сервисы запускаем с проверенными партнёрами. Нажмите «Уведомить» — сообщим, когда заработает.</span>
      </div>
    </div>
  );
}

const s = {
  container: { padding: '16px', paddingBottom: '90px', background: c.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" },
  h1: { fontSize: '20px', fontWeight: '500', color: c.t1, margin: '4px 2px 16px' },

  promo: { display: 'flex', alignItems: 'center', gap: '14px', background: c.primaryLight, borderRadius: '16px', padding: '18px', marginBottom: '18px' },
  promoText: { flex: 1, minWidth: 0 },
  promoTitle: { fontSize: '16px', fontWeight: '500', color: c.primary, marginBottom: '4px' },
  promoSub: { fontSize: '13px', color: c.primary, opacity: 0.85, lineHeight: 1.45 },

  roadHead: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: c.primaryLight, border: 'none', borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: '8px' },
  roadIconBox: { width: '42px', height: '42px', background: c.card, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roadInfo: { flex: 1, minWidth: 0 },
  roadTitle: { fontSize: '15px', fontWeight: '500', color: c.primary },
  roadSub: { fontSize: '12px', color: c.primary, opacity: 0.8, marginTop: '2px' },

  listCard: { background: c.card, border: `0.5px solid ${c.border}`, borderRadius: '14px', overflow: 'hidden', marginBottom: '18px' },
  row: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' },
  rowBorder: { borderBottom: `0.5px solid ${c.border}` },
  rowTitle: { flex: 1, fontSize: '14px', color: c.t1, minWidth: 0 },
  soonInline: { fontSize: '11px', fontWeight: '500', color: c.t3, background: c.bg2, padding: '2px 8px', borderRadius: '6px', flexShrink: 0 },
  notifiedTag: { fontSize: '11px', fontWeight: '500', color: c.success, background: c.successLight, padding: '2px 8px', borderRadius: '6px', flexShrink: 0 },
  doneTag: { fontSize: '11px', fontWeight: '500', color: c.successDark, background: c.successLight, padding: '2px 8px', borderRadius: '6px', flexShrink: 0 },

  subHead: { display: 'flex', alignItems: 'center', gap: '7px', margin: '0 2px 10px' },
  subHeadText: { fontSize: '15px', fontWeight: '500', color: c.t1 },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' },
  gridCard: { position: 'relative', background: c.card, border: `0.5px solid ${c.border}`, borderRadius: '14px', padding: '15px', cursor: 'pointer' },
  soonTag: { position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: '500', color: c.t3, background: c.bg2, padding: '2px 7px', borderRadius: '6px' },
  gridTitle: { fontSize: '14px', fontWeight: '500', color: c.t1, margin: '10px 0 12px', lineHeight: 1.3 },
  notify: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '9px', background: c.bg2, border: 'none', fontSize: '12px', fontWeight: '500', color: c.t1, cursor: 'pointer', fontFamily: 'inherit' },
  notifyDone: { color: c.successDark },

  note: { display: 'flex', gap: '9px', background: c.bg2, borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: c.t2, lineHeight: 1.5 },
};
