import { ModelOutput } from '@/types';
import { createCanvas, canvasFromImageData } from '@/lib/canvas/utils';

export function postprocessResult(result: ModelOutput, originalWidth: number, originalHeight: number): ImageData {
  const { data, width, height, channels } = result;

  // Convert ModelOutput to ImageData
  const srcImageData = new ImageData(width, height);
  if (channels === 3) {
    for (let i = 0; i < width * height; i++) {
      srcImageData.data[i * 4] = Math.min(255, Math.max(0, (data[i] || 0) * 255));
      srcImageData.data[i * 4 + 1] = Math.min(255, Math.max(0, (data[i + width * height] || 0) * 255));
      srcImageData.data[i * 4 + 2] = Math.min(255, Math.max(0, (data[i + 2 * width * height] || 0) * 255));
      srcImageData.data[i * 4 + 3] = 255;
    }
  } else if (channels === 4) {
    for (let i = 0; i < width * height; i++) {
      srcImageData.data[i * 4] = Math.min(255, Math.max(0, data[i * 4] || 0));
      srcImageData.data[i * 4 + 1] = Math.min(255, Math.max(0, data[i * 4 + 1] || 0));
      srcImageData.data[i * 4 + 2] = Math.min(255, Math.max(0, data[i * 4 + 2] || 0));
      srcImageData.data[i * 4 + 3] = Math.min(255, Math.max(0, data[i * 4 + 3] || 0));
    }
  } else {
    // Single channel - grayscale
    for (let i = 0; i < width * height; i++) {
      const v = Math.min(255, Math.max(0, (data[i] || 0) * 255));
      srcImageData.data[i * 4] = v;
      srcImageData.data[i * 4 + 1] = v;
      srcImageData.data[i * 4 + 2] = v;
      srcImageData.data[i * 4 + 3] = 255;
    }
  }

  // Resize to original dimensions
  const srcCanvas = canvasFromImageData(srcImageData);
  const { canvas, ctx } = createCanvas(originalWidth, originalHeight);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(srcCanvas, 0, 0, originalWidth, originalHeight);

  return ctx.getImageData(0, 0, originalWidth, originalHeight);
}

export function blendResult(original: ImageData, result: ImageData, mask: ImageData, featherRadius: number = 2): ImageData {
  const blended = new ImageData(new Uint8ClampedArray(original.data), original.width, original.height);

  const blurredMask = featherRadius > 0 ? applyBoxBlur(mask, featherRadius) : mask;

  for (let i = 0; i < blended.data.length; i += 4) {
    // Only blend pixels that were actually part of the user's mask.
    // Never allow feathering to bleed outside the mask into legitimate text/details!
    if (mask.data[i] > 10) {
      const alpha = Math.min(1, Math.max(0, blurredMask.data[i] / 255.0));
      blended.data[i] = Math.round(original.data[i] * (1 - alpha) + result.data[i] * alpha);
      blended.data[i + 1] = Math.round(original.data[i + 1] * (1 - alpha) + result.data[i + 1] * alpha);
      blended.data[i + 2] = Math.round(original.data[i + 2] * (1 - alpha) + result.data[i + 2] * alpha);
    }
  }

  return blended;
}

function applyBoxBlur(imageData: ImageData, radius: number): ImageData {
  const { width, height, data } = imageData;
  const result = new ImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += data[(ny * width + nx) * 4];
            count++;
          }
        }
      }

      const avg = sum / count;
      const idx = (y * width + x) * 4;
      result.data[idx] = avg;
      result.data[idx + 1] = avg;
      result.data[idx + 2] = avg;
      result.data[idx + 3] = 255;
    }
  }

  return result;
}

export function adjustBrightness(imageData: ImageData, factor: number): ImageData {
  const result = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  for (let i = 0; i < result.data.length; i += 4) {
    result.data[i] = Math.min(255, Math.max(0, result.data[i] + factor));
    result.data[i + 1] = Math.min(255, Math.max(0, result.data[i + 1] + factor));
    result.data[i + 2] = Math.min(255, Math.max(0, result.data[i + 2] + factor));
  }
  return result;
}

export function adjustContrast(imageData: ImageData, factor: number): ImageData {
  const result = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  const f = (259 * (factor + 255)) / (255 * (259 - factor));
  for (let i = 0; i < result.data.length; i += 4) {
    result.data[i] = Math.min(255, Math.max(0, f * (result.data[i] - 128) + 128));
    result.data[i + 1] = Math.min(255, Math.max(0, f * (result.data[i + 1] - 128) + 128));
    result.data[i + 2] = Math.min(255, Math.max(0, f * (result.data[i + 2] - 128) + 128));
  }
  return result;
}
