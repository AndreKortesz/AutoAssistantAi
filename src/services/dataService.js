/**
 * Data Service — загрузка данных моделей и болячек
 * 
 * Безопасность:
 * - Только GET-запросы к собственным public/-файлам (никаких внешних API)
 * - Никаких eval(), JSON.parse в try-catch
 * - Кеширование в памяти, чтобы не дёргать сеть повторно
 * - Размер JSON ограничен (защита от подмены файла)
 */

const MAX_JSON_SIZE = 5 * 1024 * 1024; // 5 MB max — защита от подозрительно больших файлов
const CATALOG_PATH = '/data/catalog.json';

// In-memory кеш
const cache = {
  catalog: null,
  models: new Map(), // model_id -> data
};

/**
 * Безопасная загрузка JSON из public/-папки.
 * Принимает только относительные пути, начинающиеся с /data/
 */
async function safeFetchJson(path) {
  // Защита: только пути из /data/
  if (typeof path !== 'string' || !path.startsWith('/data/')) {
    throw new Error('Invalid data path');
  }
  // Защита от path traversal
  if (path.includes('..') || path.includes('//')) {
    throw new Error('Invalid data path');
  }

  const response = await fetch(path, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    credentials: 'omit', // никаких куков
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  // Защита от слишком больших файлов
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_JSON_SIZE) {
    throw new Error(`File too large: ${path}`);
  }

  const text = await response.text();
  if (text.length > MAX_JSON_SIZE) {
    throw new Error(`File too large after read: ${path}`);
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON in ${path}`);
  }
}

/**
 * Загружает каталог доступных моделей
 */
export async function getCatalog() {
  if (cache.catalog) return cache.catalog;
  cache.catalog = await safeFetchJson(CATALOG_PATH);
  return cache.catalog;
}

/**
 * Список брендов
 */
export async function getBrands() {
  const catalog = await getCatalog();
  return catalog.brands.map(b => ({
    id: b.id,
    name: b.name,
    name_ru: b.name_ru,
  }));
}

/**
 * Модели бренда (с поколениями)
 */
export async function getModelsByBrand(brandId) {
  const catalog = await getCatalog();
  const brand = catalog.brands.find(b => b.id === brandId);
  if (!brand) return [];
  
  // Группируем по model_name (Solaris → [I (RB), II (HC/HCR)])
  const grouped = {};
  for (const m of brand.models) {
    if (!grouped[m.model_name]) {
      grouped[m.model_name] = {
        model_name: m.model_name,
        generations: [],
      };
    }
    grouped[m.model_name].generations.push({
      id: m.id,
      generation: m.generation,
      generation_label: m.generation_label,
      year_start: m.year_start,
      year_end: m.year_end,
    });
  }
  return Object.values(grouped);
}

/**
 * Получить полную информацию о поколении
 */
export async function getModelById(modelId) {
  const catalog = await getCatalog();
  for (const brand of catalog.brands) {
    const model = brand.models.find(m => m.id === modelId);
    if (model) {
      return { ...model, brand: brand.name, brand_id: brand.id };
    }
  }
  return null;
}

/**
 * Загружает полные данные по поколению (болячки, recalls и т.д.)
 */
export async function getModelData(modelId) {
  if (cache.models.has(modelId)) return cache.models.get(modelId);
  
  const model = await getModelById(modelId);
  if (!model) throw new Error(`Model not found: ${modelId}`);
  
  const data = await safeFetchJson(model.data_file);
  
  // Валидация: убеждаемся что это правильный JSON
  if (!data.records || !Array.isArray(data.records)) {
    throw new Error('Invalid model data: missing records');
  }
  
  cache.models.set(modelId, data);
  return data;
}

/**
 * Получить болячки конкретной машины с фильтрацией по двигателю/коробке.
 * 
 * @param {string} modelId - id поколения (solaris_rb, solaris_hc)
 * @param {object} filters - { engineCode, transmissionCode, mileage }
 * @returns {object} { systemic, wear, maintenance, minor, recalls, classActions, tsb }
 */
export async function getIssuesForCar(modelId, filters = {}) {
  const data = await getModelData(modelId);
  const { engineCode, transmissionCode } = filters;

  const matchesCarFilters = (record) => {
    const car = record.car || {};
    
    // Проверка двигателя
    if (engineCode && car.engine) {
      const recordEngine = typeof car.engine === 'object' ? car.engine.code : car.engine;
      // если в записи указан конкретный двигатель и он не совпадает — пропускаем
      if (recordEngine && recordEngine !== engineCode) {
        // Но если запись общая для всех двигателей (engine_applies: 'all') — показываем
        if (record.engine_applies !== 'all' && !Array.isArray(record.engine_applies)) {
          return false;
        }
        if (Array.isArray(record.engine_applies) && !record.engine_applies.includes(engineCode)) {
          return false;
        }
      }
    }

    // Проверка коробки
    if (transmissionCode && car.transmission) {
      const recordTrans = typeof car.transmission === 'object' ? car.transmission.code : car.transmission;
      if (recordTrans && recordTrans !== transmissionCode) {
        if (record.transmission_applies !== 'all' && !Array.isArray(record.transmission_applies)) {
          return false;
        }
        if (Array.isArray(record.transmission_applies) && !record.transmission_applies.includes(transmissionCode)) {
          return false;
        }
      }
    }

    return true;
  };

  const records = (data.records || []).filter(matchesCarFilters);

  return {
    systemic: records.filter(r => r.type === 'systemic_defect'),
    wear: records.filter(r => r.type === 'common_wear'),
    maintenance: records.filter(r => r.type === 'maintenance'),
    minor: data.minor_annoyance || [],
    recalls: data.global_recalls || [],
    classActions: data.global_class_actions || [],
    tsb: data.global_tsb || [],
    discardedRare: data.discarded_rare || [],
    metadata: data.metadata || {},
    annual_budget: data.annual_budget_15000km || null,
    major_expenses: data.major_one_time_expenses || null,
    key_insights: data.key_insights || null,
  };
}

/**
 * Найти конкретную болячку по ID
 */
export async function getIssueById(modelId, issueId) {
  const data = await getModelData(modelId);
  return (data.records || []).find(r => r.id === issueId) || null;
}

/**
 * Очистка кеша (для тестов или принудительного обновления)
 */
export function clearCache() {
  cache.catalog = null;
  cache.models.clear();
}
