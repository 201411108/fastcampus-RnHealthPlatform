import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  PhotoFile,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import useAIAnalysis from '../hooks/useAIAnalysis';
import useRecords from '../hooks/useRecords';
import { useInterstitialAd } from '@rn-health/core';
import {
  AnalyzingOverlay,
  PermissionDeniedState,
} from '../components/FeatureStates';
import { colors } from '../theme/tokens';

type CameraCaptureScreenProps = {
  navigation: {
    goBack: () => void;
  };
};

function CameraCaptureScreen({ navigation }: CameraCaptureScreenProps) {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const { bottom } = useSafeAreaInsets();

  const cameraRef = useRef<Camera>(null);

  const [photo, setPhoto] = useState<PhotoFile | null>(null);

  const handlePressTakePhoto = async () => {
    if (!cameraRef.current) {
      return;
    }

    const currentPhoto = await cameraRef.current.takePhoto();
    setPhoto(currentPhoto);
  };

  const handlePressResetPhoto = () => {
    setPhoto(null);
  };

  const { analyzeFoodImage, isAnalyzing } = useAIAnalysis();
  const { addRecord } = useRecords();

  const { loaded: interstitialLoaded, interstitial } =
    useInterstitialAd('aiCamera.interstitial');

  const handlePressAnalysis = async () => {
    if (!photo) {
      return;
    }

    const result = await analyzeFoodImage(photo.path);

    if (!result.ok) {
      Alert.alert('분석 실패', result.error);
      return;
    }

    await addRecord({
      imageUri: result.downloadUrl,
      analysisResult: result.result,
    });

    if (interstitialLoaded) {
      await interstitial.show();
    }
    navigation.goBack();
  };

  if (!hasPermission) {
    return (
      <PermissionDeniedState
        title="카메라 권한이 필요합니다"
        description="음식을 촬영하려면 카메라 접근을 허용해 주세요. 설정에서 권한을 켤 수 있습니다."
        onOpenSettings={() => Linking.openSettings()}
        onRetryRequest={() => requestPermission()}
      />
    );
  }

  if (device == null) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>사용 가능한 카메라가 없습니다.</Text>
      </View>
    );
  }

  if (photo) {
    return (
      <View style={styles.container}>
        <AnalyzingOverlay visible={isAnalyzing} />
        <Image
          source={{ uri: `file://${photo.path}` }}
          style={styles.previewImage}
          resizeMode="cover"
        />
        <View style={[styles.bottomControls, { paddingBottom: bottom + 20 }]}>
          <Pressable
            onPress={handlePressResetPhoto}
            hitSlop={10}
            style={styles.actionButton}
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>✕</Text>
          </Pressable>
          <Pressable
            hitSlop={10}
            onPress={handlePressAnalysis}
            style={[styles.actionButton, styles.primaryOutline]}
            disabled={isAnalyzing}
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonAccent}>분석 저장</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnalyzingOverlay visible={isAnalyzing} />
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
      />
      <View style={[styles.bottomControls, { paddingBottom: bottom + 20 }]}>
        <Pressable
          onPress={handlePressTakePhoto}
          hitSlop={10}
          accessibilityRole="button"
        >
          <View style={styles.shutterOuter}>
            <View style={styles.shutterInner} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const SHUTTER_SIZE = 70;
const SHUTTER_INNER_SIZE = 58;
const ACTION_BUTTON_SIZE = 54;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  messageText: {
    color: colors.inverseOnDark,
    fontSize: 17,
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    gap: 40,
  },
  shutterOuter: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: SHUTTER_SIZE / 2,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: SHUTTER_INNER_SIZE,
    height: SHUTTER_INNER_SIZE,
    borderRadius: SHUTTER_INNER_SIZE / 2,
    backgroundColor: '#ffffff',
  },
  actionButton: {
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    borderRadius: ACTION_BUTTON_SIZE / 2,
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryOutline: {
    width: 'auto',
    minWidth: 120,
    paddingHorizontal: 12,
    borderColor: colors.primary,
    backgroundColor: 'rgba(5, 150, 105, 0.25)',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  actionButtonAccent: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});

export default CameraCaptureScreen;
