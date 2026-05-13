import { useCallback, useEffect, useState } from 'react';
import type { FoodRecord } from '../types/record';
import storageService from '../services/storageService';

const useRecords = () => {
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await storageService.getRecords();
      setRecords(data);
    } catch {
      setError('기록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addRecord = useCallback(
    async (record: Omit<FoodRecord, 'id' | 'createdAt'>) => {
      try {
        setIsLoading(true);
        setError(null);

        const newRecord: FoodRecord = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          createdAt: new Date().toISOString(),
          ...record,
        };

        await storageService.saveRecord(newRecord);
        setRecords(prev => [...prev, newRecord]);
      } catch {
        setError('기록을 추가하는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deleteRecord = useCallback(async (targetId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await storageService.deleteRecord(targetId);
      setRecords(prev => prev.filter(record => record.id !== targetId));
    } catch {
      setError('기록을 삭제하는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshRecords = useCallback(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    records,
    isLoading,
    error,
    addRecord,
    deleteRecord,
    refreshRecords,
  };
};

export default useRecords;
