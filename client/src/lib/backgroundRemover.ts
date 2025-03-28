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
 * Removes the background from an image with improved edge detection
 * @param imageUrl - URL of the image to process
 * @param settings - Configuration for the background removal
 * @returns Promise<string> - The data URL of the processed image
 */
export async function removeBackground(
  imageUrl: string,
  settings: {
    foregroundThreshold?: number;
    edgeDilation?: number;
    edgeBlurAmount?: number;
    refineEdges?: boolean;
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

    // Get the segmentation of the person with higher resolution
    const segmentation = await model.segmentPerson(img, {
      flipHorizontal: false,
      internalResolution: 'high', // Better for edge accuracy
      segmentationThreshold: (settings.foregroundThreshold || 50) / 100,
      maxDetections: 1
    });

    // Create canvas for processing
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Draw the original image
    ctx.drawImage(img, 0, 0);

    // Create mask canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = img.width;
    maskCanvas.height = img.height;
    const maskCtx = maskCanvas.getContext('2d');
    
    if (!maskCtx) {
      throw new Error('Could not get mask canvas context');
    }

    // Create binary mask from segmentation
    const maskImageData = maskCtx.createImageData(canvas.width, canvas.height);
    const maskPixels = maskImageData.data;
    
    for (let i = 0; i < segmentation.data.length; i++) {
      const maskValue = segmentation.data[i] ? 255 : 0;
      const pixelIndex = i * 4;
      maskPixels[pixelIndex] = maskValue;     // R
      maskPixels[pixelIndex + 1] = maskValue; // G
      maskPixels[pixelIndex + 2] = maskValue; // B
      maskPixels[pixelIndex + 3] = 255;       // A
    }
    
    maskCtx.putImageData(maskImageData, 0, 0);

    // Edge refinement
    const edgeDilation = settings.edgeDilation ?? 2;
    if (edgeDilation > 0) {
      // Apply dilation to expand the mask slightly
      maskCtx.globalCompositeOperation = 'source-over';
      maskCtx.filter = `blur(${edgeDilation}px)`;
      maskCtx.drawImage(maskCanvas, 0, 0);
      maskCtx.filter = 'none';
      
      // Re-threshold the blurred mask
      const dilatedMaskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const dilatedPixels = dilatedMaskData.data;
      
      for (let i = 0; i < dilatedPixels.length; i += 4) {
        // If any color channel is > 128, consider it part of the mask
        if (dilatedPixels[i] > 128 || dilatedPixels[i+1] > 128 || dilatedPixels[i+2] > 128) {
          dilatedPixels[i] = 255;
          dilatedPixels[i+1] = 255;
          dilatedPixels[i+2] = 255;
        } else {
          dilatedPixels[i] = 0;
          dilatedPixels[i+1] = 0;
          dilatedPixels[i+2] = 0;
        }
      }
      maskCtx.putImageData(dilatedMaskData, 0, 0);
    }

    // Additional edge refinement (optional)
    if (settings.refineEdges) {
      // Create temporary canvas for edge refinement
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Draw original image
        tempCtx.drawImage(img, 0, 0);
        
        // Apply the mask
        tempCtx.globalCompositeOperation = 'destination-in';
        tempCtx.drawImage(maskCanvas, 0, 0);
        tempCtx.globalCompositeOperation = 'source-over';
        
        // Copy back to main canvas
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }

    // Apply the mask to the original image
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    // Edge smoothing
    const edgeBlurAmount = settings.edgeBlurAmount ?? 1;
    if (edgeBlurAmount > 0) {
      ctx.filter = `blur(${edgeBlurAmount}px)`;
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

/**
 * Example usage function
 */
export async function processImageExample() {
  try {
    // Example image URL (replace with your actual image URL)
    const imageUrl = 'https://example.com/person.jpg';
    
    // Process with recommended settings
    const result = await removeBackground(imageUrl, {
      foregroundThreshold: 60,
      edgeDilation: 3,
      edgeBlurAmount: 1,
      refineEdges: true
    });
    
    // Download the result
    downloadImage(result, 'processed_image');
    
    return result;
  } catch (error) {
    console.error('Error in example processing:', error);
  }
}

// Initialize when the app starts
export async function initializeApp() {
  try {
    await loadModel();
    console.log('App initialized and ready for background removal');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

// Call initialize when this module loads
initializeApp();