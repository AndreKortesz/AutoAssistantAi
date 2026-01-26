# Contributing to AutoAssistantAi

## Быстрый старт для разработчика

### 1. Клонировать проект

```bash
git clone https://github.com/user/AutoAssistantAi.git
cd AutoAssistantAi
```

### 2. Установить зависимости

```bash
npm install
```

### 3. Запустить dev-сервер

```bash
npm run dev
```

### 4. Открыть в браузере

```
http://localhost:5173
```

---

## Структура проекта

```
AutoAssistantAi/
├── src/
│   ├── components/       # React-компоненты
│   ├── App.jsx          # Главный компонент
│   └── main.jsx         # Entry point
├── data/                # JSON-данные
├── docs/                # Документация
├── tools/               # Утилиты и скрипты
├── prototypes/          # HTML-прототипы
└── public/              # Статика
```

---

## Правила кода

### React-компоненты

```jsx
// ✅ Хорошо: функциональный компонент с hooks
export default function IssueCard({ issue, onExpand }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div style={styles.card}>
      {/* ... */}
    </div>
  );
}

// ✅ Хорошо: inline styles в объекте
const styles = {
  card: {
    background: colors.cardBg,
    borderRadius: '12px',
    padding: '16px',
  },
};
```

### Цвета

Всегда используй переменные из `colors`:

```jsx
// ✅ Хорошо
background: colors.primary

// ❌ Плохо
background: '#1F4FD8'
```

### Именование

| Тип | Формат | Пример |
|-----|--------|--------|
| Компоненты | PascalCase | `IssueCard.jsx` |
| Функции | camelCase | `calculateHealthIndex()` |
| Константы | UPPER_SNAKE | `MILEAGE_BUFFER` |
| Стили | camelCase | `styles.cardHeader` |

---

## Добавление новой болячки

### 1. Создай JSON-файл

```bash
touch data/issues/toyota_camry_xv70_strut_mount.json
```

### 2. Заполни по схеме

Используй `issue-gold-standard-schema.json` как референс.

Минимальный набор:

```json
{
  "id": "toyota_camry_xv70_strut_mount",
  "car": {
    "brand": "Toyota",
    "model": "Camry",
    "generation": "XV70"
  },
  "issue": {
    "title": "Износ опорного подшипника",
    "system": "suspension",
    "severity": "medium"
  },
  "mileage": {
    "typical_start_km": 50000,
    "typical_end_km": 100000
  },
  "solutions": [...]
}
```

### 3. Провалидируй

```bash
npm run validate:issues
```

---

## Добавление нового экрана

### 1. Создай компонент

```bash
touch src/components/NewScreen.jsx
```

### 2. Используй шаблон

```jsx
import React, { useState } from 'react';

const colors = {
  // ... импортировать из общего файла
};

export default function NewScreen() {
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton}>←</button>
        <div style={styles.headerTitle}>Заголовок</div>
      </div>
      
      {/* Content */}
      <div style={styles.content}>
        {/* ... */}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: colors.background,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  // ...
};
```

### 3. Добавь в роутинг

В `App.jsx`:

```jsx
import NewScreen from './components/NewScreen';

// В switch/router
case 'newscreen':
  return <NewScreen />;
```

---

## Работа с прототипами

HTML-прототипы в `/prototypes/` — для быстрого тестирования UI.

### Создание прототипа

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Прототип — AutoAssistantAi</title>
  <style>
    :root {
      --primary: #1F4FD8;
      /* ... */
    }
  </style>
</head>
<body>
  <!-- Контент -->
  <script>
    // Интерактивность
  </script>
</body>
</html>
```

### Конвертация в React

После утверждения прототипа — конвертируй в React-компонент:
1. HTML → JSX (camelCase атрибуты, className вместо class)
2. CSS → styles object
3. onclick → onClick handlers

---

## Тестирование

### Визуальное тестирование

1. Открой на мобильном (или DevTools → мобильный режим)
2. Проверь все состояния (expanded/collapsed, loading, error)
3. Проверь цвета критичности
4. Убедись в читаемости текста

### Чеклист перед PR

- [ ] Код работает локально
- [ ] Нет console.log / console.error
- [ ] Стили используют `colors` константы
- [ ] Тон текстов соответствует TONE_OF_VOICE.md
- [ ] Нет хардкода данных (используй props/state)

---

## Git Workflow

### Ветки

```
main          # Продакшн
├── develop   # Разработка
├── feature/* # Новые фичи
└── fix/*     # Баг-фиксы
```

### Коммиты

```
feat: добавлен экран детальной болячки
fix: исправлен расчёт health index
docs: обновлена документация по схеме
style: форматирование кода
refactor: переработан компонент IssueCard
```

### Pull Request

1. Создай ветку от `develop`
2. Внеси изменения
3. Создай PR в `develop`
4. Опиши что сделано
5. Дождись ревью

---

## Вопросы?

Читай документацию:
- [README.md](./README.md) — обзор проекта
- [ARCHITECTURE.md](./ARCHITECTURE.md) — архитектура
- [UI_GUIDELINES.md](./UI_GUIDELINES.md) — дизайн-гайдлайны
- [TONE_OF_VOICE.md](./TONE_OF_VOICE.md) — тон коммуникации
- [ISSUE_SCHEMA.md](./ISSUE_SCHEMA.md) — схема болячки

---

*Contributing Guide v1.0*
