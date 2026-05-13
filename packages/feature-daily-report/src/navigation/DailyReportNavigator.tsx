import {Platform} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {DailyReportHomeScreen} from '../screens/DailyReportHomeScreen';
import {DailyReportHistoryScreen} from '../screens/DailyReportHistoryScreen';
import type {DailyReportDataSources} from '../types/dailyReport';
import type {DailyReportStackParamList} from './types';

const Stack = createNativeStackNavigator<DailyReportStackParamList>();

export type DailyReportNavigatorProps = {
  dataSources: DailyReportDataSources;
};

export function DailyReportNavigator({dataSources}: DailyReportNavigatorProps) {
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
          <DailyReportHomeScreen {...props} dataSources={dataSources} />
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
    </Stack.Navigator>
  );
}
