'use client';

import React from 'react';
import { ProcessingState } from '@/types';

interface ProcessingStatusProps {
  state: ProcessingState;
  onCancel?: () => void;
}

export default function ProcessingStatus({ state, onCancel }: ProcessingStatusProps) {
  if (state.stage === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center text-center">
          
          {state.stage === 'error' ? (
            <div className="w-16 h-16 mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
          ) : state.stage === 'complete' ? (
            <div className="w-16 h-16 mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
          ) : (
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
              <div 
                className="absolute inset-0 border-4 border-blue-600 dark:border-blue-500 rounded-full border-t-transparent animate-spin"
                style={{ 
                  transform: state.progress > 0 ? `rotate(${state.progress * 3.6}deg)` : undefined 
                }}
              ></div>
              {state.progress > 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {Math.round(state.progress)}%
                </div>
              )}
            </div>
          )}

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {state.stage === 'error' ? 'Processing Failed' : 
             state.stage === 'complete' ? 'Processing Complete' : 
             'Removing Watermark...'}
          </h3>
          
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-[280px]">
            {state.error || state.message}
          </p>

          {state.progress > 0 && state.stage !== 'error' && state.stage !== 'complete' && (
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${state.progress}%` }}
              ></div>
            </div>
          )}

          {state.stage !== 'complete' && onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              {state.stage === 'error' ? 'Close' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
