'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LoadedImage, MaskTool } from '@/types';
import MaskToolbar from './MaskToolbar';
import { detectWatermark } from '@/lib/detection/classical-detection';

interface MaskEditorProps {
  image: LoadedImage;
  onMaskChange: (mask: ImageData) => void;
  initialMask?: ImageData;
}

export default function MaskEditor({ image, onMaskChange, initialMask }: MaskEditorProps) {
  // Container & Canvas refs
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomCanvasRef = useRef<HTMLCanvasElement>(null);
  const topCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Offscreen canvas for the actual mask data
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tools & State
  const [tool, setTool] = useState<MaskTool>('brush');
  const [brushSize, setBrushSize] = useState(30);
  const [opacity, setOpacity] = useState(60);
  
  // View transform
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  // History
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

  // Auto-detect state
  const [isDetecting, setIsDetecting] = useState(false);

  // Initialize
  useEffect(() => {
    if (!bottomCanvasRef.current || !topCanvasRef.current) return;
    
    // Bottom canvas shows original image
    const bCtx = bottomCanvasRef.current.getContext('2d');
    if (bCtx) {
      bCtx.putImageData(image.imageData, 0, 0);
    }

    // Initialize mask canvas (offscreen)
    const mCanvas = document.createElement('canvas');
    mCanvas.width = image.width;
    mCanvas.height = image.height;
    maskCanvasRef.current = mCanvas;
    
    const mCtx = mCanvas.getContext('2d');
    if (mCtx) {
      if (initialMask) {
        mCtx.putImageData(initialMask, 0, 0);
        saveHistoryState(initialMask);
      } else {
        // Start blank
        mCtx.fillStyle = 'black';
        mCtx.fillRect(0, 0, image.width, image.height);
        const blank = mCtx.getImageData(0, 0, image.width, image.height);
        saveHistoryState(blank);
      }
    }
    
    // Initial fit to view
    fitToView();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  const fitToView = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const padding = 40;
    
    if (container.width <= padding || container.height <= padding) {
      return;
    }
    
    const scaleX = (container.width - padding) / image.width;
    const scaleY = (container.height - padding) / image.height;
    const newZoom = Math.max(0.01, Math.min(scaleX, scaleY, 1)); // Max 1x initially
    
    setZoom(newZoom);
    setPan({
      x: (container.width - image.width * newZoom) / 2,
      y: (container.height - image.height * newZoom) / 2
    });
  }, [image.width, image.height]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const handle = requestAnimationFrame(() => {
      fitToView();
    });

    const observer = new ResizeObserver(() => {
      fitToView();
    });
    
    observer.observe(containerRef.current);
    
    return () => {
      cancelAnimationFrame(handle);
      observer.disconnect();
    };
  }, [fitToView]);

  const updateOverlay = useCallback(() => {
    if (!topCanvasRef.current || !maskCanvasRef.current) return;
    const tCtx = topCanvasRef.current.getContext('2d');
    if (!tCtx) return;

    tCtx.clearRect(0, 0, image.width, image.height);
    tCtx.globalAlpha = opacity / 100;
    
    // Draw the mask in red
    const maskData = maskCanvasRef.current.getContext('2d')?.getImageData(0, 0, image.width, image.height);
    if (!maskData) return;
    
    const overlayData = tCtx.createImageData(image.width, image.height);
    for (let i = 0; i < maskData.data.length; i += 4) {
      // If white in mask, draw red overlay
      if (maskData.data[i] > 128) { // R channel check
        overlayData.data[i] = 255;     // R
        overlayData.data[i+1] = 0;     // G
        overlayData.data[i+2] = 0;     // B
        overlayData.data[i+3] = 255;   // A
      }
    }
    tCtx.putImageData(overlayData, 0, 0);
  }, [image.width, image.height, opacity]);

  // Update overlay whenever history changes
  useEffect(() => {
    updateOverlay();
  }, [historyIndex, updateOverlay]);

  // Update overlay if opacity changes
  useEffect(() => {
    updateOverlay();
  }, [opacity, updateOverlay]);

  const saveHistoryState = (imgData: ImageData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imgData);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onMaskChange(imgData);
  };

  const drawStroke = (x: number, y: number, isDown: boolean) => {
    if (!maskCanvasRef.current || !isDown) return;
    const mCtx = maskCanvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!mCtx) return;

    mCtx.lineCap = 'round';
    mCtx.lineJoin = 'round';
    mCtx.lineWidth = brushSize / zoom; // Adjust brush size based on zoom

    // Draw white for brush, black for eraser
    if (tool === 'brush') {
      mCtx.strokeStyle = 'white';
      mCtx.globalCompositeOperation = 'source-over';
    } else {
      mCtx.strokeStyle = 'black';
      mCtx.globalCompositeOperation = 'source-over'; // Just paint black on mask
    }

    mCtx.beginPath();
    if (lastPoint.current) {
      mCtx.moveTo(lastPoint.current.x, lastPoint.current.y);
    } else {
      mCtx.moveTo(x, y);
    }
    mCtx.lineTo(x, y);
    mCtx.stroke();
    
    lastPoint.current = { x, y };
    updateOverlay();
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!topCanvasRef.current) return { x: 0, y: 0 };
    const rect = topCanvasRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Map screen coords to original image scale
    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;
    return { x, y };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Middle mouse button or space+drag could trigger pan, but let's stick to MMB
    if ('button' in e && e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      return;
    }

    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);
    lastPoint.current = null;
    drawStroke(x, y, true);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPanning) {
      if ('movementX' in e) {
        setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
      }
      return;
    }

    const { x, y } = getCanvasCoords(e);
    setCursorPos({ x, y });

    if (isDrawing) {
      drawStroke(x, y, true);
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && maskCanvasRef.current) {
      setIsDrawing(false);
      lastPoint.current = null;
      
      const mCtx = maskCanvasRef.current.getContext('2d');
      if (mCtx) {
        const newData = mCtx.getImageData(0, 0, image.width, image.height);
        saveHistoryState(newData);
      }
    }
  };

  // Wheel to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    
    const newZoom = Math.min(Math.max(0.1, zoom * (1 + delta)), 10);
    
    // Zoom towards cursor
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
      
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid if typing in inputs
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key === '[' || e.key === '{') {
        setBrushSize(s => Math.max(1, s - 5));
      } else if (e.key === ']' || e.key === '}') {
        setBrushSize(s => Math.min(100, s + 5));
      } else if (e.key.toLowerCase() === 'b') {
        setTool('brush');
      } else if (e.key.toLowerCase() === 'e') {
        setTool('eraser');
      } else if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIndex, history]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      
      const mCtx = maskCanvasRef.current?.getContext('2d');
      if (mCtx) mCtx.putImageData(history[newIndex], 0, 0);
      onMaskChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      
      const mCtx = maskCanvasRef.current?.getContext('2d');
      if (mCtx) mCtx.putImageData(history[newIndex], 0, 0);
      onMaskChange(history[newIndex]);
    }
  };

  const handleClear = () => {
    if (!maskCanvasRef.current) return;
    const mCtx = maskCanvasRef.current.getContext('2d');
    if (mCtx) {
      mCtx.fillStyle = 'black';
      mCtx.fillRect(0, 0, image.width, image.height);
      const blank = mCtx.getImageData(0, 0, image.width, image.height);
      saveHistoryState(blank);
    }
  };

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    try {
      // Run detection
      const res = detectWatermark(image.imageData, { threshold: 0.5, minRegionSize: 10, mode: 'auto' });
      if (res.mask && maskCanvasRef.current) {
        const mCtx = maskCanvasRef.current.getContext('2d');
        if (mCtx) {
          // Add to current mask or replace? Let's replace for simplicity
          mCtx.putImageData(res.mask, 0, 0);
          saveHistoryState(res.mask);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDetecting(false);
    }
  };

  const hasMask = historyIndex > 0; // Simple check

  return (
    <div className="flex flex-col w-full h-full min-h-0 relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-20 pointer-events-auto">
        <MaskToolbar
          tool={tool}
          setTool={setTool}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          opacity={opacity}
          setOpacity={setOpacity}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onAutoDetect={handleAutoDetect}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          hasMask={hasMask}
          isDetecting={isDetecting}
        />
        <div className="mt-2 flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/75 text-white backdrop-blur-md shadow-md border border-white/10">
            <span>💡</span>
            <span>Brush <strong>only over the watermark</strong> you want to erase. Unmasked text & elements stay completely safe!</span>
          </span>
        </div>
      </div>

      <div 
        ref={containerRef}
        className={`flex-1 min-h-0 w-full bg-gray-200 dark:bg-gray-800 overflow-hidden relative select-none ${
          isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
        }`}
        onWheel={handleWheel}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* Transform container */}
        <div 
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: image.width,
            height: image.height,
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          <canvas
            ref={bottomCanvasRef}
            width={image.width}
            height={image.height}
            className="absolute top-0 left-0 w-full h-full select-none pointer-events-none shadow-xl"
          />
          <canvas
            ref={topCanvasRef}
            width={image.width}
            height={image.height}
            className="absolute top-0 left-0 w-full h-full select-none pointer-events-none opacity-80"
          />
          
          {/* Custom Cursor */}
          {cursorPos && !isPanning && (
            <div 
              className="absolute pointer-events-none border border-white rounded-full mix-blend-difference z-50 shadow-[0_0_2px_rgba(0,0,0,0.5)]"
              style={{
                width: brushSize / zoom,
                height: brushSize / zoom,
                left: cursorPos.x - (brushSize / zoom) / 2,
                top: cursorPos.y - (brushSize / zoom) / 2,
                backgroundColor: tool === 'brush' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
              }}
            />
          )}
        </div>

        {/* Zoom Indicator */}
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs font-mono backdrop-blur-sm pointer-events-none">
          {Math.round(zoom * 100)}%
        </div>
        
        {/* Pan Helper Hint */}
        {isPanning && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm pointer-events-none">
            Panning...
          </div>
        )}
      </div>
    </div>
  );
}
