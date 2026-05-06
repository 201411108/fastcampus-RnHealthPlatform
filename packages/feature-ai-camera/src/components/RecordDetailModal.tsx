import { FC } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FoodRecord } from '../types/record';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme/tokens';

type RecordDetailModalProps = {
  selectedRecord: FoodRecord | null;
  onClose: () => void;
};

const RecordDetailModal: FC<RecordDetailModalProps> = ({
  selectedRecord,
  onClose,
}) => {
  const { top, bottom } = useSafeAreaInsets();

  return (
    <Modal
      visible={!!selectedRecord}
      onRequestClose={onClose}
      transparent
      animationType="fade"
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: top,
            paddingBottom: bottom + spacing.lg,
          },
        ]}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.modalTitle}>
            {selectedRecord?.analysisResult.food_name}
          </Text>
          <Text style={styles.modalCalorieText}>
            {selectedRecord?.analysisResult.calories} kcal
          </Text>
          <Text style={styles.modalNutritionText}>
            탄수화물 {selectedRecord?.analysisResult.nutrition.carbs}g
          </Text>
          <Text style={styles.modalNutritionText}>
            단백질 {selectedRecord?.analysisResult.nutrition.protein}g
          </Text>
          <Text style={styles.modalNutritionText}>
            지방 {selectedRecord?.analysisResult.nutrition.fat}g
          </Text>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
          >
            <Text style={styles.closeLabel}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 350,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.textPrimary,
  },
  modalCalorieText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  modalNutritionText: {
    ...typography.body,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default RecordDetailModal;
