import {useCallback, useEffect, useState} from 'react';
import {
  toISODate,
  type DailyHealthReport,
  type DailyHealthReportInput,
} from '@rn-health/core';
import {buildDailyReportInput} from '../services/dailyReportInput';
import {generateDailyReportWithAi} from '../services/dailyReportAi';
import {appendDailyReportHistory} from '../services/dailyReportHistoryStorage';
import type {
  DailyReportDataSources,
  DailyReportGenerationStatus,
  DailyReportSourceState,
} from '../types/dailyReport';

type UseDailyReportParams = {
  dataSources: DailyReportDataSources;
  initialDate?: string;
};

export function useDailyReport({
  dataSources,
  initialDate = toISODate(new Date()),
}: UseDailyReportParams) {
  const [date] = useState(initialDate);
  const [status, setStatus] = useState<DailyReportGenerationStatus>('idle');
  const [report, setReport] = useState<DailyHealthReport | null>(null);
  const [reportInput, setReportInput] = useState<DailyHealthReportInput | null>(
    null,
  );
  const [sourceState, setSourceState] = useState<DailyReportSourceState | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [isFallback, setIsFallback] = useState(false);

  const loadReportSources = useCallback(async () => {
    try {
      setStatus('loading');
      setErrorMessage('');
      setIsFallback(false);
      setReport(null);

      const {input, sourceState: nextSourceState} = await buildDailyReportInput({
        date,
        dataSources,
      });
      setReportInput(input);
      setSourceState(nextSourceState);

      if (!nextSourceState.hasFoodRecords && !nextSourceState.hasStepRecords) {
        setStatus('empty');
        return;
      }

      setStatus('ready');
    } catch {
      setErrorMessage('Daily Report 데이터를 불러오지 못했습니다. 다시 시도해 주세요.');
      setStatus('error');
    }
  }, [dataSources, date]);

  const generateReport = useCallback(async () => {
    try {
      setStatus('generating');
      setErrorMessage('');
      setIsFallback(false);

      const canGenerate = dataSources.canGenerateReport
        ? await dataSources.canGenerateReport()
        : true;
      if (!canGenerate) {
        setStatus('locked');
        return;
      }

      let input = reportInput;
      if (!input) {
        const built = await buildDailyReportInput({
          date,
          dataSources,
        });
        input = built.input;
        setReportInput(built.input);
        setSourceState(built.sourceState);

        if (!built.sourceState.hasFoodRecords && !built.sourceState.hasStepRecords) {
          setReport(null);
          setStatus('empty');
          return;
        }
      }

      setStatus('generating');
      const result = await generateDailyReportWithAi(input);
      setReport(result.report);
      setIsFallback(result.isFallback);
      setStatus('success');

      if (!result.isFallback) {
        await appendDailyReportHistory({
          id: `${result.report.date}-${Date.now()}`,
          createdAt: new Date().toISOString(),
          report: result.report,
        });
      }
    } catch {
      setErrorMessage('Daily Report를 불러오지 못했습니다. 다시 시도해 주세요.');
      setStatus('error');
    }
  }, [dataSources, date, reportInput]);

  useEffect(() => {
    loadReportSources();
  }, [loadReportSources]);

  return {
    date,
    status,
    report,
    reportInput,
    sourceState,
    errorMessage,
    isFallback,
    loadReportSources,
    generateReport,
  };
}
