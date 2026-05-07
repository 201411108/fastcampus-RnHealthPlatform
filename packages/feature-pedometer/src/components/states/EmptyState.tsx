import {StyleSheet, Text, View, type TextStyle, type ViewStyle} from 'react-native';

type EmptyStateProps = {
  title: string;
  description?: string;
  titleStyle?: TextStyle;
  descriptionStyle?: TextStyle;
  containerStyle?: ViewStyle;
};

export function EmptyState({
  title,
  description,
  titleStyle,
  descriptionStyle,
  containerStyle,
}: EmptyStateProps) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, descriptionStyle]}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 20,
  },
});
