import { useState } from 'react';
import { ImageDown, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation } from '@tanstack/react-query';
import { downloadOptionsSchema, type DownloadOptions, type ImageFormat, type ImageQuality } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import ComparisonSlider from './ComparisonSlider';
import { apiRequest } from '@/lib/queryClient';
import { downloadImage } from '@/lib/backgroundRemover';

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
  const [activeTab, setActiveTab] = useState('comparison');
  const [format, setFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState<ImageQuality>('high');
  const { toast } = useToast();
  
  const downloadMutation = useMutation({
    mutationFn: async (options: DownloadOptions) => {
      try {
        // Client-side download of processed image
        downloadImage(processedImage, 'background_removed', options.format);
        return { success: true };
      } catch (error) {
        console.error('Error downloading image:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Image downloaded',
        description: 'Your image has been downloaded successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Failed to download image',
        variant: 'destructive'
      });
    }
  });
  
  const handleDownload = () => {
    try {
      const options = downloadOptionsSchema.parse({ format, quality });
      downloadMutation.mutate(options);
    } catch (error) {
      toast({
        title: 'Invalid download options',
        description: 'Please select valid download options.',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Result</h2>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onReset}
            disabled={downloadMutation.isPending}
          >
            <Repeat className="mr-2 h-4 w-4" />
            Try another image
          </Button>
          
          <Button 
            onClick={handleDownload} 
            disabled={downloadMutation.isPending}
          >
            <ImageDown className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="comparison" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="original">Original</TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparison" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 aspect-video h-[500px]">
            <ComparisonSlider beforeImage={originalImage} afterImage={processedImage} />
          </div>
        </TabsContent>
        
        <TabsContent value="original" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 aspect-video h-[500px] flex items-center justify-center">
            <img 
              src={originalImage} 
              alt="Original" 
              className="max-w-full max-h-full object-contain" 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="processed" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-checkerboard aspect-video h-[500px] flex items-center justify-center">
            <img 
              src={processedImage} 
              alt="Processed" 
              className="max-w-full max-h-full object-contain" 
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <h3 className="font-medium">Format</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={format === 'png' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFormat('png')}
            >
              PNG
            </Button>
            <Button 
              variant={format === 'jpg' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFormat('jpg')}
            >
              JPG
            </Button>
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <h3 className="font-medium">Quality</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={quality === 'high' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setQuality('high')}
            >
              High
            </Button>
            <Button 
              variant={quality === 'medium' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setQuality('medium')}
            >
              Medium
            </Button>
            <Button 
              variant={quality === 'low' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setQuality('low')}
            >
              Low
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}