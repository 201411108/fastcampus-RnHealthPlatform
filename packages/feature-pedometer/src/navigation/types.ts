import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';

export type PedometerTabParamList = {
  PedometerHome: undefined;
  PedometerHistory: undefined;
  PedometerSettings: undefined;
};

export type PedometerHomeScreenProps = BottomTabScreenProps<
  PedometerTabParamList,
  'PedometerHome'
>;

export type PedometerHistoryScreenProps = BottomTabScreenProps<
  PedometerTabParamList,
  'PedometerHistory'
>;

export type PedometerSettingsScreenProps = BottomTabScreenProps<
  PedometerTabParamList,
  'PedometerSettings'
>;
