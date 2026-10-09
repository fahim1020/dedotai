import { createCanvas, canvasFromImageData } from '@/lib/canvas/utils';

export function preprocessForDetection(imageData: ImageData, targetSize: [number, number]): { processed: ImageData; scale: { x: number; y: number } } {
  const [targetW, targetH] = targetSize;
  const { width, height } = imageData;
  
  const scale = Math.min(targetW / width, targetH / height);
  const newW = Math.round(width * scale);
  const newH = Math.round(height * scale);
  
  const { canvas, ctx } = createCanvas(targetW, targetH);
  const srcCanvas = canvasFromImageData(imageData);
  
  // Pad with zeros (black)
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, targetW, targetH);
  
  const offsetX = Math.round((targetW - newW) / 2);
  const offsetY = Math.round((targetH - newH) / 2);
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(srcCanvas, offsetX, offsetY, newW, newH);
  
  return {
    processed: ctx.getImageData(0, 0, targetW, targetH),
    scale: { x: targetW / width, y: targetH / height }
  };
}

export function preprocessForInpainting(
  image: ImageData, 
  mask: ImageData, 
  targetSize: [number, number]
): { processedImage: ImageData; processedMask: ImageData; scale: { x: number; y: number } } {
  const [targetW, targetH] = targetSize;
  
  const { canvas: imgCanvas, ctx: imgCtx } = createCanvas(targetW, targetH);
  const { canvas: maskCanvas, ctx: maskCtx } = createCanvas(targetW, targetH);
  
  const srcImgCanvas = canvasFromImageData(image);
  const srcMaskCanvas = canvasFromImageData(mask);
  
  imgCtx.imageSmoothingEnabled = true;
  imgCtx.imageSmoothingQuality = 'high';
  imgCtx.drawImage(srcImgCanvas, 0, 0, targetW, targetH);
  
  maskCtx.imageSmoothingEnabled = false; // Nearest neighbor for masks usually better
  maskCtx.drawImage(srcMaskCanvas, 0, 0, targetW, targetH);
  
  return {
    processedImage: imgCtx.getImageData(0, 0, targetW, targetH),
    processedMask: maskCtx.getImageData(0, 0, targetW, targetH),
    scale: { x: targetW / image.width, y: targetH / image.height }
  };
}

export function normalizeImageData(imageData: ImageData): Float32Array {
  const { width, height, data } = imageData;
  const numPixels = width * height;
  const float32 = new Float32Array(numPixels * 3);
  
  for (let i = 0; i < numPixels; i++) {
    float32[i] = data[i * 4] / 255.0;                   // R
    float32[numPixels + i] = data[i * 4 + 1] / 255.0;   // G
    float32[numPixels * 2 + i] = data[i * 4 + 2] / 255.0; // B
  }
  
  return float32;
}

export function normalizeMask(mask: ImageData): Float32Array {
  const { width, height, data } = mask;
  const numPixels = width * height;
  const float32 = new Float32Array(numPixels);
  
  for (let i = 0; i < numPixels; i++) {
    float32[i] = data[i * 4] > 127 ? 1.0 : 0.0;
  }
  
  return float32;
}
