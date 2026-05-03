# MERGE_REPORT — Hyundai Solaris II (HC/HCR) 2017-2022

**Дата:** 2026-05-03 (аудит применён)
**Версия:** 1.1.1
**Источник:** объединение 10 файлов (5 Claude + 5 Grok) по `prompt-6-merge.txt` + аудит 3 моделей по `prompt-8-apply.txt`
**Финальные артефакты:**
- `solaris_ii_final.json` (765 193 bytes, 72 records + 13 recalls + 3 class actions + 5 TSB)
- `solaris_ii_buyer_guide.md` (обновлён)
- `solaris_ii_merge_report.md` (этот документ)

---

## 1. Что объединено

### 1.1. Источники

| Источник | Двигатель | Коробки | Системы | Recalls | Износ/ТО |
|----------|-----------|---------|---------|---------|----------|
| Claude 1-6 | 9 records | 7 records | 12 records | 13 recalls + 2 CA + 4 TSB + 2 RU goodwill | 13 maint + 16 wear |
| Grok 1-5 | 6 records | 9 records | 10 records | 3 recalls + 2 CA + 1 TSB | RTF не парсится |

**Заметка:** RTF Grok 5 (износ/ТО) и Grok 6 (сводка) не парсились корректно — кириллица потеряна. Использован полный массив Claude 5 (29 записей).

### 1.2. Финал по типам после аудита (v1.1.1)

| Тип записи | До аудита | После аудита | Дельта |
|------------|-----------|--------------|--------|
| `systemic_defect` | 32 | 32 | 0 |
| `common_wear` | 26 | **27** | **+1** (trunk_button_oxidation) |
| `maintenance` | 13 | 13 | 0 |
| `minor_annoyance` | 1 | 1 | 0 |
| `discarded_rare` | 9 | 9 | 0 |
| `recall` (global) | 13 | 13 | 0 |
| `class_action` (global) | 3 | 3 | 0 |
| `tsb` (global) | 5 | 5 | 0 |
| **ИТОГО уникальных ID** | **93** | **94** | **+1** |

---

## 2. Конфликты разрешены при сборке (этап слияния)

| # | Каноническая болячка | Поле | Claude | Grok | Что выбрано |
|---|---------------------|------|---------|------|-------------|
| 1 | `timing_chain_stretch_g4fg` | mileage | 200 000 | 150-180 000 | Компромисс: start=150k, peak=180k, end=200k. Web-search подтвердил для втулочно-роликовой цепи 24321-2B200 |
| 2 | `seatbelt_pretensioner_recall` (NHTSA 22V-354) | affected_units | 239 000 | 230 233 | **Принято Grok-значение** — 230 233 (NHTSA, CarComplaints, Justia) |
| 3 | `torque_converter_lockup_wear_a6gf1` | fix_in_year | (нет) | 2011 | fixed_in_year=null + needs_review:true |
| 4 | `rear_beam_bushings_hc` | part_number | (нет) | 55160-1R000 | Принято — артикул валиден для HC дорест |
| 5 | `rear_beam_bushings_hcr` | part_number | (нет) | (нет) | part_number=null + needs_review:true |
| 6 | `valve_body_harness_a6gf1` | part_number | (нет) | 46307-3B650 | part_number=null + manual_check_required:true |

---

## 3. Web-search верификации при слиянии (4 шт.)

| # | Что проверял | Источник | Результат |
|---|--------------|----------|-----------|
| 1 | Цепь ГРМ G4FG ресурс | motorhunter, drive2 (2020), xn----7sblddwxcgjt2a1a | Втулочно-роликовая цепь 24321-2B200, 150-200k |
| 2 | NHTSA 22V-354 affected_units | nhtsa.gov, Justia, CarComplaints, RepairPal | 230 233 единицы |
| 3 | Артикул 55160-1R000 | autoopt.ru, avtoall.ru, drive2 | Подтверждено для дорест HC |
| 4 | Артикул 24321-2B200 | solarisrio.ru, motorhunter | Усиленная цепь с 07.2015 |

---

## 4. Аудит данных (2026-05-03)

### 4.1. Использованы модели

- **Grok** (Audit_GROK.rtf, 2026-05-03) — оценка качества JSON 5/5
- **Gemini** (Отчет_по_аудиту_Hyundai_Solaris_II.docx, 2026-05-03) — оценка 4.5/5
- **Perplexity-style** (solaris_full_audit.md) — оценка 4/5

### 4.2. Сводка по моделям

| Раздел | Grok | Gemini | Perplexity | Применено |
|--------|------|--------|------------|-----------|
| А. Галлюцинации | 0 | 1 | 4 | **0** |
| Б. Пропущенные болячки | 0 | 2 | 5 | **1** (кнопка багажника) |
| В. Пропущенные recalls | 4 (уже в JSON) | 0 | 3 (без ID) | **0** |
| Г. Несостыковки | 0 | 2 | 5 | **3** (ГБО + рейка + worst_case) |
| Д. Структурные ошибки | 0 | 0 | 4 | **0** |
| **ИТОГО** | **4** | **5** | **21** | **4** |

**Итого пунктов в аудите:** 28 | **Применено:** 4 | **Отклонено:** 24

### 4.3. Применённые правки (4 шт.)

| # | Правка | Источник | Уверенность | Источник верификации |
|---|--------|----------|-------------|----------------------|
| **G2** | `worst_case_cost zadiry_g4fg` max расширен с 300 000 → **350 000 ₽** | Perplexity | средняя | Web-search 2026: oem-zap.su, full-quattro, Drive2 — ремонты до 250-350k подтверждаются |
| **G6** | `valve_adjustment_g4fg` добавлен `gbo_note`: на ГБО интервал **60 000 км** вместо 90 000 | Gemini | средняя | Web-search: ГБО ускоряет износ клапанов; не фиксируем 45 000 — нет точного источника |
| **G7** | `steering_rack_bushing_knock.parts[]` добавлен **56500-H5000** + альтернативы (Mando, ALNSU, RSR) | Gemini | высокая | rem.ru (49 706-51 466 ₽), market.yandex, reikanen.ru, drive2 |
| **B6** | Создана новая запись `hyundai_solaris_ii_trunk_button_oxidation` с артикулом **81260-H5000** | Gemini | средняя | гидрач.рф (артикул для Solaris II 2017+); needs_review:true для статистики |

### 4.4. Отклонённые правки (24 шт.)

| # | Правка | Кто предложил | Почему отклонено |
|---|--------|---------------|------------------|
| A1 | TSB HFE-17-14-E800-HCR не существует | Perplexity | Web-search опроверг: solaris2.ru даёт полный документ от 2017-11-03 с ECU P/No 391F2-03KA0, код 391F2F02 |
| A2 | ECU ROM ID HCR75E4D6ARSN3F0/F1 — синтетика | Perplexity | Web-search опроверг: документ TSB содержит точные ROM ID |
| A3 | part_number 28510-2BEA0 в zadiry_g4fg | Perplexity | Этого артикула в моём JSON НЕТ — Perplexity галлюцинирует про чужой JSON |
| A4 | 55160-1R000 → 55160-L1000 | Gemini | Web-search не подтвердил существование 55160-L1000 для Solaris II |
| A5 | "Hyundai признал" — официального признания нет | Perplexity | Claude в JSON указал `is_acknowledged: false` с косвенным признанием — правка некорректна |
| B1 | piston slap G4FG/G4LC — отдельная болячка | Perplexity | Уже покрыто в zadiry_cylinders и oil_consumption — это симптом тех же дефектов |
| B2 | Растяжение цепи ГРМ — пропущена | Perplexity | **УЖЕ В JSON** как `timing_chain_stretch_g4fg` |
| B3 | Детонация на 92 G4FG | Perplexity | Только Perplexity, нет 3+ источников |
| B4 | Течь сальников коленвала | Perplexity | Только Perplexity, родственная `valve_cover_gasket_leak_g4fg` уже есть |
| B5 | Пинки АКПП A6GF1 | Perplexity | **УЖЕ В JSON** как `valve_body_clogging_a6gf1` |
| B7 | Оплавление отражателей галогеновой оптики 2017-2018 | Gemini | Web-search не подтвердил для Solaris II — общая теория для всех машин с галогеном. Упомянуто в edge_cases buyer guide |
| V1 | Canada recalls (C2229, C2226, C2213, C2208) | Grok | **УЖЕ В JSON** все 4: `recall_canada_TC_*`. Grok смотрел старую версию |
| V2 | Recall Brazil brake master cylinder | Grok | **УЖЕ В JSON** |
| V3 | Class action Allard (paint peeling) | Grok | **УЖЕ В JSON** как `ca_quebec_paint_peeling` |
| V4 | NHTSA airbag/ремни recalls (без ID) | Perplexity | **УЖЕ В JSON** 5 разных recalls (21V-796, 22V-069, 22V-218, 22V-123, 22V-354) |
| V5 | TSB обновления АКПП (без ID) | Perplexity | Без ID и описания |
| V6 | TSB cold start calibration (без ID) | Perplexity | Без ID и описания |
| G1 | "каждый 5-10 владелец" → "10-20%" | Perplexity | Такой фразы в моём JSON нет |
| G3 | zadiry_g4lc frequency — qualitative | Perplexity | В JSON `frequency_percent` для G4LC уже null с qualitative описанием |
| G4 | idle_vibration_g4lc: systemic_defect → minor_annoyance | Perplexity | Есть TSB → признанный дефект; severity=low уже корректна |
| G5 | cause.primary должно быть "предполагается" | Perplexity | Реальная причина (керамическая крошка катализатора) — широко известна |
| D1 | ECU ROM ID — избыточная детализация | Perplexity | Полезная информация для механика |
| D2 | relations.causes — нарушена логика | Perplexity | Без конкретики |
| D3 | metadata.global_recalls — нет списка | Perplexity | В JSON есть `global_recalls` с 13 записями |

### 4.5. Web-search верификации при аудите (6 шт.)

| # | Что проверял | Источник | Результат |
|---|--------------|----------|-----------|
| 1 | TSB HFE-17-14-E800-HCR | solaris2.ru/threads/obnovlenie-ehbu-ustranenie-vibracii-na-1-4-tsb.341 | Подтверждено: документ 2017-11-03, ECU P/No 391F2-03KA0, ROM ID HCR75E4D6ARSN3F0→F1, код 391F2F02 |
| 2 | Артикул 56500-H5000 | rem.ru (49 706-51 466 ₽), market.yandex (Mando), reikanen.ru, drive2 | Подтверждено для Solaris II 2017+ и Kia Rio IV |
| 3 | Артикул 81260-H5000 | гидрач.рф | Подтверждено для Solaris II 2017+. На Solaris I был 81260-1R000 |
| 4 | Артикул 55160-L1000 | OEM-каталоги | НЕ подтверждено |
| 5 | Регулировка клапанов G4FG на ГБО | Drive2 (G4GC на ГБО), digitronicgas.ru | Частично: ГБО ускоряет износ, типичная рекомендация 60k. "45 000" не подтверждено |
| 6 | Стоимость капремонта G4FG 2026 | oem-zap.su, full-quattro.ru, Drive2 | Расширили max до 350 000 ₽ |

### 4.6. Записи помечены `needs_review: true` (15 шт. после аудита, +1 от B6)

| # | ID | Причина |
|---|-----|---------|
| 1 | `hyundai_solaris_ii_g4lc_camshaft_bed_wear` | Источники Grok ссылаются на Rio 4G/X-Line, не Solaris II напрямую |
| 2 | `hyundai_solaris_ii_m6cf1_bearing_noise` | Гул подшипников МКПП — мало конкретики |
| 3 | `hyundai_solaris_ii_a6gf1_valve_body_harness` | part_number не верифицирован OEM |
| 4 | `hyundai_solaris_ii_a6gf1_2_valve_body_harness` | То же |
| 5 | `hyundai_solaris_ii_a6gf1_torque_converter_lockup_wear` | Конфликт дат fix |
| 6 | `hyundai_solaris_ii_a6gf1_2_underdrive_clutch_wear` | Единичные кейсы |
| 7 | `hyundai_solaris_ii_rear_beam_bushings_hcr` | Артикул для HCR не верифицирован |
| 8 | `hyundai_solaris2_paint_thinness_chipping_body` | Унаследовано от Claude 3 |
| 9 | `hyundai_solaris2_led_headlamp_condensation_electrical` | Унаследовано |
| 10 | `hyundai_solaris2_battery_undercharge_ams_electrical` | Унаследовано |
| 11 | `hyundai_solaris_overheating_a6gf1` | Нужна валидация частоты |
| 12 | `hyundai_solaris_atf_coolant_emulsion_a6gf1` | Нужна доп. валидация по VIN |
| 13 | `hyundai_solaris_rear_shock_absorber` | Артикул 55310-H5100 для HCR |
| 14 | `hyundai_solaris_front_arm_bushing` | Унаследовано |
| 15 | **`hyundai_solaris_ii_trunk_button_oxidation`** *(новая после аудита)* | Нужна статистика именно по Solaris II |

(Плюс class_action `hyundai_kia_theft_class_action_mdl_3052` с `needs_review:true`.)

### 4.7. Записи с `manual_check_required: true` (6 шт., не изменилось после аудита)

| # | ID | Поле | Что проверить |
|---|-----|------|---------------|
| 1 | `hyundai_solaris_ii_g4lc_camshaft_bed_wear` | связь с ГРМ/ГБЦ | Подтвердить статистику для Solaris II |
| 2 | `hyundai_solaris_ii_a6gf1_valve_body_harness` | part_number | OEM-каталог |
| 3 | `hyundai_solaris_ii_a6gf1_2_valve_body_harness` | part_number | OEM-каталог |
| 4 | `hyundai_solaris_ii_a6gf1_torque_converter_lockup_wear` | history.fixed_in_year | Уточнить специфику |
| 5 | `hyundai_solaris_ii_a6gf1_2_underdrive_clutch_wear` | wear data | Проверить статистику |
| 6 | `hyundai_solaris_ii_rear_beam_bushings_hcr` | part_number | Установить для балки от Elantra |

---

## 5. Что НЕ вошло в финальный JSON (`discarded_rare[]` — 9 позиций)

| # | ID | Причина |
|---|-----|---------|
| 1 | `discarded_thermostat` | <5%, нет массовых подтверждений |
| 2 | `discarded_weak_oem_battery` | Единичные случаи |
| 3 | `discarded_brake_vacuum_booster` | Нет 3+ источников |
| 4 | `discarded_a6gf1_underdrive_hub_bolts` | Фикс с 2012 (до Solaris II HC) |
| 5 | `discarded_a6gf1_diff_spline_strip` | Единичные упоминания |
| 6 | `discarded_g4fg_dual_vvt_phaser_grok` | Оставлено как `cvvt_phaser_knock_g4fg` |
| 7 | `discarded_injector_noise` | Норма работы G4FG |
| 8 | `discarded_a6gf1_pretensioner_us_yc_recall_for_ru` | Recalls для Accent YC не применимы юридически к РФ |
| 9 | `discarded_solaris_i_rb_recall_99256_units` | Это Solaris I (RB) |

---

## 6. Целостность JSON после аудита

| Проверка | Результат |
|----------|-----------|
| `json.load()` без ошибок | ✅ OK |
| Все ID уникальны (94 в сумме) | ✅ OK |
| Все `linked_issue_id` валидны | ✅ OK |
| `metadata.version` обновлён до 1.1.1 | ✅ OK |
| `metadata.updated_at` = 2026-05-03 | ✅ OK |
| Размер JSON | 765 193 bytes |

---

## 7. Top-5 critical (после аудита)

| # | ID | Severity | Двигатель/Коробка | Стоимость ремонта (RUB) |
|---|-----|----------|-------------------|--------------------------|
| 1 | `hyundai_solaris_zadiry_cylinders_g4fg` | critical | G4FG | **150 000-350 000** *(скорректировано)* |
| 2 | `hyundai_solaris_overheating_a6gf1` | critical | A6GF1 | 80 000-130 000 |
| 3 | `hyundai_solaris_atf_coolant_emulsion_a6gf1` | critical | A6GF1 | 100 000-150 000 |
| 4 | `hyundai_solaris_zadiry_cylinders_g4lc` | critical | G4LC | 130 000-250 000 |
| 5 | `hyundai_solaris2_seatbelt_pretensioner_recall_interior` | critical | (recall, US/CA) | (на РФ не распространяется) |

---

## 8. Готовность к импорту в БД

После применения 4 правок аудита 2026-05-03:

- ✅ `solaris_ii_final.json` (v1.1.1) — готов к импорту
- ✅ `solaris_ii_buyer_guide.md` — обновлён
- ✅ `solaris_ii_merge_report.md` — этот документ

**Качество JSON:** ⭐⭐⭐⭐⭐ (Grok) / ⭐⭐⭐⭐½ (Gemini) / ⭐⭐⭐⭐ (Perplexity-style).

**Главные риски, оставшиеся:**
1. US/CA recalls **не применимы** к РФ Solaris II юридически (разные партии)
2. 15 записей с `needs_review:true` — нужна доп. статистика
3. 6 записей с `manual_check_required:true` — нужна ручная проверка part_number в OEM-каталогах
4. Class actions ongoing (paint peeling) — следить за обновлениями
5. RU-владельцы не могут участвовать в US class actions

JSON готов к продакшену AutoAssistantAi.
