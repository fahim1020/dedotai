'use client';

import React from 'react';
import ThemeToggle from './ThemeToggle';
import PrivacyBadge from './PrivacyBadge';

interface HeaderProps {
  onNewImage?: () => void;
  hasImage?: boolean;
}

export default function Header({ onNewImage, hasImage }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-500">
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
              <line x1="16" x2="22" y1="5" y2="5" />
              <line x1="19" x2="19" y1="2" y2="8" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">DeWatermark</span>
          </div>
          <div className="hidden sm:block">
            <PrivacyBadge />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {hasImage && onNewImage && (
            <button
              onClick={onNewImage}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              New Image
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
