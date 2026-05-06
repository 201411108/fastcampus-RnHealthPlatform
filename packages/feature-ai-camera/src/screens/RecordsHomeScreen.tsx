import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useCameraPermission } from 'react-native-vision-camera';
import type { RecordsHomeScreenProps } from '../navigation/types';
import useRecords from '../hooks/useRecords';
import RecordItem from '../components/RecordItem';
import type { FoodRecord } from '../types/record';
import { useCallback, useRef, useState } from 'react';
import RecordDetailModal from '../components/RecordDetailModal';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useForeground,
} from 'react-native-google-mobile-ads';
import {
  EmptyRecordsState,
  ErrorBanner,
  LoadingStateFullScreen,
} from '../components/FeatureStates';
import { colors, radius, spacing } from '../theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const BANNER_FALLBACK_UNIT_ID =
  Platform.OS === 'ios'
    ? 'ca-app-pub-3940256099942544/2934735716'
    : 'ca-app-pub-3940256099942544/6300978111';

const bannerAdUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : BANNER_FALLBACK_UNIT_ID;

function RecordsHomeScreen({ navigation }: RecordsHomeScreenProps) {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { hasPermission, requestPermission } = useCameraPermission();

  const horizontalPadding = spacing.lg;
  const bannerWidth = Math.max(
    0,
    Math.round(windowWidth - horizontalPadding * 2),
  );

  const handlePressCamera = () => {
    if (!hasPermission) {
      requestPermission();
      return;
    }
    navigation.navigate('CameraCapture');
  };

  const { records, isLoading, error, deleteRecord, refreshRecords } =
    useRecords();

  const skipNextFocusRefresh = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (skipNextFocusRefresh.current) {
        skipNextFocusRefresh.current = false;
        return;
      }
      refreshRecords();
    }, [refreshRecords]),
  );

  const [selectedRecord, setSelectedRecord] = useState<FoodRecord | null>(null);

  const handlePressRecordItem = useCallback((record: FoodRecord) => {
    setSelectedRecord(record);
  }, []);

  const handleCloseRecordDetailModal = useCallback(() => {
    setSelectedRecord(null);
  }, []);

  const handleLongPressRecordItem = useCallback(
    (record: FoodRecord) => {
      Alert.alert(
        '기록 삭제',
        `${record.analysisResult.food_name}을 삭제하시겠습니까?`,
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => {
              deleteRecord(record.id);
            },
          },
        ],
      );
    },
    [deleteRecord],
  );

  const bannerRef = useRef<BannerAd>(null);

  useForeground(() => {
    if (Platform.OS === 'ios') {
      bannerRef.current?.load();
    }
  });

  if (isLoading && records.length === 0) {
    return (
      <LoadingStateFullScreen message="기록을 불러오는 중입니다." />
    );
  }

  const footerBottomPad = insets.bottom + spacing.xl;

  return (
    <View style={styles.root}>
      <View style={[styles.paddedBlock, { paddingHorizontal: horizontalPadding }]}>
        {error ? (
          <ErrorBanner message={error} onRetry={refreshRecords} />
        ) : null}
      </View>

      <View
        style={[
          styles.bannerOuter,
          {
            paddingHorizontal: horizontalPadding,
            maxWidth: windowWidth,
          },
        ]}
      >
        <BannerAd
          ref={bannerRef}
          unitId={bannerAdUnitId}
          size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
          width={bannerWidth}
        />
      </View>

      <FlatList
        data={records}
        keyExtractor={item => item.id}
        refreshing={isLoading && records.length > 0}
        onRefresh={refreshRecords}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyRecordsState
              title="아직 기록이 없습니다"
              description="카메라로 음식을 촬영하면 분석 결과가 여기에 쌓입니다."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <RecordItem
            record={item}
            onPress={() => handlePressRecordItem(item)}
            onLongPress={() => handleLongPressRecordItem(item)}
          />
        )}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: horizontalPadding },
          records.length === 0 && styles.listContentEmpty,
        ]}
      />

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: footerBottomPad,
          },
        ]}
      >
        <Pressable
          onPress={handlePressCamera}
          style={styles.cameraButton}
          accessibilityRole="button"
        >
          <Text style={styles.cameraButtonLabel}>
            {hasPermission ? '카메라로 기록하기' : '카메라 권한 요청 후 기록하기'}
          </Text>
        </Pressable>
      </View>

      <RecordDetailModal
        selectedRecord={selectedRecord}
        onClose={handleCloseRecordDetailModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  paddedBlock: {
    width: '100%',
  },
  bannerOuter: {
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  footer: {
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  cameraButton: {
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cameraButtonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RecordsHomeScreen;
