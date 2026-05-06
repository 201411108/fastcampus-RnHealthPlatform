import { FC } from 'react';
import type { FoodRecord } from '../types/record';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type RecordItemProps = {
  record: FoodRecord;
  onPress: () => void;
  onLongPress: () => void;
};

const RecordItem: FC<RecordItemProps> = ({ record, onPress, onLongPress }) => {
  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
    >
      <Image
        source={{
          uri: record.imageUri,
        }}
        style={styles.image}
      />
      <View style={styles.itemContainer}>
        <Text style={styles.foodName}>{record.analysisResult.food_name}</Text>
        <Text style={styles.calorieText}>
          {record.analysisResult.calories} kcal
        </Text>
        <Text style={styles.nutritionText}>
          탄수화물 {record.analysisResult.nutrition.carbs}g
        </Text>
        <Text style={styles.nutritionText}>
          단백질 {record.analysisResult.nutrition.protein}g
        </Text>
        <Text style={styles.nutritionText}>
          지방 {record.analysisResult.nutrition.fat}g
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  itemContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  foodName: {
    ...typography.section,
    fontSize: 16,
  },
  calorieText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  nutritionText: {
    ...typography.caption,
    fontSize: 13,
  },
});

export default RecordItem;
