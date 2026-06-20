import React, { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import Icon from './Icon';
import { getService } from './servicesCatalog';
import { trackServiceInterest, isNotified } from '../services/serviceAnalytics';

// Детальная страница сервиса: описание + «В разработке» + кнопка «Уведомить».
const c = {
  bg: '#F7F8FA', card: '#FFFFFF', bg2: '#F1F5F9', border: '#E2E8F0',
  primary: '#1F4FD8', primaryLight: 'rgba(31,79,216,0.08)',
  success: '#1D9E75', successDark: '#0F6E56', successLight: 'rgba(29,158,117,0.10)',
  t1: '#1E293B', t2: '#64748B', t3: '#94A3B8',
};

export default function ServiceDetailScreen() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const svc = getService(serviceId);
  const [done, setDone] = useState(() => (serviceId ? isNotified(serviceId) : false));

  if (!svc) return <Navigate to="/services" replace />;

  const notify = () => {
    if (done) return;
    trackServiceInterest(serviceId, { title: svc.title });
    setDone(true);
  };

  return (
    <div style={s.container}>
      <button style={s.back} onClick={() => navigate('/services')} aria-label="Назад">
        <Icon name="arrowLeft" size={22} color={c.t1} />
      </button>

      <div style={s.iconBox}><Icon name={svc.icon} size={32} color={c.primary} /></div>
      <div style={s.statusRow}>
        <span style={s.statusTag}>В разработке</span>
        {svc.group && <span style={s.group}>{svc.group}</span>}
      </div>
      <h1 style={s.h1}>{svc.title}</h1>
      <p style={s.desc}>{svc.desc}</p>

      <button style={{ ...s.notify, ...(done ? s.notifyDone : {}) }} onClick={notify} disabled={done}>
        <Icon name={done ? 'check' : 'bell'} size={18} color={done ? c.successDark : '#fff'} />
        {done ? 'Уведомим, когда заработает' : 'Уведомить о запуске'}
      </button>
      {done && <div style={s.doneHint}>Спасибо! Сообщим вам, как только сервис заработает.</div>}

      <div style={s.note}>
        <Icon name="info" size={17} color={c.t3} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Запускаем сервисы с проверенными партнёрами. Ваш интерес помогает нам понять, что подключать в первую очередь.</span>
      </div>
    </div>
  );
}

const s = {
  container: { padding: '16px', paddingBottom: '90px', background: c.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" },
  back: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 12px', marginLeft: '-4px' },
  iconBox: { width: '64px', height: '64px', borderRadius: '16px', background: c.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' },
  statusRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  statusTag: { fontSize: '12px', fontWeight: '500', color: c.t2, background: c.bg2, padding: '3px 10px', borderRadius: '7px' },
  group: { fontSize: '12px', color: c.t3 },
  h1: { fontSize: '24px', fontWeight: '600', color: c.t1, margin: '0 0 10px', lineHeight: 1.2 },
  desc: { fontSize: '15px', color: c.t2, lineHeight: 1.55, margin: '0 0 24px' },
  notify: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', padding: '15px', borderRadius: '14px', border: 'none', background: c.primary, color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  notifyDone: { background: c.successLight, color: c.successDark, cursor: 'default' },
  doneHint: { fontSize: '13px', color: c.t2, textAlign: 'center', marginTop: '10px', lineHeight: 1.5 },
  note: { display: 'flex', gap: '9px', background: c.bg2, borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: c.t2, lineHeight: 1.5, marginTop: '28px' },
};
