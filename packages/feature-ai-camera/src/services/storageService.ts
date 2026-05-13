import AsyncStorage from '@react-native-async-storage/async-storage';
import { RECORDS_KEY, type FoodRecord } from '../types/record';

class StorageService {
  async getRecords(): Promise<FoodRecord[]> {
    try {
      const data = await AsyncStorage.getItem(RECORDS_KEY);
      const records = data ? JSON.parse(data) : [];

      return records;
    } catch (error) {
      console.error('Failed to get records: ', error);
      return [];
    }
  }

  async saveRecord(record: FoodRecord): Promise<void> {
    try {
      const records = await this.getRecords();
      const updatedRecords = [...records, record];

      await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(updatedRecords));
    } catch (error) {
      console.error('Failed to save record: ', error);
      throw error;
    }
  }

  async deleteRecord(id: string): Promise<void> {
    try {
      const records = await this.getRecords();
      const filteredRecords = records.filter(record => record.id !== id);

      await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(filteredRecords));
    } catch (error) {
      console.error('Failed to delete record: ', error);
      throw error;
    }
  }
}

export default new StorageService();
