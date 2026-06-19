import React, { useState } from 'react';
import Icon from './Icon';

// AutoAssistantAi — Онбординг
// Финальная версия с 4 слайдами

const colors = {
  background: '#F7F8FA',
  cardBg: '#FFFFFF',
  primary: '#1F4FD8',
  primaryLight: 'rgba(31, 79, 216, 0.08)',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
};

// Слайды онбординга
const slides = [
  {
    id: 1,
    icon: 'sparkles',
    title: 'Знаем, когда сломается',
    subtitle: 'до того, как это случится',
    description: 'Понимайте состояние авто с первого взгляда. Мы знаем болячки вашей модели и предупредим за несколько тысяч км до проблемы.',
    stat: '87%',
    statLabel: 'проблем можно избежать, если знать о них заранее',
  },
  {
    id: 2,
    icon: 'wallet',
    title: 'Не дадим переплатить',
    subtitle: 'за ремонт и запчасти',
    description: 'Честные цены на работы и запчасти. Где чинить, что купить, и что можно сделать самому.',
    stat: 'до 40%',
    statLabel: 'экономии на ремонте и запчастях',
  },
  {
    id: 3,
    icon: 'clipboard',
    title: 'Вся история',
    subtitle: 'в одном месте',
    description: 'Сфоткайте чек или накладную — распознаем и добавим. При продаже покажете покупателю полный журнал.',
    stat: '+15%',
    statLabel: 'к цене авто с прозрачной историей',
  },
  {
    id: 4,
    icon: 'bot',
    title: 'AI-механик 24/7',
    subtitle: 'в вашем кармане',
    description: 'Опишите симптом — получите диагноз с вероятностями и ценами. Как друг, который разбирается в машинах.',
    stat: '~3 000 ₽',
    statLabel: 'экономия на поездке в диагностику',
  },
];

export default function Onboarding({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div style={styles.container}>
      {/* Логотип */}
      <div style={styles.logoContainer}>
        <img src="/branding/logo-mark.png" alt="AutoAssistantAi" style={styles.logo} />
        <div style={styles.logoText}>AutoAssistantAi</div>
      </div>

      {/* Контент слайда */}
      <div style={styles.slideContent}>
        <div style={styles.iconContainer}>
          <Icon name={slide.icon} size={48} color={colors.primary} strokeWidth={1.6} />
        </div>
        
        <h1 style={styles.title}>{slide.title}</h1>
        {slide.subtitle && (
          <h2 style={styles.subtitle}>{slide.subtitle}</h2>
        )}
        
        <p style={styles.description}>{slide.description}</p>
        
        {/* Статистика */}
        {slide.stat && (
          <div style={styles.statContainer}>
            <span style={styles.statValue}>{slide.stat}</span>
            <span style={styles.statLabel}>{slide.statLabel}</span>
          </div>
        )}
      </div>

      {/* Индикаторы */}
      <div style={styles.indicators}>
        {slides.map((_, index) => (
          <div
            key={index}
            style={{
              ...styles.indicator,
              ...(index === currentSlide ? styles.indicatorActive : {}),
            }}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>

      {/* Кнопки */}
      <div style={styles.buttons}>
        {!isLastSlide && (
          <button style={styles.skipButton} onClick={handleSkip}>
            Пропустить
          </button>
        )}
        <button
          style={{
            ...styles.nextButton,
            ...(isLastSlide ? styles.nextButtonFull : {}),
          }}
          onClick={handleNext}
        >
          {isLastSlide ? 'Начать' : 'Далее'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: colors.background,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
  },

  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
  },

  logo: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    objectFit: 'cover',
    display: 'block',
  },

  logoText: {
    fontSize: '18px',
    fontWeight: '600',
    color: colors.textPrimary,
  },

  slideContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '0 16px',
  },

  iconContainer: {
    width: '100px',
    height: '100px',
    background: colors.primaryLight,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },

  icon: {
    fontSize: '48px',
  },

  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: '4px',
    lineHeight: 1.2,
  },

  subtitle: {
    fontSize: '20px',
    fontWeight: '500',
    color: colors.primary,
    marginBottom: '16px',
    lineHeight: 1.2,
  },

  description: {
    fontSize: '16px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    maxWidth: '320px',
    marginBottom: '24px',
  },

  statContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 24px',
    background: colors.cardBg,
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },

  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 1,
    marginBottom: '4px',
  },

  statLabel: {
    fontSize: '13px',
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: '200px',
  },

  indicators: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '24px',
  },

  indicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: colors.textTertiary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  indicatorActive: {
    width: '24px',
    borderRadius: '4px',
    background: colors.primary,
  },

  buttons: {
    display: 'flex',
    gap: '12px',
  },

  skipButton: {
    flex: 1,
    padding: '16px',
    fontSize: '16px',
    fontWeight: '500',
    color: colors.textSecondary,
    background: 'transparent',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },

  nextButton: {
    flex: 1,
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
    background: colors.primary,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },

  nextButtonFull: {
    flex: 'unset',
    width: '100%',
  },
};
