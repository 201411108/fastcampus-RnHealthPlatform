import {useCallback, useEffect, useMemo, useState} from 'react';
import {configureAdUnits, initializeMobileAds} from '@rn-health/core';
import {
  CameraCaptureScreen,
  RecordDetailModal,
  RecordItem,
  useRecords,
  type FoodRecord,
} from '@rn-health/feature-ai-camera';
import {DailyReportNavigator} from '@rn-health/feature-daily-report';
import {
  createExpoStepSensor,
  PedometerHistoryScreen,
  PedometerSettingsScreen,
  StepTrackingProvider,
  useStepTrackingContext,
  type StepSensorPort,
} from '@rn-health/feature-pedometer';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  DefaultTheme,
  useFocusEffect,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {productionAdUnits} from './src/adsUnitConfig';
import {dailyReportDataSources} from './src/dailyReportDataSources';

type RootStackParamList = {
  MainTabs: undefined;
  CameraCapture: undefined;
};

type MainTabParamList = {
  Home: undefined;
  History: undefined;
  DailyReport: undefined;
  Settings: undefined;
};

type MainTabsProps = {
  stepSensor: StepSensorPort;
  onOpenCamera: () => void;
};

type HomeDashboardScreenProps = {
  onOpenCamera: () => void;
  bottomPadding: number;
};

type HistoryScreenProps = {
  onOpenCamera: () => void;
  bottomPadding: number;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

type SettingsScreenProps = {
  bottomPadding: number;
};

function HomeDashboardScreen({
  onOpenCamera,
  bottomPadding,
}: HomeDashboardScreenProps) {
  const [goalInput, setGoalInput] = useState('');
  const {
    goalStepCount,
    stepCount,
    statusMessage,
    errorMessage,
    isTracking,
    isProcessing,
    isGeneratingStepInsight,
    stepInsightResult,
    setGoalStepCount,
    handleTrackingButtonPress,
  } = useStepTrackingContext();
  const {records, isLoading, refreshRecords} = useRecords();

  useFocusEffect(
    useCallback(() => {
      refreshRecords();
    }, [refreshRecords]),
  );

  const handleSaveGoal = useCallback(() => {
    const nextGoalStepCount = Number(goalInput.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(nextGoalStepCount) || nextGoalStepCount <= 0) {
      Alert.alert('목표 걸음수', '1 이상의 숫자로 목표 걸음수를 입력해 주세요.');
      return;
    }

    setGoalStepCount(nextGoalStepCount);
    setGoalInput(String(nextGoalStepCount));
  }, [goalInput, setGoalStepCount]);

  const handlePressTracking = useCallback(() => {
    handleTrackingButtonPress().catch(() => {});
  }, [handleTrackingButtonPress]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.homeContent,
          {paddingBottom: bottomPadding + spacing.xl},
        ]}
      >
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>AI 헬스 플랫폼</Text>
          <Text style={styles.heroTitle}>오늘의 건강 흐름을 한 곳에서</Text>
          <Text style={styles.heroDescription}>
            걸음 추적과 음식 카메라 분석을 시작하고, 기록은 하단 탭에서 바로
            확인해요.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>만보기</Text>
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <View>
                <Text style={styles.metricLabel}>현재 걸음 수</Text>
                <Text style={styles.metricValue}>{stepCount}보</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillLabel}>
                  {isTracking ? '추적 중' : '대기'}
                </Text>
              </View>
            </View>
            <Text style={styles.helperText}>{statusMessage}</Text>
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
            <View style={styles.goalRow}>
              <TextInput
                value={goalInput}
                onChangeText={setGoalInput}
                placeholder={
                  goalStepCount ? `${goalStepCount}보` : '목표 걸음수 입력'
                }
                keyboardType="number-pad"
                style={styles.goalInput}
                accessibilityLabel="목표 걸음수 입력"
              />
              <Pressable
                onPress={handleSaveGoal}
                style={styles.secondaryButton}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonLabel}>저장</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={handlePressTracking}
              disabled={isProcessing}
              style={[
                styles.primaryButton,
                isProcessing && styles.disabledButton,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonLabel}>
                {isTracking ? '추적 중지' : '걸음 추적 시작'}
              </Text>
            </Pressable>
            {isGeneratingStepInsight ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" color={appColors.primary} />
                <Text style={styles.helperText}>
                  만보기 리포트를 생성하고 있어요.
                </Text>
              </View>
            ) : null}
            {stepInsightResult.summary ? (
              <View style={styles.insightBox}>
                <Text style={styles.insightTitle}>최근 만보기 리포트</Text>
                <Text style={styles.helperText}>{stepInsightResult.summary}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 카메라</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>음식 사진 분석</Text>
            <Text style={styles.helperText}>
              촬영한 음식 사진을 AI가 분석하고, 칼로리와 영양 정보를 기록으로
              남겨요.
            </Text>
            <View style={styles.metricRow}>
              <Text style={styles.helperText}>저장된 분석 기록</Text>
              <Text style={styles.metricCompact}>
                {isLoading ? '불러오는 중' : `${records.length}개`}
              </Text>
            </View>
            <Pressable
              onPress={onOpenCamera}
              style={styles.primaryButton}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonLabel}>카메라로 분석하기</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HistoryScreen({onOpenCamera, bottomPadding}: HistoryScreenProps) {
  const [selectedTab, setSelectedTab] = useState<'food' | 'steps'>('food');
  const [selectedRecord, setSelectedRecord] = useState<FoodRecord | null>(null);
  const {records, isLoading, error, deleteRecord, refreshRecords} = useRecords();

  useFocusEffect(
    useCallback(() => {
      refreshRecords();
    }, [refreshRecords]),
  );

  const handleCloseRecordDetailModal = useCallback(() => {
    setSelectedRecord(null);
  }, []);

  const handleLongPressRecordItem = useCallback(
    (record: FoodRecord) => {
      Alert.alert(
        '기록 삭제',
        `${record.analysisResult.food_name}을 삭제하시겠습니까?`,
        [
          {text: '취소', style: 'cancel'},
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => {
              deleteRecord(record.id).catch(() => {});
            },
          },
        ],
      );
    },
    [deleteRecord],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.historyRoot, {paddingBottom: bottomPadding}]}>
        <View style={styles.headerBlock}>
          <Text style={styles.screenTitle}>히스토리</Text>
          <Text style={styles.screenDescription}>
            AI 카메라 분석 기록과 만보기 생성 리포트를 함께 확인해요.
          </Text>
        </View>

        <View style={styles.segment}>
          <Pressable
            onPress={() => setSelectedTab('food')}
            style={[
              styles.segmentButton,
              selectedTab === 'food' && styles.segmentButtonActive,
            ]}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.segmentButtonLabel,
                selectedTab === 'food' && styles.segmentButtonLabelActive,
              ]}
            >
              AI 카메라
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedTab('steps')}
            style={[
              styles.segmentButton,
              selectedTab === 'steps' && styles.segmentButtonActive,
            ]}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.segmentButtonLabel,
                selectedTab === 'steps' && styles.segmentButtonLabelActive,
              ]}
            >
              만보기 리포트
            </Text>
          </Pressable>
        </View>

        {selectedTab === 'food' ? (
          <FlatList
            data={records}
            keyExtractor={item => item.id}
            refreshing={isLoading}
            onRefresh={refreshRecords}
            contentContainerStyle={[
              styles.historyListContent,
              records.length === 0 && styles.historyListEmpty,
            ]}
            ListHeaderComponent={
              error ? <Text style={styles.errorText}>{error}</Text> : null
            }
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.cardTitle}>아직 분석 기록이 없어요</Text>
                  <Text style={styles.helperText}>
                    홈에서 카메라로 음식을 촬영하면 이곳에 기록이 쌓입니다.
                  </Text>
                  <Pressable
                    onPress={onOpenCamera}
                    style={styles.primaryButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryButtonLabel}>
                      카메라로 기록하기
                    </Text>
                  </Pressable>
                </View>
              ) : null
            }
            renderItem={({item}) => (
              <RecordItem
                record={item}
                onPress={() => setSelectedRecord(item)}
                onLongPress={() => handleLongPressRecordItem(item)}
              />
            )}
          />
        ) : (
          <View style={styles.stepHistoryPanel}>
            <PedometerHistoryScreen />
          </View>
        )}

        <RecordDetailModal
          selectedRecord={selectedRecord}
          onClose={handleCloseRecordDetailModal}
        />
      </View>
    </SafeAreaView>
  );
}

function SettingsScreen({bottomPadding}: SettingsScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.settingsRoot, {paddingBottom: bottomPadding}]}>
        <View style={styles.headerBlock}>
          <Text style={styles.screenTitle}>설정</Text>
          <Text style={styles.screenDescription}>
            현재는 개인정보 처리방침만 확인할 수 있어요.
          </Text>
        </View>
        <PedometerSettingsScreen />
      </View>
    </SafeAreaView>
  );
}

function MainTabs({stepSensor, onOpenCamera}: MainTabsProps) {
  const insets = useSafeAreaInsets();
  const tabBarBottomOffset = Platform.OS === 'android' ? insets.bottom : 0;
  const tabBarBottomPadding = Platform.OS === 'ios' ? insets.bottom : spacing.xs;
  const tabBarHeight =
    tabBarBaseHeight + (Platform.OS === 'ios' ? insets.bottom : 0);
  const contentBottomPadding = tabBarHeight + tabBarBottomOffset;

  return (
    <StepTrackingProvider stepSensor={stepSensor}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: appColors.primary,
          tabBarInactiveTintColor: appColors.textMuted,
          tabBarStyle: [
            styles.tabBar,
            {
              bottom: tabBarBottomOffset,
              height: tabBarHeight,
              paddingBottom: tabBarBottomPadding,
            },
          ],
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen name="Home" options={{title: '홈'}}>
          {() => (
            <HomeDashboardScreen
              onOpenCamera={onOpenCamera}
              bottomPadding={contentBottomPadding}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="History" options={{title: '히스토리'}}>
          {() => (
            <HistoryScreen
              onOpenCamera={onOpenCamera}
              bottomPadding={contentBottomPadding}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="DailyReport" options={{title: '데일리 리포트'}}>
          {() => (
            <View
              style={[
                styles.dailyReportTabContent,
                {paddingBottom: contentBottomPadding},
              ]}
            >
              <DailyReportNavigator dataSources={dailyReportDataSources} />
            </View>
          )}
        </Tab.Screen>
        <Tab.Screen name="Settings" options={{title: '설정'}}>
          {() => <SettingsScreen bottomPadding={contentBottomPadding} />}
        </Tab.Screen>
      </Tab.Navigator>
    </StepTrackingProvider>
  );
}

type MainTabsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'MainTabs'
>;

function MainTabsScreen({navigation}: MainTabsScreenProps) {
  const expoStepSensor = useMemo(() => createExpoStepSensor(), []);

  return (
    <MainTabs
      stepSensor={expoStepSensor}
      onOpenCamera={() => navigation.navigate('CameraCapture')}
    />
  );
}

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    configureAdUnits(productionAdUnits);
    initializeMobileAds().catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY).then(result => {
      if (result === RESULTS.DENIED) {
        request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer theme={DefaultTheme}>
        <Stack.Navigator>
          <Stack.Screen
            name="MainTabs"
            component={MainTabsScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="CameraCapture"
            options={{headerShown: false, animation: 'slide_from_bottom'}}
          >
            {props => <CameraCaptureScreen navigation={props.navigation} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const appColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceMuted: '#ecfdf5',
  primary: '#047857',
  primarySoft: '#d1fae5',
  text: '#111827',
  textMuted: '#4b5563',
  textSubtle: '#6b7280',
  border: '#e5e7eb',
  danger: '#dc2626',
  inverseText: '#ffffff',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 32,
};

const tabBarBaseHeight = 56;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  homeContent: {
    flexGrow: 1,
    padding: spacing.xl,
    gap: spacing.xl,
    backgroundColor: appColors.background,
  },
  heroCard: {
    borderRadius: 20,
    backgroundColor: appColors.surfaceMuted,
    padding: spacing.xl,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: appColors.primarySoft,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.primary,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: appColors.text,
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: appColors.textMuted,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: appColors.text,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: appColors.text,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metricLabel: {
    fontSize: 13,
    color: appColors.textSubtle,
  },
  metricValue: {
    marginTop: spacing.xs,
    fontSize: 32,
    fontWeight: '800',
    color: appColors.text,
  },
  metricCompact: {
    fontSize: 16,
    fontWeight: '700',
    color: appColors.primary,
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: appColors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusPillLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.primary,
  },
  helperText: {
    fontSize: 15,
    lineHeight: 22,
    color: appColors.textMuted,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: appColors.danger,
  },
  goalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  goalInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: appColors.text,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: appColors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  primaryButtonLabel: {
    color: appColors.inverseText,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonLabel: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  insightBox: {
    borderRadius: 12,
    backgroundColor: appColors.surfaceMuted,
    padding: spacing.md,
    gap: spacing.xs,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: appColors.primary,
  },
  historyRoot: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    backgroundColor: appColors.background,
    gap: spacing.lg,
  },
  settingsRoot: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  dailyReportTabContent: {
    flex: 1,
  },
  headerBlock: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: appColors.text,
  },
  screenDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: appColors.textMuted,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: '#eef2f7',
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: appColors.surface,
  },
  segmentButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: appColors.textSubtle,
  },
  segmentButtonLabelActive: {
    color: appColors.primary,
  },
  historyListContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  historyListEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  stepHistoryPanel: {
    flex: 1,
    marginHorizontal: -spacing.xl,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopColor: appColors.border,
    backgroundColor: appColors.surface,
    minHeight: tabBarBaseHeight,
    paddingTop: spacing.xs,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 0,
  },
});
