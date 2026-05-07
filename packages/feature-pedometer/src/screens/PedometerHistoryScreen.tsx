import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import StepInsightHistoryList from '../components/StepInsightHistoryList';
import { useStepTrackingContext } from '../providers/StepTrackingProvider';
import type { PedometerHistoryScreenProps } from '../navigation/types';

export default function PedometerHistoryScreen(
  _props: PedometerHistoryScreenProps,
) {
  const { stepInsightHistory, refreshStepInsightHistory } =
    useStepTrackingContext();

  useFocusEffect(
    useCallback(() => {
      refreshStepInsightHistory();
    }, [refreshStepInsightHistory]),
  );

  return (
    <View style={styles.container}>
      <StepInsightHistoryList items={stepInsightHistory} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
});
