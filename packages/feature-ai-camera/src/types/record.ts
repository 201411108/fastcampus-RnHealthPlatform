import type { FoodAnalysisResult } from './nutrition';

export interface FoodRecord {
  id: string;
  createdAt: string;
  imageUri: string;
  analysisResult: FoodAnalysisResult;
}

export const RECORDS_KEY = '@food_records';
