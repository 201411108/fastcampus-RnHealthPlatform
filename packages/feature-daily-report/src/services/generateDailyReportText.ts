import {getAI, getGenerativeModel} from '@react-native-firebase/ai';

type GenerationConfig = {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
};

export type GenerateDailyReportTextResult =
  | {success: true; text: string}
  | {success: false; error: string};

export type GenerateDailyReportTextParams = {
  model?: string;
  systemInstruction?: string;
  generationConfig?: GenerationConfig;
  prompt: string;
  timeoutMs?: number;
};

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).then(
    value => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      return value;
    },
    error => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      throw error;
    },
  );
}

export async function generateDailyReportText({
  model = 'gemini-2.5-flash',
  systemInstruction,
  generationConfig,
  prompt,
  timeoutMs = 10_000,
}: GenerateDailyReportTextParams): Promise<GenerateDailyReportTextResult> {
  try {
    const ai = getAI();
    const generativeModel = getGenerativeModel(ai, {
      model,
      systemInstruction,
      generationConfig,
    });

    const result = await withTimeout(
      generativeModel.generateContent([{text: prompt}]),
      timeoutMs,
      '요청 시간 초과',
    );

    const text = result.response.text();
    if (!text || text.trim().length === 0) {
      return {success: false, error: 'AI 응답 없음'};
    }

    return {success: true, text};
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Daily Report 생성 중 오류가 발생했습니다';
    return {success: false, error: message};
  }
}
