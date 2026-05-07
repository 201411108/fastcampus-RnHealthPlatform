import {getAI, getGenerativeModel} from '@react-native-firebase/ai';

export type CreateGeminiModelParams = {
  model?: string;
  systemInstruction?: string;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
};

export function createGeminiGenerativeModel(
  params: CreateGeminiModelParams,
): ReturnType<typeof getGenerativeModel> {
  const ai = getAI();
  return getGenerativeModel(ai, {
    model: params.model ?? 'gemini-2.5-flash',
    systemInstruction: params.systemInstruction,
    generationConfig: params.generationConfig,
  });
}
