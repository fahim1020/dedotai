import { ImageModel, ModelInfo, ModelOutput, InferenceBackend, DetectionOptions } from '@/types';
import { MODEL_REGISTRY } from './types';
import { loadModel } from './model-loader';
import { initializeOnnxRuntime, createSession, runInference, disposeSession } from '@/lib/inference/onnx-runtime';
import { preprocessForDetection, normalizeImageData } from '@/lib/image/preprocessing';
import { getBestBackend } from '@/lib/inference/capability-detect';
import { float32ToImageData } from '@/lib/canvas/utils';
import { detectWatermark } from '@/lib/detection/classical-detection';

export class OnnxDetectorModel implements ImageModel {
  private session: unknown = null;
  private _isLoaded = false;

  get info(): ModelInfo {
    const reg = MODEL_REGISTRY['u2net-detection'];
    return {
      name: reg.name,
      description: 'Salient object detection for watermark regions',
      source: reg.sourceUrl,
      license: reg.license,
      expectedInputSize: reg.expectedInputSize,
      outputFormat: reg.outputFormat,
      approximateSize: `${reg.approximateSizeMB}MB`,
      modelPath: reg.sourceUrl,
    };
  }

  get isLoaded(): boolean {
    return this._isLoaded;
  }

  async load(backend?: InferenceBackend): Promise<void> {
    const reg = MODEL_REGISTRY['u2net-detection'];
    if (!reg) throw new Error('Model info not found for u2net-detection');

    try {
      const buffer = await loadModel(reg.sourceUrl);
      const resolvedBackend = backend ?? await getBestBackend();
      await initializeOnnxRuntime(resolvedBackend);
      this.session = await createSession(buffer, resolvedBackend);
      this._isLoaded = true;
    } catch (e) {
      console.warn('Failed to load ONNX detector, will use classical fallback', e);
      this._isLoaded = false;
    }
  }

  async predict(input: ImageData): Promise<ModelOutput> {
    // Fallback to classical if model not loaded
    if (!this.session) {
      const result = detectWatermark(input, {
        threshold: 0.5,
        minRegionSize: 100,
        mode: 'auto',
      });
      // Convert DetectionResult mask to ModelOutput format
      const maskData = new Float32Array(result.mask.width * result.mask.height);
      for (let i = 0; i < maskData.length; i++) {
        maskData[i] = result.mask.data[i * 4] / 255;
      }
      return {
        data: maskData,
        width: result.mask.width,
        height: result.mask.height,
        channels: 1,
      };
    }

    const reg = MODEL_REGISTRY['u2net-detection'];
    const targetSize = reg.expectedInputSize;
    const { processed } = preprocessForDetection(input, targetSize);

    const inputFloat32 = normalizeImageData(processed);

    const inputs = {
      'input.1': {
        data: inputFloat32,
        dims: [1, 3, targetSize[1], targetSize[0]],
      },
    };

    const outputs = await runInference(this.session, inputs);

    const outputKey = Object.keys(outputs)[0];
    const outputData = outputs[outputKey];

    return {
      data: outputData.data,
      width: targetSize[0],
      height: targetSize[1],
      channels: 1,
    };
  }

  async dispose(): Promise<void> {
    if (this.session) {
      await disposeSession(this.session);
      this.session = null;
      this._isLoaded = false;
    }
  }
}
