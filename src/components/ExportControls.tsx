'use client';

import React, { useState, useEffect } from 'react';
import { exportImage, downloadImage, generateFilename } from '@/lib/export/export';
import { formatFileSize } from '@/utils/format';
import { ImageFormat } from '@/types';

interface ExportControlsProps {
  resultImage: ImageData;
  originalFileName: string;
}

export default function ExportControls({ resultImage, originalFileName }: ExportControlsProps) {
  const [format, setFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(90);
  const [preserveTransparency, setPreserveTransparency] = useState(true);
  const [stripAiWatermarks, setStripAiWatermarks] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);

  useEffect(() => {
    // Determine default format based on original filename if possible
    const ext = originalFileName.split('.').pop()?.toLowerCase();
    if (ext === 'png') setFormat('png');
    else if (ext === 'webp') setFormat('webp');
    else setFormat('jpeg');
  }, [originalFileName]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportImage(resultImage, {
        format,
        quality: quality / 100,
        preserveTransparency,
        stripAiWatermarks,
        alreadySanitized: true
      });
      
      const filename = generateFilename(originalFileName, format);
      downloadImage(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export image.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4 py-2.5 px-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-md">
      {/* Format Selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Format</span>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {(['jpeg', 'png', 'webp'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`py-1 px-3 text-xs font-semibold rounded-md transition-colors ${
                format === f 
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {format === 'png' && (
          <label className="flex items-center gap-2 cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={preserveTransparency}
              onChange={(e) => setPreserveTransparency(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600"
            />
            <span className="text-xs text-gray-600 dark:text-gray-300">Transparency</span>
          </label>
        )}
      </div>

      {/* Quality Slider (for JPEG / WEBP) */}
      {(format === 'jpeg' || format === 'webp') && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Quality</span>
          <input
            type="range"
            min="30"
            max="100"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs font-mono text-gray-500 w-8">{quality}%</span>
        </div>
      )}

      {/* Auto-Strip SynthID / AI Watermarks Toggle */}
      <label 
        className="flex items-center gap-1.5 cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
        title="Disrupts invisible SynthID and AI frequency watermarks via phase-shift resampling and edge-preserving bilateral filtering"
      >
        <input
          type="checkbox"
          checked={stripAiWatermarks}
          onChange={(e) => setStripAiWatermarks(e.target.checked)}
          className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 dark:border-gray-600"
        />
        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 select-none">
          <span>🛡️</span>
          <span>Strip SynthID / AI Watermark</span>
        </span>
      </label>

      {/* Download Action */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-gray-400 hidden sm:inline">
          {resultImage.width} × {resultImage.height}px
        </span>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-full shadow-sm transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          )}
          Download Result
        </button>
      </div>
    </div>
  );
}
