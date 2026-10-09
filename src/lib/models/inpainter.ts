import { ImageModel, ModelInfo, ModelOutput, InferenceBackend } from '@/types';
import { MODEL_REGISTRY } from './types';
import { loadModel } from './model-loader';
import { initializeOnnxRuntime, createSession, runInference, disposeSession } from '@/lib/inference/onnx-runtime';
import { preprocessForInpainting, normalizeImageData, normalizeMask } from '@/lib/image/preprocessing';
import { getBestBackend } from '@/lib/inference/capability-detect';

export class OnnxInpainterModel implements ImageModel {
  private session: unknown = null;
  private _isLoaded = false;

  get info(): ModelInfo {
    const reg = MODEL_REGISTRY['lama-inpainting'];
    return {
      name: reg.name,
      description: 'Large Mask Inpainting for watermark removal',
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
    const reg = MODEL_REGISTRY['lama-inpainting'];
    if (!reg) throw new Error('Model info not found for lama-inpainting');

    try {
      const buffer = await loadModel(reg.sourceUrl);
      const resolvedBackend = backend ?? await getBestBackend();
      await initializeOnnxRuntime(resolvedBackend);
      this.session = await createSession(buffer, resolvedBackend);
      this._isLoaded = true;
    } catch (e) {
      console.warn('Failed to load ONNX inpainter, will use classical fallback', e);
      this._isLoaded = false;
    }
  }

  async predict(input: ImageData): Promise<ModelOutput> {
    if (!this.session) {
      throw new Error('Model not loaded. Use classical inpainting as fallback.');
    }

    const reg = MODEL_REGISTRY['lama-inpainting'];
    const targetSize = reg.expectedInputSize;

    // The input ImageData is expected to be the image; mask should be passed via
    // a separate call. For the ImageModel interface, we process the image.
    const imgFloat32 = normalizeImageData(input);

    const inputs = {
      image: {
        data: imgFloat32,
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
      channels: 3,
    };
  }

  /** Run inpainting with both image and mask */
  async inpaint(image: ImageData, mask: ImageData): Promise<ModelOutput> {
    if (!this.session) {
      throw new Error('Model not loaded. Use classical inpainting as fallback.');
    }

    const reg = MODEL_REGISTRY['lama-inpainting'];
    const targetSize = reg.expectedInputSize;

    const { processedImage, processedMask } = preprocessForInpainting(
      image,
      mask,
      targetSize
    );

    const imgFloat32 = normalizeImageData(processedImage);
    const maskFloat32 = normalizeMask(processedMask);

    const inputs = {
      image: {
        data: imgFloat32,
        dims: [1, 3, targetSize[1], targetSize[0]],
      },
      mask: {
        data: maskFloat32,
        dims: [1, 1, targetSize[1], targetSize[0]],
      },
    };

    const outputs = await runInference(this.session, inputs);

    const outputKey = Object.keys(outputs)[0];
    const outputData = outputs[outputKey];

    return {
      data: outputData.data,
      width: targetSize[0],
      height: targetSize[1],
      channels: 3,
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
