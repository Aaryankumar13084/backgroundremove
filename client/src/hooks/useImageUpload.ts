import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UploadOptions {
  maxSize?: number;
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
  const { toast } = useToast();
  
  const maxSize = options?.maxSize || 5 * 1024 * 1024; // 5MB default
  const allowedTypes = options?.allowedTypes || ['image/jpeg', 'image/png', 'image/jpg'];
  
  const validateFile = useCallback((file: File): boolean => {
    if (!allowedTypes.includes(file.type)) {
      setError(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
      toast({
        title: "Invalid file type",
        description: `Only ${allowedTypes.join(', ')} files are allowed.`,
        variant: "destructive",
      });
      return false;
    }
    
    if (file.size > maxSize) {
      setError(`File too large. Maximum size: ${Math.floor(maxSize / 1024 / 1024)}MB`);
      toast({
        title: "File too large",
        description: `Maximum file size is ${Math.floor(maxSize / 1024 / 1024)}MB.`,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  }, [allowedTypes, maxSize, toast]);
  
  const upload = useCallback(async (file: File): Promise<void> => {
    if (!validateFile(file)) {
      return;
    }
    
    setFile(file);
    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    
    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);
      
      // After processing completes
      setProgress(100);
      clearInterval(interval);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : 'Error uploading image',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [validateFile, toast]);
  
  const reset = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setIsLoading(false);
    setError(null);
    setProgress(0);
  }, [preview]);
  
  return {
    file,
    preview,
    isLoading,
    error,
    progress,
    upload,
    reset
  };
}
