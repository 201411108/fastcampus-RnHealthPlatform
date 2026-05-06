import storage from '@react-native-firebase/storage';

interface UploadResult {
  success: true;
  downloadUrl: string;
  storagePath: string;
}

interface UploadError {
  success: false;
  error: string;
}

class FirebaseStorageService {
  private generateFileName(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `food_${timestamp}_${random}`;
  }

  async uploadImage(localUri: string): Promise<UploadResult | UploadError> {
    try {
      const fileName = this.generateFileName();
      const storagePath = `food_images/${fileName}`;
      const reference = storage().ref(storagePath);

      let uploadUri = localUri.trim();
      if (
        !uploadUri.startsWith('file://') &&
        !uploadUri.startsWith('content://')
      ) {
        uploadUri = `file://${uploadUri}`;
      }

      await reference.putFile(uploadUri);
      const downloadUrl = await reference.getDownloadURL();

      return {
        success: true,
        downloadUrl,
        storagePath,
      };
    } catch (error) {
      console.error('Firebase storage upload error : ', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default new FirebaseStorageService();
