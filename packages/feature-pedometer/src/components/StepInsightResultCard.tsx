import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StepInsightResult } from '../types/stepInsight';

type StepInsightResultCardProps = {
  isGenerating: boolean;
  errorMessage: string;
  result: StepInsightResult;
  canRegenerate: boolean;
  onRegenerate: () => void;
};

function hasStepInsightResult(result: StepInsightResult) {
  return !!result.summary || !!result.insight || !!result.motivation;
}

export default function StepInsightResultCard({
  isGenerating,
  errorMessage,
  result,
  canRegenerate,
  onRegenerate,
}: StepInsightResultCardProps) {
  const hasResult = hasStepInsightResult(result);

  return (
    <View style={styles.wrapper}>
      {isGenerating && (
        <Text style={styles.aiStatusText}>AI 인사이트를 생성하고 있습니다...</Text>
      )}
      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      {hasResult && (
        <View style={styles.aiInsightCard}>
          <Text style={styles.aiInsightTitle}>AI 걸음 인사이트</Text>
          <Text style={styles.aiInsightItemTitle}>요약</Text>
          <Text style={styles.aiInsightItemBody}>{result.summary}</Text>
          <Text style={styles.aiInsightItemTitle}>인사이트</Text>
          <Text style={styles.aiInsightItemBody}>{result.insight}</Text>
          <Text style={styles.aiInsightItemTitle}>동기부여</Text>
          <Text style={styles.aiInsightItemBody}>{result.motivation}</Text>
        </View>
      )}
      {canRegenerate && (
        <Pressable
          style={[
            styles.button,
            styles.regenerateButton,
            isGenerating ? styles.disabledButton : null,
          ]}
          onPress={onRegenerate}
          disabled={isGenerating}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>AI 인사이트 재생성</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  aiStatusText: {
    fontSize: 14,
    color: '#1d4ed8',
  },
  errorText: {
    fontSize: 14,
    color: '#d92d20',
  },
  aiInsightCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    padding: 12,
    gap: 6,
  },
  aiInsightTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  aiInsightItemTitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  aiInsightItemBody: {
    fontSize: 14,
    color: '#374151',
  },
  button: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  regenerateButton: {
    backgroundColor: '#1d4ed8',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
