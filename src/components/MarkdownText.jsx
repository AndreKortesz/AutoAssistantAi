import React from 'react';

// Лёгкий рендер markdown от Gemini: абзацы, маркированные/нумерованные списки, **жирный**.
// Общий компонент для полного ассистента и мини-чата онбординга.
function inlineBold(text, keyBase) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={`${keyBase}-${i}`}>{part}</strong> : part
  );
}

export default function MarkdownText({ text, color = '#1E293B' }) {
  const lines = (text || '').split('\n');
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push(list); list = null; } };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { flush(); continue; }
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ol) {
      if (!list || !list.ordered) { flush(); list = { ordered: true, items: [] }; }
      list.items.push(ol[1]);
    } else if (ul) {
      if (!list || list.ordered) { flush(); list = { ordered: false, items: [] }; }
      list.items.push(ul[1]);
    } else {
      flush();
      blocks.push({ para: line.trim() });
    }
  }
  flush();

  const p = { fontSize: '14px', color, lineHeight: 1.55, margin: '0 0 8px' };
  const listS = { margin: '0 0 8px', paddingLeft: '20px' };
  const li = { fontSize: '14px', color, lineHeight: 1.5, marginBottom: '5px' };

  return (
    <>
      {blocks.map((b, bi) => {
        if (b.para !== undefined) return <p key={bi} style={p}>{inlineBold(b.para, `p${bi}`)}</p>;
        const items = b.items.map((it, ii) => <li key={ii} style={li}>{inlineBold(it, `l${bi}-${ii}`)}</li>);
        return b.ordered ? <ol key={bi} style={listS}>{items}</ol> : <ul key={bi} style={listS}>{items}</ul>;
      })}
    </>
  );
}
