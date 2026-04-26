# Gold Standard: Схема болячки

## Философия

Структура болячки повторяет **мышление опытного владельца автомобиля**:

1. **Контекст** — какой автомобиль?
2. **Симптом** — что я вижу/слышу/чувствую?
3. **Причина** — почему это происходит?
4. **Пробег** — когда это случается?
5. **Решение** — что делать?
6. **Запчасти** — что купить?
7. **Результат** — что будет после ремонта?

Это **не** энциклопедическая статья. Это **практическое руководство** для человека, который хочет решить проблему.

---

## Полная структура

### Базовые поля

```json
{
  "id": "mustang_6g_ecoboost_fuel_sensor",
  "version": "1.0.0",
  "created_at": "2025-01-21",
  "updated_at": "2026-01-26"
}
```

### car — Контекст автомобиля

```json
{
  "car": {
    "brand": "Ford",
    "model": "Mustang",
    "generation": "6G (S550)",
    "year_start": 2015,
    "year_end": 2023,
    "engine": {
      "code": "2.3L EcoBoost",
      "displacement": 2.3,
      "power_hp": 310,
      "fuel": "бензин",
      "turbo": true
    },
    "transmission": {
      "code": "10R80",
      "type": "АКПП",
      "gears": 10
    },
    "body_type": "Купе",
    "market": "USA",
    "facelift": "дорест"
  }
}
```

**Важно:** Болячки привязаны к **поколению + двигателю + КПП**. Разные моторы = разные проблемы.

### issue — Описание проблемы

```json
{
  "issue": {
    "title": "Датчик давления топлива старой ревизии",
    "title_short": "Датчик топлива",
    "system": "fuel",
    "subsystem": "fuel_pressure",
    "severity": "critical",
    "severity_reason": "Может привести к критическому отказу двигателя",
    "can_drive": false,
    
    "symptoms": [
      {
        "description": "Плавающие обороты холостого хода",
        "conditions": "на прогретом двигателе"
      },
      {
        "description": "Потеря мощности",
        "conditions": "при разгоне под нагрузкой"
      },
      {
        "description": "Двигатель глохнет",
        "conditions": "спонтанно, без предупреждения"
      }
    ],
    
    "obd_codes": [
      {
        "code": "P008A",
        "description": "Давление в топливной системе слишком низкое"
      },
      {
        "code": "P0148",
        "description": "Ошибка подачи топлива"
      }
    ],
    
    "cause": {
      "primary": "Датчик топлива старого образца отправляет ложные данные в ECU без запуска Check Engine",
      "secondary": ["Окисление контактов", "Брак партии"],
      "not_cause": ["Топливный насос", "Форсунки", "Топливный фильтр"],
      "root_cause_type": "конструктивный_дефект"
    }
  }
}
```

#### Severity levels

| Level | Описание | can_drive |
|-------|----------|-----------|
| `critical` | Ехать нельзя, риск серьёзной поломки | false |
| `high` | Важно, но можно добраться до сервиса | true |
| `medium` | Следить за симптомами, планировать ремонт | true |
| `low` | Расходник, не критично | true |

#### System values

```
engine, transmission, suspension, brakes, body, 
electrical, cooling, fuel, exhaust, interior
```

### mileage — Когда проявляется

```json
{
  "mileage": {
    "typical_start_km": 0,
    "typical_end_km": null,
    "peak_km": 40000,
    "frequency_percent": 35,
    "frequency_description": "У каждого третьего владельца"
  }
}
```

- `typical_start_km` — с какого пробега обычно начинается
- `typical_end_km` — до какого пробега актуально (`null` = всегда)
- `peak_km` — пик проявления
- `frequency_percent` — у скольких % владельцев встречается

### solutions — Решения

```json
{
  "solutions": [
    {
      "type": "correct",
      "title": "Замена на ревизию 2",
      "description": "Заменить датчик давления топлива на BU5Z-9F972-B",
      
      "diy_possible": true,
      "diy_difficulty": "easy",
      "diy_difficulty_score": 2,
      "diy_time_hours": 0.5,
      "diy_tools": ["Ключ на 24", "Ключ на 12", "Ветошь"],
      "diy_warning": "Если датчик прикипел — не применяйте силу!",
      
      "service_time_hours": 0.5,
      "service_recommendation": "Любой сервис с опытом работы с Ford",
      
      "labor_cost": {
        "min": 500,
        "max": 1500,
        "currency": "RUB"
      },
      
      "effectiveness": "Полностью устраняет проблему"
    }
  ]
}
```

#### DIY Difficulty Scale

| Score | Label | Описание |
|-------|-------|----------|
| 1 | Элементарно | Любой справится |
| 2 | Легко | Нужны базовые навыки |
| 3 | Средне | Нужен опыт |
| 4 | Сложно | Лучше в сервис |
| 5 | Очень сложно | Только профессионал |

### parts — Запчасти

```json
{
  "parts": [
    {
      "name": "Датчик давления топлива",
      "part_number": "BU5Z-9F972-B",
      "revision": "rev.2",
      "revision_history": [
        {
          "part_number": "BU5Z-9F972-A",
          "revision": "rev.1",
          "status": "проблемная",
          "note": "Старая ревизия с дефектом"
        }
      ],
      "manufacturer": "Ford/Motorcraft",
      "is_original": true,
      
      "alternatives": [
        {
          "part_number": "SP1234",
          "manufacturer": "Bosch",
          "quality": "oem_supplier",
          "notes": "Поставщик OEM, качество идентично"
        }
      ],
      
      "do_not_buy": [
        {
          "part_number": "CHEAP-123",
          "manufacturer": "NoName",
          "reason": "Выходит из строя через 5000 км"
        }
      ],
      
      "price": {
        "min": 4500,
        "max": 6000,
        "currency": "RUB",
        "as_of_date": "2026-01"
      },
      "price_usd": 55,
      
      "quantity": 1,
      
      "where_to_buy": [
        "Официальный дилер",
        "Exist.ru",
        "tascaparts.com (USA, через VPN)"
      ]
    }
  ]
}
```

### defect_status — Юридический статус

```json
{
  "defect_status": {
    "is_acknowledged": true,
    "acknowledged_by": "Ford Motor Company",
    "acknowledged_date": "2016-03",
    
    "class_actions": [
      {
        "country": "USA",
        "country_flag": "🇺🇸",
        "year": 2018,
        "plaintiffs_count": 45000,
        "status": "won",
        "result": "Расширение гарантии до 150k миль + компенсация до $1,500",
        "case_number": "2:18-cv-12345"
      }
    ],
    
    "recalls": [
      {
        "country": "USA",
        "country_flag": "🇺🇸",
        "campaign_code": "19V-287",
        "year": 2019,
        "description": "Замена датчика давления топлива"
      },
      {
        "country": "Russia",
        "country_flag": "🇷🇺",
        "campaign_code": null,
        "note": "Не проводилась"
      }
    ],
    
    "tsb": [
      {
        "code": "TSB 18-2346",
        "date": "2018-11",
        "description": "Procedure for fuel pressure sensor replacement"
      }
    ],
    
    "fix_in_production": {
      "date": "2017-06",
      "description": "С июня 2017 устанавливается ревизия 2"
    }
  }
}
```

#### Class Action Status

| Status | Описание |
|--------|----------|
| `won` | Выигран истцами |
| `lost` | Проигран |
| `settlement` | Мировое соглашение |
| `pending` | В процессе |

### relations — Связи с другими болячками

```json
{
  "relations": {
    "causes": ["mustang_6g_ecoboost_engine_failure"],
    "caused_by": [],
    "often_confused_with": ["mustang_6g_ecoboost_fuel_pump"],
    "fix_together": [
      "mustang_6g_ecoboost_oil_separator",
      "mustang_6g_ecoboost_pcm_update"
    ],
    "fix_order": 1
  }
}
```

### prevention — Профилактика

```json
{
  "prevention": {
    "possible": true,
    "actions": [
      {
        "description": "Заменить датчик превентивно при покупке б/у",
        "interval_km": null,
        "interval_months": null
      }
    ],
    "recommendation": "Проверять и менять всем EcoBoost обязательно! Купите заранее и положите в багажник."
  }
}
```

### owner_reports — Отзывы владельцев

```json
{
  "owner_reports": [
    {
      "mileage_km": 45000,
      "year": 2016,
      "date": "2023-05",
      "comment": "Менял сам, заняло 30 минут. Проблема ушла полностью.",
      "solution_worked": true,
      "source": "drive2.ru"
    }
  ]
}
```

### sources — Источники информации

```json
{
  "sources": [
    {
      "type": "drive2",
      "url": "https://www.drive2.ru/l/553952925722871354/",
      "author": "MUSTANG CLAN",
      "author_type": "experienced_owner",
      "confidence": "high",
      "date": "2020-02"
    },
    {
      "type": "official_recall",
      "url": "https://www.nhtsa.gov/...",
      "confidence": "high"
    }
  ]
}
```

#### Source types

```
drive2, forum, youtube, official_recall, 
service_bulletin, expert, owner_direct
```

#### Confidence levels

| Level | Описание |
|-------|----------|
| `high` | Проверено, подтверждено несколькими источниками |
| `medium` | Один надёжный источник |
| `low` | Не проверено, требует валидации |

### meta — Мета-информация

```json
{
  "meta": {
    "data_quality": "gold",
    "completeness_percent": 95,
    "needs_review": false,
    "tags": ["критично", "проверить_сразу", "diy"]
  }
}
```

#### Data quality levels

| Level | Описание |
|-------|----------|
| `gold` | Эталон, полностью заполнен и проверен |
| `verified` | Проверено, но не все поля заполнены |
| `unverified` | Не проверено |
| `draft` | Черновик |

---

## Минимальный набор полей

Для создания болячки **обязательны**:

```json
{
  "id": "unique_id",
  "car": {
    "brand": "...",
    "model": "...",
    "generation": "..."
  },
  "issue": {
    "title": "...",
    "system": "...",
    "severity": "..."
  },
  "mileage": {
    "typical_start_km": 0,
    "typical_end_km": 100000
  },
  "solutions": [...]
}
```

Всё остальное — опционально, но **чем больше — тем лучше**.

---

## Примеры

См. файлы:
- `issue-example-mustang-fuel-sensor.json` — полный пример (v1.1)
- `data/issues/hyundai/solaris_rb/solaris_rb_final.json` — продакшен набор Solaris RB

---

## Что нового в v1.1 (апрель 2026)

Версия 1.1 добавила поля, которые накопились на практике при сборке нескольких поколений (Mustang, Audi A1, Solaris RB).

### Новое на корне
- **`type`** — тип записи: `systemic_defect / common_wear / maintenance / minor_annoyance / rare / discarded_rare`. Определяет, на какой странице UI запись показывается.
- **`type_reason`** — обоснование классификации.

### Новый блок `defect_status`
Юридический статус дефекта — recall, class actions, TSB, исправление в производстве:
```json
"defect_status": {
  "is_acknowledged": true,
  "acknowledged_by": "Hyundai",
  "class_actions": [
    {
      "country": "США",
      "country_flag": "🇺🇸",
      "year": 2022,
      "status": "dismissed",
      "case_number": "8:22-cv-00448-SPG-KES",
      "result": "Иск отозван истцами 22.06.2023"
    }
  ],
  "related_recalls": [
    {
      "country": "США",
      "recall_id": "23V-651000",
      "campaign_code": "Hyundai 251",
      "year": 2023,
      "affected_units": 240589,
      "status": "open"
    }
  ],
  "tsb": [...],
  "fix_in_production": {"date": "2018-01-01", "description": "..."}
}
```

### Расширенный `solution.type` enum
Теперь поддерживаются: `correct, temporary, preventive, workaround, replacement, repair, maintenance, modification`. Помогает UI разделять «замена детали» vs «ремонт» vs «модификация» (например, удаление катализатора).

### Новые поля в `solutions`
- **`diy_difficulty_score`** (1-5) — численная шкала сложности
- **`service_recommendation`** (любой / специализированный / только_дилер)
- **`consumables[]`** — расходники (герметик, прокладки, смазка)
- **`torque_specs[]`** — моменты затяжки болтов
- **`special_tools[]`** — специнструмент
- **`post_repair_procedures[]`** — адаптации, прокачки, тесты после ремонта

### Новые поля в `parts`
- **`is_original`** (boolean) — оригинал или аналог
- **`revision_history[]`** — история ревизий детали (старая проблемная → актуальная)

### Новые поля в `mileage`
- **`frequency_description`** — текст для UI («У каждого третьего владельца»)
- **`climate_dependent`** + **`climate_note`** — зависимость от климата

### Новое в `car.engine`
- **`fuel_requirements`** — `{octane_min, octane_recommended, compatible[], warning}`

### Новое в `meta.tags`
Стандартизированные префиксы:
- `canonical:NAME` — каноническое имя болячки (для группировки записей по разным двигателям)
- `variant:NAME` — вариант (двигатель, рынок, рестайл)
- `verified_by_websearch` — запись подтверждена web-поиском
- `recall` — есть отзывная кампания

---

*Gold Standard v1.1 — апрель 2026*
