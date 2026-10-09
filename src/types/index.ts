/* ─────────────────────────────────────────────────────────────
   DeWatermark – Shared Type Definitions
   ───────────────────────────────────────────────────────────── */

// ── Capabilities ──────────────────────────────────────────────

export type InferenceBackend = 'webgpu' | 'wasm' | 'cpu';

export interface DeviceCapabilities {
  webgpu: boolean;
  wasm: boolean;
  offscreenCanvas: boolean;
  webWorker: boolean;
  sharedArrayBuffer: boolean;
  indexedDB: boolean;
  backend: InferenceBackend;
}

// ── Model System ──────────────────────────────────────────────

export interface ModelInfo {
  name: string;
  description: string;
  source: string;
  license: string;
  expectedInputSize: [number, number]; // [width, height]
  outputFormat: string;
  approximateSize: string; // e.g. "27MB"
  modelPath: string;
}

export interface ModelOutput {
  data: Float32Array | Uint8Array;
  width: number;
  height: number;
  channels: number;
}

export interface ImageModel {
  readonly info: ModelInfo;
  readonly isLoaded: boolean;
  load(backend?: InferenceBackend): Promise<void>;
  predict(input: ImageData): Promise<ModelOutput>;
  dispose(): Promise<void>;
}

export type ModelLoadingState =
  | 'idle'
  | 'downloading'
  | 'loading'
  | 'ready'
  | 'error';

export interface ModelStatus {
  state: ModelLoadingState;
  progress: number; // 0-100
  error?: string;
}

// ── Detection ─────────────────────────────────────────────────

export interface DetectionResult {
  mask: ImageData;
  confidence: number;
  regions: DetectedRegion[];
}

export interface DetectedRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface DetectionOptions {
  threshold: number; // 0-1
  minRegionSize: number; // minimum pixel area
  mode: 'auto' | 'text' | 'logo' | 'pattern';
}

// ── Inpainting ────────────────────────────────────────────────

export interface InpaintingInput {
  image: ImageData;
  mask: ImageData;
}

export interface InpaintingResult {
  image: ImageData;
  processingTimeMs: number;
}

export interface InpaintingOptions {
  method: 'classical' | 'onnx';
  tileSize: number;
  tileOverlap: number;
  iterations: number;
}

// ── Mask Editor ───────────────────────────────────────────────

export type MaskTool = 'brush' | 'eraser';

export interface MaskEditorState {
  tool: MaskTool;
  brushSize: number;
  opacity: number;
  history: ImageData[];
  historyIndex: number;
  zoom: number;
  panX: number;
  panY: number;
}

export interface BrushStroke {
  points: Array<{ x: number; y: number }>;
  tool: MaskTool;
  size: number;
}

// ── Image Loading ─────────────────────────────────────────────

export type ImageFormat = 'png' | 'jpeg' | 'webp';

export interface LoadedImage {
  original: HTMLImageElement;
  imageData: ImageData;
  width: number;
  height: number;
  fileName: string;
  fileSize: number;
  format: ImageFormat;
}

export interface ImageValidation {
  valid: boolean;
  error?: string;
}

export const IMAGE_LIMITS = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxDimension: 8192,
  minDimension: 16,
  supportedTypes: [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/pjpeg',
    'image/x-png',
  ] as const,
} as const;

// ── Export ─────────────────────────────────────────────────────

export interface ExportOptions {
  format: ImageFormat;
  quality: number; // 0.25-1.0 for JPEG/WebP
  preserveTransparency: boolean;
  stripAiWatermarks?: boolean; // Neutralize SynthID and imperceptible AI watermarks
  alreadySanitized?: boolean; // If true, already neutralized in workspace; export 1:1 without double-filtering
}

// ── Processing Pipeline ───────────────────────────────────────

export type ProcessingStage =
  | 'idle'
  | 'loading-image'
  | 'detecting'
  | 'mask-editing'
  | 'inpainting'
  | 'postprocessing'
  | 'complete'
  | 'error';

export interface ProcessingState {
  stage: ProcessingStage;
  progress: number; // 0-100
  message: string;
  error?: string;
}

// ── Tiling ────────────────────────────────────────────────────

export interface Tile {
  x: number;
  y: number;
  width: number;
  height: number;
  imageData: ImageData;
  maskData: ImageData;
}

export interface TilingConfig {
  tileSize: number;
  overlap: number;
  imageWidth: number;
  imageHeight: number;
}

// ── View Modes ────────────────────────────────────────────────

export type ViewMode = 'original' | 'mask' | 'result' | 'compare';

// ── Worker Messages ───────────────────────────────────────────

export type WorkerMessageType =
  | 'init'
  | 'detect'
  | 'inpaint'
  | 'progress'
  | 'result'
  | 'error'
  | 'dispose';

export interface WorkerMessage {
  type: WorkerMessageType;
  payload?: unknown;
  transferable?: ArrayBuffer[];
}

export interface WorkerInitPayload {
  backend: InferenceBackend;
  modelPath: string;
  modelType: 'detector' | 'inpainter';
}

export interface WorkerDetectPayload {
  imageData: ArrayBuffer;
  width: number;
  height: number;
  options: DetectionOptions;
}

export interface WorkerInpaintPayload {
  imageData: ArrayBuffer;
  maskData: ArrayBuffer;
  width: number;
  height: number;
  options: InpaintingOptions;
}

export interface WorkerProgressPayload {
  progress: number;
  message: string;
}

export interface WorkerResultPayload {
  data: ArrayBuffer;
  width: number;
  height: number;
  channels: number;
  processingTimeMs: number;
}

export interface WorkerErrorPayload {
  message: string;
  code?: string;
}
