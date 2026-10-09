import { DeviceCapabilities, InferenceBackend } from '@/types';

let cachedCapabilities: DeviceCapabilities | null = null;
let cachedBackend: InferenceBackend | null = null;

export async function detectWebGPU(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  try {
    const gpu = (navigator as any).gpu;
    if (!gpu) return false;
    const adapter = await gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

export function detectWasm(): boolean {
  try {
    if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
      const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
      if (module instanceof WebAssembly.Module) {
        return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
      }
    }
  } catch {
    // Fall through
  }
  return false;
}

export async function detectCapabilities(): Promise<DeviceCapabilities> {
  if (cachedCapabilities) return cachedCapabilities;

  const hasWebGpu = await detectWebGPU();
  const hasWasm = detectWasm();
  const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
  const hasWebWorker = typeof Worker !== 'undefined';
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const hasIndexedDB = typeof indexedDB !== 'undefined';

  let backend: InferenceBackend = 'cpu';
  if (hasWebGpu) backend = 'webgpu';
  else if (hasWasm) backend = 'wasm';

  cachedCapabilities = {
    webgpu: hasWebGpu,
    wasm: hasWasm,
    offscreenCanvas: hasOffscreenCanvas,
    webWorker: hasWebWorker,
    sharedArrayBuffer: hasSharedArrayBuffer,
    indexedDB: hasIndexedDB,
    backend,
  };

  return cachedCapabilities;
}

export async function getBestBackend(): Promise<InferenceBackend> {
  if (cachedBackend) return cachedBackend;

  const caps = await detectCapabilities();
  if (caps.webgpu) {
    cachedBackend = 'webgpu';
  } else if (caps.wasm) {
    cachedBackend = 'wasm';
  } else {
    cachedBackend = 'cpu';
  }

  return cachedBackend;
}
