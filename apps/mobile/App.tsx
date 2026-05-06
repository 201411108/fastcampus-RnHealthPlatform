import React, {useEffect} from 'react';
import {healthPlatformTag} from '@rn-health/core';
import {AICameraNavigator} from '@rn-health/feature-ai-camera';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';

type RootStackParamList = {
  Home: undefined;
  AiCameraFeature: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

function HomeScreen({navigation}: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>AI 헬스 플랫폼</Text>
        <Text style={styles.description}>
          {healthPlatformTag} · React Native starter with react-navigation wired
          in.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('AiCameraFeature')}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonLabel}>음식 카메라 기록</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    mobileAds()
      .initialize()
      .then(() => {});
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
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="AiCameraFeature"
            component={AICameraNavigator}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#4b5563',
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
