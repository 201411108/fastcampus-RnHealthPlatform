import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StepTrackingProvider} from '../providers/StepTrackingProvider';
import PedometerHistoryScreen from '../screens/PedometerHistoryScreen';
import PedometerHomeScreen from '../screens/PedometerHomeScreen';
import PedometerSettingsScreen from '../screens/PedometerSettingsScreen';
import type {StepSensorPort} from '../sensor/types';
import type {PedometerTabParamList} from './types';

const Tab = createBottomTabNavigator<PedometerTabParamList>();

export type PedometerNavigatorProps = {
  stepSensor?: StepSensorPort;
};

/**
 * 앱 셸에서 마운트할 만보기 기능의 유일한 public 진입점입니다.
 */
export function PedometerNavigator({stepSensor}: PedometerNavigatorProps) {
  return (
    <StepTrackingProvider stepSensor={stepSensor}>
      <Tab.Navigator
        initialRouteName="PedometerHome"
        screenOptions={{
          headerTitleAlign: 'center',
        }}
      >
        <Tab.Screen
          name="PedometerHome"
          component={PedometerHomeScreen}
          options={{title: '홈', headerTitle: '만보기'}}
        />
        <Tab.Screen
          name="PedometerHistory"
          component={PedometerHistoryScreen}
          options={{title: '기록'}}
        />
        <Tab.Screen
          name="PedometerSettings"
          component={PedometerSettingsScreen}
          options={{title: '정보'}}
        />
      </Tab.Navigator>
    </StepTrackingProvider>
  );
}
