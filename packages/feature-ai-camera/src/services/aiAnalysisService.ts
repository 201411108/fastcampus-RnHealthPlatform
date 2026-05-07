import { generateContentWithImageAndText } from '@rn-health/core';
import {
  FOOD_ANALYSIS_PROMPT,
  FOOD_ANALYSIS_SYSTEM_PROMPT,
} from '../constants/prompts';
import { FoodAnalysisResult } from '../types/nutrition';

interface AnalysisSuccess {
  success: true;
  result: FoodAnalysisResult;
}

interface AnalysisError {
  success: false;
  error: string;
}

class AIAnalysisService {
  async analyzeFoodImage(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
  ): Promise<AnalysisSuccess | AnalysisError> {
    try {
      const generated = await generateContentWithImageAndText({
        systemInstruction: FOOD_ANALYSIS_SYSTEM_PROMPT,
        textPrompt: FOOD_ANALYSIS_PROMPT,
        imageBase64,
        mimeType,
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        },
      });

      if (!generated.success) {
        return { success: false, error: generated.error };
      }

      const text = generated.text;

      const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('json 매치 에러');
        return {
          success: false,
          error: '유효하지 않은 JSON 형식',
        };
      }

      let parsed: FoodAnalysisResult;

      try {
        const jsonString = jsonMatch[0];

        const openBarce = (jsonString.match(/\{/g) || []).length;
        const closeBarce = (jsonString.match(/\}/g) || []).length;

        if (openBarce !== closeBarce) {
          console.log('openBarce !== closeBarce');
          return {
            success: false,
            error: '유효하지 않은 JSON 형식',
          };
        }

        parsed = JSON.parse(jsonString);
      } catch (error) {
        console.log('JSON 파싱 오류');
        return {
          success: false,
          error: 'JSON 파싱 오류',
        };
      }

      if (!parsed.food_name || typeof parsed.calories !== 'number') {
        console.log('유효하지 않은 분석 결과');
        return {
          success: false,
          error: '유효하지 않은 분석 결과',
        };
      }

      if (!parsed.nutrition) {
        parsed.nutrition = { protein: 0, carbs: 0, fat: 0 };
      }

      if (typeof parsed.confidence !== 'number') {
        parsed.confidence = 0;
      }

      return {
        success: true,
        result: parsed,
      };
    } catch (error) {
      console.error('AI Analysis Error: ', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default new AIAnalysisService();
