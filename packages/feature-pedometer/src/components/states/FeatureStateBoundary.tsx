import type {ReactNode} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

type FeatureStateBoundaryProps = {
  isLoading: boolean;
  loadingMessage?: string;
  errorMessage?: string | null;
  isUnsupported?: boolean;
  unsupportedTitle?: string;
  unsupportedDescription?: string;
  children: ReactNode;
};

export function FeatureStateBoundary({
  isLoading,
  loadingMessage = '불러오는 중입니다…',
  errorMessage,
  isUnsupported,
  unsupportedTitle = '이 기기에서는 지원하지 않습니다',
  unsupportedDescription = '걸음 수 센서를 사용할 수 없습니다. 다른 기기에서 이용해 주세요.',
  children,
}: FeatureStateBoundaryProps) {
  if (isLoading) {
    return (
      <View style={styles.centered} accessibilityRole="progressbar">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.hint}>{loadingMessage}</Text>
      </View>
    );
  }

  if (isUnsupported) {
    return (
      <View style={styles.centered}>
        <Text style={styles.unsupportedTitle}>{unsupportedTitle}</Text>
        <Text style={styles.unsupportedBody}>{unsupportedDescription}</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>문제가 발생했습니다</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  hint: {
    fontSize: 14,
    color: '#4b5563',
  },
  unsupportedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400e',
    textAlign: 'center',
  },
  unsupportedBody: {
    fontSize: 14,
    color: '#78350f',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#b42318',
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
  },
});
