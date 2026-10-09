'use client';

import React, { useState } from 'react';
import ImageWorkspace from '@/components/ImageWorkspace';
import ImageUploader from '@/components/ImageUploader';
import LandingHero from '@/components/LandingHero';
import Header from '@/components/Header';
import { LoadedImage } from '@/types';

export default function Page() {
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);

  const handleNewImage = () => {
    setLoadedImage(null);
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors ${
      loadedImage ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen'
    }`}>
      <Header onNewImage={handleNewImage} hasImage={!!loadedImage} />
      
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {!loadedImage ? (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <LandingHero onGetStarted={() => {
              document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
            }} />
            <div id="upload-section" className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Remove Watermarks & Purge SynthID
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                  Upload any image to erase visible watermarks or strip invisible Google SynthID & AI markers. 100% local, keeping text razor sharp.
                </p>
              </div>
              <ImageUploader onImageLoaded={setLoadedImage} />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 p-2 md:p-4 overflow-hidden flex flex-col">
            <ImageWorkspace image={loadedImage} />
          </div>
        )}
      </main>
    </div>
  );
}
