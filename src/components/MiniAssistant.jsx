import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import MarkdownText from './MarkdownText';

// Мини-чат ассистента ПОВЕРХ онбординга (не роут). По конкретному вопросу-уточнению.
// Вопрос предзаполнен в поле и редактируется. «Вернуться к вопросам» закрывает оверлей
// и сообщает наружу, спрашивал ли пользователь (asked) — чтобы решить, откладывать ли вопрос.
const c = {
  bg: '#F7F8FA', card: '#FFFFFF', border: '#E2E8F0',
  primary: '#1F4FD8', primaryLight: 'rgba(31,79,216,0.08)',
  t1: '#1E293B', t2: '#64748B', t3: '#94A3B8',
};

export default function MiniAssistant({ questionText, topicLabel, carContext, onClose }) {
  const [input, setInput] = useState(questionText || '');
  const [messages, setMessages] = useState([]); // { role:'user'|'assistant', text }
  const [typing, setTyping] = useState(false);
  const askedRef = useRef(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const close = () => onClose(askedRef.current);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    askedRef.current = true;
    const history = messages.map(m => ({ role: m.role, text: m.text }));
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setTyping(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, carContext }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = (res.ok && data.text) ? data.text : (data.error || 'Не удалось получить ответ. Попробуйте ещё раз.');
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Нет связи с ассистентом. Проверьте интернет и попробуйте снова.' }]);
    } finally {
      setTyping(false);
    }
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div style={s.sheet}>
        <div style={s.header}>
          <div style={s.headLeft}>
            <div style={s.avatar}><Icon name="bot" size={18} color={c.primary} /></div>
            <div>
              <div style={s.title}>Ассистент</div>
              {topicLabel && <div style={s.sub}>По вопросу: «{topicLabel}»</div>}
            </div>
          </div>
          <button style={s.back} onClick={close}>Вернуться к вопросам</button>
        </div>

        <div ref={scrollRef} style={s.body}>
          {messages.length === 0 && (
            <div style={s.hintEmpty}>Спросите про этот момент — отвечу по вашей машине. Вопрос можно отредактировать.</div>
          )}
          {messages.map((m, i) => (
            m.role === 'user'
              ? <div key={i} style={s.userRow}><div style={s.userBubble}>{m.text}</div></div>
              : <div key={i} style={s.botRow}>
                  <div style={s.avatarSm}><Icon name="bot" size={15} color={c.primary} /></div>
                  <div style={s.botBubble}><MarkdownText text={m.text} /></div>
                </div>
          ))}
          {typing && (
            <div style={s.botRow}>
              <div style={s.avatarSm}><Icon name="bot" size={15} color={c.primary} /></div>
              <div style={s.botBubble}><span style={s.dots}>…</span></div>
            </div>
          )}
        </div>

        <div style={s.inputRow}>
          <input
            style={s.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Спросите про этот момент…"
            aria-label="Вопрос ассистенту"
          />
          <button style={{ ...s.sendBtn, opacity: input.trim() ? 1 : 0.5 }} onClick={send} disabled={!input.trim()} aria-label="Отправить">
            <Icon name="send" size={18} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: 'fixed', inset: 0, zIndex: 2200, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" },
  sheet: { width: '100%', maxWidth: '440px', height: '82vh', background: c.bg, borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '14px 16px', background: c.card, borderBottom: `1px solid ${c.border}`, flexShrink: 0 },
  headLeft: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 },
  avatar: { width: '34px', height: '34px', borderRadius: '10px', background: c.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: '15px', fontWeight: '600', color: c.t1 },
  sub: { fontSize: '12px', color: c.t3, marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' },
  back: { flexShrink: 0, background: 'none', border: 'none', color: c.primary, fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  body: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px' },
  hintEmpty: { fontSize: '13px', color: c.t3, lineHeight: 1.5, textAlign: 'center', padding: '20px 12px' },
  userRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' },
  userBubble: { maxWidth: '80%', background: c.primary, color: '#fff', padding: '10px 14px', borderRadius: '14px 14px 4px 14px', fontSize: '14px', lineHeight: 1.4 },
  botRow: { display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' },
  avatarSm: { width: '28px', height: '28px', borderRadius: '8px', background: c.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  botBubble: { flex: 1, background: c.card, border: `1px solid ${c.border}`, padding: '10px 14px', borderRadius: '14px 14px 14px 4px' },
  dots: { fontSize: '20px', color: c.t3, letterSpacing: '2px' },
  inputRow: { display: 'flex', gap: '8px', padding: '12px 16px 22px', background: c.card, borderTop: `1px solid ${c.border}`, flexShrink: 0 },
  input: { flex: 1, padding: '12px 14px', borderRadius: '12px', border: `1px solid ${c.border}`, fontSize: '14px', fontFamily: 'inherit', outline: 'none', color: c.t1 },
  sendBtn: { width: '44px', flexShrink: 0, borderRadius: '12px', border: 'none', background: c.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
