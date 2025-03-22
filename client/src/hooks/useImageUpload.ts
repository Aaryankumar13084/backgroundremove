import { useState, useCallback } from 'react';

interface UploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

interface UploadResult {
  file: File | null;
  preview: string | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  upload: (file: File) => Promise<void>;
  reset: () => void;
}

export function useImageUpload(options?: UploadOptions): UploadResult {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const validateFile = useCallback((file: File): boolean => {
    // Check file size
    if (options?.maxSize && file.size > options.maxSize) {
      setError(`File size exceeds the maximum allowed size (${Math.round(options.maxSize / 1024 / 1024)} MB)`);
      return false;
    }

    // Check file type
    if (options?.allowedTypes && !options.allowedTypes.includes(file.type)) {
      setError(`File type not supported. Allowed types: ${options.allowedTypes.join(', ')}`);
      return false;
    }

    return true;
  }, [options]);

  const upload = useCallback(async (file: File): Promise<void> => {
    setError(null);
    
    if (!validateFile(file)) {
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setFile(file);
    
    try {
      // Create a preview URL
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          setProgress(percentage);
        }
      };
      
      const previewUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      setPreview(previewUrl);
      setProgress(100);
    } catch (err) {
      setError('Failed to generate preview');
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [validateFile]);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setIsLoading(false);
    setError(null);
    setProgress(0);
  }, []);

  return { file, preview, isLoading, error, progress, upload, reset };
}