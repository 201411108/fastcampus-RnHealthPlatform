import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@rn-health/one_time_pass_remaining/v1';

export async function getRemainingOneTimePasses(): Promise<number> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

export async function incrementOneTimePasses(): Promise<number> {
  const current = await getRemainingOneTimePasses();
  const next = current + 1;
  await AsyncStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

export async function decrementOneTimePasses(): Promise<number> {
  const current = await getRemainingOneTimePasses();
  const next = Math.max(0, current - 1);
  await AsyncStorage.setItem(STORAGE_KEY, String(next));
  return next;
}
