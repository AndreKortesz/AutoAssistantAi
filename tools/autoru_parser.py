#!/usr/bin/env python3
"""
Парсер справочника автомобилей Auto.ru
Структура: марка → модель → поколение → двигатель → КПП

Использование:
    pip install playwright aiohttp
    playwright install chromium
    python autoru_parser.py

Результат сохраняется в cars_database.json
"""

import asyncio
import json
import random
import re
import time
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, asdict

try:
    from playwright.async_api import async_playwright, Page, Browser
except ImportError:
    print("Установите playwright: pip install playwright && playwright install chromium")
    exit(1)


# ============= КОНФИГУРАЦИЯ =============

CONFIG = {
    "base_url": "https://auto.ru",
    "catalog_url": "https://auto.ru/catalog/cars/",
    "delay_min": 2.0,  # Минимальная задержка между запросами (сек)
    "delay_max": 5.0,  # Максимальная задержка
    "page_timeout": 30000,  # Таймаут загрузки страницы (мс)
    "max_retries": 3,  # Количество попыток при ошибке
    "output_file": "cars_database.json",
    "progress_file": "parser_progress.json",  # Для продолжения после сбоя
    "headless": True,  # True = без окна браузера
    "brands_limit": None,  # None = все марки, число = ограничение для теста
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
]


# ============= МОДЕЛИ ДАННЫХ =============

@dataclass
class Engine:
    code: str  # Код двигателя (например, G4FC)
    name: str  # Название (например, 1.6 MPI)
    volume: Optional[float] = None  # Объём в литрах
    power_hp: Optional[int] = None  # Мощность л.с.
    fuel_type: Optional[str] = None  # Тип топлива


@dataclass
class Configuration:
    engine: Engine
    transmissions: list[str]  # Доступные КПП для этого двигателя


@dataclass
class Generation:
    id: str
    name: str
    years: list[int]  # [начало, конец]
    body_types: list[str]
    configurations: list[Configuration]


@dataclass
class Model:
    id: str
    name: str
    generations: list[Generation]


@dataclass
class Brand:
    id: str
    name: str
    name_ru: Optional[str]
    logo_url: Optional[str]
    models: list[Model]


# ============= УТИЛИТЫ =============

def random_delay():
    """Случайная задержка между запросами"""
    delay = random.uniform(CONFIG["delay_min"], CONFIG["delay_max"])
    time.sleep(delay)


def get_random_user_agent():
    return random.choice(USER_AGENTS)


def save_progress(data: dict, filename: str = None):
    """Сохранение прогресса для возможности продолжения"""
    filename = filename or CONFIG["progress_file"]
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_progress(filename: str = None) -> dict:
    """Загрузка прогресса"""
    filename = filename or CONFIG["progress_file"]
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def save_database(brands: list[Brand], filename: str = None):
    """Сохранение базы данных"""
    filename = filename or CONFIG["output_file"]
    data = {
        "version": "1.0",
        "source": "auto.ru",
        "parsed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "brands_count": len(brands),
        "brands": [asdict(b) for b in brands]
    }
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n✅ База сохранена в {filename}")


# ============= ПАРСЕР =============

class AutoRuParser:
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.brands: list[Brand] = []
        
    async def init_browser(self):
        """Инициализация браузера"""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=CONFIG["headless"],
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
            ]
        )
        context = await self.browser.new_context(
            user_agent=get_random_user_agent(),
            viewport={'width': 1920, 'height': 1080},
            locale='ru-RU',
        )
        self.page = await context.new_page()
        
        # Убираем признаки автоматизации
        await self.page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            window.chrome = { runtime: {} };
        """)
        
    async def close_browser(self):
        """Закрытие браузера"""
        if self.browser:
            await self.browser.close()
            
    async def goto_with_retry(self, url: str) -> bool:
        """Переход на страницу с повторами при ошибке"""
        for attempt in range(CONFIG["max_retries"]):
            try:
                await self.page.goto(url, timeout=CONFIG["page_timeout"], wait_until="domcontentloaded")
                await asyncio.sleep(1)  # Даём странице подгрузиться
                return True
            except Exception as e:
                print(f"  ⚠️ Попытка {attempt + 1}/{CONFIG['max_retries']}: {e}")
                if attempt < CONFIG["max_retries"] - 1:
                    await asyncio.sleep(5)
        return False
    
    async def parse_brands(self) -> list[dict]:
        """Парсинг списка марок"""
        print("📋 Загружаю список марок...")
        
        if not await self.goto_with_retry(CONFIG["catalog_url"]):
            raise Exception("Не удалось загрузить каталог")
        
        # Ждём загрузки списка марок
        await self.page.wait_for_selector('.IndexMarks__item, .CatalogMarks__item, [class*="Mark"]', timeout=10000)
        
        brands = []
        
        # Пробуем разные селекторы (структура может меняться)
        selectors = [
            '.IndexMarks__item a',
            '.CatalogMarks__item a',
            '[class*="MarkItem"] a',
            '.catalog__marks-item a',
        ]
        
        for selector in selectors:
            elements = await self.page.query_selector_all(selector)
            if elements:
                for el in elements:
                    href = await el.get_attribute('href')
                    text = await el.inner_text()
                    if href and '/catalog/cars/' in href:
                        brand_id = href.split('/catalog/cars/')[-1].strip('/').split('/')[0]
                        if brand_id and text.strip():
                            brands.append({
                                'id': brand_id,
                                'name': text.strip(),
                                'url': f"{CONFIG['base_url']}{href}" if href.startswith('/') else href
                            })
                break
        
        # Убираем дубликаты
        seen = set()
        unique_brands = []
        for b in brands:
            if b['id'] not in seen:
                seen.add(b['id'])
                unique_brands.append(b)
        
        print(f"  Найдено {len(unique_brands)} марок")
        return unique_brands
    
    async def parse_models(self, brand_id: str) -> list[dict]:
        """Парсинг моделей марки"""
        url = f"{CONFIG['catalog_url']}{brand_id}/"
        
        if not await self.goto_with_retry(url):
            return []
        
        models = []
        
        # Селекторы для моделей
        selectors = [
            '.CatalogModels__item a',
            '.IndexModels__item a',
            '[class*="ModelItem"] a',
            '.catalog__models-item a',
        ]
        
        for selector in selectors:
            elements = await self.page.query_selector_all(selector)
            if elements:
                for el in elements:
                    href = await el.get_attribute('href')
                    text = await el.inner_text()
                    if href and brand_id in href:
                        # Извлекаем id модели из URL
                        parts = href.split('/')
                        try:
                            brand_idx = parts.index(brand_id)
                            if brand_idx + 1 < len(parts) and parts[brand_idx + 1]:
                                model_id = parts[brand_idx + 1]
                                if model_id and not model_id.isdigit():
                                    models.append({
                                        'id': model_id,
                                        'name': text.strip(),
                                        'url': f"{CONFIG['base_url']}{href}" if href.startswith('/') else href
                                    })
                        except ValueError:
                            continue
                break
        
        # Убираем дубликаты
        seen = set()
        unique_models = []
        for m in models:
            if m['id'] not in seen:
                seen.add(m['id'])
                unique_models.append(m)
        
        return unique_models
    
    async def parse_generations(self, brand_id: str, model_id: str) -> list[dict]:
        """Парсинг поколений модели"""
        url = f"{CONFIG['catalog_url']}{brand_id}/{model_id}/"
        
        if not await self.goto_with_retry(url):
            return []
        
        generations = []
        
        # Селекторы для поколений
        selectors = [
            '.CatalogGenerations__item',
            '.IndexGenerations__item',
            '[class*="GenerationItem"]',
            '.catalog__generations-item',
        ]
        
        for selector in selectors:
            elements = await self.page.query_selector_all(selector)
            if elements:
                for el in elements:
                    # Ищем ссылку внутри элемента
                    link = await el.query_selector('a')
                    if not link:
                        continue
                        
                    href = await link.get_attribute('href')
                    
                    # Извлекаем название и годы
                    name_el = await el.query_selector('[class*="name"], [class*="title"], h3, h4')
                    name = await name_el.inner_text() if name_el else ""
                    
                    years_el = await el.query_selector('[class*="years"], [class*="period"]')
                    years_text = await years_el.inner_text() if years_el else ""
                    
                    if href:
                        # Извлекаем id поколения из URL
                        parts = href.split('/')
                        gen_id = None
                        for i, part in enumerate(parts):
                            if part == model_id and i + 1 < len(parts):
                                gen_id = parts[i + 1]
                                break
                        
                        if gen_id and gen_id.isdigit():
                            # Парсим годы
                            years = []
                            year_match = re.findall(r'(\d{4})', years_text)
                            if year_match:
                                years = [int(y) for y in year_match[:2]]
                            
                            generations.append({
                                'id': gen_id,
                                'name': name.strip() or f"Поколение {gen_id}",
                                'years': years,
                                'url': f"{CONFIG['base_url']}{href}" if href.startswith('/') else href
                            })
                break
        
        return generations
    
    async def parse_configurations(self, brand_id: str, model_id: str, gen_id: str) -> list[dict]:
        """Парсинг конфигураций (двигатели + КПП)"""
        url = f"{CONFIG['catalog_url']}{brand_id}/{model_id}/{gen_id}/specifications/"
        
        if not await self.goto_with_retry(url):
            # Пробуем альтернативный URL
            url = f"{CONFIG['catalog_url']}{brand_id}/{model_id}/{gen_id}/"
            if not await self.goto_with_retry(url):
                return []
        
        configurations = []
        
        # Ищем таблицу характеристик или карточки комплектаций
        try:
            # Ждём загрузки контента
            await self.page.wait_for_selector(
                '[class*="Specifications"], [class*="Configuration"], [class*="Engine"], table',
                timeout=5000
            )
        except:
            pass
        
        # Парсим данные о двигателях и КПП
        # Структура auto.ru может меняться, пробуем несколько подходов
        
        # Подход 1: Таблица спецификаций
        rows = await self.page.query_selector_all('table tr, [class*="SpecRow"], [class*="ConfigRow"]')
        
        engine_data = {}
        current_engine = None
        
        for row in rows:
            text = await row.inner_text()
            
            # Ищем информацию о двигателе
            engine_match = re.search(r'(\d+\.?\d*)\s*(?:л|L)?\s*[\/,]?\s*(\d+)\s*(?:л\.?с\.?|hp)', text, re.IGNORECASE)
            if engine_match:
                volume = float(engine_match.group(1))
                power = int(engine_match.group(2))
                engine_key = f"{volume}_{power}"
                
                if engine_key not in engine_data:
                    engine_data[engine_key] = {
                        'volume': volume,
                        'power_hp': power,
                        'name': f"{volume} л / {power} л.с.",
                        'transmissions': set()
                    }
                current_engine = engine_key
            
            # Ищем тип КПП
            if current_engine:
                trans_patterns = [
                    (r'механ|мкпп|mt|manual', 'MT'),
                    (r'автомат|акпп|at(?!v)|automatic', 'AT'),
                    (r'робот|amt|dsg|dct|powershift', 'AMT'),
                    (r'вариатор|cvt', 'CVT'),
                ]
                for pattern, trans_type in trans_patterns:
                    if re.search(pattern, text, re.IGNORECASE):
                        engine_data[current_engine]['transmissions'].add(trans_type)
        
        # Подход 2: Карточки комплектаций
        if not engine_data:
            cards = await self.page.query_selector_all('[class*="Modification"], [class*="Complectation"]')
            for card in cards:
                text = await card.inner_text()
                
                engine_match = re.search(r'(\d+\.?\d*)\s*(?:л|L)?\s*[\/,]?\s*(\d+)\s*(?:л\.?с\.?|hp)', text, re.IGNORECASE)
                if engine_match:
                    volume = float(engine_match.group(1))
                    power = int(engine_match.group(2))
                    engine_key = f"{volume}_{power}"
                    
                    if engine_key not in engine_data:
                        engine_data[engine_key] = {
                            'volume': volume,
                            'power_hp': power,
                            'name': f"{volume} л / {power} л.с.",
                            'transmissions': set()
                        }
                    
                    # Ищем КПП в той же карточке
                    trans_patterns = [
                        (r'механ|мкпп|mt(?!\d)|manual', 'MT'),
                        (r'автомат|акпп|at(?!v)|automatic', 'AT'),
                        (r'робот|amt|dsg|dct', 'AMT'),
                        (r'вариатор|cvt', 'CVT'),
                    ]
                    for pattern, trans_type in trans_patterns:
                        if re.search(pattern, text, re.IGNORECASE):
                            engine_data[engine_key]['transmissions'].add(trans_type)
        
        # Преобразуем в список конфигураций
        for key, data in engine_data.items():
            configurations.append({
                'engine': {
                    'code': '',
                    'name': data['name'],
                    'volume': data['volume'],
                    'power_hp': data['power_hp'],
                    'fuel_type': None
                },
                'transmissions': list(data['transmissions']) or ['AT', 'MT']  # По умолчанию
            })
        
        return configurations
    
    async def run(self):
        """Основной метод парсинга"""
        print("🚗 Парсер справочника Auto.ru")
        print("=" * 50)
        
        await self.init_browser()
        
        try:
            # Загружаем прогресс (если есть)
            progress = load_progress()
            completed_brands = set(progress.get('completed_brands', []))
            
            # Парсим марки
            brands_data = await self.parse_brands()
            
            if CONFIG["brands_limit"]:
                brands_data = brands_data[:CONFIG["brands_limit"]]
            
            total_brands = len(brands_data)
            
            for i, brand_data in enumerate(brands_data, 1):
                brand_id = brand_data['id']
                brand_name = brand_data['name']
                
                if brand_id in completed_brands:
                    print(f"⏭️  [{i}/{total_brands}] {brand_name} — пропущено (уже обработано)")
                    continue
                
                print(f"\n🔹 [{i}/{total_brands}] {brand_name}")
                random_delay()
                
                # Парсим модели
                models_data = await self.parse_models(brand_id)
                print(f"   Найдено моделей: {len(models_data)}")
                
                models = []
                for j, model_data in enumerate(models_data, 1):
                    model_id = model_data['id']
                    model_name = model_data['name']
                    
                    print(f"   📁 [{j}/{len(models_data)}] {model_name}")
                    random_delay()
                    
                    # Парсим поколения
                    generations_data = await self.parse_generations(brand_id, model_id)
                    
                    generations = []
                    for gen_data in generations_data:
                        gen_id = gen_data['id']
                        gen_name = gen_data['name']
                        
                        print(f"      🔸 {gen_name}")
                        random_delay()
                        
                        # Парсим конфигурации
                        configs_data = await self.parse_configurations(brand_id, model_id, gen_id)
                        
                        configurations = [
                            Configuration(
                                engine=Engine(**cfg['engine']),
                                transmissions=cfg['transmissions']
                            )
                            for cfg in configs_data
                        ]
                        
                        if configurations:
                            print(f"         Конфигураций: {len(configurations)}")
                        
                        generations.append(Generation(
                            id=gen_id,
                            name=gen_name,
                            years=gen_data.get('years', []),
                            body_types=[],
                            configurations=configurations
                        ))
                    
                    if generations:
                        models.append(Model(
                            id=model_id,
                            name=model_name,
                            generations=generations
                        ))
                
                if models:
                    self.brands.append(Brand(
                        id=brand_id,
                        name=brand_name,
                        name_ru=brand_name,
                        logo_url=None,
                        models=models
                    ))
                
                # Сохраняем прогресс
                completed_brands.add(brand_id)
                save_progress({
                    'completed_brands': list(completed_brands),
                    'partial_data': [asdict(b) for b in self.brands]
                })
            
            # Финальное сохранение
            save_database(self.brands)
            
            print("\n" + "=" * 50)
            print(f"✅ Парсинг завершён!")
            print(f"   Марок: {len(self.brands)}")
            print(f"   Моделей: {sum(len(b.models) for b in self.brands)}")
            print(f"   Поколений: {sum(len(m.generations) for b in self.brands for m in b.models)}")
            
        except Exception as e:
            print(f"\n❌ Ошибка: {e}")
            # Сохраняем то, что успели собрать
            if self.brands:
                save_database(self.brands, "cars_database_partial.json")
                print("   Частичные данные сохранены в cars_database_partial.json")
            raise
        
        finally:
            await self.close_browser()


# ============= ТОЧКА ВХОДА =============

async def main():
    parser = AutoRuParser()
    await parser.run()


if __name__ == "__main__":
    asyncio.run(main())
