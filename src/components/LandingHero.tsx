import React from 'react';
import StatusIndicator from './StatusIndicator';
import PrivacyBadge from './PrivacyBadge';

interface LandingHeroProps {
  onGetStarted: () => void;
}

export default function LandingHero({ onGetStarted }: LandingHeroProps) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-950 pt-16 pb-24 lg:pt-24 lg:pb-32">
      {/* Background gradients */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-200 to-indigo-400 dark:from-blue-800 dark:to-indigo-900 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <PrivacyBadge />
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl mb-6">
            Erase Watermarks &<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Cleanse SynthID AI.
            </span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Erase visible logos or strip imperceptible Google SynthID & AI watermarks directly in your browser. 100% private on-device processing while keeping all text & typography razor sharp.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button
              onClick={onGetStarted}
              className="rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              Get Started
            </button>
            <a href="#how-it-works" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white group">
              Learn more <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>
          
          <div className="mt-12 flex justify-center">
            <StatusIndicator />
          </div>
        </div>
        
        <div className="mx-auto mt-20 max-w-5xl sm:mt-24 lg:mt-32">
          <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-x-8">
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">100% Local & Private</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">All processing runs directly in your browser. Zero uploads, zero tracking, no server storage.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">SOTA SynthID Neutralizer</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sub-pixel elastic phase scrambling & 8x8 DCT AC carrier decorrelation disarm AI detectors.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 7 4-4 4 4"/><path d="M8 3v12"/><path d="m20 17-4 4-4-4"/><path d="M16 21V9"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">STEP Razor-Sharp Text</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Catmull-Rom sampling & Laplacian high-pass boost guarantee fonts, code, and UI stay crystal clear.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
