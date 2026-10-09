import { IMAGE_LIMITS, ImageValidation } from '@/types';

export async function validateImageFile(file: File): Promise<ImageValidation> {
  const isTypeSupported = 
    IMAGE_LIMITS.supportedTypes.includes(file.type as typeof IMAGE_LIMITS.supportedTypes[number]) ||
    /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!isTypeSupported) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: PNG, JPEG, WebP`,
    };
  }

  if (file.size > IMAGE_LIMITS.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds the limit of ${IMAGE_LIMITS.maxFileSize / (1024 * 1024)}MB`,
    };
  }

  const dimensions = await getImageDimensions(file);

  if (
    dimensions.width > IMAGE_LIMITS.maxDimension ||
    dimensions.height > IMAGE_LIMITS.maxDimension ||
    dimensions.width < IMAGE_LIMITS.minDimension ||
    dimensions.height < IMAGE_LIMITS.minDimension
  ) {
    return {
      valid: false,
      error: `Image dimensions must be between ${IMAGE_LIMITS.minDimension} and ${IMAGE_LIMITS.maxDimension} pixels`,
    };
  }

  return { valid: true };
}

/** Alias for components that import validateFile */
export const validateFile = validateImageFile;

export function validateDimensions(width: number, height: number): ImageValidation {
  if (
    width > IMAGE_LIMITS.maxDimension ||
    height > IMAGE_LIMITS.maxDimension ||
    width < IMAGE_LIMITS.minDimension ||
    height < IMAGE_LIMITS.minDimension
  ) {
    return {
      valid: false,
      error: `Image dimensions must be between ${IMAGE_LIMITS.minDimension} and ${IMAGE_LIMITS.maxDimension} pixels`,
    };
  }
  return { valid: true };
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}
