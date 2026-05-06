import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AICameraStackParamList = {
  RecordsHome: undefined;
  CameraCapture: undefined;
};

export type RecordsHomeScreenProps = NativeStackScreenProps<
  AICameraStackParamList,
  'RecordsHome'
>;

export type CameraCaptureScreenProps = NativeStackScreenProps<
  AICameraStackParamList,
  'CameraCapture'
>;
