import { InferenceBackend } from '@/types';

let ort: any = null;

export async function initializeOnnxRuntime(backend: InferenceBackend): Promise<void> {
  if (!ort) {
    ort = await import('onnxruntime-web');
    // Configure wasm paths if needed
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
  }
}

export async function createSession(modelBuffer: ArrayBuffer, backend: InferenceBackend): Promise<any> {
  if (!ort) throw new Error('ONNX Runtime not initialized');
  
  const options: any = {
    executionProviders: [backend === 'webgpu' ? 'webgpu' : 'wasm']
  };

  return await ort.InferenceSession.create(modelBuffer, options);
}

export async function runInference(
  session: any, 
  inputs: Record<string, { data: Float32Array; dims: number[] }>
): Promise<Record<string, { data: Float32Array; dims: number[] }>> {
  if (!ort) throw new Error('ONNX Runtime not initialized');

  const feeds: Record<string, any> = {};
  for (const [key, value] of Object.entries(inputs)) {
    feeds[key] = new ort.Tensor('float32', value.data, value.dims);
  }

  const results = await session.run(feeds);
  
  const outputs: Record<string, { data: Float32Array; dims: number[] }> = {};
  for (const [key, tensor] of Object.entries(results)) {
    outputs[key] = {
      data: (tensor as any).data as Float32Array,
      dims: (tensor as any).dims
    };
  }

  return outputs;
}

export async function disposeSession(session: any): Promise<void> {
  if (session && typeof session.release === 'function') {
    await session.release();
  }
}
