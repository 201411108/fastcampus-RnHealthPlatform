import {
  extractFirstJsonObject,
  normalizeFoodAnalysisResult,
  parseJsonObject,
} from '@rn-health/core';
import { generateContentWithImageAndText } from './generateContentWithImageAndText';
import {
  FOOD_ANALYSIS_PROMPT,
  FOOD_ANALYSIS_SYSTEM_PROMPT,
} from '../constants/prompts';
import type { FoodAnalysisResult } from '../types/nutrition';

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

      const jsonString = extractFirstJsonObject(generated.text);
      if (!jsonString) {
        console.log('json 매치 에러');
        return {
          success: false,
          error: '유효하지 않은 JSON 형식',
        };
      }

      let parsed: FoodAnalysisResult;

      try {
        const normalized = normalizeFoodAnalysisResult(
          parseJsonObject<unknown>(jsonString),
        );
        if (!normalized) {
          console.log('유효하지 않은 분석 결과');
          return {
            success: false,
            error: '유효하지 않은 분석 결과',
          };
        }
        parsed = normalized;
      } catch (error) {
        console.log('JSON 파싱 오류');
        return {
          success: false,
          error: 'JSON 파싱 오류',
        };
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
