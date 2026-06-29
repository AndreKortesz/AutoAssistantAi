# Архитектура AutoAssistantAi

> Главная техническая карта. Описывает код, как он есть сейчас. Если расходится с
> кодом — верен код, документ надо поправить. Новичку/ИИ: начни с этого файла, затем
> [HEALTH_INDEX.md](HEALTH_INDEX.md) (самая нетривиальная механика) и [FEATURES.md](FEATURES.md).

---

## 1. Стек и деплой

- **Frontend:** React 18 + Vite + react-router-dom v6. **Инлайн-стили** (объекты `styles`/`s`/`c`), без Tailwind/CSS-файлов, без TypeScript.
- **Backend (тонкий):** `server.js` — Express. Отдаёт `dist/`, проксирует чат к Gemini, принимает события интереса к сервисам и пишет их в PostgreSQL.
- **БД:** PostgreSQL (Railway), опционально — только для аналитики интереса к сервисам. Всё остальное работает без БД.
- **Деплой:** Railway, `git push` в `main` → авто-сборка (`npm install && npm run build`) → `node server.js`.
- **Данные модели:** статические JSON в `public/data/` (копируются в `dist/`).
- **Состояние пользователя:** localStorage с whitelist-валидацией. PII не храним.

Скрипты: `npm run build` (vite), `npm run dev` (фронт), `npm run dev:server` / `npm start` (Express, нужен `GEMINI_API_KEY` для чата).

---

## 2. Карта файлов

```
server.js                      ← Express: gzip, кэш-заголовки, /api/chat (Gemini), /api/interest (+Postgres), /api/interest/report
index.html                     ← favicon (light/dark) + apple-touch + manifest + theme-color + CSS-keyframes (aaaCarIn/Shine/PopUp/RingPulse)
public/
├── manifest.webmanifest       ← PWA «на рабочий стол», standalone
├── apple-touch-icon / icon-192/512 / icon-maskable-512 / favicon-light/dark.png
├── branding/                  ← logo-mark-light.png (знак в UI), logo-wide-light/dark.png
└── data/
    ├── catalog.json           ← бренды/модели/поколения/двигатели/коробки (transmission.type, body_types, engine_transmission_compat)
    └── issues/hyundai/{solaris_rb,solaris_hc}/*_final.json

src/
├── main.jsx
├── App.jsx                    ← роутинг, ErrorBoundary, BottomNav (5 пунктов), RootRoute, ScrollToTop, ResetScreen, shouldShowNav
├── contexts/CarContext.jsx    ← единый провайдер состояния (см. §4)
├── services/
│   ├── dataService.js         ← загрузка catalog/модели, кэш, защита (path traversal, лимит 5 МБ, валидация)
│   ├── userCarService.js      ← машина + onboardingAnswers в localStorage (whitelist); флаг онбординга
│   ├── journalService.js      ← журнал ТО/ремонтов; из него выводятся fixedIssueIds (TTL по пробегу)
│   ├── issueStatusService.js  ← статус болячки по мнению юзера: 'actual' | 'unknown'
│   ├── wearStatusService.js   ← статус износа по факту: 'checked_ok' | 'needs_replace' | 'unknown' (+untilKm)
│   ├── maturingAspects.js     ← Стадия 2: пробег на момент «не знаю», «созревшие» аспекты, затухание
│   ├── deferredQuestions.js   ← отложенные вопросы к ассистенту (нудж на главной)
│   └── serviceAnalytics.js    ← trackServiceInterest → POST /api/interest + локальный счётчик
├── utils/issueHelpers.js      ← ВСЯ доменная логика: классификация по пробегу, индекс+зрелость, износ,
│                                системы, sentiment ответов, стоимость владения, форматтеры, линковка recalls
└── components/
    ├── Onboarding.jsx         ← 4 слайда-интро
    ├── AddCarForm.jsx         ← каскадные селекты конфигурации → /checkup
    ├── OnboardingQuestions.jsx← /checkup: 5 вопросов + гейт + доп. блок (3); «не знаю»→3 пути; MiniAssistant
    ├── MiniAssistant.jsx      ← мини-чат ассистента ОВЕРЛЕЕМ поверх онбординга (не роут)
    ├── Dashboard.jsx          ← «Мой гараж»: кольцо зрелости (анимация, тап→модалка), чек-лист источников,
    │                            системы, стоимость, ассистент-чип, нудж-слот, микро-награды
    ├── IssuesScreen.jsx       ← «Обслуживание»: 3 вкладки (Слабые места / ТО / Карта), дожим, тур, sentiment-подсветка
    ├── MaintenanceTab.jsx     ← вкладка ТО: Регламент + Износ (4-статусный контроль по факту)
    ├── MileageMapTab.jsx      ← вкладка Карта: таймлайн по пробегу
    ├── IssueDetailScreen.jsx  ← детальная запись по id (болячка/ТО/износ)
    ├── BuyerChecklistScreen.jsx← /checklist: чек-лист покупки (динамически из болячек)
    ├── ServicesScreen.jsx     ← /services: витрина услуг (заглушки «В разработке»)
    ├── ServiceDetailScreen.jsx← /services/:id: описание сервиса + «Уведомить»
    ├── servicesCatalog.js     ← каталог сервисов (id → title/icon/group/desc)
    ├── CoachmarksTour.jsx     ← оверлей-тур по вкладкам
    ├── JournalScreen.jsx · CostScreen.jsx · MileageUpdateModal.jsx · MaintenanceScreen.jsx (осиротевший)
    ├── MarkdownText.jsx       ← общий рендер markdown (ассистент + мини-чат)
    ├── CarSilhouette.jsx · Icon.jsx (инлайн-SVG, ТОЛЬКО контурные, без эмодзи)

docs/  · data/ (схема болячки)  · prototypes/ (HTML-референсы)
```

---

## 3. Роутинг (`App.jsx`)

| Путь | Экран | Нав. снизу |
|------|-------|:----------:|
| `/` | `RootRoute` — мгновенный редирект | — |
| `/reset` | `ResetScreen` — чистит все `aaa_*` и на старт (для тестов) | — |
| `/add-car` | `AddCarForm` | — |
| `/checkup` | `OnboardingQuestions` (опрос-ощущения) | — |
| `/dashboard` | `Dashboard` | ✓ |
| `/issues` · `/issues/:issueId` | `IssuesScreen` · `IssueDetailScreen` | ✓ / — |
| `/journal` | `JournalScreen` | ✓ |
| `/cost` | `CostScreen` | ✓ |
| `/assistant` | `AssistantScreen` | ✓ |
| `/services` · `/services/:serviceId` | `ServicesScreen` · `ServiceDetailScreen` | ✓ / — |
| `/checklist` | `BuyerChecklistScreen` | — |
| `/maintenance` | `MaintenanceScreen` *(осиротевший — функционал во вкладке `/issues`; кандидат на удаление)* | ✓ |

- **`RootRoute`** решает СРАЗУ: `userCar` и флаг онбординга читаются из localStorage синхронно. Тяжёлый JSON грузится в фоне. **Не возвращать splash-гейт на `loading`** (была регрессия медленного старта).
- **`ScrollToTop`** сбрасывает прокрутку наверх при смене маршрута.
- **5 пунктов нав.:** Главная · Обслуживание · Журнал · Ассистент · Сервисы.
- **`shouldShowNav`** прячет нав. на `/`, `/add-car`, `/checkup`, `/checklist`, `/reset`, `/issues/*`, `/services/*`.

---

## 4. Состояние: `CarContext.jsx`

| Поле | Что |
|------|-----|
| `userCar` | машина из localStorage (синхронно) + `onboardingAnswers` |
| `carDetails` | данные модели из catalog |
| `issuesData` | `{ systemic, wear, maintenance, minor, recalls, classActions, tsb, annual_budget, hasData }` под конфигурацию |
| `journalRecords` | журнал (подписка) |
| `fixedIssueIds` | производное от журнала «устранено» (TTL по пробегу) |
| `issueStatuses` | `{id:'actual'|'unknown'}` (дожим болячек) |
| `wearStatuses` | `{id:{s:'checked_ok'|'needs_replace'|'unknown', untilKm}}` |
| `picturePct`, `maturity` | «% картины» (монотонный пол) + уровень зрелости (1/2/3) |
| **методы** | `saveCar`, `updateMileage`, `removeCar`, `refresh`, `markIssueFixed`, `unmarkIssueFixed`, `saveAnswers`, `setIssueStatus`, `setWearStatus` |

---

## 5. Хранилище (localStorage, ключи `aaa_*`)

| Ключ | Сервис | Что |
|------|--------|-----|
| `aaa_user_car` | userCarService | конфигурация авто + `onboardingAnswers` |
| `aaa_onboarding_completed` | userCarService | прошёл интро |
| `aaa_journal` | journalService | записи ТО/ремонтов |
| `aaa_issue_status` | issueStatusService | вердикт по болячке |
| `aaa_wear_status` | wearStatusService | статус износа по факту (+untilKm) |
| `aaa_maturing` | maturingAspects | пробег на момент «не знаю» + счётчик показов |
| `aaa_deferred_questions` | deferredQuestions | отложенные вопросы ассистенту |
| `aaa_picture_floor` | CarContext | монотонный пол «% картины» |
| `aaa_maturity_done` | Dashboard | показан ли разовый момент «оценка готова» |
| `aaa_service_tour_seen` | IssuesScreen | показан ли тур-коачмарк |
| `aaa_service_interest` / `aaa_service_notified` | serviceAnalytics | локальный счётчик / на что нажали «Уведомить» |
| `aaa_uid` | serviceAnalytics | анонимный id (не PII) |

`/reset` чистит все `aaa_*` и перезагружает на старт.

**Безопасность:** никаких PII/секретов; валидация при чтении и записи; `GEMINI_API_KEY`/`ADMIN_KEY` и т.п. — только в env сервера, на фронт не уходят.

---

## 6. Сервер (`server.js`) и переменные окружения

Эндпоинты:
- `POST /api/chat` → Gemini 2.5 Flash. Системный промпт заземлён на болячки конфигурации, запрет выдумывать артикулы/recall/цены. `thinkingConfig.thinkingBudget: 0` (иначе ответ обрывается), `maxOutputTokens: 1024`, rate-limit 20/мин/IP, лимит тела 256 КБ.
- `POST /api/interest` → запись в PostgreSQL (если есть `DATABASE_URL`) + лог + уведомление владельцу (Telegram/вебхук, если заданы env).
- `GET /api/interest/report?key=<ADMIN_KEY>` → HTML-таблица спроса по сервисам (защищена ключом).
- gzip всех ответов; кэш `max-age=31536000 immutable` для хешированных ассетов Vite, `no-cache` для `index.html`; SPA-fallback.

| Env | Назначение |
|-----|-----------|
| `GEMINI_API_KEY` | ключ чата (без него `/api/chat` → 503) |
| `GEMINI_MODEL` | модель (по умолч. `gemini-2.5-flash`) |
| `DATABASE_URL` | PostgreSQL (Railway); без неё аналитика работает на логах |
| `ADMIN_KEY` | пароль к `/api/interest/report` |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | уведомления владельцу об интересе |
| `INTEREST_WEBHOOK_URL` | произвольный вебхук (получает структуру события — напр. для Google Таблицы) |
| `PORT` | порт (Railway задаёт сам) |

---

## 7. Дизайн-система (кратко; подробно — UI_GUIDELINES.md)

- Primary `#1F4FD8`, Background `#F7F8FA`, Text `#1E293B`. Success `#2E9E6F`/`#1D9E75`, янтарь `#BA7517`, critical `#DC2626`/`#E24B4A`. Кольцо зрелости: приглушённый `#7FC9AD` → насыщенный `#1D9E75`.
- Mobile-first, max-width ~420px, белые карточки, мягкие тени. Иконки — **только контурные** инлайн-SVG (`Icon.jsx`), **без эмодзи**. Цвет несёт точка/иконка, не заливка блока.
- Анимации — CSS-keyframes в `index.html`, уважают `prefers-reduced-motion`.

---

## 8. Нюансы и подводные камни (читать перед правками)

- **Две схемы данных RB/HC.** RB: заголовок в `issue.title`; HC: в `position.name`/`part_info.name`. Не обращаться к `issue.title` напрямую — только `recordTitle()`/`recordSystem()`/`wearRange()` из issueHelpers.
- **Поля бывают строкой вместо массива** (`where_to_buy`, `alternatives`, `do_not_buy`, `cause.secondary`, `prevention.actions`) → оборачивать `asArray()`, иначе `.map`/`.join` уронят экран.
- **Баг `{число && <JSX>}`**: при значении `0` (бесплатный ремонт по отзыву) React печатает «0». Для чисел использовать `value > 0 &&`.
- **Кузов исключён везде** (`isBodyRecord`) — в «Обслуживании» и системах не показываем; в общий индекс кузовные болячки входят.
- **Индекс — не диагноз, а созревающая оценка** (40–95, не 0/100). Системные болячки = статистика модели (вычитаются по классификации); износ = только по подтверждённому факту; ответы-ощущения = мягкая поправка ±1-2. См. [HEALTH_INDEX.md](HEALTH_INDEX.md).
- **Монотонный «пол» зрелости** (`aaa_picture_floor`) — картина не «раскрывается обратно», кольцо не мелькает на границе уровня.
- **Сборка не ловит undefined-компоненты/импорты** (это runtime-ошибка) — проверять импорты икон/компонентов вручную (был краш Карты из-за забытого `import Icon`).
- **AssistantScreen — `height: calc(100dvh - 72px)`** (не 100vh): 100vh на мобиле больше вьюпорта, инпут уходил под нав; автоскролл — по контейнеру, не `scrollIntoView` (дёргало окно).
- **Сбор данных — НЕ задача Claude Code** (отдельный pipeline). Артикулы/recall_id — только проверенные или `null + needs_review`.

---

## 9. Технический долг

- `/maintenance` + `MaintenanceScreen.jsx` — осиротевший роут.
- Неиспользуемые стили после редизайнов (picture*, refine*, mdP/mdList/mdLi в AssistantScreen) — безвредны, можно подчистить.
- Жёсткого клампа «плавного шага» индекса нет (плавность даёт count-up + анимация дуги).
- Автотестов нет. Первый кандидат — юнит-тесты `classifyIssueByMileage`/`issueAnchorKm`/`pictureCompleteness`/`wearIndexDelta`/`systemSentiment`.
- Вопрос онбординга про документы решено не делать (см. memory).
