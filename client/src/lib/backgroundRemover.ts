import * as bodyPix from '@tensorflow-models/body-pix';
import * as tf from '@tensorflow/tfjs';

// Initialize TensorFlow.js
tf.setBackend('webgl');

// Load the BodyPix model
let bodyPixModel: bodyPix.BodyPix | null = null;

export async function loadModel() {
  try {
    if (!bodyPixModel) {
      bodyPixModel = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
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
 * Removes the background from an image, keeping only the person
 * @param imageUrl - URL of the image to process
 * @param settings - Configuration for the background removal
 * @returns Promise<string> - The data URL of the processed image
 */
export async function removeBackground(
  imageUrl: string,
  settings: {
    foregroundThreshold?: number;
    backgroundThreshold?: number;
    alphaMatting?: boolean;
  } = {}
): Promise<string> {
  try {
    // Load the model if not already loaded
    const model = await loadModel();

    // Create an image element
    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Wait for the image to load
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Get the segmentation of the person
    const segmentation = await model.segmentPerson(img, {
      flipHorizontal: false,
      internalResolution: 'medium',
      segmentationThreshold: (settings.foregroundThreshold || 50) / 100,
    });

    // Create a canvas to draw the result
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Draw the original image
    ctx.drawImage(img, 0, 0);

    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Apply the mask to remove the background
    for (let i = 0; i < segmentation.data.length; i++) {
      // If pixel is not part of person, make it transparent
      if (!segmentation.data[i]) {
        // Each pixel has 4 values (RGBA), so multiply by 4
        const pixelIndex = i * 4;
        pixels[pixelIndex + 3] = 0; // Set alpha to 0 (transparent)
      }
    }

    // Put the modified image data back on the canvas
    ctx.putImageData(imageData, 0, 0);

    // Return the data URL of the image with background removed
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