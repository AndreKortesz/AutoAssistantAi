import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as dataService from '../services/dataService';
import * as userCarService from '../services/userCarService';

const CarContext = createContext(null);

export function CarProvider({ children }) {
  const [userCar, setUserCar] = useState(null);
  const [carDetails, setCarDetails] = useState(null); // данные модели из catalog
  const [issuesData, setIssuesData] = useState(null); // болячки + recalls и т.д.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка при старте
  useEffect(() => {
    loadUserCar();
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
    const ok = userCarService.updateUserCar({ mileage: parseInt(mileage) });
    if (ok) {
      setUserCar(prev => prev ? { ...prev, mileage: parseInt(mileage) } : null);
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
  };

  return <CarContext.Provider value={value}>{children}</CarContext.Provider>;
}

export function useCar() {
  const ctx = useContext(CarContext);
  if (!ctx) throw new Error('useCar must be used within CarProvider');
  return ctx;
}
