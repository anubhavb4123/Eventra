import jsQR from 'jsqr';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Loads a File or Blob into an HTMLImageElement
 */
function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Creates a canvas and gets image data at a specific width and height
 */
function getCanvasImageData(
  img: HTMLImageElement,
  targetWidth?: number,
  targetHeight?: number,
  cropArea?: { sx: number; sy: number; sw: number; sh: number }
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; data: ImageData } | null {
  const canvas = document.createElement('canvas');
  const w = targetWidth || (cropArea ? cropArea.sw : img.naturalWidth || img.width);
  const h = targetHeight || (cropArea ? cropArea.sh : img.naturalHeight || img.height);
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  if (cropArea) {
    ctx.drawImage(img, cropArea.sx, cropArea.sy, cropArea.sw, cropArea.sh, 0, 0, w, h);
  } else {
    ctx.drawImage(img, 0, 0, w, h);
  }

  const data = ctx.getImageData(0, 0, w, h);
  return { canvas, ctx, data };
}

/**
 * Contrast stretch and invert dark backgrounds to guarantee
 * gold-on-black or inverted QR codes decode seamlessly.
 */
function enhanceAndBinarize(imageData: ImageData): Uint8ClampedArray {
  const { data, width, height } = imageData;
  const out = new Uint8ClampedArray(data.length);

  // 1. Calculate luminance and min/max
  let minLum = 255;
  let maxLum = 0;
  let totalLum = 0;
  const pixelCount = width * height;
  const lumArray = new Float32Array(pixelCount);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // Standard perceptual luminance
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    lumArray[p] = lum;
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
    totalLum += lum;
  }

  const avgLum = totalLum / pixelCount;
  // If average luminance is low (< 128), it's likely a dark mode / inverted QR code
  const isInverted = avgLum < 120;
  const range = Math.max(maxLum - minLum, 1);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // Normalize contrast to [0, 255]
    let normalized = ((lumArray[p] - minLum) / range) * 255;

    // If inverted, flip so modules are dark and background is light
    if (isInverted) {
      normalized = 255 - normalized;
    }

    out[i] = normalized;
    out[i + 1] = normalized;
    out[i + 2] = normalized;
    out[i + 3] = 255;
  }

  return out;
}

/**
 * Decode a QR code from a File or Blob with multi-pass fallback:
 * Pass 1: jsQR direct (with inversionAttempts: 'attemptBoth')
 * Pass 2: Grayscale contrast-stretched & auto-inverted for dark mode/gold-on-black
 * Pass 3: Inverted raw RGB
 * Pass 4: Downscaled pass (for high-resolution photos)
 * Pass 5: Centered crop pass (for images with large dark borders)
 * Pass 6: Browser native BarcodeDetector API (if supported)
 * Pass 7: Html5Qrcode ZXing engine
 */
export async function decodeQRFromImage(file: File | Blob): Promise<string> {
  const img = await loadImage(file);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  if (origW === 0 || origH === 0) {
    throw new Error('Image could not be rendered or has invalid dimensions.');
  }

  // --- PASS 1: jsQR Direct at standard/scaled size ---
  // Clamp to max 1200px to keep decoding instantaneous
  const scale = Math.min(1, 1200 / Math.max(origW, origH));
  const workW = Math.round(origW * scale);
  const workH = Math.round(origH * scale);

  const base = getCanvasImageData(img, workW, workH);
  if (base) {
    const result1 = jsQR(base.data.data, base.data.width, base.data.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (result1?.data) {
      return result1.data;
    }

    // --- PASS 2: Contrast Stretched + Auto-Inverted (Targeted for Gold on Black) ---
    const enhancedBytes = enhanceAndBinarize(base.data);
    const result2 = jsQR(enhancedBytes, base.data.width, base.data.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (result2?.data) {
      return result2.data;
    }

    // --- PASS 3: Explicit RGB Inversion ---
    const invertedBytes = new Uint8ClampedArray(base.data.data.length);
    for (let i = 0; i < base.data.data.length; i += 4) {
      invertedBytes[i] = 255 - base.data.data[i];
      invertedBytes[i + 1] = 255 - base.data.data[i + 1];
      invertedBytes[i + 2] = 255 - base.data.data[i + 2];
      invertedBytes[i + 3] = base.data.data[i + 3];
    }
    const result3 = jsQR(invertedBytes, base.data.width, base.data.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (result3?.data) {
      return result3.data;
    }
  }

  // --- PASS 4: Scaled Down Pass (500px - optimal for noise reduction in photos) ---
  if (origW > 500 || origH > 500) {
    const downW = 500;
    const downH = Math.round((origH / origW) * 500);
    const down = getCanvasImageData(img, downW, downH);
    if (down) {
      const result4 = jsQR(down.data.data, down.data.width, down.data.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (result4?.data) {
        return result4.data;
      }

      const enhancedDown = enhanceAndBinarize(down.data);
      const result4b = jsQR(enhancedDown, down.data.width, down.data.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (result4b?.data) {
        return result4b.data;
      }
    }
  }

  // --- PASS 5: Center Crop (cuts off dark padding/borders) ---
  const cropSize = Math.round(Math.min(origW, origH) * 0.85);
  const cropArea = {
    sx: Math.round((origW - cropSize) / 2),
    sy: Math.round((origH - cropSize) / 2),
    sw: cropSize,
    sh: cropSize,
  };
  const cropped = getCanvasImageData(img, 450, 450, cropArea);
  if (cropped) {
    const result5 = jsQR(cropped.data.data, cropped.data.width, cropped.data.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (result5?.data) {
      return result5.data;
    }

    const enhancedCropped = enhanceAndBinarize(cropped.data);
    const result5b = jsQR(enhancedCropped, cropped.data.width, cropped.data.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (result5b?.data) {
      return result5b.data;
    }
  }

  // --- PASS 6: Native Browser BarcodeDetector API ---
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const barcodes = await detector.detect(img);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue;
      }
    } catch {
      // Continue to final fallback
    }
  }

  // --- PASS 7: Html5Qrcode (ZXing engine) ---
  try {
    let dummyContainer = document.getElementById('qr-hidden-decoder-container');
    if (!dummyContainer) {
      dummyContainer = document.createElement('div');
      dummyContainer.id = 'qr-hidden-decoder-container';
      dummyContainer.style.display = 'none';
      document.body.appendChild(dummyContainer);
    }
    const html5Qr = new Html5Qrcode('qr-hidden-decoder-container', false);
    const zxingResult = await html5Qr.scanFile(file as File, false);
    try {
      html5Qr.clear();
    } catch {
      // Ignored
    }
    if (zxingResult) {
      return zxingResult;
    }
  } catch {
    // Ignored, will throw user-friendly error below
  }

  throw new Error('No QR code could be detected in this image. Please ensure the QR code is clearly visible and well-lit.');
}
