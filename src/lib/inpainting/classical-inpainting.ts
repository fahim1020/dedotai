import { InpaintingInput, InpaintingResult } from '@/types';

export async function classicalInpaint(
  input: InpaintingInput,
  options?: { iterations?: number; onProgress?: (p: number) => void }
): Promise<InpaintingResult> {
  const startTime = performance.now();
  const { image, mask } = input;
  const { width, height } = image;
  const numPixels = width * height;

  const resultData = new Uint8ClampedArray(image.data);
  const maskState = new Uint8Array(numPixels);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let unknownCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask.data[idx * 4] > 128) {
        maskState[idx] = 1;
        unknownCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      } else {
        maskState[idx] = 0;
      }
    }
  }

  const totalUnknown = unknownCount;
  if (totalUnknown === 0) {
    return {
      image: new ImageData(resultData, width, height),
      processingTimeMs: performance.now() - startTime,
    };
  }

  // Add margin around bounding box to capture surrounding texture and gradients
  const pad = 24;
  const bMinX = Math.max(1, minX - pad);
  const bMinY = Math.max(1, minY - pad);
  const bMaxX = Math.min(width - 2, maxX + pad);
  const bMaxY = Math.min(height - 2, maxY + pad);

  // Compute local variance / texture grain from known boundary pixels
  let textureVariance = 0;
  let sampleCount = 0;
  for (let y = bMinY; y <= bMaxY; y += 2) {
    for (let x = bMinX; x <= bMaxX; x += 2) {
      const idx = y * width + x;
      if (maskState[idx] === 0) {
        const rDiff = Math.abs(resultData[idx * 4] - resultData[(idx + 1) * 4]);
        const gDiff = Math.abs(resultData[idx * 4 + 1] - resultData[(idx + 1) * 4 + 1]);
        const bDiff = Math.abs(resultData[idx * 4 + 2] - resultData[(idx + 1) * 4 + 2]);
        textureVariance += (rDiff + gDiff + bDiff) / 3;
        sampleCount++;
      }
    }
  }
  const avgNoise = sampleCount > 0 ? Math.min(6, textureVariance / sampleCount) : 0;

  const maxIterations = options?.iterations || 120;
  let currentIter = 0;
  const searchRadius = 4;

  while (unknownCount > 0 && currentIter < maxIterations) {
    currentIter++;
    let pixelsProcessedThisIter = 0;

    const tempResult = new Uint8ClampedArray(resultData);
    const tempMask = new Uint8Array(maskState);

    // Scan bounding box for frontier pixels (unknown pixels bordering known pixels)
    for (let y = bMinY; y <= bMaxY; y++) {
      for (let x = bMinX; x <= bMaxX; x++) {
        const idx = y * width + x;
        if (maskState[idx] === 1) {
          let hasKnownNeighbor = false;
          // Quick 4-neighbor check to see if this pixel is on the fill frontier
          if (
            maskState[idx - 1] === 0 ||
            maskState[idx + 1] === 0 ||
            maskState[idx - width] === 0 ||
            maskState[idx + width] === 0
          ) {
            hasKnownNeighbor = true;
          }

          if (!hasKnownNeighbor) continue;

          let rSum = 0;
          let gSum = 0;
          let bSum = 0;
          let weightSum = 0;

          // Multi-radius gradient-extrapolating neighborhood
          for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= height) continue;

            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              if (nx < 0 || nx >= width) continue;

              const nIdx = ny * width + nx;
              if (maskState[nIdx] === 0) {
                const distSq = dx * dx + dy * dy;
                if (distSq > searchRadius * searchRadius) continue;

                const dist = Math.sqrt(distSq);

                // Compute color gradient at the known neighbor to extrapolate into hole
                const rightIdx = nx < width - 1 ? nIdx + 1 : nIdx;
                const leftIdx = nx > 0 ? nIdx - 1 : nIdx;
                const downIdx = ny < height - 1 ? nIdx + width : nIdx;
                const upIdx = ny > 0 ? nIdx - width : nIdx;

                const gxR = (resultData[rightIdx * 4] - resultData[leftIdx * 4]) * 0.5;
                const gyR = (resultData[downIdx * 4] - resultData[upIdx * 4]) * 0.5;

                const gxG = (resultData[rightIdx * 4 + 1] - resultData[leftIdx * 4 + 1]) * 0.5;
                const gyG = (resultData[downIdx * 4 + 1] - resultData[upIdx * 4 + 1]) * 0.5;

                const gxB = (resultData[rightIdx * 4 + 2] - resultData[leftIdx * 4 + 2]) * 0.5;
                const gyB = (resultData[downIdx * 4 + 2] - resultData[upIdx * 4 + 2]) * 0.5;

                // First-order Taylor extrapolation along displacement vector (-dx, -dy)
                const dispX = -dx;
                const dispY = -dy;

                const predR = Math.min(255, Math.max(0, resultData[nIdx * 4] + gxR * dispX + gyR * dispY));
                const predG = Math.min(255, Math.max(0, resultData[nIdx * 4 + 1] + gxG * dispX + gyG * dispY));
                const predB = Math.min(255, Math.max(0, resultData[nIdx * 4 + 2] + gxB * dispX + gyB * dispY));

                // Weight based on inverse distance and gradient alignment
                const w = 1.0 / (dist * dist + 0.1);

                rSum += predR * w;
                gSum += predG * w;
                bSum += predB * w;
                weightSum += w;
              }
            }
          }

          if (weightSum > 0) {
            // Add subtle micro-grain to avoid flat plastic blur on textured backgrounds
            const grain = avgNoise > 0 ? (Math.random() - 0.5) * avgNoise : 0;

            tempResult[idx * 4] = Math.min(255, Math.max(0, Math.round(rSum / weightSum + grain)));
            tempResult[idx * 4 + 1] = Math.min(255, Math.max(0, Math.round(gSum / weightSum + grain)));
            tempResult[idx * 4 + 2] = Math.min(255, Math.max(0, Math.round(bSum / weightSum + grain)));
            tempResult[idx * 4 + 3] = 255;

            tempMask[idx] = 0;
            pixelsProcessedThisIter++;
          }
        }
      }
    }

    resultData.set(tempResult);
    maskState.set(tempMask);
    unknownCount -= pixelsProcessedThisIter;

    if (pixelsProcessedThisIter === 0) break;

    if (options?.onProgress) {
      options.onProgress(Math.min(95, Math.round(((totalUnknown - unknownCount) / totalUnknown) * 100)));
    }

    // Yield every 3 iterations to keep UI responsive
    if (currentIter % 3 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return {
    image: new ImageData(resultData, width, height),
    processingTimeMs: performance.now() - startTime,
  };
}
