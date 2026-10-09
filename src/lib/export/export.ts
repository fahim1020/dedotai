import { ExportOptions, ImageFormat } from '@/types';
import { canvasFromImageData } from '@/lib/canvas/utils';
import { sanitizeInvisibleWatermarks } from '@/lib/image/synthid-neutralizer';

export async function exportImage(imageData: ImageData, options: ExportOptions): Promise<Blob> {
  const shouldSanitize = options.stripAiWatermarks !== false && !options.alreadySanitized;
  const processedData = shouldSanitize 
    ? sanitizeInvisibleWatermarks(imageData) 
    : imageData;

  const canvas = canvasFromImageData(processedData);
  
  let mimeType = 'image/png';
  if (options.format === 'jpeg') mimeType = 'image/jpeg';
  else if (options.format === 'webp') mimeType = 'image/webp';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image blob'));
      },
      mimeType,
      options.quality
    );
  });
}

export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateFilename(originalName: string, format: ImageFormat): string {
  const lastDot = originalName.lastIndexOf('.');
  const baseName = lastDot === -1 ? originalName : originalName.slice(0, lastDot);
  return `${baseName}_dewatermarked.${format}`;
}
