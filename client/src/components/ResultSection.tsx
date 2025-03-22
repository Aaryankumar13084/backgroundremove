import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImageFormat, ImageQuality } from "@shared/schema";
import ComparisonSlider from "./ComparisonSlider";

interface ResultSectionProps {
  originalImage: string;
  processedImage: string;
  onReset: () => void;
}

export default function ResultSection({ 
  originalImage, 
  processedImage, 
  onReset 
}: ResultSectionProps) {
  const [format, setFormat] = useState<ImageFormat>("png");
  const [quality, setQuality] = useState<ImageQuality>("high");
  const { toast } = useToast();

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(processedImage);
      if (!response.ok) {
        throw new Error("Failed to download image");
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create a download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `background_removed.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download the processed image",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Before/After Comparison */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Before / After Comparison</h3>
          </div>
          <div className="p-4">
            <div className="w-full h-64">
              <ComparisonSlider 
                beforeImage={originalImage} 
                afterImage={processedImage} 
              />
            </div>
          </div>
        </div>

        {/* Download Options */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Download Options</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="format" className="block text-sm font-medium text-gray-700">Format</label>
                <Select value={format} onValueChange={(val) => setFormat(val as ImageFormat)}>
                  <SelectTrigger className="w-[180px]" id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpg">JPG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="quality" className="block text-sm font-medium text-gray-700">Quality</label>
                <Select value={quality} onValueChange={(val) => setQuality(val as ImageQuality)}>
                  <SelectTrigger className="w-[180px]" id="quality">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High (Original Size)</SelectItem>
                    <SelectItem value="medium">Medium (75%)</SelectItem>
                    <SelectItem value="low">Low (50%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                className="w-full flex items-center justify-center"
                onClick={() => downloadMutation.mutate()}
                disabled={downloadMutation.isPending}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mr-2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Processed Image
              </Button>
            </div>
            
            <div className="text-center">
              <button 
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={onReset}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="inline mr-1"
                >
                  <path d="M21.5 2v6h-6" />
                  <path d="M2.5 12c0 5 4 9 9 9 2.5 0 5-1 6.5-2.5 1-1 1.5-2 2-3.5" />
                  <path d="M21.5 8c-1-5-5-7-9-6.5-5.5.5-8.5 5.5-7.5 11 .5 2 1.5 3.5 3 4.5" />
                </svg>
                Start over with a new image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
