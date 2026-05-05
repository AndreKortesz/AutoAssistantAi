/**
 * UserCarService — безопасное хранение данных машины пользователя.
 * 
 * Безопасность:
 * - localStorage только для НЕсекретных данных (ID модели, пробег, опционально VIN)
 * - VIN можно хранить в зашифрованном виде или вообще не хранить (только в текущей сессии)
 * - Никаких персональных данных (ФИО, телефон, email)
 * - Валидация всех значений перед сохранением
 */

const STORAGE_KEY = 'aaa_user_car';
const ONBOARDING_KEY = 'aaa_onboarding_completed';

// Допустимые значения (защита от подмены)
const VALID_FIELDS = [
  'modelId',         // id поколения (solaris_rb, solaris_hc)
  'engineCode',      // G4FA, G4FC, G4LC, G4FG
  'transmissionCode',// M5CF1, A6GF1, и т.д.
  'year',            // год выпуска (число)
  'mileage',         // пробег (число, км)
  'bodyType',        // Седан, Хэтчбек
  'addedAt',         // ISO timestamp
];

const MAX_VIN_LENGTH = 17;
const MAX_MILEAGE = 999999;

/**
 * Валидация и санитизация данных машины
 */
function validateCarData(data) {
  if (!data || typeof data !== 'object') return null;
  
  const clean = {};
  
  // Только белый список полей
  for (const key of VALID_FIELDS) {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  }
  
  // Тип-проверки
  if (clean.modelId && typeof clean.modelId !== 'string') return null;
  if (clean.modelId && !/^[a-z0-9_]+$/.test(clean.modelId)) return null; // только snake_case
  
  if (clean.engineCode && typeof clean.engineCode !== 'string') return null;
  if (clean.engineCode && !/^[A-Z0-9_-]+$/i.test(clean.engineCode)) return null;
  
  if (clean.transmissionCode && typeof clean.transmissionCode !== 'string') return null;
  if (clean.transmissionCode && !/^[A-Z0-9_-]+$/i.test(clean.transmissionCode)) return null;
  
  if (clean.year !== undefined) {
    clean.year = parseInt(clean.year);
    if (isNaN(clean.year) || clean.year < 1900 || clean.year > 2030) return null;
  }
  
  if (clean.mileage !== undefined) {
    clean.mileage = parseInt(clean.mileage);
    if (isNaN(clean.mileage) || clean.mileage < 0 || clean.mileage > MAX_MILEAGE) return null;
  }
  
  if (clean.bodyType && typeof clean.bodyType !== 'string') return null;
  if (clean.bodyType && clean.bodyType.length > 50) return null;
  
  return clean;
}

/**
 * Сохранить данные машины
 */
export function saveUserCar(data) {
  const validated = validateCarData(data);
  if (!validated) {
    console.error('Invalid car data');
    return false;
  }
  
  validated.addedAt = validated.addedAt || new Date().toISOString();
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    return true;
  } catch (e) {
    // localStorage может быть недоступен (privacy mode)
    console.error('Failed to save car data:', e);
    return false;
  }
}

/**
 * Получить данные машины
 */
export function getUserCar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return validateCarData(parsed); // ре-валидация при чтении
  } catch (e) {
    return null;
  }
}

/**
 * Обновить отдельные поля машины (например, пробег)
 */
export function updateUserCar(updates) {
  const current = getUserCar();
  if (!current) return false;
  return saveUserCar({ ...current, ...updates });
}

/**
 * Удалить данные машины
 */
export function deleteUserCar() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Онбординг
 */
export function isOnboardingCompleted() {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function markOnboardingCompleted() {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Полный сброс пользовательских данных (для приватного режима)
 */
export function resetAllUserData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_KEY);
    return true;
  } catch (e) {
    return false;
  }
}
