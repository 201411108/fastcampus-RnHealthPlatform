import {createGeminiGenerativeModel} from './createGeminiGenerativeModel';

export type GenerateTextResult =
  | {success: true; text: string}
  | {success: false; error: string};

export type GenerateTextFromPromptParams = {
  model?: string;
  systemInstruction?: string;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
  prompt: string;
  /** 기본 10_000ms */
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
    err => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      throw err;
    },
  );
}

export async function generateTextFromPrompt(
  params: GenerateTextFromPromptParams,
): Promise<GenerateTextResult> {
  const timeoutMs = params.timeoutMs ?? 10_000;
  try {
    const model = createGeminiGenerativeModel({
      model: params.model,
      systemInstruction: params.systemInstruction,
      generationConfig: params.generationConfig,
    });

    const result = await withTimeout(
      model.generateContent([{text: params.prompt}]),
      timeoutMs,
      '요청 시간 초과',
    );

    const text = result.response.text();

    if (!text || text.trim().length === 0) {
      return {success: false, error: 'AI 응답 없음'};
    }

    return {success: true, text};
  } catch (e) {
    const message =
      e instanceof Error ? e.message : '텍스트 생성 중 오류가 발생했습니다';
    return {success: false, error: message};
  }
}
