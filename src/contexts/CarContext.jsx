import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as dataService from '../services/dataService';
import * as userCarService from '../services/userCarService';
import * as journalService from '../services/journalService';

const CarContext = createContext(null);

export function CarProvider({ children }) {
  // userCar читаем из localStorage СИНХРОННО — это мгновенно и позволяет
  // корневому маршруту сразу решить, куда вести (онбординг/дашборд/добавление),
  // не дожидаясь загрузки тяжёлого JSON болячек.
  const [userCar, setUserCar] = useState(() => userCarService.getUserCar());
  const [carDetails, setCarDetails] = useState(null); // данные модели из catalog
  const [issuesData, setIssuesData] = useState(null); // болячки + recalls и т.д.
  const [journalRecords, setJournalRecords] = useState(() => journalService.loadRecords());
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

  const mileage = userCar?.mileage ? parseInt(userCar.mileage) : 0;

  // fixedIssueIds — всегда производный от журнала с учётом TTL.
  const fixedIssueIds = useMemo(
    () => journalService.getFixedIssueIds(journalRecords, mileage),
    [journalRecords, mileage]
  );

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

  const removeCar = useCallback(async () => {
    userCarService.deleteUserCar();
    setUserCar(null);
    setCarDetails(null);
    setIssuesData(null);
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
  };

  return <CarContext.Provider value={value}>{children}</CarContext.Provider>;
}

export function useCar() {
  const ctx = useContext(CarContext);
  if (!ctx) throw new Error('useCar must be used within CarProvider');
  return ctx;
}
