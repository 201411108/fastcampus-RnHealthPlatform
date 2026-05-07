import {useState} from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type StepGoalInputProps = {
  onGoalSaved?: (goal: number) => void;
};

export default function StepGoalInput({onGoalSaved}: StepGoalInputProps) {
  const [inputGoal, setInputGoal] = useState('');
  const [savedGoal, setSavedGoal] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSaveGoal = () => {
    const parsedGoal = Number(inputGoal.trim());

    if (!Number.isFinite(parsedGoal) || parsedGoal <= 0) {
      setErrorMessage('1 이상의 숫자를 입력해 주세요.');
      return;
    }

    setSavedGoal(parsedGoal);
    setErrorMessage('');
    onGoalSaved?.(parsedGoal);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.goalInputSection}>
      <TextInput
        value={inputGoal}
        onChangeText={setInputGoal}
        keyboardType="number-pad"
        placeholder="목표 걸음수를 입력하세요"
        style={styles.input}
      />
      <Pressable
        style={styles.saveButton}
        onPress={handleSaveGoal}
        accessibilityRole="button"
        accessibilityLabel="목표 걸음수 저장"
      >
        <Text style={styles.saveButtonText}>저장</Text>
      </Pressable>
      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      <Text style={styles.goalText}>
        {savedGoal === null
          ? '목표가 아직 설정되지 않았습니다.'
          : `목표 걸음수: ${savedGoal}보`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  goalInputSection: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#c8c8c8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#222',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 4,
    color: '#d92d20',
    fontSize: 14,
  },
  goalText: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '500',
  },
});
