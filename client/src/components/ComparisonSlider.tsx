import { useState, useRef, useEffect } from "react";

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
}

export default function ComparisonSlider({ beforeImage, afterImage }: ComparisonSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (isDragging && sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(percentage);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleEnd);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging]);

  return (
    <div 
      ref={sliderRef}
      className="relative overflow-hidden w-full h-full"
    >
      {/* Before Image (Full size) */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-center bg-no-repeat bg-contain"
        style={{ backgroundImage: `url(${beforeImage})` }}
      />
      
      {/* After Image (Partial based on slider position) */}
      <div 
        className="absolute top-0 left-0 h-full bg-center bg-no-repeat bg-contain transparent-bg"
        style={{ 
          backgroundImage: `url(${afterImage})`,
          width: `${position}%`,
          borderRight: "2px solid white"
        }}
      />
      
      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-10 transform -translate-x-1/2 cursor-ew-resize z-10 flex items-center justify-center"
        style={{ left: `${position}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 w-10 h-10 bg-white bg-opacity-80 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-md" />
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
          className="relative z-10 text-primary"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      
      <style jsx>{`
        .transparent-bg {
          background-image: linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
                          linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
                          linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
}
