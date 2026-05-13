import {DailyReportStateView} from './DailyReportStateView';

type DailyReportEmptyStateProps = {
  onRetry: () => void;
};

export function DailyReportEmptyState({onRetry}: DailyReportEmptyStateProps) {
  return (
    <DailyReportStateView
      title="오늘 기록이 아직 없어요"
      description="식단 기록이나 걸음 요약이 쌓이면 하루 흐름을 리포트로 정리할 수 있어요."
      actionLabel="다시 확인"
      onAction={onRetry}
    />
  );
}
