export type Nutrition = {
  protein: number;
  carbs: number;
  fat: number;
};

export type NutritionTotals = Nutrition & {
  calories: number;
};

export type FoodAnalysisResult = {
  food_name: string;
  calories: number;
  nutrition: Nutrition;
  confidence: number;
};
