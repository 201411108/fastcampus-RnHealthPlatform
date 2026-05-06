import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import aiAnalysisService from '../services/aiAnalysisService';
import firebaseStorageService from '../services/firebaseStorageService';
import { FoodAnalysisResult } from '../types/nutrition';
import { useState } from 'react';

type AnalyzeFoodImageSuccess = {
  ok: true;
  result: FoodAnalysisResult;
  downloadUrl: string;
};

type AnalyzeFoodImageFailure = {
  ok: false;
  error: string;
};

const useAIAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeFoodImage = async (
    imageUri: string,
  ): Promise<AnalyzeFoodImageSuccess | AnalyzeFoodImageFailure> => {
    try {
      let filePathForRead = imageUri;
      let uploadUri = imageUri;

      if (imageUri.startsWith('file://')) {
        filePathForRead = imageUri.replace('file://', '');
        uploadUri =
          Platform.OS === 'ios' ? imageUri : imageUri.replace('file://', '');
      } else if (imageUri.startsWith('content://')) {
        const tempPath = `${RNFS.CachesDirectoryPath}/temp_image_${Date.now()}.jpg`;
        await RNFS.copyFile(imageUri, tempPath);
        filePathForRead = tempPath;
        uploadUri =
          Platform.OS === 'ios' ? `file://${tempPath}` : tempPath;
      }

      setIsAnalyzing(true);
      const base64 = await RNFS.readFile(filePathForRead, 'base64');

      const uploadResult = await firebaseStorageService.uploadImage(uploadUri);
      const result = await aiAnalysisService.analyzeFoodImage(base64);

      if (!result.success) {
        setError(result.error);
        return { ok: false, error: result.error };
      }

      if (!uploadResult.success) {
        setError(uploadResult.error);
        return { ok: false, error: uploadResult.error };
      }

      setError(null);
      return {
        ok: true,
        result: result.result,
        downloadUrl: uploadResult.downloadUrl,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    error,
    analyzeFoodImage,
  };
};

export default useAIAnalysis;
