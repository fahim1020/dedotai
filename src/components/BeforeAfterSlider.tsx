'use client';

import React, { useState, useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
  before: ImageData;
  after: ImageData;
  width: number;
  height: number;
}

export default function BeforeAfterSlider({ before, after, width, height }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const beforeCanvasRef = useRef<HTMLCanvasElement>(null);
  const afterCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (beforeCanvasRef.current) {
      const ctx = beforeCanvasRef.current.getContext('2d');
      if (ctx) ctx.putImageData(before, 0, 0);
    }
    if (afterCanvasRef.current) {
      const ctx = afterCanvasRef.current.getContext('2d');
      if (ctx) ctx.putImageData(after, 0, 0);
    }
  }, [before, after]);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setPosition(percent);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches[0]) handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', () => setIsDragging(false));
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', () => setIsDragging(false));
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', () => setIsDragging(false));
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', () => setIsDragging(false));
    };
  }, [isDragging]);

  const containerStyle = {
    maxWidth: '100%',
    maxHeight: '70vh',
    aspectRatio: `${width}/${height}`,
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full mx-auto overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-lg shadow-inner select-none touch-none"
      style={containerStyle}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        if (e.touches[0]) handleMove(e.touches[0].clientX);
      }}
    >
      {/* After Image (Background) */}
      <canvas
        ref={afterCanvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
      />
      <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold rounded pointer-events-none">
        After
      </div>

      {/* Before Image (Foreground, clipped) */}
      <div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <canvas
          ref={beforeCanvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0 object-contain pointer-events-none"
          style={{ width: `${(100 / position) * 100}%`, maxWidth: 'none', height: '100%' }}
        />
        <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold rounded">
          Before
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize hover:bg-blue-100 transition-colors z-10 flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `calc(${position}% - 2px)` }}
      >
        <div className="w-8 h-8 -ml-3.5 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18 3-3-3-3"/><path d="m9 6-3 3 3 3"/><path d="M21 12H3"/></svg>
        </div>
      </div>
    </div>
  );
}
