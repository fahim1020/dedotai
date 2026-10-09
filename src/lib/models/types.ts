export * from '@/types';

export interface ModelInfo {
  name: string;
  sourceUrl: string;
  license: string;
  expectedInputSize: [number, number]; // [width, height]
  outputFormat: string;
  approximateSizeMB: number;
}

export const MODEL_REGISTRY: Record<string, ModelInfo> = {
  'lama-inpainting': {
    name: 'LaMa Inpainting',
    sourceUrl: 'https://huggingface.co/CyberTimon/RapidRAW-Models/resolve/main/lama_fp16.onnx',
    license: 'Apache 2.0',
    expectedInputSize: [512, 512],
    outputFormat: 'image',
    approximateSizeMB: 106
  },
  'u2net-detection': {
    name: 'U²-Net Lite Detection',
    sourceUrl: 'https://huggingface.co/danielgatis/rembg/resolve/main/u2netp.onnx', // Placeholder URL
    license: 'Apache 2.0',
    expectedInputSize: [320, 320],
    outputFormat: 'mask',
    approximateSizeMB: 4.7
  }
};
