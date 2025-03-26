import { useState, useRef, useEffect } from 'react';
import { ImageDown, Repeat, ZoomIn, ZoomOut, MoveHorizontal, Undo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useMutation, useQuery } from '@tanstack/react-query';
import { downloadOptionsSchema, type DownloadOptions, type ImageFormat, type ImageQuality, type Settings } from '@shared/schema';
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
  const [activeTab, setActiveTab] = useState('processed');
  const [format, setFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState<ImageQuality>('high');
  const { toast } = useToast();
  
  // Image manipulation state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fetch settings to check if move/resize is enabled
  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });
  
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
  
  // Reset image position and scale
  const resetTransform = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!settings?.allowMove) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  
  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !settings?.allowMove) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  };
  
  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle zoom in
  const handleZoomIn = () => {
    if (!settings?.allowResize) return;
    setScale(prev => Math.min(prev + 0.1, 3));
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    if (!settings?.allowResize) return;
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };
  
  // Handle touch events for mobile
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!settings?.allowMove || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !settings?.allowMove || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
      
      // Prevent default to avoid page scrolling while dragging
      e.preventDefault();
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isDragging, position, dragStart, settings?.allowMove]);
  
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
          <div 
            ref={containerRef}
            className={`border rounded-lg overflow-hidden relative aspect-video h-[500px] flex items-center justify-center ${settings?.backgroundType === 'transparent' ? 'bg-checkerboard' : ''}`}
            style={{
              backgroundColor: settings?.backgroundType === 'color' ? settings.backgroundColor : undefined,
              backgroundImage: settings?.backgroundType === 'image' && settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: settings?.allowMove ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img 
              ref={imageRef}
              src={processedImage} 
              alt="Processed" 
              className="max-w-full max-h-full object-contain transition-transform"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center',
                pointerEvents: 'none' // Prevents the image from capturing mouse events
              }}
            />
            
            {/* Controls overlay */}
            {(settings?.allowMove || settings?.allowResize) && (
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                {settings?.allowResize && (
                  <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm p-2 rounded-lg shadow-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleZoomOut}
                        disabled={scale <= 0.5}
                        className="h-8 w-8"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      
                      <div className="text-xs font-medium">
                        {Math.round(scale * 100)}%
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleZoomIn}
                        disabled={scale >= 3}
                        className="h-8 w-8"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="px-2">
                      <Slider
                        value={[scale * 100]}
                        min={50}
                        max={300}
                        step={5}
                        onValueChange={([newValue]) => setScale(newValue / 100)}
                      />
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={resetTransform}
                  className="shadow-lg"
                >
                  <Undo className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}
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