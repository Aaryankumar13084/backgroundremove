import { useRef, useState, useEffect } from 'react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
}

export default function ComparisonSlider({ beforeImage, afterImage }: ComparisonSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      
      const newPosition = Math.max(0, Math.min(100, (x / width) * 100));
      setPosition(newPosition);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!sliderRef.current || e.touches.length === 0) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const width = rect.width;
      
      const newPosition = Math.max(0, Math.min(100, (x / width) * 100));
      setPosition(newPosition);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging]);

  return (
    <div 
      ref={sliderRef}
      className="relative w-full h-full max-h-[600px] overflow-hidden rounded-lg shadow-lg"
    >
      {/* Before Image */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={beforeImage} 
          alt="Original" 
          className="object-contain w-full h-full" 
        />
      </div>
      
      {/* After Image */}
      <div 
        className="absolute inset-0 overflow-hidden h-full" 
        style={{ width: `${position}%` }}
      >
        <img 
          src={afterImage} 
          alt="Processed" 
          className="object-contain w-full h-full absolute right-0 transform translate-x-0" 
          style={{ width: `${100 / (position / 100)}%` }}
        />
      </div>
      
      {/* Slider Handle */}
      <div 
        className="absolute inset-y-0 flex items-center justify-center cursor-ew-resize z-10"
        style={{ left: `${position}%` }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        <div className="w-1 h-full bg-white opacity-80"></div>
        <div className="absolute w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
          <div className="w-4 h-4 text-primary">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M18 8L22 12L18 16"></path>
              <path d="M6 8L2 12L6 16"></path>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}