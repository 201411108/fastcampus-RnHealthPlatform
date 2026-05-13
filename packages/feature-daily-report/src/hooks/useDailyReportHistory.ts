import {useCallback, useEffect, useState} from 'react';
import type {DailyReportHistoryItem} from '../types/dailyReport';
import {getDailyReportHistory} from '../services/dailyReportHistoryStorage';

export function useDailyReportHistory() {
  const [history, setHistory] = useState<DailyReportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await getDailyReportHistory();
      setHistory(items);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    refreshHistory: loadHistory,
  };
}
