export function createCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');
  return { canvas, ctx };
}

export function imageDataFromCanvas(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function canvasFromImageData(imageData: ImageData): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(imageData.width, imageData.height);
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function resizeImageData(imageData: ImageData, targetW: number, targetH: number): ImageData {
  const { canvas, ctx } = createCanvas(targetW, targetH);
  const srcCanvas = canvasFromImageData(imageData);
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(srcCanvas, 0, 0, targetW, targetH);
  
  return ctx.getImageData(0, 0, targetW, targetH);
}

export function imageDataToFloat32(imageData: ImageData, normalize: boolean = true): Float32Array {
  const { width, height, data } = imageData;
  const numPixels = width * height;
  const float32 = new Float32Array(numPixels * 3);
  
  const scale = normalize ? 255.0 : 1.0;
  
  // CHW format
  for (let i = 0; i < numPixels; i++) {
    float32[i] = data[i * 4] / scale;                   // R
    float32[numPixels + i] = data[i * 4 + 1] / scale;   // G
    float32[numPixels * 2 + i] = data[i * 4 + 2] / scale; // B
  }
  
  return float32;
}

export function float32ToImageData(data: Float32Array, w: number, h: number, channels: number): ImageData {
  const imageData = new ImageData(w, h);
  const numPixels = w * h;
  
  if (channels === 3) {
    // Assume CHW format
    for (let i = 0; i < numPixels; i++) {
      imageData.data[i * 4] = Math.max(0, Math.min(255, Math.round(data[i] * 255)));
      imageData.data[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(data[numPixels + i] * 255)));
      imageData.data[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(data[numPixels * 2 + i] * 255)));
      imageData.data[i * 4 + 3] = 255;
    }
  } else if (channels === 1) {
    for (let i = 0; i < numPixels; i++) {
      const val = Math.max(0, Math.min(255, Math.round(data[i] * 255)));
      imageData.data[i * 4] = val;
      imageData.data[i * 4 + 1] = val;
      imageData.data[i * 4 + 2] = val;
      imageData.data[i * 4 + 3] = 255;
    }
  } else {
    throw new Error(`Unsupported number of channels: ${channels}`);
  }
  
  return imageData;
}

export function compositeImages(base: ImageData, overlay: ImageData, mask: ImageData): ImageData {
  const result = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height);
  
  for (let i = 0; i < mask.data.length; i += 4) {
    const maskVal = mask.data[i] / 255.0; // Assume grayscale mask
    if (maskVal > 0) {
      result.data[i] = Math.round(base.data[i] * (1 - maskVal) + overlay.data[i] * maskVal);
      result.data[i + 1] = Math.round(base.data[i + 1] * (1 - maskVal) + overlay.data[i + 1] * maskVal);
      result.data[i + 2] = Math.round(base.data[i + 2] * (1 - maskVal) + overlay.data[i + 2] * maskVal);
      result.data[i + 3] = 255;
    }
  }
  
  return result;
}

export function getMaskBoundingBox(mask: ImageData): { x: number; y: number; w: number; h: number } | null {
  const { width, height, data } = mask;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx] > 0) { // White pixel
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        found = true;
      }
    }
  }

  if (!found) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
