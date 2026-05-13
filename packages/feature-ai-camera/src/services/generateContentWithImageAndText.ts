import {getAI, getGenerativeModel} from '@react-native-firebase/ai';

type GenerationConfig = {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
};

export type GenerateImageAndTextResult =
  | {success: true; text: string}
  | {success: false; error: string};

export type GenerateContentWithImageAndTextParams = {
  model?: string;
  systemInstruction?: string;
  generationConfig?: GenerationConfig;
  imageBase64: string;
  mimeType?: string;
  textPrompt: string;
};

export async function generateContentWithImageAndText(
  params: GenerateContentWithImageAndTextParams,
): Promise<GenerateImageAndTextResult> {
  try {
    const ai = getAI();
    const model = getGenerativeModel(ai, {
      model: params.model ?? 'gemini-2.5-flash',
      systemInstruction: params.systemInstruction,
      generationConfig: params.generationConfig,
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: params.imageBase64,
          mimeType: params.mimeType ?? 'image/jpeg',
        },
      },
      {text: params.textPrompt},
    ]);

    const text = result.response.text();
    if (!text || text.trim().length === 0) {
      return {success: false, error: 'AI 응답 없음'};
    }

    return {success: true, text};
  } catch (e) {
    const message =
      e instanceof Error ? e.message : '이미지 분석 요청 중 오류가 발생했습니다';
    return {success: false, error: message};
  }
}
