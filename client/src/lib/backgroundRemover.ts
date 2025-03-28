import * as bodyPix from '@tensorflow-models/body-pix';
import * as tf from '@tensorflow/tfjs';

// Initialize TensorFlow.js
await tf.setBackend('webgl');

let bodyPixModel: bodyPix.BodyPix | null = null;

export async function loadModel() {
  if (!bodyPixModel) {
    bodyPixModel = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2
    });
  }
  return bodyPixModel;
}

export async function removeBackground(
  imageUrl: string,
  options: {
    foregroundThreshold?: number;
    edgeDilation?: number;
    edgeBlurAmount?: number;
  } = {}
): Promise<string> {
  try {
    const model = await loadModel();

    // Load image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Get segmentation
    const segmentation = await model.segmentPerson(img, {
      flipHorizontal: false,
      internalResolution: 'high',
      segmentationThreshold: (options.foregroundThreshold || 50) / 100
    });

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Create mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = img.width;
    maskCanvas.height = img.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) throw new Error('Could not get mask context');

    // Fill mask with segmentation data
    const maskImageData = maskCtx.createImageData(img.width, img.height);
    for (let i = 0; i < segmentation.data.length; i++) {
      const val = segmentation.data[i] ? 255 : 0;
      const pos = i * 4;
      maskImageData.data[pos] = val;
      maskImageData.data[pos + 1] = val;
      maskImageData.data[pos + 2] = val;
      maskImageData.data[pos + 3] = 255;
    }
    maskCtx.putImageData(maskImageData, 0, 0);

    // Apply edge dilation if needed
    if (options.edgeDilation && options.edgeDilation > 0) {
      maskCtx.filter = `blur(${options.edgeDilation}px)`;
      maskCtx.drawImage(maskCanvas, 0, 0);
      maskCtx.filter = 'none';
      
      const dilatedData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      for (let i = 0; i < dilatedData.data.length; i += 4) {
        const avg = (dilatedData.data[i] + dilatedData.data[i+1] + dilatedData.data[i+2]) / 3;
        dilatedData.data[i] = dilatedData.data[i+1] = dilatedData.data[i+2] = avg > 128 ? 255 : 0;
      }
      maskCtx.putImageData(dilatedData, 0, 0);
    }

    // Apply mask to original image
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    // Apply edge blur if needed
    if (options.edgeBlurAmount && options.edgeBlurAmount > 0) {
      ctx.filter = `blur(${options.edgeBlurAmount}px)`;
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Background removal failed:', error);
    throw error;
  }
}

export function downloadImage(dataUrl: string, filename: string = 'no-bg') {
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Initialize when loaded
(async function init() {
  try {
    await loadModel();
    console.log('Background remover ready');
  } catch (error) {
    console.error('Initialization failed:', error);
  }
})();