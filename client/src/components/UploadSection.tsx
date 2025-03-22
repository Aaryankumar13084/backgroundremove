import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ResultSection from "./ResultSection";
import { Settings } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

interface UploadSectionProps {
  settings?: Settings;
  isLoading: boolean;
}

interface UploadResponse {
  original: string;
  processed: string;
}

export default function UploadSection({ settings, isLoading }: UploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrls, setImageUrls] = useState<UploadResponse | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);
      
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        return await response.json() as UploadResponse;
      } finally {
        clearInterval(progressInterval);
        setProgress(100);
      }
    },
    onSuccess: (data) => {
      setImageUrls(data);
      setIsUploading(false);
      toast({
        title: "Success",
        description: "Image background has been successfully removed.",
      });
    },
    onError: (error) => {
      setIsUploading(false);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process image",
        variant: "destructive",
      });
    }
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        let errorMessage = "Invalid file";
        
        if (error.code === "file-too-large") {
          errorMessage = "File is too large. Maximum size is 5MB.";
        } else if (error.code === "file-invalid-type") {
          errorMessage = "Invalid file type. Only JPG and PNG are supported.";
        }
        
        toast({
          title: "Upload Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      if (acceptedFiles.length > 0) {
        setIsUploading(true);
        setProgress(0);
        uploadMutation.mutate(acceptedFiles[0]);
      }
    },
    disabled: isUploading || isLoading
  });

  const resetUpload = () => {
    setImageUrls(null);
    setIsUploading(false);
    setProgress(0);
  };

  return (
    <div className="p-6">
      {/* Drop Zone (shown when no image is uploaded) */}
      {!isUploading && !imageUrls && (
        <div
          {...getRootProps()}
          className={`drop-zone border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
            isDragActive ? "border-primary bg-blue-50" : ""
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-50 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your image here, or <span className="text-primary">browse</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports JPG, PNG • Max file size: 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing State (shown when image is uploading) */}
      {isUploading && (
        <div className="mt-8">
          <div className="flex flex-col items-center space-y-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600">Removing background... Please wait</p>
          </div>
        </div>
      )}

      {/* Result Section (shown after background removal) */}
      {imageUrls && (
        <ResultSection 
          originalImage={imageUrls.original} 
          processedImage={imageUrls.processed} 
          onReset={resetUpload} 
        />
      )}
    </div>
  );
}
