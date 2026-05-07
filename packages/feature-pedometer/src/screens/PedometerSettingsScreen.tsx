import {useCallback} from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {PRIVACY_POLICY_URL} from '../constants/legalUrls';
import type {PedometerSettingsScreenProps} from '../navigation/types';

export default function PedometerSettingsScreen(
  _props: PedometerSettingsScreenProps,
) {
  const openPrivacyPolicy = useCallback(async () => {
    const url = PRIVACY_POLICY_URL.trim();
    if (!url) {
      Alert.alert(
        '개인정보 처리방침',
        'constants/legalUrls.ts 파일에 PRIVACY_POLICY_URL을 설정한 뒤 다시 시도해 주세요.',
      );
      return;
    }
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('오류', '링크를 열 수 없습니다. URL 형식을 확인해 주세요.');
      return;
    }
    await Linking.openURL(url);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>앱 정보</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="개인정보 처리방침 열기"
        style={({pressed}) => [styles.row, pressed && styles.rowPressed]}
        onPress={openPrivacyPolicy}
      >
        <Text style={styles.rowLabel}>개인정보 처리방침</Text>
        <Text style={styles.rowHint}>Safari에서 보기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowLabel: {
    fontSize: 16,
    color: '#111',
  },
  rowHint: {
    fontSize: 14,
    color: '#888',
  },
});
