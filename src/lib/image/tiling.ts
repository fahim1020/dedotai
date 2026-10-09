import { TilingConfig } from '@/types';
import { createCanvas, canvasFromImageData } from '@/lib/canvas/utils';

export interface Tile {
  x: number;
  y: number;
  width: number;
  height: number;
  imageData: ImageData;
  maskData: ImageData;
}

export function createTiles(image: ImageData, mask: ImageData, config: TilingConfig): Tile[] {
  const tiles: Tile[] = [];
  const { tileSize, overlap } = config;
  const step = tileSize - overlap;
  
  const imgCanvas = canvasFromImageData(image);
  const imgCtx = imgCanvas.getContext('2d')!;
  
  const maskCanvas = canvasFromImageData(mask);
  const maskCtx = maskCanvas.getContext('2d')!;

  for (let y = 0; y < image.height; y += step) {
    for (let x = 0; x < image.width; x += step) {
      // Ensure we don't go out of bounds
      const actualX = Math.min(x, Math.max(0, image.width - tileSize));
      const actualY = Math.min(y, Math.max(0, image.height - tileSize));
      
      const w = Math.min(tileSize, image.width - actualX);
      const h = Math.min(tileSize, image.height - actualY);
      
      const tileMaskData = maskCtx.getImageData(actualX, actualY, w, h);
      
      // Check if tile has any masked pixels
      let hasMask = false;
      for (let i = 0; i < tileMaskData.data.length; i += 4) {
        if (tileMaskData.data[i] > 0) {
          hasMask = true;
          break;
        }
      }
      
      if (hasMask) {
        const tileImageData = imgCtx.getImageData(actualX, actualY, w, h);
        tiles.push({
          x: actualX,
          y: actualY,
          width: w,
          height: h,
          imageData: tileImageData,
          maskData: tileMaskData
        });
      }
    }
  }

  return tiles;
}

export function mergeTiles(
  tiles: { tile: Tile; result: ImageData }[], 
  originalWidth: number, 
  originalHeight: number, 
  overlap: number
): ImageData {
  const { canvas, ctx } = createCanvas(originalWidth, originalHeight);
  
  // Simply drawing tiles onto the canvas for now.
  // Proper blending would require an accumulator array for pixel values and weights.
  // For a robust implementation, this would iterate through each pixel of each tile,
  // applying a distance-to-edge weight.
  
  const accumulator = new Float32Array(originalWidth * originalHeight * 4);
  const weightMap = new Float32Array(originalWidth * originalHeight);

  for (const { tile, result } of tiles) {
    for (let ty = 0; ty < tile.height; ty++) {
      for (let tx = 0; tx < tile.width; tx++) {
        const x = tile.x + tx;
        const y = tile.y + ty;
        
        if (x >= originalWidth || y >= originalHeight) continue;
        
        // Calculate weight based on distance to edge
        const distX = Math.min(tx, tile.width - 1 - tx);
        const distY = Math.min(ty, tile.height - 1 - ty);
        const weight = Math.min(distX, distY, overlap) / Math.max(1, overlap);
        
        const idx = (y * originalWidth + x) * 4;
        const tIdx = (ty * tile.width + tx) * 4;
        
        accumulator[idx] += result.data[tIdx] * weight;
        accumulator[idx + 1] += result.data[tIdx + 1] * weight;
        accumulator[idx + 2] += result.data[tIdx + 2] * weight;
        accumulator[idx + 3] = 255; // Alpha
        
        weightMap[y * originalWidth + x] += weight;
      }
    }
  }

  const finalImageData = ctx.createImageData(originalWidth, originalHeight);
  for (let i = 0; i < weightMap.length; i++) {
    const w = weightMap[i];
    if (w > 0) {
      finalImageData.data[i * 4] = Math.min(255, accumulator[i * 4] / w);
      finalImageData.data[i * 4 + 1] = Math.min(255, accumulator[i * 4 + 1] / w);
      finalImageData.data[i * 4 + 2] = Math.min(255, accumulator[i * 4 + 2] / w);
      finalImageData.data[i * 4 + 3] = 255;
    }
  }

  return finalImageData;
}

export function calculateOptimalTileSize(imageWidth: number, imageHeight: number, maxModelSize: number): TilingConfig {
  return {
    tileSize: maxModelSize,
    overlap: Math.floor(maxModelSize * 0.125),
    imageWidth,
    imageHeight,
  };
}
