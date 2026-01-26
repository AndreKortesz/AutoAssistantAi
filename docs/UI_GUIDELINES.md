# UI Guidelines — AutoAssistantAi

## Философия дизайна

### Ключевая эмоция
> «Я под защитой, всё под контролем»

Пользователь **не должен бояться** своего автомобиля. Сервис **информирует**, а не **пугает**.

### Принципы

1. **Спокойствие** — без паники, без давления
2. **Ясность** — понятно с первого взгляда
3. **Прогрессивное раскрытие** — минимум сначала, детали по запросу
4. **iOS-эстетика** — если выглядит как часть iOS — подходит

---

## Цветовая система

### Основные цвета

```css
:root {
  /* Основные */
  --primary: #1F4FD8;
  --primary-light: rgba(31, 79, 216, 0.08);
  --primary-hover: #1a43b8;
  
  /* Фоны */
  --background: #F7F8FA;
  --card-bg: #FFFFFF;
  --border: #E2E8F0;
  
  /* Статусы */
  --success: #2E9E6F;
  --success-light: rgba(46, 158, 111, 0.08);
  
  --warning: #D97706;
  --warning-light: rgba(217, 119, 6, 0.08);
  
  --critical: #DC2626;
  --critical-light: rgba(220, 38, 38, 0.08);
  
  /* Текст */
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --text-tertiary: #94A3B8;
}
```

### Использование статусных цветов

| Цвет | Когда использовать |
|------|-------------------|
| 🔴 Critical (красный) | Severity: critical, "нельзя ехать" |
| 🟠 Warning (оранжевый) | Severity: high, "скоро", внимание |
| 🟡 Medium (жёлтый) | Severity: medium |
| 🟢 Success (зелёный) | Severity: low, "пройдено", успех |
| 🔵 Primary (синий) | Действия, ссылки, акценты |

---

## Типографика

### Шрифты

```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
```

Используем системные шрифты для нативного ощущения.

### Размеры

| Элемент | Размер | Вес |
|---------|--------|-----|
| Заголовок страницы | 22px | 700 |
| Заголовок секции | 16px | 600 |
| Заголовок карточки | 15px | 600 |
| Основной текст | 14px | 400 |
| Вторичный текст | 13px | 400 |
| Подписи, теги | 12px | 500 |
| Мелкий текст | 11px | 400 |

---

## Компоненты

### Карточки

```css
.card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border);
}
```

### Бейджи критичности

```jsx
// Точка (в списке)
<div style={{
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: severityColor
}} />

// Полный бейдж
<span style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  borderRadius: 20,
  fontSize: 13,
  fontWeight: 600,
  color: severityColor,
  background: severityLightColor
}}>
  🔴 Критично
</span>
```

### Кнопки

```css
/* Primary */
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 14px 20px;
  font-size: 15px;
  font-weight: 600;
}

/* Secondary */
.btn-secondary {
  background: var(--primary-light);
  color: var(--primary);
  border: none;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--primary);
  border: none;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
}
```

### Теги (Chips)

```css
.chip {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.chip-default {
  background: var(--primary-light);
  color: var(--primary);
}

.chip-success {
  background: var(--success-light);
  color: var(--success);
}

.chip-warning {
  background: var(--warning-light);
  color: var(--warning);
}
```

### Секции (аккордеоны)

```jsx
<button style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: `1px solid ${color}`,
  background: `${color}10`, // 10% opacity
}}>
  <span>● Заголовок секции</span>
  <span>3</span> {/* count */}
  <span>▼</span>
</button>
```

---

## Паттерны UI

### Прогресс-бар пробега

```
[-------|███████████|-------]
 15k     ↑ 45k       80k
       Ваш пробег
```

- Серая полоса = полный диапазон
- Цветная зона = диапазон болячки
- Маркер = текущий пробег пользователя

### Иконки статуса в карточке

```
┌─────────────────────────────────────────────┐
│ ● Растяжение цепи ГРМ           ⚖️ 📋  ▼   │
│   Двигатель • 35% авто                      │
└─────────────────────────────────────────────┘

⚖️ = есть выигранные иски
📋 = есть отзывные кампании
```

### Табы в решении

```
┌────────────────────┬────────────────────┐
│  🔧 В сервисе      │  🛠 Своими руками  │
│   рекомендуем      │   для опытных      │
└────────────────────┴────────────────────┘
```

### VIN промпт

```
┌─────────────────────────────────────────────┐
│ 💡 Хотите узнать больше?                    │
│                                             │
│ Введите VIN — проверим, попадает ли ваше    │
│ авто под отзывную кампанию.                 │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │           [ Ввести VIN ]                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│              Пропустить                     │
└─────────────────────────────────────────────┘
```

Дизайн: dashed border, gradient background, ненавязчивый

---

## Анимации

### Раскрытие секций

```css
.section-content {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.2s ease;
}

.section-content.open {
  max-height: 500px;
  opacity: 1;
}
```

### Поворот стрелки

```css
.chevron {
  transition: transform 0.2s ease;
}

.chevron.open {
  transform: rotate(180deg);
}
```

### Появление карточек

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeIn 0.3s ease-out;
}
```

---

## Запреты ❌

### Тон
- ❌ "НЕЛЬЗЯ ЕЗДИТЬ!!!"
- ✅ "Требует срочного внимания"

- ❌ "КРИТИЧЕСКАЯ ОШИБКА"
- ✅ "Важная проблема"

- ❌ "Вы должны немедленно..."
- ✅ "Рекомендуем проверить..."

### Визуал
- ❌ Красные мигающие элементы
- ❌ Кислотные цвета
- ❌ Агрессивные тени
- ❌ Избыточные иконки
- ❌ Много восклицательных знаков

### Информация
- ❌ Перегруз информацией
- ❌ Все детали сразу
- ❌ Длинные списки без группировки

---

## Адаптивность

### Mobile-first
Основной дизайн — для мобильных (375px).

```css
.container {
  max-width: 420px;
  margin: 0 auto;
  padding: 0 16px;
}
```

### Отступы
- Между секциями: 16px
- Внутри карточки: 14-16px
- Между карточками: 8-10px
- Между элементами внутри: 8-12px

---

## Чеклист качества

Перед релизом проверить:

- [ ] Текст читаем на любом фоне
- [ ] Интерактивные элементы ≥ 44px (touch target)
- [ ] Нет красного без необходимости
- [ ] Тон спокойный, не алармистский
- [ ] Информация структурирована (заголовки, группы)
- [ ] Анимации плавные, не раздражающие
- [ ] Нет перегруза информацией на одном экране

---

*UI Guidelines v1.0 — январь 2026*
