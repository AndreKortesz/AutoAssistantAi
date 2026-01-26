import React, { useState, useEffect } from 'react';

// AutoAssistantAi Onboarding — Fixed Version
// Реальный логотип + единый стиль кнопок (без золотой кнопки)

const slides = [
  {
    id: 1,
    illustration: 'dashboard',
    title: "Индекс здоровья",
    subtitle: "вашего авто",
    description: "Видите состояние всех систем автомобиля в одном месте. Знаете, что требует внимания прямо сейчас.",
    stat: null,
    statLabel: null
  },
  {
    id: 2,
    illustration: 'predictive',
    title: "Предупреждаем о проблемах",
    subtitle: "до поломки",
    description: "Знаем типичные болячки вашей конфигурации двигатель + КПП. Предупредим заранее — за 5 000 км до возможной проблемы.",
    stat: "38%",
    statLabel: "владельцев сталкиваются с этой проблемой на 90–110 тыс. км"
  },
  {
    id: 3,
    illustration: 'savings',
    title: "Помогаем не переплачивать",
    subtitle: "за ремонт",
    description: "Честная оценка стоимости работ и запчастей. Покажем, где дешевле и надёжнее — без навязывания.",
    stat: "−40%",
    statLabel: "средняя экономия на ремонте с нашими рекомендациями"
  },
  {
    id: 4,
    illustration: 'history',
    title: "Вся история авто",
    subtitle: "в одном месте",
    description: "Фотографируйте чеки — мы сами распознаем и добавим в журнал. При продаже покажете полную историю обслуживания.",
    stat: "+15%",
    statLabel: "к цене авто с документированной историей"
  }
];

// Цветовая схема
const colors = {
  background: '#F7F8FA',
  backgroundGradient: 'linear-gradient(180deg, #FFFFFF 0%, #F7F8FA 100%)',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  
  primary: '#1F4FD8',      // Синий из брендбука
  primaryDark: '#1A3FB0',
  secondary: '#3B7DED',
  
  success: '#2E9E6F',
  warning: '#F5A623',
  critical: '#E5533D',
  
  textPrimary: '#2A2E35',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
};

// SVG Иллюстрации — улучшенные
const Illustrations = {
  // Мини-дашборд с индексом здоровья
  dashboard: ({ color }) => (
    <svg viewBox="0 0 140 150" fill="none" style={{ width: '100%', height: '100%' }}>
      {/* Карточка дашборда */}
      <rect x="10" y="5" width="120" height="140" rx="12" fill="#FFFFFF" stroke={colors.border} strokeWidth="1.5" />
      
      {/* Заголовок */}
      <text x="70" y="24" textAnchor="middle" fill={colors.textPrimary} fontSize="9" fontWeight="600" fontFamily="system-ui">Hyundai Solaris</text>
      <text x="70" y="35" textAnchor="middle" fill={colors.textTertiary} fontSize="7" fontFamily="system-ui">1.6 AT • 87 000 км</text>
      
      {/* Круговой индикатор здоровья */}
      <circle cx="70" cy="68" r="28" stroke={colors.border} strokeWidth="6" fill="none" />
      <circle 
        cx="70" 
        cy="68" 
        r="28" 
        stroke={colors.success} 
        strokeWidth="6" 
        fill="none" 
        strokeLinecap="round"
        strokeDasharray="132"
        strokeDashoffset="33"
        transform="rotate(-90 70 68)"
      />
      <text x="70" y="65" textAnchor="middle" fill={colors.textPrimary} fontSize="18" fontWeight="700" fontFamily="system-ui">74</text>
      <text x="70" y="76" textAnchor="middle" fill={colors.textTertiary} fontSize="7" fontFamily="system-ui">из 100</text>
      
      {/* Мини-индикаторы систем */}
      <g transform="translate(20, 105)">
        {/* Двигатель */}
        <rect x="0" y="0" width="28" height="28" rx="6" fill="rgba(46, 158, 111, 0.1)" />
        <text x="14" y="12" textAnchor="middle" fill={colors.success} fontSize="10" fontWeight="600" fontFamily="system-ui">78</text>
        <text x="14" y="22" textAnchor="middle" fill={colors.textTertiary} fontSize="5" fontFamily="system-ui">мотор</text>
        
        {/* Коробка */}
        <rect x="32" y="0" width="28" height="28" rx="6" fill="rgba(46, 158, 111, 0.1)" />
        <text x="46" y="12" textAnchor="middle" fill={colors.success} fontSize="10" fontWeight="600" fontFamily="system-ui">82</text>
        <text x="46" y="22" textAnchor="middle" fill={colors.textTertiary} fontSize="5" fontFamily="system-ui">КПП</text>
        
        {/* Подвеска */}
        <rect x="64" y="0" width="28" height="28" rx="6" fill="rgba(245, 166, 35, 0.15)" />
        <text x="78" y="12" textAnchor="middle" fill={colors.warning} fontSize="10" fontWeight="600" fontFamily="system-ui">61</text>
        <text x="78" y="22" textAnchor="middle" fill={colors.textTertiary} fontSize="5" fontFamily="system-ui">подв.</text>
        
        {/* Тормоза */}
        <rect x="96" y="0" width="28" height="28" rx="6" fill="rgba(229, 83, 61, 0.12)" />
        <text x="110" y="12" textAnchor="middle" fill={colors.critical} fontSize="10" fontWeight="600" fontFamily="system-ui">45</text>
        <text x="110" y="22" textAnchor="middle" fill={colors.textTertiary} fontSize="5" fontFamily="system-ui">тормоза</text>
      </g>
    </svg>
  ),

  predictive: ({ color }) => (
    <svg viewBox="0 0 120 120" fill="none" style={{ width: '100%', height: '100%' }}>
      {/* Автомобиль */}
      <path 
        d="M18 72 L24 56 L42 50 L78 50 L96 56 L102 72 L102 82 L18 82 Z" 
        stroke={color} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="rgba(31, 79, 216, 0.04)"
      />
      <circle cx="36" cy="82" r="9" stroke={color} strokeWidth="2.5" fill="#fff" />
      <circle cx="36" cy="82" r="4" fill={color} opacity="0.2" />
      <circle cx="84" cy="82" r="9" stroke={color} strokeWidth="2.5" fill="#fff" />
      <circle cx="84" cy="82" r="4" fill={color} opacity="0.2" />
      <path d="M44 50 L48 60 L72 60 L76 50" stroke={color} strokeWidth="2" strokeLinecap="round" fill="rgba(31, 79, 216, 0.06)" />
      
      {/* Щит защиты */}
      <path 
        d="M60 12 L78 20 L78 38 C78 50 60 58 60 58 C60 58 42 50 42 38 L42 20 Z" 
        stroke={color} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="rgba(31, 79, 216, 0.06)"
      />
      <path 
        d="M51 34 L57 40 L69 28" 
        stroke={colors.success} 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Сигналы */}
      <g opacity="0.5">
        <circle cx="12" cy="68" r="2" fill={color}>
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="6" cy="68" r="2" fill={color}>
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.2s" />
        </circle>
        <circle cx="108" cy="68" r="2" fill={color}>
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.4s" />
        </circle>
        <circle cx="114" cy="68" r="2" fill={color}>
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.6s" />
        </circle>
      </g>
    </svg>
  ),
  
  savings: ({ color }) => (
    <svg viewBox="0 0 120 120" fill="none" style={{ width: '100%', height: '100%' }}>
      {/* Кошелёк */}
      <rect x="15" y="32" width="58" height="44" rx="6" stroke={color} strokeWidth="2.5" fill="rgba(31, 79, 216, 0.04)" />
      <path d="M15 46 L73 46" stroke={color} strokeWidth="2" />
      <rect x="55" y="54" width="18" height="12" rx="3" stroke={color} strokeWidth="2" fill="#fff" />
      <circle cx="64" cy="60" r="3" fill={color} opacity="0.3" />
      
      {/* Монета с рублём */}
      <circle cx="95" cy="35" r="18" stroke={color} strokeWidth="2.5" fill="rgba(31, 79, 216, 0.06)" />
      <text x="95" y="42" textAnchor="middle" fill={color} fontSize="18" fontWeight="600" fontFamily="system-ui">₽</text>
      
      {/* Стрелка вниз — экономия */}
      <path d="M95 58 L95 90" stroke={colors.success} strokeWidth="3" strokeLinecap="round" />
      <path d="M86 81 L95 90 L104 81" stroke={colors.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Текст экономии */}
      <text x="95" y="108" textAnchor="middle" fill={colors.success} fontSize="11" fontWeight="600" fontFamily="system-ui">экономия</text>
    </svg>
  ),
  
  history: ({ color }) => (
    <svg viewBox="0 0 120 120" fill="none" style={{ width: '100%', height: '100%' }}>
      {/* Документ */}
      <rect x="38" y="12" width="58" height="82" rx="6" stroke={color} strokeWidth="2.5" fill="rgba(31, 79, 216, 0.04)" />
      
      {/* Заголовок документа */}
      <rect x="38" y="12" width="58" height="18" rx="6" stroke={color} strokeWidth="2.5" fill="rgba(31, 79, 216, 0.08)" />
      <text x="67" y="25" textAnchor="middle" fill={color} fontSize="9" fontWeight="600" fontFamily="system-ui">ЖУРНАЛ</text>
      
      {/* Строки с чекмарками */}
      <g>
        <rect x="46" y="38" width="42" height="16" rx="3" fill="rgba(46, 158, 111, 0.08)" />
        <path d="M50 46 L54 50 L62 42" stroke={colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="68" y="49" fill={colors.textSecondary} fontSize="8" fontFamily="system-ui">Замена масла</text>
      </g>
      
      <g>
        <rect x="46" y="58" width="42" height="16" rx="3" fill="rgba(46, 158, 111, 0.08)" />
        <path d="M50 66 L54 70 L62 62" stroke={colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="68" y="69" fill={colors.textSecondary} fontSize="8" fontFamily="system-ui">Тормоза</text>
      </g>
      
      <g>
        <rect x="46" y="78" width="42" height="12" rx="3" fill="rgba(31, 79, 216, 0.04)" stroke={color} strokeWidth="1" strokeDasharray="3 2" />
      </g>
      
      {/* Телефон со сканером */}
      <rect x="8" y="40" width="26" height="46" rx="5" stroke={color} strokeWidth="2" fill="#fff" />
      <circle cx="21" cy="54" r="8" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="21" cy="54" r="3" fill={color} opacity="0.2" />
      <rect x="14" y="72" width="14" height="6" rx="3" fill={color} opacity="0.15" />
      
      {/* Линия сканирования */}
      <path d="M34 63 L38 63" stroke={colors.success} strokeWidth="2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
      </path>
      <path d="M34 60 L36 60" stroke={colors.success} strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" begin="0.2s" />
      </path>
      <path d="M34 66 L36 66" stroke={colors.success} strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
      </path>
    </svg>
  )
};

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const goToSlide = (index) => {
    if (isAnimating || index === currentSlide) return;
    setDirection(index > currentSlide ? 1 : -1);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsAnimating(false);
    }, 250);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;
  const IllustrationComponent = Illustrations[slide.illustration];

  return (
    <div style={styles.container}>
      {/* Subtle background */}
      <div style={styles.bgPattern} />
      
      {/* Main content */}
      <div style={{
        ...styles.content,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Реальный логотип — изображение */}
        <div style={styles.logoContainer}>
          <img 
            src="/logo-aaa.png" 
            alt="AAA" 
            style={styles.logoImage}
          />
          <div style={styles.brandName}>AutoAssistantAi</div>
        </div>

        {/* Main card */}
        <div style={styles.card}>
          {/* Slide content */}
          <div style={{
            ...styles.slideContent,
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating 
              ? `translateX(${direction * -20}px)` 
              : 'translateX(0)',
            transition: 'all 0.25s ease-out'
          }}>
            {/* Illustration — больше для дашборда */}
            <div style={{
              ...styles.illustrationContainer,
              ...(slide.illustration === 'dashboard' ? styles.illustrationLarge : {})
            }}>
              <IllustrationComponent color={colors.primary} />
            </div>

            {/* Title */}
            <h1 style={styles.title}>
              {slide.title}
              <span style={styles.titleAccent}> {slide.subtitle}</span>
            </h1>

            {/* Description */}
            <p style={styles.description}>{slide.description}</p>

            {/* Stat block — только если есть данные */}
            {slide.stat && (
              <div style={styles.statBlock}>
                <div style={styles.statValue}>{slide.stat}</div>
                <div style={styles.statLabel}>{slide.statLabel}</div>
              </div>
            )}
          </div>

          {/* Pagination dots */}
          <div style={styles.pagination}>
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                style={{
                  ...styles.dot,
                  ...(index === currentSlide ? styles.dotActive : {})
                }}
                aria-label={`Слайд ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Navigation buttons — единый стиль */}
        <div style={styles.navigation}>
          {currentSlide > 0 && (
            <button onClick={prevSlide} style={styles.backButton}>
              ← Назад
            </button>
          )}
          
          <button 
            onClick={isLastSlide ? () => alert('Переход к добавлению авто') : nextSlide}
            style={styles.primaryButton}
          >
            {isLastSlide ? 'Добавить автомобиль' : 'Далее'}
          </button>
        </div>

        {/* Skip link */}
        {!isLastSlide && (
          <button 
            onClick={() => goToSlide(slides.length - 1)} 
            style={styles.skipButton}
          >
            Пропустить
          </button>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Персональный автомобильный ассистент</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.backgroundGradient,
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
  },

  bgPattern: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      radial-gradient(circle at 20% 80%, rgba(31, 79, 216, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(31, 79, 216, 0.02) 0%, transparent 40%)
    `,
    pointerEvents: 'none',
  },

  content: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '420px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },

  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },

  // Реальный логотип как изображение
  logoImage: {
    width: '72px',
    height: '72px',
    objectFit: 'contain',
    borderRadius: '18px',
    // Лёгкая тень для интеграции
    filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))',
  },

  brandName: {
    fontSize: '13px',
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: '1.5px',
  },

  card: {
    width: '100%',
    borderRadius: '24px',
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    boxShadow: `
      0 1px 2px rgba(0, 0, 0, 0.02),
      0 4px 12px rgba(0, 0, 0, 0.04),
      0 16px 32px rgba(0, 0, 0, 0.04)
    `,
    padding: '32px 28px 28px',
  },

  slideContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },

  illustrationContainer: {
    width: '140px',
    height: '140px',
    marginBottom: '24px',
  },

  illustrationLarge: {
    width: '180px',
    height: '190px',
  },

  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 1.3,
    margin: '0 0 12px 0',
  },

  titleAccent: {
    color: colors.primary,
  },

  description: {
    fontSize: '15px',
    lineHeight: 1.65,
    color: colors.textSecondary,
    margin: '0 0 24px 0',
    maxWidth: '320px',
  },

  statBlock: {
    width: '100%',
    padding: '20px',
    background: `linear-gradient(135deg, rgba(31, 79, 216, 0.04) 0%, rgba(31, 79, 216, 0.01) 100%)`,
    borderRadius: '16px',
    border: `1px solid rgba(31, 79, 216, 0.06)`,
  },

  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: colors.primary,
    marginBottom: '4px',
  },

  statLabel: {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.5,
  },

  pagination: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '24px',
  },

  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: colors.border,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: 0,
  },

  dotActive: {
    width: '24px',
    borderRadius: '4px',
    background: colors.primary,
  },

  navigation: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    justifyContent: 'center',
  },

  backButton: {
    padding: '14px 20px',
    fontSize: '15px',
    fontWeight: '500',
    color: colors.textSecondary,
    background: '#FFFFFF',
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Единый стиль кнопки — синяя, без золота
  primaryButton: {
    flex: 1,
    maxWidth: '260px',
    padding: '16px 28px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
    background: colors.primary,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: `0 4px 12px rgba(31, 79, 216, 0.25)`,
    transition: 'all 0.2s ease',
  },

  skipButton: {
    background: 'none',
    border: 'none',
    color: colors.textTertiary,
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 16px',
    transition: 'color 0.2s ease',
  },

  footer: {
    marginTop: '4px',
  },

  footerText: {
    fontSize: '12px',
    color: colors.textTertiary,
    letterSpacing: '0.5px',
  },
};

// Global styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    button:hover {
      transform: translateY(-1px);
      opacity: 0.95;
    }
    
    button:active {
      transform: translateY(0);
    }
  `;
  document.head.appendChild(styleSheet);
}
