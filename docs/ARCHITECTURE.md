# Архитектура AutoAssistantAi

> Главная техническая карта. Описывает код, как он есть сейчас. Если расходится с
> кодом — верен код, документ надо поправить.

---

## 1. Стек и деплой

- **Frontend:** React 18 + Vite + react-router-dom v6. **Инлайн-стили** (объекты `styles`/`s`/`c`), без Tailwind, без CSS-файлов, без TypeScript.
- **Backend (тонкий):** `server.js` — Express. Отдаёт собранный `dist/` и проксирует чат к Gemini. Никакой БД пока нет.
- **Деплой:** Railway. `git push` в `main` → авто-сборка (`npm install && npm run build`) → `node server.js`.
- **Данные модели:** статические JSON в `public/data/` (копируются в `dist/` при сборке).
- **Состояние пользователя:** localStorage (с whitelist-валидацией). PII не храним.

Сборка: `npm run build`. Локальный фронт: `npm run dev`. Локально с сервером/чатом: `npm run dev:server` (нужен `GEMINI_API_KEY`).

---

## 2. Карта файлов

```
server.js                      ← Express: gzip, кэш-заголовки, статика dist/, /api/chat → Gemini
index.html                     ← favicon (light/dark), apple-touch-icon, manifest, theme-color
public/
├── manifest.webmanifest       ← PWA: «добавить на рабочий стол», standalone
├── apple-touch-icon.png, icon-192/512, icon-maskable-512, favicon-light/dark.png
├── branding/                  ← logo-mark-light.png (знак в UI), logo-wide-light/dark.png
└── data/
    ├── catalog.json           ← бренды/модели/поколения/двигатели/коробки (+ transmission.type, body_types)
    └── issues/hyundai/
        ├── solaris_rb/solaris_rb_final.json
        └── solaris_hc/solaris_ii_final.json

src/
├── main.jsx                   ← точка входа
├── App.jsx                    ← роутинг, ErrorBoundary, BottomNav, RootRoute (редирект), shouldShowNav
├── contexts/
│   └── CarContext.jsx         ← единый провайдер состояния (см. §4)
├── services/
│   ├── dataService.js         ← загрузка catalog/модели; кэш; защита (path traversal, лимит 5 МБ, валидация)
│   ├── userCarService.js      ← машина пользователя + ответы онбординга в localStorage (whitelist)
│   ├── journalService.js      ← журнал ТО/ремонтов; из него выводятся fixedIssueIds (с TTL)
│   ├── issueStatusService.js  ← статус болячки по мнению юзера: 'actual' | 'unknown' (localStorage)
│   └── serviceAnalytics.js    ← trackServiceInterest(serviceId): событие интереса + локальный счётчик (заглушка под бэк)
├── utils/
│   └── issueHelpers.js        ← ВСЯ доменная логика: классификация по пробегу, индекс, зрелость,
│                                системы, стоимость владения, форматтеры, линковка recalls/исков
└── components/
    ├── Onboarding.jsx         ← 4 слайда-интро (новый пользователь)
    ├── AddCarForm.jsx         ← каскадные селекты: марка→модель→поколение→двигатель→коробка→год→пробег
    ├── OnboardingQuestions.jsx← /checkup: вопросы-ощущения (Duolingo-стиль) + «Не знаю» → 3 пути
    ├── Dashboard.jsx          ← «Мой гараж»: кольцо зрелости, «% картины», системы, стоимость, ассистент-чип
    ├── IssuesScreen.jsx       ← «Обслуживание»: 3 вкладки (Слабые места / ТО / Карта) + дожим + тур
    ├── MaintenanceTab.jsx     ← вкладка ТО: Регламент + Износ (строки → детальная карточка)
    ├── MileageMapTab.jsx      ← вкладка Карта: вертикальный таймлайн по пробегу
    ├── IssueDetailScreen.jsx  ← детальная страница болячки/ТО/износа по id
    ├── JournalScreen.jsx      ← журнал обслуживания
    ├── AssistantScreen.jsx    ← AI-чат (Gemini), рендер markdown
    ├── ServicesScreen.jsx     ← «Сервисы»: витрина услуг (заглушки «скоро» + «Уведомить» → аналитика интереса)
    ├── BuyerChecklistScreen.jsx← «Чек-лист покупки»: что проверить при покупке (динамически из болячек)
    ├── ServiceDetailScreen.jsx ← страница сервиса: описание + «В разработке» + «Уведомить»
    ├── servicesCatalog.js      ← каталог сервисов (id → title/icon/group/desc), общий для витрины и детали
    ├── CoachmarksTour.jsx     ← оверлей-подсветка для тура по вкладкам
    ├── MileageUpdateModal.jsx ← модалка обновления пробега
    ├── CarSilhouette.jsx      ← SVG-силуэт авто по типу кузова/цвету
    └── Icon.jsx               ← инлайн-SVG иконки (Lucide-стиль). ТОЛЬКО контурные, без эмодзи.

docs/                          ← эта документация
data/                          ← каноническая схема болячки + пример (ISSUE_SCHEMA.md, *.json)
prototypes/                    ← HTML-референсы дизайна (Audi A1)
```

---

## 3. Роутинг (`App.jsx`)

| Путь | Экран | Нав. снизу |
|------|-------|:----------:|
| `/` | `RootRoute` — редирект | — |
| `/add-car` | `AddCarForm` | — |
| `/checkup` | `OnboardingQuestions` (опрос) | — |
| `/dashboard` | `Dashboard` | ✓ |
| `/issues` | `IssuesScreen` (вкладку можно задать через `location.state.tab`) | ✓ |
| `/issues/:issueId` | `IssueDetailScreen` | ✓ |
| `/journal` | `JournalScreen` | ✓ |
| `/maintenance` | `MaintenanceScreen` *(осиротевший — функционал переехал во вкладку `/issues` service; кандидат на удаление)* | ✓ |
| `/cost` | `CostScreen` (полная стоимость владения) | ✓ |
| `/assistant` | `AssistantScreen` | ✓ |
| `/services` | `ServicesScreen` (витрина услуг) | ✓ |
| `/services/:serviceId` | `ServiceDetailScreen` (детали + «Уведомить») | — |
| `/checklist` | `BuyerChecklistScreen` (чек-лист покупки) | — |

- **`RootRoute`** решает СРАЗУ (без мигания): `userCar` и флаг онбординга читаются из localStorage синхронно. Нет авто → `/add-car`; есть → `/dashboard`; не прошёл интро → `Onboarding`. Тяжёлый JSON болячек грузится в фоне, экраны показывают своё «Загрузка». **Не возвращать splash-гейт на `loading`** — это была регрессия медленного старта.
- **`shouldShowNav`** скрывает нижнюю навигацию на `/`, `/add-car`, `/checkup`.
- **`ErrorBoundary`** ловит падение дерева и показывает текст ошибки + «Сбросить и перезагрузить» (вместо белого экрана).

---

## 4. Состояние: `CarContext.jsx`

Единый провайдер. Значения:

| Поле | Что |
|------|-----|
| `userCar` | машина из localStorage (читается **синхронно** в инициализаторе useState) |
| `carDetails` | данные модели из catalog (двигатели, коробки, поколение) |
| `issuesData` | `{ systemic, wear, maintenance, minor, recalls, classActions, tsb, annual_budget, hasData }` — отфильтровано под конфигурацию |
| `journalRecords` | записи журнала (подписка на `journalService`) |
| `fixedIssueIds` | **производное** от журнала: id болячек, отмеченных «устранено» (с учётом TTL по пробегу) |
| `issueStatuses` | `{ id: 'actual' \| 'unknown' }` (подписка на `issueStatusService`) |
| **методы** | `saveCar`, `updateMileage`, `removeCar`, `refresh`, `markIssueFixed(issue)`, `unmarkIssueFixed(id)`, `saveAnswers(answers)`, `setIssueStatus(id, status)` |

`loading` остаётся `true`, пока грузятся `carDetails` + большой JSON болячек; на него завязаны лоадеры экранов (НЕ корневой редирект — см. §3).

---

## 5. Потоки данных

**Старт:** `CarProvider` синхронно читает `userCar` → `RootRoute` мгновенно решает маршрут → `loadUserCar()` асинхронно тянет `getModelById` (catalog) и `getIssuesForCar` (JSON модели, кэшируется) → `issuesData` готов → экраны рендерят контент.

**Фильтрация под конфигурацию:** `dataService.getIssuesForCar(modelId, {engineCode, transmissionCode})` берёт `records` из JSON и делит по `type`: `systemic_defect`→systemic, `common_wear`→wear, `maintenance`→maintenance; `minor_annoyance`→minor. Глобальные `global_recalls/_class_actions/_tsb` кладутся в recalls/classActions/tsb. Применяется match по двигателю/коробке (с нюансом: записи систем трансмиссии могут иметь `engine:null`, чтобы не привязываться к мотору).

**Отметка «устранено»:** кнопка в `IssueCard`/`IssueDetailScreen` → `markIssueFixed(issue)` → запись в журнал → `journalService` уведомляет → `fixedIssueIds` пересчитывается → индекс/группы/«% картины» обновляются.

---

## 6. Хранилище (localStorage)

| Ключ | Сервис | Что | Валидация |
|------|--------|-----|-----------|
| `aaa_user_car` | userCarService | конфигурация авто + `onboardingAnswers` | whitelist полей; ответы — только `good/mid/bad/unknown`, ≤20 шт |
| `aaa_onboarding_completed` | userCarService | прошёл ли интро | 'true' |
| `aaa_journal` | journalService | записи ТО/ремонтов | — |
| `aaa_issue_status` | issueStatusService | вердикт по болячке | ключ snake_case, значение `actual/unknown` |
| `aaa_service_tour_seen` | IssuesScreen | показан ли тур-коачмарк | 'true' |

**Правила безопасности:** никаких PII (ФИО/телефон/email); никаких секретов; всё валидируется при чтении и записи; `GEMINI_API_KEY` — только в env сервера, на фронт не уходит.

---

## 7. Сервер (`server.js`)

- `compression()` — gzip всех ответов (JSON модели ~828 КБ → ~114 КБ; главный ускоритель загрузки).
- Кэш-заголовки: хешированные ассеты Vite (`-<hash>.js|css`) → `max-age=31536000, immutable`; `index.html` → `no-cache`.
- `POST /api/interest` — интерес к сервису: счётчик в памяти + лог в Railway + (если заданы env)
  уведомление владельцу. Каналы по env: `TELEGRAM_BOT_TOKEN`+`TELEGRAM_CHAT_ID` (Telegram),
  `INTEREST_WEBHOOK_URL` (произвольный вебхук). Без env — только лог.
- `POST /api/chat` → Gemini 2.5 Flash (`generativelanguage.googleapis.com`):
  - системный промпт строится из контекста машины + болячек, с жёстким запретом выдумывать артикулы/recall/цены;
  - `thinkingConfig.thinkingBudget: 0` — иначе «мышление» съедает `maxOutputTokens` и ответ обрывается;
  - `maxOutputTokens: 1024`, простой rate-limit 20 запросов/мин на IP, лимит тела 256 КБ.
- SPA-fallback: всё остальное → `dist/index.html`.

---

## 8. Дизайн-система (кратко; подробно — UI_GUIDELINES.md)

- Primary Blue `#1F4FD8`, Background `#F7F8FA`, Text `#1E293B`.
- Success `#2E9E6F`/`#1D9E75`, Warning/янтарь `#BA7517`/`#D97706`, Critical `#DC2626`/`#E24B4A`.
- Шрифт Inter / системный. Mobile-first, max-width ~420px. Белые карточки, мягкие тени, радиусы.
- Иконки — **только контурные** инлайн-SVG (`Icon.jsx`). **Никаких эмодзи.** Цвет несёт точка/иконка, не заливка блока.

---

## 9. Известные хвосты / технический долг

- `/maintenance` + `MaintenanceScreen.jsx` — осиротевший роут (функционал во вкладке `/issues`). Кандидат на удаление.
- `rowSub` в `IssuesScreen` — мёртвый код после возврата `IssueCard`.
- `groupByImportance` принимает `fixedIssueIds`, но фильтрация «сделано» сейчас в `IssuesScreen` (не внутри хелпера).
- Жёсткого клампа «плавного шага» индекса нет — плавность даёт мягкие веса + анимация кольца.
- Автотестов нет. Первый кандидат — юнит-тесты на `classifyIssueByMileage`/`issueAnchorKm`/`pictureCompleteness`.
