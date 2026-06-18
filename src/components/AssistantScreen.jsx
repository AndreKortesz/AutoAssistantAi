import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCar } from '../contexts/CarContext';
import Icon from './Icon';
import CarSilhouette from './CarSilhouette';

// AutoAssistantAi — AI Ассистент
// Чат с диагностикой и подсказками

// Цветовая схема
const colors = {
  background: '#F7F8FA',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  
  primary: '#1F4FD8',
  primaryLight: 'rgba(31, 79, 216, 0.08)',
  
  success: '#2E9E6F',
  successLight: 'rgba(46, 158, 111, 0.08)',
  
  warning: '#D97706',
  warningLight: 'rgba(217, 119, 6, 0.08)',
  
  critical: '#DC2626',
  criticalLight: 'rgba(220, 38, 38, 0.08)',
  
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  
  userBubble: '#1F4FD8',
  assistantBubble: '#FFFFFF',
};

// Форматирование пробега с ~
const formatMileage = (mileage) => {
  const rounded = Math.round(mileage / 1000) * 1000;
  return `~${rounded.toLocaleString('ru-RU')}`;
};

// Категории быстрых подсказок
const promptCategories = [
  {
    id: 'symptoms',
    icon: 'search',
    title: 'Диагностика',
    prompts: [
      'Стучит при повороте руля',
      'Гудит на скорости',
      'Вибрация при торможении',
      'Двигатель троит на холодную',
      'Загорелся Check Engine',
    ],
  },
  {
    id: 'maintenance',
    icon: 'wrench',
    title: 'Обслуживание',
    prompts: [
      'Когда менять цепь ГРМ?',
      'Какое масло лучше залить?',
      'Пора ли менять тормозную жидкость?',
      'Что входит в ТО-90000?',
    ],
  },
  {
    id: 'parts',
    icon: 'package',
    title: 'Запчасти',
    prompts: [
      'Какие колодки лучше поставить?',
      'Оригинал или аналог фильтров?',
      'Какой антифриз подходит?',
    ],
  },
  {
    id: 'errors',
    icon: 'alert',
    title: 'Ошибки',
    prompts: [
      'Расшифруй ошибку P0171',
      'Что значит P0420?',
      'Ошибка P0016 — это серьёзно?',
    ],
  },
  {
    id: 'buying',
    icon: 'shield',
    title: 'При покупке',
    prompts: [
      'На что смотреть при покупке?',
      'Слабые места этой модели',
      'Какой пробег считается большим?',
    ],
  },
];

// Компонент сообщения пользователя
const UserMessage = ({ text }) => (
  <div style={styles.userMessageContainer}>
    <div style={styles.userBubble}>
      {text}
    </div>
  </div>
);

// Компонент сообщения ассистента — текст от Gemini (с переносами строк)
const AssistantMessage = ({ response }) => (
  <div style={styles.assistantMessageContainer}>
    <div style={styles.assistantAvatar}><Icon name="bot" size={18} color={colors.primary} /></div>
    <div style={styles.assistantBubble}>
      <p style={{ ...styles.assistantText, whiteSpace: 'pre-wrap' }}>{response.text}</p>
    </div>
  </div>
);

// Компонент быстрых подсказок
const QuickPrompts = ({ categories, onSelect, visible }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  
  if (!visible) return null;
  
  return (
    <div style={styles.quickPrompts}>
      {/* Категории */}
      <div style={styles.categoriesRow}>
        {categories.map(cat => (
          <button
            key={cat.id}
            style={{
              ...styles.categoryButton,
              ...(activeCategory === cat.id ? styles.categoryButtonActive : {}),
            }}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
          >
            <span style={styles.categoryIcon}><Icon name={cat.icon} size={15} color={colors.textSecondary} /></span>
            <span style={styles.categoryTitle}>{cat.title}</span>
          </button>
        ))}
      </div>
      
      {/* Промпты выбранной категории */}
      {activeCategory && (
        <div style={styles.promptsList}>
          {categories.find(c => c.id === activeCategory)?.prompts.map((prompt, i) => (
            <button
              key={i}
              style={styles.promptButton}
              onClick={() => onSelect(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Приветственное сообщение
const WelcomeMessage = ({ car }) => (
  <div style={styles.welcome}>
    <div style={{ ...styles.welcomeIcon, display: 'flex', justifyContent: 'center' }}><Icon name="bot" size={44} color={colors.primary} /></div>
    <div style={styles.welcomeTitle}>Привет! Я ваш автоассистент</div>
    <div style={styles.welcomeText}>
      Знаю ваш {car.brand} {car.model} ({car.engine}) вдоль и поперёк.
      Спросите о симптомах, обслуживании или запчастях.
    </div>
    <div style={styles.welcomeHint}>
      Выберите тему ниже или напишите свой вопрос
    </div>
  </div>
);

export default function AssistantScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userCar, carDetails, issuesData } = useCar();
  const car = useMemo(() => {
    if (!carDetails || !userCar) return null;
    const engine = carDetails.engines?.find(e => e.code === userCar.engineCode);
    const trans = carDetails.transmissions?.find(t => t.code === userCar.transmissionCode);
    return {
      brand: carDetails.brand,
      model: carDetails.model_name,
      generation: carDetails.generation,
      year: userCar.year,
      engine: engine?.label || userCar.engineCode || '',
      transmission: trans?.label || userCar.transmissionCode || '',
      mileage: userCar.mileage ? parseInt(userCar.mileage) : 0,
    };
  }, [carDetails, userCar]);

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Контекст для заземления ассистента: реальные болячки из базы (без выдумок).
  const buildCarContext = () => {
    if (!car) return {};
    const issues = (issuesData?.systemic || []).slice(0, 14).map(i => ({
      title: i.issue?.title || '',
      severity: i.issue?.severity || '',
      cause: i.issue?.cause?.primary || '',
    }));
    return {
      car: `${car.brand} ${car.model} ${car.generation || ''} · ${car.engine}${car.transmission ? ` · ${car.transmission}` : ''}`.trim(),
      mileage: car.mileage,
      issues,
    };
  };

  const handleSend = async (text) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const history = messages.map(m => ({
      role: m.type === 'user' ? 'user' : 'model',
      text: m.type === 'user' ? m.text : (m.response?.text || ''),
    }));

    setMessages(prev => [...prev, { type: 'user', text: messageText }]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history, carContext: buildCarContext() }),
      });
      const data = await res.json().catch(() => ({}));
      let text;
      if (res.ok && data.text) {
        text = data.text;
      } else {
        text = data.error || 'Не удалось получить ответ. Попробуйте ещё раз.';
        if (data.detail) text += `\n\n(${data.detail})`;
      }
      setMessages(prev => [...prev, { type: 'assistant', response: { text } }]);
    } catch (e) {
      setMessages(prev => [...prev, { type: 'assistant', response: { text: 'Нет связи с ассистентом. Проверьте интернет и попробуйте снова.' } }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptSelect = (prompt) => {
    handleSend(prompt);
  };

  // Вопрос, переданный с главной (чип-пример) — отправляем один раз при заходе.
  const initialSentRef = useRef(false);
  useEffect(() => {
    const prompt = location.state?.prompt;
    if (prompt && car && !initialSentRef.current) {
      initialSentRef.current = true;
      handleSend(prompt);
    }
  }, [location.state, car]);

  if (!car) {
    return (
      <div style={styles.container}>
        <div style={styles.welcome}>
          <div style={{ ...styles.welcomeIcon, display: 'flex', justifyContent: 'center' }}><CarSilhouette color="#B8BCC2" width={110} height={60} /></div>
          <div style={styles.welcomeTitle}>Сначала добавьте автомобиль</div>
          <div style={styles.welcomeText}>Чтобы ассистент знал вашу машину и давал точные ответы</div>
          <button
            onClick={() => navigate('/add-car')}
            style={{ marginTop: 16, padding: '12px 24px', background: colors.primary, color: '#FFFFFF', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            Добавить автомобиль
          </button>
        </div>
      </div>
    );
  }

  const showQuickPrompts = messages.length === 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/dashboard')} aria-label="Назад"><Icon name="arrowLeft" size={20} color={colors.textPrimary} /></button>
        <div style={styles.headerCenter}>
          <div style={styles.headerTitle}>Ассистент</div>
          <div style={styles.headerSubtitle}>
            {car.brand} {car.model} • {car.engine}
          </div>
        </div>
        <button style={styles.newChatButton} onClick={() => setMessages([])} aria-label="Новый чат"><Icon name="plus" size={20} color={colors.primary} /></button>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && <WelcomeMessage car={car} />}
        
        {messages.map((msg, i) => (
          msg.type === 'user' 
            ? <UserMessage key={i} text={msg.text} />
            : <AssistantMessage key={i} response={msg.response} />
        ))}
        
        {isTyping && (
          <div style={styles.typingIndicator}>
            <div style={styles.assistantAvatar}><Icon name="bot" size={18} color={colors.primary} /></div>
            <div style={styles.typingDots}>
              <span style={styles.dot}>●</span>
              <span style={{...styles.dot, animationDelay: '0.2s'}}>●</span>
              <span style={{...styles.dot, animationDelay: '0.4s'}}>●</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        ...styles.inputArea,
        paddingTop: showQuickPrompts ? '12px' : '10px',
        paddingBottom: showQuickPrompts ? '16px' : '12px',
      }}>
        {/* Quick prompts — только когда чат пустой */}
        <QuickPrompts 
          categories={promptCategories}
          onSelect={handlePromptSelect}
          visible={showQuickPrompts}
        />
        
        {/* Input field */}
        <div style={styles.inputRow}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Опишите симптом или задайте вопрос..."
            style={styles.input}
          />
          <button
            style={{
              ...styles.sendButton,
              opacity: inputValue.trim() ? 1 : 0.5,
            }}
            onClick={() => handleSend()}
            disabled={!inputValue.trim()}
            aria-label="Отправить"
          >
            <Icon name="send" size={18} color="#FFFFFF" />
          </button>
        </div>
      </div>

    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    width: '100%',
    background: colors.background,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: colors.cardBg,
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },

  backButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: colors.textPrimary,
    cursor: 'pointer',
  },

  headerCenter: {
    flex: 1,
    textAlign: 'center',
  },

  headerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.textPrimary,
  },

  headerSubtitle: {
    fontSize: '12px',
    color: colors.textTertiary,
    marginTop: '2px',
  },

  newChatButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.primaryLight,
    border: 'none',
    borderRadius: '10px',
    fontSize: '20px',
    color: colors.primary,
    cursor: 'pointer',
  },

  // Messages
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    paddingBottom: '100px',
  },

  // Welcome
  welcome: {
    textAlign: 'center',
    padding: '32px 16px',
  },

  welcomeIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },

  welcomeTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: '8px',
  },

  welcomeText: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.5,
    marginBottom: '16px',
  },

  welcomeHint: {
    fontSize: '13px',
    color: colors.textTertiary,
  },

  // User message
  userMessageContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px',
  },

  userBubble: {
    maxWidth: '80%',
    padding: '12px 16px',
    background: colors.userBubble,
    color: '#FFFFFF',
    borderRadius: '18px 18px 4px 18px',
    fontSize: '14px',
    lineHeight: 1.5,
  },

  // Assistant message
  assistantMessageContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
    alignItems: 'flex-start',
  },

  assistantAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: colors.primaryLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  },

  assistantBubble: {
    maxWidth: 'calc(100% - 50px)',
    padding: '14px 16px',
    background: colors.assistantBubble,
    borderRadius: '18px 18px 18px 4px',
    border: `1px solid ${colors.border}`,
  },

  assistantText: {
    fontSize: '14px',
    color: colors.textPrimary,
    lineHeight: 1.5,
    margin: 0,
  },

  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: '12px',
    marginBottom: '8px',
  },

  // Causes
  causesSection: {
    marginTop: '8px',
  },

  causeCard: {
    padding: '10px 12px',
    background: colors.background,
    borderRadius: '8px',
    marginBottom: '6px',
  },

  causeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },

  causeName: {
    fontSize: '13px',
    fontWeight: '500',
    color: colors.textPrimary,
  },

  causeProbability: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.primary,
  },

  causeCost: {
    fontSize: '12px',
    color: colors.textSecondary,
  },

  // Info
  infoSection: {
    marginTop: '12px',
    padding: '10px 12px',
    background: colors.background,
    borderRadius: '8px',
  },

  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
  },

  infoLabel: {
    fontSize: '12px',
    color: colors.textSecondary,
  },

  infoValue: {
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Symptoms
  symptomsSection: {
    marginTop: '8px',
  },

  symptomsTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },

  symptomTag: {
    fontSize: '12px',
    padding: '4px 10px',
    background: colors.warningLight,
    color: colors.warning,
    borderRadius: '6px',
  },

  // Options
  optionsSection: {
    marginTop: '12px',
  },

  optionCard: {
    padding: '10px 12px',
    background: colors.background,
    borderRadius: '8px',
    marginBottom: '6px',
  },

  optionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  optionName: {
    fontSize: '13px',
    fontWeight: '500',
    color: colors.textPrimary,
  },

  optionPrice: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.success,
  },

  optionNote: {
    fontSize: '11px',
    color: colors.textTertiary,
    marginTop: '2px',
  },

  // Checklist
  checkListSection: {
    marginTop: '12px',
  },

  checkItem: {
    padding: '8px 0',
    borderBottom: `1px solid ${colors.border}`,
  },

  checkItemHeader: {
    fontSize: '13px',
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: '2px',
  },

  checkItemText: {
    fontSize: '12px',
    color: colors.textSecondary,
    paddingLeft: '24px',
  },

  // Warning
  warningBox: {
    marginTop: '12px',
    padding: '10px 12px',
    background: colors.warningLight,
    borderRadius: '8px',
    fontSize: '13px',
    color: colors.warning,
  },

  // Drive status
  driveStatus: {
    marginTop: '12px',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Recommendation
  recommendation: {
    marginTop: '12px',
    padding: '10px 12px',
    background: colors.primaryLight,
    borderRadius: '8px',
    fontSize: '13px',
    color: colors.textPrimary,
    lineHeight: 1.4,
  },

  // Suggestions
  suggestionsSection: {
    marginTop: '12px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },

  suggestionTag: {
    fontSize: '12px',
    padding: '6px 10px',
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    color: colors.textSecondary,
  },

  // Typing indicator
  typingIndicator: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },

  typingDots: {
    display: 'flex',
    gap: '4px',
    padding: '12px 16px',
    background: colors.cardBg,
    borderRadius: '18px',
    border: `1px solid ${colors.border}`,
  },

  dot: {
    fontSize: '8px',
    color: colors.textTertiary,
    animation: 'pulse 1s ease-in-out infinite',
  },

  // Input area
  inputArea: {
    position: 'fixed',
    bottom: '80px',
    left: 0,
    right: 0,
    background: colors.cardBg,
    borderTop: `1px solid ${colors.border}`,
    padding: '12px 16px 16px',
  },

  // Quick prompts
  quickPrompts: {
    marginBottom: '12px',
  },

  categoriesRow: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '8px',
    marginBottom: '8px',
  },

  categoryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '20px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  categoryButtonActive: {
    background: colors.primaryLight,
    borderColor: colors.primary,
  },

  categoryIcon: {
    fontSize: '14px',
  },

  categoryTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: colors.textPrimary,
  },

  promptsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },

  promptButton: {
    padding: '8px 12px',
    fontSize: '13px',
    color: colors.textPrimary,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
  },

  // Input row
  inputRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    padding: '14px 16px',
    fontSize: '15px',
    color: colors.textPrimary,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '24px',
    outline: 'none',
  },

  sendButton: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.primary,
    border: 'none',
    borderRadius: '50%',
    fontSize: '18px',
    color: '#FFFFFF',
    cursor: 'pointer',
    flexShrink: 0,
  },

  // Bottom Navigation
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    padding: '6px 12px 24px',
    background: colors.cardBg,
    borderTop: `1px solid ${colors.border}`,
  },

  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '8px 14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '12px',
  },

  navItemActive: {
    background: colors.primaryLight,
  },

  navIcon: {
    fontSize: '20px',
  },

  navLabel: {
    fontSize: '10px',
    fontWeight: '500',
    color: colors.textSecondary,
  },
};

// Global styles with animation
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    button:active { opacity: 0.8; }
    input:focus { border-color: #1F4FD8 !important; }
    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
  `;
  document.head.appendChild(styleSheet);
}
