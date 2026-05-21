import {Platform} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {DailyReportHomeScreen} from '../screens/DailyReportHomeScreen';
import {DailyReportHistoryScreen} from '../screens/DailyReportHistoryScreen';
import {WeeklyReportScreen} from '../screens/WeeklyReportScreen';
import type {DailyReportDataSources} from '../types/dailyReport';
import type {WeeklyReportDataSources} from '../types/weeklyReport';
import type {DailyReportStackParamList} from './types';

const Stack = createNativeStackNavigator<DailyReportStackParamList>();

export type DailyReportNavigatorProps = {
  dataSources: DailyReportDataSources;
  weeklyDataSources: WeeklyReportDataSources;
  onOpenStore?: () => void;
};

export function DailyReportNavigator({
  dataSources,
  weeklyDataSources,
  onOpenStore,
}: DailyReportNavigatorProps) {
  return (
    <Stack.Navigator initialRouteName="DailyReportHome">
      <Stack.Screen
        name="DailyReportHome"
        options={{
          title: 'Daily Report',
          headerLargeTitle: false,
          ...(Platform.OS === 'android' && {
            statusBarTranslucent: false,
          }),
        }}
      >
        {props => (
          <DailyReportHomeScreen
            {...props}
            dataSources={dataSources}
            onOpenStore={onOpenStore}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="DailyReportHistory"
        component={DailyReportHistoryScreen}
        options={{
          title: '리포트 히스토리',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="WeeklyReport"
        options={{
          title: '주간 요약',
          animation: 'slide_from_right',
        }}
      >
        {props => (
          <WeeklyReportScreen {...props} weeklyDataSources={weeklyDataSources} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
