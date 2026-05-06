interface Nutrition {
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodAnalysisResult {
  food_name: string;
  calories: number;
  nutrition: Nutrition;
  confidence: number;
}
