import React from 'react';

// Силуэт авто пользователя. Кузов красится в выбранный цвет, поверх —
// полупрозрачные блик/стекло/тень, поэтому один силуэт читается в любом цвете.
// Колёса нейтральные (не красятся). Для MVP — один универсальный спортивный
// силуэт + fallback-цвет. По мере роста каталога можно добавить SVG по моделям.
//
// props: color (hex из CAR_COLORS), animate (bool — выезд+блик), width, height

const DEFAULT_COLOR = '#B8BCC2'; // серебро по умолчанию

export default function CarSilhouette({ color, animate = false, width = 92, height = 50 }) {
  const body = color || DEFAULT_COLOR;
  return (
    <div
      style={{ position: 'relative', width, height, flexShrink: 0, overflow: 'hidden' }}
      className={animate ? 'aaa-car-in' : undefined}
    >
      <svg width={width} height={height} viewBox="0 0 184 100" role="img" aria-label="Силуэт автомобиля">
        {/* тень под машиной */}
        <ellipse cx="92" cy="90" rx="80" ry="5" fill="rgba(0,0,0,0.07)" />
        {/* кузов — красится */}
        <path d="M16 68 Q19 52 48 49 L76 45 Q98 30 134 29 Q164 29 182 46 L182 66 Q182 70 176 70 L22 70 Q16 70 16 67 Z" fill={body} />
        {/* нижняя тень кузова */}
        <path d="M16 68 Q19 52 48 49 L60 48 L60 70 L22 70 Q16 70 16 67 Z" fill="rgba(0,0,0,0.14)" />
        {/* стекло */}
        <path d="M80 45 Q100 33 132 32 Q156 33 174 46 Z" fill="rgba(255,255,255,0.28)" />
        {/* блик по кузову */}
        <path d="M30 53 Q70 47 170 49 L170 52 Q70 50 30 56 Z" fill="rgba(255,255,255,0.32)" />
        {/* колёса — нейтральные */}
        <circle cx="60" cy="70" r="16" fill="#15171D" />
        <circle cx="60" cy="70" r="16" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
        <circle cx="60" cy="70" r="6" fill="#5F5E5A" />
        <circle cx="158" cy="70" r="16" fill="#15171D" />
        <circle cx="158" cy="70" r="16" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
        <circle cx="158" cy="70" r="6" fill="#5F5E5A" />
      </svg>
      {animate && (
        <div className="aaa-shine" style={{ position: 'absolute', top: 0, left: 0, width: 22, height: '100%', background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.85), transparent)', transform: 'skewX(-18deg)' }} />
      )}
    </div>
  );
}
