import type {FoodAnalysisResult} from './nutrition';

export type FoodRecord = {
  id: string;
  createdAt: string;
  imageUri: string;
  analysisResult: FoodAnalysisResult;
};
