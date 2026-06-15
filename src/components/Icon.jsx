import React from 'react';

// Inline-SVG иконки в стиле Lucide (тонкая линия, stroke=currentColor).
// Без внешних зависимостей и без эмодзи. Цвет/размер — через props.
const PATHS = {
  home: <><path d="M3 9.5 12 3l9 6.5" /><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" /><path d="M9 21v-6h6v6" /></>,
  wrench: <path d="M14.7 6.3a4 4 0 0 0 5 5l-2.6 2.6-5-5 2.6-2.6Z M11.4 8.9 4.5 15.8a2.1 2.1 0 0 0 3 3l6.9-6.9" />,
  clipboard: <><rect x="8" y="3" width="8" height="4" rx="1" /><path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" /><path d="M9 12h6 M9 16h4" /></>,
  chat: <path d="M21 11.5a8 8 0 0 1-8.5 8 9 9 0 0 1-3.8-.8L3 21l1.3-4.5A8 8 0 0 1 4 11.5a8 8 0 0 1 8.5-8 8 8 0 0 1 8.5 8Z" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></>,
  pencil: <path d="M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowRight: <path d="M5 12h14 m-7-7 7 7-7 7" />,
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  zap: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />,
  droplet: <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5 12 2.7C11.5 5 10 7.4 8 9.5 6 11.1 5 13 5 15a7 7 0 0 0 7 7Z" />,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16 M10 14.7V18 M14 14.7V18 M8 21h8" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4 M12 17h0" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="M12 8v4 M12 16h0" /></>,
};

export default function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {path}
    </svg>
  );
}
