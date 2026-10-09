'use client';

import React from 'react';
import { MaskTool } from '@/types';

interface MaskToolbarProps {
  tool: MaskTool;
  setTool: (tool: MaskTool) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onAutoDetect: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasMask: boolean;
  isDetecting?: boolean;
}

export default function MaskToolbar({
  tool,
  setTool,
  brushSize,
  setBrushSize,
  opacity,
  setOpacity,
  onUndo,
  onRedo,
  onClear,
  onAutoDetect,
  canUndo,
  canRedo,
  hasMask,
  isDetecting = false
}: MaskToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm z-10 w-full max-w-full overflow-x-auto">
      
      {/* Tools */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg shrink-0">
        <button
          onClick={() => setTool('brush')}
          className={`p-2 rounded-md flex items-center justify-center transition-colors ${
            tool === 'brush' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          title="Brush (B)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-md flex items-center justify-center transition-colors ${
            tool === 'eraser' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          title="Eraser (E)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
        </button>
      </div>

      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 shrink-0" />

      {/* Brush Size */}
      <div className="flex items-center gap-3 shrink-0 min-w-[140px]">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8" title="Size ([ and ])">Size</label>
        <input
          type="range"
          min="1"
          max="100"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div 
          className="shrink-0 rounded-full bg-blue-600 dark:bg-blue-500"
          style={{ width: `${Math.min(24, Math.max(4, brushSize / 4))}px`, height: `${Math.min(24, Math.max(4, brushSize / 4))}px` }}
        />
      </div>

      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 shrink-0 hidden sm:block" />

      {/* Opacity */}
      <div className="hidden sm:flex items-center gap-3 shrink-0 min-w-[120px]">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Opacity</label>
        <input
          type="range"
          min="30"
          max="100"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 shrink-0" />

      {/* History & Clear */}
      <div className="flex gap-1 shrink-0">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
        </button>
        <button
          onClick={onClear}
          disabled={!hasMask}
          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-1"
          title="Clear Mask"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
        </button>
      </div>

      <div className="flex-grow" />

      {/* Auto Detect */}
      <button
        onClick={onAutoDetect}
        disabled={isDetecting}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors shrink-0 border border-blue-200 dark:border-blue-800"
      >
        {isDetecting ? (
          <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 dark:border-blue-400/30 dark:border-t-blue-400 rounded-full animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
        )}
        Auto Detect
      </button>

    </div>
  );
}
