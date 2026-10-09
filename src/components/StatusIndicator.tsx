'use client';

import React from 'react';
import { useCapabilities } from '@/hooks/useCapabilities';

export default function StatusIndicator() {
  const { capabilities, isDetecting } = useCapabilities();

  if (isDetecting || !capabilities) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
        Detecting capabilities...
      </div>
    );
  }

  const getBackendColor = () => {
    switch (capabilities.backend) {
      case 'webgpu':
        return 'bg-green-500';
      case 'wasm':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBackendLabel = () => {
    switch (capabilities.backend) {
      case 'webgpu':
        return 'WebGPU';
      case 'wasm':
        return 'WASM Fallback';
      default:
        return 'CPU';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getBackendColor()}`} />
        <span>{getBackendLabel()}</span>
      </div>
      <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
      <div className="flex items-center gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        <span>ONNX Runtime Web</span>
      </div>
      <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
      <div className="flex items-center gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        <span>Local Processing</span>
      </div>
    </div>
  );
}
