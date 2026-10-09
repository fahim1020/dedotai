import { DetectionOptions, DetectionResult } from '@/types';

export function detectWatermark(imageData: ImageData, options: DetectionOptions): DetectionResult {
  const { width, height, data } = imageData;
  const numPixels = width * height;
  
  // 1. Convert to grayscale
  const gray = new Float32Array(numPixels);
  for (let i = 0; i < numPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  
  // 2. Edge detection (Sobel)
  const edges = new Float32Array(numPixels);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      const gx = 
        -1 * gray[idx - width - 1] + 1 * gray[idx - width + 1] +
        -2 * gray[idx - 1]         + 2 * gray[idx + 1] +
        -1 * gray[idx + width - 1] + 1 * gray[idx + width + 1];
        
      const gy = 
        -1 * gray[idx - width - 1] - 2 * gray[idx - width] - 1 * gray[idx - width + 1] +
         1 * gray[idx + width - 1] + 2 * gray[idx + width] + 1 * gray[idx + width + 1];
         
      edges[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // 3. Watermark Likelihood Weighting
  // Watermarks typically appear in corners (bottom-right/left, top-right/left)
  // or outer margins, rather than occupying the main center of the composition.
  const weightedScores = new Float32Array(numPixels);
  for (let y = 0; y < height; y++) {
    const normY = y / height;
    const isNearTop = normY < 0.15;
    const isNearBottom = normY > 0.80;
    
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const normX = x / width;
      const isNearLeft = normX < 0.18;
      const isNearRight = normX > 0.82;
      
      let spatialFactor = 0.05; // Suppress main subject/center text
      
      if ((isNearBottom && isNearRight) || (isNearBottom && isNearLeft)) {
        spatialFactor = 1.0; // Most common watermark position
      } else if ((isNearTop && isNearRight) || (isNearTop && isNearLeft)) {
        spatialFactor = 0.85;
      } else if (isNearBottom) {
        spatialFactor = 0.65;
      } else if (isNearTop || isNearLeft || isNearRight) {
        spatialFactor = 0.35;
      }

      weightedScores[idx] = edges[idx] * spatialFactor;
    }
  }
  
  // 4. Thresholding based on weighted scores
  const threshold = options.threshold ?? 0.5;
  const baseCutoff = 255 * threshold * 1.5;
  
  let candidates: number[] = [];
  for (let i = 0; i < numPixels; i++) {
    if (weightedScores[i] > baseCutoff) {
      candidates.push(i);
    }
  }

  // Safety cap: Watermarks rarely exceed 5% of the total image area.
  const maxAllowedPixels = Math.floor(numPixels * 0.04);
  if (candidates.length > maxAllowedPixels) {
    const scoreMap = candidates.map(idx => ({ idx, score: weightedScores[idx] }));
    scoreMap.sort((a, b) => b.score - a.score);
    candidates = scoreMap.slice(0, maxAllowedPixels).map(c => c.idx);
  }

  const mask = new ImageData(width, height);
  for (const idx of candidates) {
    mask.data[idx * 4] = 255;
    mask.data[idx * 4 + 1] = 255;
    mask.data[idx * 4 + 2] = 255;
    mask.data[idx * 4 + 3] = 255;
  }
  
  // 5. Morphological Dilation to connect letter strokes
  const dilatedMask = new ImageData(width, height);
  const radius = 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let isWhite = false;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            if (mask.data[(ny * width + nx) * 4] === 255) {
              isWhite = true;
              break;
            }
          }
        }
        if (isWhite) break;
      }
      
      const idx = (y * width + x) * 4;
      if (isWhite) {
        dilatedMask.data[idx] = 255;
        dilatedMask.data[idx + 1] = 255;
        dilatedMask.data[idx + 2] = 255;
        dilatedMask.data[idx + 3] = 255;
      } else {
        dilatedMask.data[idx] = 0;
        dilatedMask.data[idx + 1] = 0;
        dilatedMask.data[idx + 2] = 0;
        dilatedMask.data[idx + 3] = 255;
      }
    }
  }

  return {
    mask: dilatedMask,
    confidence: candidates.length / Math.max(1, maxAllowedPixels),
    regions: [],
  };
}

export function adjustDetectionThreshold(existingMask: ImageData, baseData: Float32Array, threshold: number): ImageData {
  // A real implementation would reuse the computed edge map (baseData).
  // For this API, we assume baseData is the raw edge map.
  const { width, height } = existingMask;
  const newMask = new ImageData(width, height);
  const edgeThreshold = 255 * threshold * 2;
  
  for (let i = 0; i < width * height; i++) {
    if (baseData[i] > edgeThreshold) {
      newMask.data[i * 4] = 255;
      newMask.data[i * 4 + 1] = 255;
      newMask.data[i * 4 + 2] = 255;
      newMask.data[i * 4 + 3] = 255;
    } else {
      newMask.data[i * 4] = 0;
      newMask.data[i * 4 + 1] = 0;
      newMask.data[i * 4 + 2] = 0;
      newMask.data[i * 4 + 3] = 255;
    }
  }
  
  return newMask;
}
