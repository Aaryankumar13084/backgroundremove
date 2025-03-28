import * as bodyPix from '@tensorflow-models/body-pix';
import * as tf from '@tensorflow/tfjs';

// Initialize TensorFlow.js
tf.setBackend('webgl');

let bodyPixModel: bodyPix.BodyPix | null = null;

export async function loadModel() {
  try {
    if (!bodyPixModel) {
      bodyPixModel = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 1.0, // बेहतर accuracy के लिए 1.0 किया
        quantBytes: 2
      });
      console.log('BodyPix model loaded successfully');
    }
    return bodyPixModel;
  } catch (error) {
    console.error('Failed to load BodyPix model:', error);
    throw error;
  }
}

/**
 * Refine mask using dilation to remove background more effectively
 */
function refineMask(mask: Uint8Array, width: number, height: number, iterations: number = 2): Uint8Array {
  const newMask = new Uint8Array(mask);
  
  for (let iter = 0; iter < iterations; iter++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        
        if (mask[i] === 0 && (
          mask[i - 1] === 1 || mask[i + 1] === 1 || 
          mask[i - width] === 1 || mask[i + width] === 1
        )) {
          newMask[i] = 1; // Expand foreground
        }
      }
    }
  }
  return newMask;
}

/**
 * Removes the background from an image, keeping only the person
 */
export async function removeBackground(
  imageUrl: string,
  settings: {
    foregroundThreshold?: number;
    blurEffect?: number;
    refineEdges?: boolean;
  } = {}
): Promise<string> {
  try {
    const model = await loadModel();
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageUrl;
    });

    const segmentation = await model.segmentPerson(img, {
      flipHorizontal: false,
      internalResolution: 'high',
      segmentationThreshold: (settings.foregroundThreshold || 10) / 100, // बेहतर accuracy के लिए 10% threshold
    });

    const mask = settings.refineEdges ? refineMask(segmentation.data, img.width, img.height) : segmentation.data;

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < mask.length; i++) {
      const pixelIndex = i * 4;

      if (!mask[i]) {
        pixels[pixelIndex + 3] = 0; // Background को transparent कर दिया
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Apply blur effect for smoother edges
    if (settings.blurEffect && settings.blurEffect > 0) {
      ctx.globalAlpha = 0.9;
      ctx.filter = `blur(${settings.blurEffect}px)`;
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
}
/**
 * Downloads the processed image
 * @param dataUrl - The data URL of the image
 * @param filename - The filename for the download
 * @param format - The image format (png or jpg)
 */
export function downloadImage(dataUrl: string, filename: string = 'background_removed', format: 'png' | 'jpg' = 'png') {
  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}