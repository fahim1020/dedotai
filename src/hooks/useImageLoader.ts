import { useState, useCallback } from 'react';
import { LoadedImage } from '@/types';
import { validateFile } from '@/utils/file-validation';

export function useImageLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImage = useCallback(async (file: File): Promise<LoadedImage | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const validation = await validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid image file');
      }

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                throw new Error('Could not get canvas context');
              }
              
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              // Get format from mime type or extension
              let format: 'png' | 'jpeg' | 'webp' = 'jpeg';
              if (file.type === 'image/png' || /\.png$/i.test(file.name)) format = 'png';
              else if (file.type === 'image/webp' || /\.webp$/i.test(file.name)) format = 'webp';
              
              resolve({
                original: img,
                imageData,
                width: img.width,
                height: img.height,
                fileName: file.name,
                fileSize: file.size,
                format
              });
            } catch (err) {
              reject(err);
            }
          };
          
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target?.result as string;
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading image';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { loadImage, isLoading, error };
}
