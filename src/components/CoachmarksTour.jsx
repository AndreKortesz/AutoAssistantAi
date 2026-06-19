import React, { useState, useLayoutEffect } from 'react';

// Коачмарк-тур: затемняет экран, «вырезает» подсветку на целевом элементе,
// рядом — баблик с подписью и «Далее»/«Пропустить». Не слайды — поверх реального экрана.
// steps: [{ targetRef, title, text, onEnter? }]
const c = { card: '#FFFFFF', primary: '#1F4FD8', t1: '#1E293B', t2: '#64748B', t3: '#94A3B8' };

export default function CoachmarksTour({ steps, onClose }) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState(null);
  const step = steps[idx];

  useLayoutEffect(() => {
    step?.onEnter?.();
    const measure = () => {
      const el = step?.targetRef?.current;
      if (el) setRect(el.getBoundingClientRect());
    };
    measure();
    const t = setTimeout(measure, 80); // после возможного перерендера контента вкладки
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  if (!rect) return null;
  const last = idx === steps.length - 1;
  const pad = 6;

  return (
    <div style={st.overlay} onClick={(e) => { if (e.target === e.currentTarget) {} }}>
      {/* Вырез-подсветка: огромная тень делает всё вокруг тёмным, сам элемент — ярким */}
      <div style={{
        position: 'fixed', top: rect.top - pad, left: rect.left - pad,
        width: rect.width + pad * 2, height: rect.height + pad * 2,
        borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
        pointerEvents: 'none', transition: 'all 0.25s ease',
      }} />
      <div style={{ ...st.bubble, top: rect.bottom + 12 }}>
        <div style={st.titleRow}>
          <span style={st.title}>{step.title}</span>
          <span style={st.count}>{idx + 1}/{steps.length}</span>
        </div>
        <div style={st.text}>{step.text}</div>
        <div style={st.actions}>
          <button style={st.skip} onClick={onClose}>Пропустить</button>
          <button style={st.next} onClick={() => (last ? onClose() : setIdx(idx + 1))}>
            {last ? 'Понятно' : 'Далее'}
          </button>
        </div>
      </div>
    </div>
  );
}

const st = {
  overlay: { position: 'fixed', inset: 0, zIndex: 2000, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" },
  bubble: { position: 'fixed', left: 16, right: 16, maxWidth: '388px', margin: '0 auto', background: c.card, borderRadius: '14px', padding: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.25)' },
  titleRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px' },
  title: { fontSize: '15px', fontWeight: '600', color: c.t1 },
  count: { fontSize: '12px', color: c.t3, flexShrink: 0, marginLeft: '10px' },
  text: { fontSize: '13px', color: c.t2, lineHeight: 1.5 },
  actions: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' },
  skip: { background: 'none', border: 'none', color: c.t3, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' },
  next: { background: c.primary, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
};
