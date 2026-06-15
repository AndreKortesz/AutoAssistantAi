import React from 'react';

// Силуэт авто. Кузов красится в выбранный цвет, поверх — полупрозрачные
// блик/стекло/тень, поэтому один силуэт читается в любом цвете. Колёса
// нейтральные. Форма выбирается по типу кузова (bodyType).
//
// props: color (hex), bodyType ('Седан'|'Хэтчбек'|'Кроссовер'|'Универсал'|'Купе'|'Внедорожник'),
//        animate (bool), width, height

const DEFAULT_COLOR = '#B8BCC2';

// viewBox 0 0 184 100. Для каждого типа — путь кузова, стекло и параметры колёс.
const SHAPES = {
  sedan: {
    body: 'M12 70 V62 Q12 54 28 51 L62 47 Q72 37 98 36 L122 37 Q134 39 142 48 L168 54 Q172 56 172 62 V70 Z',
    glass: 'M66 47 Q74 38 98 37 L120 38 Q130 40 136 47 Z',
    wheels: [54, 150], r: 15, wy: 70,
  },
  hatchback: {
    body: 'M12 70 V62 Q12 54 28 51 L60 47 Q70 37 96 36 L126 38 Q150 43 156 58 L156 70 Z',
    glass: 'M64 47 Q73 38 96 37 L122 39 Q138 43 144 56 Z',
    wheels: [52, 138], r: 15, wy: 70,
  },
  wagon: {
    body: 'M12 70 V60 Q12 52 28 49 L60 45 Q70 35 96 34 L150 36 Q166 39 168 52 L168 70 Z',
    glass: 'M64 45 Q73 35 96 34 L146 36 Q156 39 160 50 Z',
    wheels: [52, 150], r: 15, wy: 70,
  },
  crossover: {
    body: 'M10 68 V52 Q12 42 30 39 L60 35 Q70 25 100 25 L134 27 Q156 31 166 44 L172 50 Q174 52 174 60 V68 Z',
    glass: 'M66 37 Q74 27 100 27 L130 29 Q146 33 152 43 Z',
    wheels: [54, 150], r: 18, wy: 68,
  },
  coupe: {
    body: 'M16 68 Q19 52 48 49 L76 45 Q98 30 134 29 Q164 29 182 46 L182 66 Q182 70 176 70 L22 70 Q16 70 16 67 Z',
    glass: 'M80 45 Q100 33 132 32 Q156 33 174 46 Z',
    wheels: [56, 152], r: 16, wy: 70,
  },
  offroader: {
    body: 'M10 66 V42 Q10 38 16 38 L44 36 L50 30 Q52 28 60 28 L150 28 Q160 28 162 35 L170 40 Q174 42 174 48 V66 Z',
    glass: 'M54 36 L116 36 L116 44 L54 44 Z',
    wheels: [52, 150], r: 18, wy: 66,
  },
};

const TYPE_TO_SHAPE = {
  'Седан': 'sedan',
  'Хэтчбек': 'hatchback',
  'Универсал': 'wagon',
  'Кроссовер': 'crossover',
  'Купе': 'coupe',
  'Внедорожник': 'offroader',
};

export default function CarSilhouette({ color, bodyType, animate = false, width = 92, height = 50 }) {
  const body = color || DEFAULT_COLOR;
  const shape = SHAPES[TYPE_TO_SHAPE[bodyType]] || SHAPES.sedan;
  const [w1, w2] = shape.wheels;
  const r = shape.r;
  const wy = shape.wy;

  return (
    <div
      style={{ position: 'relative', width, height, flexShrink: 0, overflow: 'hidden' }}
      className={animate ? 'aaa-car-in' : undefined}
    >
      <svg width={width} height={height} viewBox="0 0 184 100" role="img" aria-label={`Силуэт: ${bodyType || 'авто'}`}>
        <ellipse cx="92" cy="92" rx="82" ry="5" fill="rgba(0,0,0,0.07)" />
        {/* кузов — красится */}
        <path d={shape.body} fill={body} />
        {/* лёгкая нижняя тень по кузову */}
        <path d={shape.body} fill="rgba(0,0,0,0.10)" transform="translate(0,2)" opacity="0.25" />
        {/* стекло */}
        <path d={shape.glass} fill="rgba(255,255,255,0.30)" />
        {/* блик */}
        <path d="M30 50 Q90 44 168 48 L168 51 Q90 47 30 53 Z" fill="rgba(255,255,255,0.30)" />
        {/* колёса */}
        {[w1, w2].map((cx, i) => (
          <g key={i}>
            <circle cx={cx} cy={wy} r={r} fill="#15171D" />
            <circle cx={cx} cy={wy} r={r} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
            <circle cx={cx} cy={wy} r={r * 0.38} fill="#5F5E5A" />
          </g>
        ))}
      </svg>
      {animate && (
        <div className="aaa-shine" style={{ position: 'absolute', top: 0, left: 0, width: 22, height: '100%', background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.85), transparent)', transform: 'skewX(-18deg)' }} />
      )}
    </div>
  );
}
