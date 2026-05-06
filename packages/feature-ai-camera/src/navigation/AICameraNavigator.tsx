import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RecordsHomeScreen from '../screens/RecordsHomeScreen';
import CameraCaptureScreen from '../screens/CameraCaptureScreen';
import type { AICameraStackParamList } from './types';

const Stack = createNativeStackNavigator<AICameraStackParamList>();

export function AICameraNavigator() {
  return (
    <Stack.Navigator initialRouteName="RecordsHome">
      <Stack.Screen
        name="RecordsHome"
        component={RecordsHomeScreen}
        options={{
          title: '음식 기록',
          headerLargeTitle: false,
          ...(Platform.OS === 'android' && {
            // 명시하지 않으면 첫 프레임에서 큰 topInset이 잡혀 헤더 위에 빈 여백이 생길 수 있음
            statusBarTranslucent: false,
          }),
        }}
      />
      <Stack.Screen
        name="CameraCapture"
        component={CameraCaptureScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}
