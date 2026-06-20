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
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  package: <><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5 M12 22V12" /></>,
  bot: <><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M12 4v4 M9 2h6" /><circle cx="9" cy="14" r="1" /><circle cx="15" cy="14" r="1" /></>,
  pin: <><path d="M12 21s-6-5.7-6-10a6 6 0 0 1 12 0c0 4.3-6 10-6 10Z" /><circle cx="12" cy="11" r="2" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></>,
  bulb: <><path d="M9 18h6 M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" /></>,
  scale: <><path d="M12 3v18 M5 21h14 M7 7l-4 7a4 4 0 0 0 8 0L7 7Z M17 7l-4 7a4 4 0 0 0 8 0l-4-7Z M5 7h14" /></>,
  fileText: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5 M9 13h6 M9 17h4" /></>,
  factory: <><path d="M2 21h20 M4 21V10l5 3V10l5 3V7l6 4v10 M9 21v-4 M15 21v-4" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  wallet: <><path d="M19 7V5a2 2 0 0 0-2-2H6a3 3 0 0 0-3 3v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H6a3 3 0 0 1-3-3" /><path d="M16 12h.01" /></>,
  camera: <><path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4Z" /><circle cx="12" cy="13" r="3" /></>,
  clip: <path d="M21 8.5 12.5 17a4 4 0 0 1-6-5.5l8-8a3 3 0 0 1 4 4l-8 8a1.5 1.5 0 0 1-2-2L15 6" />,
  disc: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></>,
  sparkles: <path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4Z" />,
  send: <path d="M22 2 11 13 M22 2 15 22l-4-9-9-4Z" />,
  x: <path d="M18 6 6 18 M6 6l12 12" />,
  plus: <path d="M12 5v14 M5 12h14" />,
  arrowLeft: <path d="M19 12H5 m7 7-7-7 7-7" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5 M12 8h0" /></>,
  smile: <><circle cx="12" cy="12" r="9" /><path d="M8 14a4 4 0 0 0 8 0" /><path d="M9 9h0 M15 9h0" /></>,
  calendar: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4 M16 3v4 M4 10h16" /><path d="m9 15 2 2 4-4" /></>,
  gauge: <><path d="M12 14 15 9" /><circle cx="12" cy="14" r="1" /><path d="M4 18a8 8 0 1 1 16 0" /></>,
  // --- иконки раздела «Сервисы» ---
  store: <><path d="M3 9 4.5 4h15L21 9" /><path d="M5 9v11h14V9" /><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" /><path d="M9.5 20v-5h5v5" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  lifebuoy: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="m5.5 5.5 4 4 M18.5 5.5l-4 4 M5.5 18.5l4-4 M18.5 18.5l-4-4" /></>,
  truck: <><rect x="2" y="6" width="12" height="9" rx="1" /><path d="M14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
  battery: <><rect x="2" y="8" width="15" height="8" rx="1.5" /><path d="M20 11v2" /><path d="M9 9.5 7.5 12.5H10L8.5 15.5" /></>,
  key: <><circle cx="7.5" cy="15.5" r="3.5" /><path d="m10 13 8-8 M16 5l3 3 M13.5 7.5l2.5 2.5" /></>,
  fuel: <><path d="M3 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16 M2 21h13 M6 8h6" /><path d="M13 9h3a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3" /></>,
  cart: <><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.4 12h10l1.6-8H6" /></>,
  car: <><path d="M3 17v-4l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5v4 M3 13h18" /><circle cx="7.5" cy="17" r="1.6" /><circle cx="16.5" cy="17" r="1.6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M4.9 19.1l2.1-2.1 M17 7l2.1-2.1" /></>,
  gavel: <><path d="M14 3l7 7-2.5 2.5-7-7z" /><path d="m9.5 9.5-6.5 6.5 2.5 2.5 6.5-6.5 M3 21h9" /></>,
  dots: <><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
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
