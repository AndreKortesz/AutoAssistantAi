import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as dataService from '../services/dataService';
import * as userCarService from '../services/userCarService';
import * as journalService from '../services/journalService';
import * as issueStatusService from '../services/issueStatusService';
import * as wearStatusService from '../services/wearStatusService';
import { pictureCompleteness, maturityLevel } from '../utils/issueHelpers';

const CarContext = createContext(null);
const PICTURE_FLOOR_KEY = 'aaa_picture_floor';
const readFloor = () => { try { return parseInt(localStorage.getItem(PICTURE_FLOOR_KEY)) || 0; } catch (e) { return 0; } };

export function CarProvider({ children }) {
  // userCar читаем из localStorage СИНХРОННО — это мгновенно и позволяет
  // корневому маршруту сразу решить, куда вести (онбординг/дашборд/добавление),
  // не дожидаясь загрузки тяжёлого JSON болячек.
  const [userCar, setUserCar] = useState(() => userCarService.getUserCar());
  const [carDetails, setCarDetails] = useState(null); // данные модели из catalog
  const [issuesData, setIssuesData] = useState(null); // болячки + recalls и т.д.
  const [journalRecords, setJournalRecords] = useState(() => journalService.loadRecords());
  const [issueStatuses, setIssueStatuses] = useState(() => issueStatusService.loadStatuses());
  const [wearStatuses, setWearStatuses] = useState(() => wearStatusService.loadWearStatuses());
  const [pictureFloor, setPictureFloor] = useState(readFloor); // монотонный «пол» зрелости — картина не «раскрывается» обратно
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка при старте
  useEffect(() => {
    loadUserCar();
  }, []);

  // Подписка на изменения журнала — синхронизация между экранами.
  useEffect(() => {
    return journalService.subscribe(() => {
      setJournalRecords(journalService.loadRecords());
    });
  }, []);

  // Подписка на статусы болячек (актуально / не знаю).
  useEffect(() => {
    return issueStatusService.subscribe(() => {
      setIssueStatuses(issueStatusService.loadStatuses());
    });
  }, []);

  const setIssueStatus = useCallback((id, status) => {
    issueStatusService.setStatus(id, status);
  }, []);

  useEffect(() => {
    return wearStatusService.subscribe(() => {
      setWearStatuses(wearStatusService.loadWearStatuses());
    });
  }, []);

  const setWearStatus = useCallback((id, status, untilKm) => {
    wearStatusService.setWearStatus(id, status, untilKm);
  }, []);

  const mileage = userCar?.mileage ? parseInt(userCar.mileage) : 0;

  // fixedIssueIds — всегда производный от журнала с учётом TTL.
  const fixedIssueIds = useMemo(
    () => journalService.getFixedIssueIds(journalRecords, mileage),
    [journalRecords, mileage]
  );

  // «% картины» — сырой расчёт; наружу отдаём монотонную версию (не падает от снятия отметок).
  const rawPicturePct = useMemo(() => {
    if (!issuesData) return 0;
    return pictureCompleteness({
      answers: userCar?.onboardingAnswers || {},
      issues: issuesData.systemic,
      fixedIssueIds,
      issueStatuses,
      journalCount: journalRecords.length,
      mileageKnown: mileage > 0,
    });
  }, [issuesData, userCar, fixedIssueIds, issueStatuses, journalRecords, mileage]);

  useEffect(() => {
    if (rawPicturePct > pictureFloor) {
      setPictureFloor(rawPicturePct);
      try { localStorage.setItem(PICTURE_FLOOR_KEY, String(rawPicturePct)); } catch (e) {}
    }
  }, [rawPicturePct, pictureFloor]);

  const picturePct = Math.max(rawPicturePct, pictureFloor);
  const maturity = useMemo(() => maturityLevel(picturePct), [picturePct]);

  const markIssueFixed = useCallback((issue) => {
    journalService.markIssueFixed(issue, mileage);
  }, [mileage]);

  const unmarkIssueFixed = useCallback((issueId) => {
    journalService.unmarkIssueFixed(issueId);
  }, []);

  const loadUserCar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const car = userCarService.getUserCar();
      setUserCar(car);

      if (car && car.modelId) {
        const details = await dataService.getModelById(car.modelId);
        setCarDetails(details);

        const issues = await dataService.getIssuesForCar(car.modelId, {
          engineCode: car.engineCode,
          transmissionCode: car.transmissionCode,
        });
        setIssuesData(issues);
      } else {
        setCarDetails(null);
        setIssuesData(null);
      }
    } catch (e) {
      setError(e.message);
      console.error('Failed to load car data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCar = useCallback(async (data) => {
    const ok = userCarService.saveUserCar(data);
    if (ok) {
      await loadUserCar();
    }
    return ok;
  }, [loadUserCar]);

  const updateMileage = useCallback(async (mileage) => {
    const stamp = new Date().toISOString();
    const ok = userCarService.updateUserCar({ mileage: parseInt(mileage), mileageUpdatedAt: stamp });
    if (ok) {
      setUserCar(prev => prev ? { ...prev, mileage: parseInt(mileage), mileageUpdatedAt: stamp } : null);
    }
    return ok;
  }, []);

  // Ответы на вопросы-ощущения (этап онбординга). Пишем в localStorage и
  // тут же обновляем состояние, чтобы индекс зрелости пересчитался сразу.
  const saveAnswers = useCallback((answers) => {
    const ok = userCarService.saveOnboardingAnswers(answers);
    if (ok) {
      setUserCar(prev => prev ? { ...prev, onboardingAnswers: { ...(prev.onboardingAnswers || {}), ...answers } } : prev);
    }
    return ok;
  }, []);

  const removeCar = useCallback(async () => {
    userCarService.deleteUserCar();
    setUserCar(null);
    setCarDetails(null);
    setIssuesData(null);
    setPictureFloor(0);
    try { localStorage.removeItem(PICTURE_FLOOR_KEY); } catch (e) {}
  }, []);

  const value = {
    userCar,
    carDetails,
    issuesData,
    loading,
    error,
    saveCar,
    updateMileage,
    removeCar,
    refresh: loadUserCar,
    journalRecords,
    fixedIssueIds,
    markIssueFixed,
    unmarkIssueFixed,
    saveAnswers,
    issueStatuses,
    setIssueStatus,
    wearStatuses,
    setWearStatus,
    picturePct,
    maturity,
  };

  return <CarContext.Provider value={value}>{children}</CarContext.Provider>;
}

export function useCar() {
  const ctx = useContext(CarContext);
  if (!ctx) throw new Error('useCar must be used within CarProvider');
  return ctx;
}
