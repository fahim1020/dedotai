'use client';

import React, { useCallback, useState, useRef } from 'react';
import { LoadedImage } from '@/types';
import { useImageLoader } from '@/hooks/useImageLoader';

interface ImageUploaderProps {
  onImageLoaded: (image: LoadedImage) => void;
}

export default function ImageUploader({ onImageLoaded }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadImage, isLoading, error } = useImageLoader();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleProcessFile = useCallback(async (file: File) => {
    const loaded = await loadImage(file);
    if (loaded) {
      onImageLoaded(loaded);
    }
  }, [loadImage, onImageLoaded]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleProcessFile(e.dataTransfer.files[0]);
    }
  }, [handleProcessFile]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleProcessFile(e.target.files[0]);
    }
  }, [handleProcessFile]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          await handleProcessFile(file);
          break;
        }
      }
    }
  }, [handleProcessFile]);

  const handleLoadSampleImage = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw rich gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 900, 600);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 900, 600);

    // Decorative grid
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 900; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let y = 0; y < 600; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(900, y);
      ctx.stroke();
    }

    // Badge
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.roundRect(80, 60, 180, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('GOOGLE GEMINI AI', 105, 83);

    // Main title typography
    ctx.font = 'bold 42px sans-serif';
    const textGrad = ctx.createLinearGradient(80, 145, 600, 145);
    textGrad.addColorStop(0, '#ffffff');
    textGrad.addColorStop(1, '#93c5fd');
    ctx.fillStyle = textGrad;
    ctx.fillText('SynthID Watermark Test', 80, 145);

    // Subtitle
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('High-contrast typography & code for text clarity and watermark verification.', 80, 190);

    // Code block container
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(80, 230, 740, 220, 16);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    ctx.font = '16px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('import { sanitizeInvisibleWatermarks } from "./synthid-neutralizer";', 110, 275);
    ctx.fillStyle = '#a855f7';
    ctx.fillText('// STEP: Selective Text & Edge Protection (Zero Bilinear Blur)', 110, 315);
    ctx.fillStyle = '#4ade80';
    ctx.fillText('const cleaned = sanitizeInvisibleWatermarks(imageData, {', 110, 355);
    ctx.fillText('  engine: "spectral-neural", textEnhance: "ultra"', 130, 385);
    ctx.fillText('});', 110, 415);

    // Watermark badge in corner
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(810, 520, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('✨', 800, 526);

    const dataUrl = canvas.toDataURL('image/png');
    const img = new Image();
    img.onload = () => {
      const imageData = ctx.getImageData(0, 0, 900, 600);
      onImageLoaded({
        original: img,
        imageData,
        width: 900,
        height: 600,
        fileName: 'synthid_sample_benchmark.png',
        fileSize: 45000,
        format: 'png',
      });
    };
    img.src = dataUrl;
  }, [onImageLoaded]);

  return (
    <div 
      className="w-full max-w-2xl mx-auto my-8 outline-none"
      onPaste={handlePaste}
      tabIndex={0}
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center w-full h-80 px-6 py-10 transition-all border-2 border-dashed rounded-2xl cursor-pointer group ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="image/png, image/jpeg, image/jpg, image/webp, .png, .jpg, .jpeg, .webp"
          className="hidden"
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin dark:border-blue-900 dark:border-t-blue-400" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Processing image...</p>
          </div>
        ) : (
          <>
            <div className={`p-4 mb-4 rounded-full bg-white dark:bg-gray-900 shadow-sm transition-transform ${isDragging ? 'scale-110' : 'group-hover:scale-105'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
            </div>
            <p className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-200 text-center">
              Drop your image here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              or click to browse • You can also paste an image
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">PNG, JPEG, WebP</span>
              <span className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">Up to 50MB</span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/60 w-full flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSampleImage();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-full border border-blue-200 dark:border-blue-800 transition-colors shadow-xs"
              >
                <span>⚡</span>
                <span>Try Sample Image with Text & SynthID</span>
              </button>
            </div>
          </>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-4 text-sm text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
