import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Settings } from '@shared/schema';
import { removeBackground } from '@/lib/backgroundRemover';
import { useImageUpload } from '@/hooks/useImageUpload';
import { apiRequest } from '@/lib/queryClient';

interface UploadSectionProps {
  settings?: Settings;
  isLoading: boolean;
  onUploadSuccess: (data: UploadResponse) => void;
}

interface UploadResponse {
  original: string;
  processed: string;
}

export default function UploadSection({ settings, isLoading, onUploadSuccess }: UploadSectionProps) {
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    file,
    preview,
    isLoading: isUploading,
    error,
    progress,
    upload,
    reset
  } = useImageUpload({
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  });
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await upload(acceptedFiles[0]);
      }
    },
    maxSize: 10 * 1024 * 1024,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/jpg': []
    },
    multiple: false
  });
  
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!file) throw new Error('No file selected');
      
      const formData = new FormData();
      formData.append('image', file);
      
      setProcessing(true);
      setProcessingProgress(10);
      
      // Client-side processing using TensorFlow
      if (preview) {
        try {
          setProcessingProgress(30);
          // Process the image using TensorFlow.js
          const processedImageUrl = await removeBackground(preview, {
            foregroundThreshold: settings?.foregroundThreshold,
            backgroundThreshold: settings?.backgroundThreshold,
            alphaMatting: settings?.alphaMatting
          });
          
          setProcessingProgress(80);
          
          // Return both the original and processed image
          return {
            original: preview,
            processed: processedImageUrl
          };
        } catch (error) {
          console.error('Error processing image:', error);
          throw error;
        } finally {
          setProcessingProgress(100);
          setProcessing(false);
        }
      }
      
      // As a fallback, use server-side processing
      const response = await apiRequest<UploadResponse>({
        url: '/api/upload',
        method: 'POST',
        body: formData,
        withCredentials: true,
        on401: 'throw'
      });
      
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      onUploadSuccess(data);
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive'
      });
      setProcessing(false);
    }
  });
  
  // The onUploadSuccess callback is now passed as a prop
  
  const handleUpload = async () => {
    if (file) {
      uploadMutation.mutate(file);
    } else {
      toast({
        title: 'No image selected',
        description: 'Please select an image to upload',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div 
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors duration-200 
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700'} 
          ${preview ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-950'}`}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-xl mx-auto">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-auto max-h-[400px] object-contain rounded-md shadow-sm" 
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
              >
                Change
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 text-center py-8">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Upload an image</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
                Drag and drop or click to upload. We support JPG, PNG and WebP images up to 10 MB.
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-sm mt-2 text-center">{error}</div>
        )}
        
        {isUploading && (
          <div className="mt-4 w-full max-w-xs mx-auto">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">Uploading... {progress}%</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex justify-center">
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading || uploadMutation.isPending || isLoading}
          className="w-full max-w-xs"
        >
          {uploadMutation.isPending || processing ? (
            <>
              <span className="mr-2">
                Processing...
              </span>
              {processingProgress}%
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Remove Background
            </>
          )}
        </Button>
      </div>
    </div>
  );
}