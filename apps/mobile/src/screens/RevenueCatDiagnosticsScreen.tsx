import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getDiagnosticsSnapshot,
  refreshAll,
  restorePurchases,
  type RevenueCatDiagnosticsSnapshot,
} from '../purchases/revenueCatService';

export function RevenueCatDiagnosticsScreen() {
  const [snapshot, setSnapshot] = useState<RevenueCatDiagnosticsSnapshot | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const loadSnapshot = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextSnapshot = await getDiagnosticsSnapshot();
      setSnapshot(nextSnapshot);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshot().catch(() => {});
  }, [loadSnapshot]);

  const handleRefreshAll = useCallback(async () => {
    setActionMessage('');
    try {
      await refreshAll();
      await loadSnapshot();
      setActionMessage('Refresh 완료');
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : 'Refresh 실패',
      );
    }
  }, [loadSnapshot]);

  const handleRestore = useCallback(async () => {
    setActionMessage('');
    const outcome = await restorePurchases();
    await loadSnapshot();
    setActionMessage(
      outcome.status === 'success'
        ? 'Restore 성공'
        : outcome.status === 'cancelled'
          ? 'Restore 취소'
          : outcome.message ?? 'Restore 실패',
    );
  }, [loadSnapshot]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>RevenueCat 진단</Text>
        <Text style={styles.description}>
          개발 전용 화면입니다. 원시 SDK 상태와 앱 권한 변환 결과를 확인해요.
        </Text>

        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={handleRefreshAll}>
            <Text style={styles.buttonLabel}>Refresh All</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={handleRestore}>
            <Text style={styles.buttonLabel}>Restore</Text>
          </Pressable>
        </View>

        {actionMessage ? (
          <Text style={styles.actionMessage}>{actionMessage}</Text>
        ) : null}

        {isLoading ? (
          <ActivityIndicator color="#047857" />
        ) : (
          <View style={styles.jsonBlock}>
            <Text style={styles.jsonText}>
              {JSON.stringify(snapshot, null, 2)}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#047857',
    paddingHorizontal: 12,
  },
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '700',
  },
  actionMessage: {
    fontSize: 14,
    color: '#047857',
  },
  jsonBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  jsonText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: '#111827',
  },
});
