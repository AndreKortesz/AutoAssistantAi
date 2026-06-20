# Данные и схема

> Каноническая схема болячки (v1.1) — в [`/data/ISSUE_SCHEMA.md`](../data/ISSUE_SCHEMA.md)
> рядом с `issue-gold-standard-schema.json` и примером
> `issue-example-mustang-fuel-sensor.json`. Здесь — как данные устроены и читаются в коде.

---

## 1. Каталог — `public/data/catalog.json`

Бренды → модели → поколения. У поколения: `id`, `model_name`, `generation_label`,
`year_start/end`, `data_file` (путь к JSON болячек), `engines[]`, `transmissions[]`
(с `code`, **`type`** «АКПП/МКПП/Вариатор/Робот», `gears`, `label`),
`engine_transmission_compat[]`, `body_types[]`.

`transmission.type` используется для вопроса по коробке в опросе (`OnboardingQuestions`).
`engine_transmission_compat` — для авто-фильтрации коробок в форме под выбранный двигатель.

## 2. Файл модели — `public/data/issues/<brand>/<gen>/<...>_final.json`

Верхние ключи: `metadata`, **`records`** (массив записей), `minor_annoyance`,
`discarded_rare`, `global_recalls`, `global_class_actions`, `global_tsb`,
`annual_budget_15000km`, `major_one_time_expenses`, `key_insights`.

`dataService.getIssuesForCar` фильтрует `records` под двигатель/коробку и делит по `type`:

| `type` | Куда | Что это |
|--------|------|---------|
| `systemic_defect` | `systemic` | массовый конструктивный дефект (recall/TSB/иск или ≥10% и раньше ресурса) |
| `common_wear` | `wear` | предсказуемый износ (есть `wear_interval_km` — может быть `{min,max}`) |
| `maintenance` | `maintenance` | плановое ТО (есть `maintenance_interval_km`) |
| `minor_annoyance` | `minor` | мелочь без угрозы безопасности |
| `discarded_rare` | — | отброшено (<3 источников), в UI не идёт |

Глобальные `global_recalls/_class_actions/_tsb` → `recalls/classActions/tsb`. Привязка к
конкретным болячкам — через `linked_issue_id` (см. `getLinkedRecalls/getLinkedClassActions/getLinkedTSB`).

## 3. Ключевые блоки записи (Gold Standard)

`car` (конфигурация + `fuel_requirements`), `issue` (symptoms, obd_codes, `cause`, `severity`,
`severity_reason`, `system`/`subsystem`, `can_drive`), `mileage` (`typical_start_km`,
`typical_end_km`, `peak_km`, `frequency_percent`, `frequency_description`), `consequences`
(`worst_case_cost_rub`), `solutions` (diy + service, `diy_difficulty`), `parts` (артикулы,
`revision_history`, `alternatives`, `do_not_buy`, `where_to_buy`), `defect_status`
(class_actions, recalls, tsb с флагами стран), `prevention`, `diagnostic`, `owner_reports`,
`sources`, `meta`.

⚠️ Часть полей в данных может приходить **строкой вместо массива** (`where_to_buy`,
`alternatives`, `do_not_buy`, `cause.secondary` и т.п.) → в UI оборачивать `asArray()`,
иначе `.map`/`.join` уронят экран.

## 4. Различие схем RB и HC (важно!)

Два собранных файла имеют РАЗНЫЕ схемы названий:
- **Solaris RB** — заголовок в `issue.title`;
- **Solaris II HC** — у ТО/износа имя в `position.name` / `part_info.name`.

Поэтому в коде НЕ обращаться напрямую к `issue.title`, а использовать хелперы:
- `recordTitle(r)` = `issue.title || issue.title_short || position.name || part_info.name || title`;
- `recordSystem(r)` = `issue.system || position.system || part_info.system`;
- `wearRange(r)` нормализует `wear_interval_km` (число или `{min,max}`) к `{min,max}`.

## 5. Собранные модели

- **Solaris RB (2010–2017):** G4FA 1.4 (107 л.с.), G4FC 1.6 (123 л.с.). Коробки M5CF1, M6CF1,
  A4CF1, A6GF1 (рестайл 2014–2017 — A6GF1, **не** A6MF1).
- **Solaris II HC (2017–2022):** Kappa G4LC 1.4 (100 л.с.), Gamma II G4FG 1.6 (123 л.с.) — **не**
  G4FA/G4FC. Только 6-ст: M6CF1, A6GF1, A6GF1-2. Близнец США — Accent YC (не HC). 6 полей помечены
  `manual_check_required` (АКПП, шлейф гидроблока, сайлентблоки) — артикулы требуют ручной проверки.

## 6. Кузов исключён везде

`isBodyRecord(r)` (`recordSystem === 'body'`). Болячки кузова не показываем в «Обслуживании»
и не считаем в системах — решение владельца. (В общий индекс здоровья они при этом входят.)

## 7. Правила данных (повтор из CLAUDE.md)

- **Никогда не выдумывать** артикулы, `recall_id`, цифры — только проверенные или `null` +
  `needs_review: true`. Лучше честное «не знаю», чем галлюцинация.
- Опасные поля (ATF, тормозная жидкость, антифриз, SRS) → `manual_check_required: true`.
- Минимум 3 источника на болячку; аудит — в другой LLM (не той, что собирала).
- Сбор данных — отдельный pipeline (Claude.ai + Grok + Gemini), НЕ задача Claude Code
  (см. PROCESS.md / DATA_COLLECTION.md).
