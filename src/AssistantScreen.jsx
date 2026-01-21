import React, { useState, useRef, useEffect } from 'react';

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

// Данные автомобиля
const carData = {
  brand: 'Hyundai',
  model: 'Solaris',
  year: 2015,
  engine: '1.6 G4FC',
  transmission: '6-АКПП',
  mileage: 87000,
  mileageConfidence: 'high',
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
    icon: '🔍',
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
    icon: '🔧',
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
    icon: '📦',
    title: 'Запчасти',
    prompts: [
      'Какие колодки лучше поставить?',
      'Оригинал или аналог фильтров?',
      'Какой антифриз подходит?',
    ],
  },
  {
    id: 'errors',
    icon: '⚠️',
    title: 'Ошибки',
    prompts: [
      'Расшифруй ошибку P0171',
      'Что значит P0420?',
      'Ошибка P0016 — это серьёзно?',
    ],
  },
  {
    id: 'buying',
    icon: '🚗',
    title: 'При покупке',
    prompts: [
      'На что смотреть при покупке?',
      'Слабые места этой модели',
      'Какой пробег считается большим?',
    ],
  },
];

// Симулированные ответы ассистента
const getAssistantResponse = (userMessage, car) => {
  const msg = userMessage.toLowerCase();
  
  // Стук при повороте руля
  if (msg.includes('стук') && msg.includes('руля') || msg.includes('стучит') && msg.includes('поворот')) {
    return {
      text: `Для вашего ${car.brand} ${car.model} с пробегом ${formatMileage(car.mileage)} км это типичный симптом.`,
      causes: [
        { name: 'Рулевая рейка (втулки)', probability: 60, costMin: 3000, costMax: 15000 },
        { name: 'Рулевые наконечники', probability: 25, costMin: 2000, costMax: 5000 },
        { name: 'Стойки стабилизатора', probability: 15, costMin: 2000, costMax: 4000 },
      ],
      canDrive: true,
      recommendation: 'Рекомендую проверить на подъёмнике. Если рейка — можно поставить ремкомплект, это дешевле замены.',
    };
  }
  
  // Гудит на скорости
  if (msg.includes('гуд') && (msg.includes('скорост') || msg.includes('поворот'))) {
    return {
      text: `Гул, который усиливается в поворотах — классический признак износа ступичного подшипника.`,
      causes: [
        { name: 'Ступичный подшипник (передний)', probability: 85, costMin: 2500, costMax: 6000 },
        { name: 'Ступичный подшипник (задний)', probability: 10, costMin: 2500, costMax: 5000 },
        { name: 'Шины (неравномерный износ)', probability: 5, costMin: 0, costMax: 20000 },
      ],
      canDrive: true,
      warning: 'Не тяните с заменой — подшипник может заклинить на ходу.',
      recommendation: 'Для Solaris рекомендую SKF или FAG вместо оригинала ILJIN — ходят дольше.',
    };
  }
  
  // Цепь ГРМ
  if (msg.includes('цепь') || msg.includes('грм')) {
    return {
      text: `На моторе ${car.engine} цепь ГРМ обычно ходит 150-180 тыс. км. У вас ${formatMileage(car.mileage)} км — запас ещё есть.`,
      info: [
        { label: 'Типичный ресурс', value: '150 000 – 180 000 км' },
        { label: 'Ваш пробег', value: `${formatMileage(car.mileage)} км` },
        { label: 'Стоимость замены', value: '15 000 – 35 000 ₽' },
      ],
      symptoms: ['Дизельный звук на холодную', 'Ошибка по фазам ГРМ', 'Плавающие обороты'],
      recommendation: 'Рекомендую проверить натяжитель на 120 тыс. км. Если есть посторонние звуки при запуске — не откладывайте диагностику.',
    };
  }
  
  // Масло
  if (msg.includes('масло') && (msg.includes('какое') || msg.includes('лучше') || msg.includes('залить'))) {
    return {
      text: `Для ${car.engine} рекомендую масло 5W-40 или 5W-30 (API SN/SP).`,
      options: [
        { name: 'Shell Helix HX8 5W-40', price: '2 500 ₽', note: 'Оптимальный выбор' },
        { name: 'Liqui Moly Top Tec 4100', price: '3 200 ₽', note: 'Премиум' },
        { name: 'Лукойл Genesis 5W-40', price: '1 800 ₽', note: 'Бюджетный вариант' },
      ],
      recommendation: 'Интервал замены — каждые 10-12 тыс. км, в городском режиме лучше 8-10 тыс.',
    };
  }
  
  // Колодки
  if (msg.includes('колодк')) {
    return {
      text: `Для ${car.brand} ${car.model} хорошо подходят:`,
      options: [
        { name: 'Sangsin SP1399', price: '1 800 ₽', note: 'Корейский OEM, отличный выбор' },
        { name: 'TRW GDB3548', price: '2 400 ₽', note: 'Европейское качество' },
        { name: 'Brembo P30052', price: '3 200 ₽', note: 'Премиум, для активной езды' },
      ],
      recommendation: 'Оригинал Hyundai/Mobis стоит ~2 500 ₽, но Sangsin — тот же завод, дешевле.',
    };
  }
  
  // Ошибка P0171
  if (msg.includes('p0171')) {
    return {
      text: `Ошибка P0171 — бедная смесь (Bank 1). Двигатель получает меньше топлива, чем нужно.`,
      causes: [
        { name: 'Подсос воздуха', probability: 40, costMin: 500, costMax: 5000 },
        { name: 'Грязный MAF-датчик', probability: 30, costMin: 500, costMax: 1500 },
        { name: 'Топливный фильтр/насос', probability: 20, costMin: 2000, costMax: 8000 },
        { name: 'Форсунки', probability: 10, costMin: 3000, costMax: 12000 },
      ],
      canDrive: true,
      recommendation: 'Начните с простого: проверьте патрубки на трещины и почистите MAF очистителем. Часто это решает проблему за 500 ₽.',
    };
  }
  
  // На что смотреть при покупке
  if (msg.includes('покупк') || msg.includes('смотреть')) {
    return {
      text: `При покупке ${car.brand} ${car.model} обратите внимание:`,
      checkList: [
        { item: 'Цепь ГРМ', check: 'Послушать на холодную — не должно быть дизельного звука' },
        { item: 'Рулевая рейка', check: 'Покрутить руль на месте — не должно быть стуков' },
        { item: 'Ступичные подшипники', check: 'Поднять машину, покачать колёса — люфт = замена' },
        { item: 'Кузов', check: 'Проверить арки, пороги, низ дверей на ржавчину' },
        { item: 'АКПП', check: 'Проверить уровень и цвет масла, не должно пахнуть горелым' },
      ],
      recommendation: 'Solaris — надёжная машина. Главное — не брать с убитой цепью ГРМ и проблемной АКПП.',
    };
  }
  
  // Дефолтный ответ
  return {
    text: `Хороший вопрос! Для точного ответа по вашему ${car.brand} ${car.model} (${car.engine}, ${formatMileage(car.mileage)} км) мне нужно чуть больше деталей. Можете описать симптом подробнее?`,
    suggestions: ['Опишите звук или поведение', 'Когда появляется проблема?', 'Есть ли ошибки на панели?'],
  };
};

// Компонент сообщения пользователя
const UserMessage = ({ text }) => (
  <div style={styles.userMessageContainer}>
    <div style={styles.userBubble}>
      {text}
    </div>
  </div>
);

// Компонент сообщения ассистента
const AssistantMessage = ({ response }) => (
  <div style={styles.assistantMessageContainer}>
    <div style={styles.assistantAvatar}>🤖</div>
    <div style={styles.assistantBubble}>
      <p style={styles.assistantText}>{response.text}</p>
      
      {/* Причины с вероятностями */}
      {response.causes && (
        <div style={styles.causesSection}>
          <div style={styles.sectionTitle}>📍 Вероятные причины:</div>
          {response.causes.map((cause, i) => (
            <div key={i} style={styles.causeCard}>
              <div style={styles.causeHeader}>
                <span style={styles.causeName}>{cause.name}</span>
                <span style={styles.causeProbability}>{cause.probability}%</span>
              </div>
              <div style={styles.causeCost}>
                {cause.costMin.toLocaleString('ru-RU')} – {cause.costMax.toLocaleString('ru-RU')} ₽
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Информация */}
      {response.info && (
        <div style={styles.infoSection}>
          {response.info.map((item, i) => (
            <div key={i} style={styles.infoRow}>
              <span style={styles.infoLabel}>{item.label}</span>
              <span style={styles.infoValue}>{item.value}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Симптомы */}
      {response.symptoms && (
        <div style={styles.symptomsSection}>
          <div style={styles.sectionTitle}>🔔 Признаки износа:</div>
          <div style={styles.symptomsTags}>
            {response.symptoms.map((s, i) => (
              <span key={i} style={styles.symptomTag}>{s}</span>
            ))}
          </div>
        </div>
      )}
      
      {/* Варианты (масло, колодки) */}
      {response.options && (
        <div style={styles.optionsSection}>
          {response.options.map((opt, i) => (
            <div key={i} style={styles.optionCard}>
              <div style={styles.optionHeader}>
                <span style={styles.optionName}>{opt.name}</span>
                <span style={styles.optionPrice}>{opt.price}</span>
              </div>
              {opt.note && <div style={styles.optionNote}>{opt.note}</div>}
            </div>
          ))}
        </div>
      )}
      
      {/* Чеклист */}
      {response.checkList && (
        <div style={styles.checkListSection}>
          {response.checkList.map((item, i) => (
            <div key={i} style={styles.checkItem}>
              <div style={styles.checkItemHeader}>☑️ {item.item}</div>
              <div style={styles.checkItemText}>{item.check}</div>
            </div>
          ))}
        </div>
      )}
      
      {/* Предупреждение */}
      {response.warning && (
        <div style={styles.warningBox}>
          ⚠️ {response.warning}
        </div>
      )}
      
      {/* Можно ли ездить */}
      {response.canDrive !== undefined && (
        <div style={{
          ...styles.driveStatus,
          background: response.canDrive ? colors.successLight : colors.criticalLight,
          color: response.canDrive ? colors.success : colors.critical,
        }}>
          {response.canDrive ? '✓ Можно ездить' : '⛔ Ехать нельзя'}
        </div>
      )}
      
      {/* Рекомендация */}
      {response.recommendation && (
        <div style={styles.recommendation}>
          💡 {response.recommendation}
        </div>
      )}
      
      {/* Подсказки для уточнения */}
      {response.suggestions && (
        <div style={styles.suggestionsSection}>
          {response.suggestions.map((s, i) => (
            <span key={i} style={styles.suggestionTag}>{s}</span>
          ))}
        </div>
      )}
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
            <span style={styles.categoryIcon}>{cat.icon}</span>
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
const WelcomeMessage = () => (
  <div style={styles.welcome}>
    <div style={styles.welcomeIcon}>🤖</div>
    <div style={styles.welcomeTitle}>Привет! Я ваш автоассистент</div>
    <div style={styles.welcomeText}>
      Знаю ваш {carData.brand} {carData.model} ({carData.engine}) вдоль и поперёк. 
      Спросите о симптомах, обслуживании или запчастях.
    </div>
    <div style={styles.welcomeHint}>
      Выберите тему ниже или напишите свой вопрос
    </div>
  </div>
);

export default function AssistantScreen() {
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

  const handleSend = (text) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    // Добавляем сообщение пользователя
    setMessages(prev => [...prev, { type: 'user', text: messageText }]);
    setInputValue('');
    setIsTyping(true);

    // Симулируем задержку ответа
    setTimeout(() => {
      const response = getAssistantResponse(messageText, carData);
      setMessages(prev => [...prev, { type: 'assistant', response }]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
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

  const showQuickPrompts = messages.length === 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton}>←</button>
        <div style={styles.headerCenter}>
          <div style={styles.headerTitle}>Ассистент</div>
          <div style={styles.headerSubtitle}>
            {carData.brand} {carData.model} • {carData.engine}
          </div>
        </div>
        <button style={styles.newChatButton}>+</button>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && <WelcomeMessage />}
        
        {messages.map((msg, i) => (
          msg.type === 'user' 
            ? <UserMessage key={i} text={msg.text} />
            : <AssistantMessage key={i} response={msg.response} />
        ))}
        
        {isTyping && (
          <div style={styles.typingIndicator}>
            <div style={styles.assistantAvatar}>🤖</div>
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
          >
            ➤
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
