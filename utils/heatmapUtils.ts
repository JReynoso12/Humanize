/**
 * Utility functions for heatmap visualization
 */

import { RGBColor } from '@/types';

/**
 * Convert movement intensity (0-1) to RGB color
 * Low movement → blue/green (0-0.33)
 * Medium movement → yellow (0.33-0.66)
 * High movement → red (0.66-1.0)
 */
export function movementToColor(intensity: number): RGBColor {
  // Clamp intensity to 0-1
  const clamped = Math.max(0, Math.min(1, intensity));

  let r: number, g: number, b: number;

  if (clamped < 0.33) {
    // Blue to Green gradient (low movement)
    const t = clamped / 0.33;
    r = Math.floor(0 * (1 - t) + 0 * t);
    g = Math.floor(100 * (1 - t) + 255 * t);
    b = Math.floor(255 * (1 - t) + 0 * t);
  } else if (clamped < 0.66) {
    // Green to Yellow gradient (medium movement)
    const t = (clamped - 0.33) / 0.33;
    r = Math.floor(0 * (1 - t) + 255 * t);
    g = Math.floor(255 * (1 - t) + 255 * t);
    b = Math.floor(0 * (1 - t) + 0 * t);
  } else {
    // Yellow to Red gradient (high movement)
    const t = (clamped - 0.66) / 0.34;
    r = Math.floor(255 * (1 - t) + 255 * t);
    g = Math.floor(255 * (1 - t) + 0 * t);
    b = Math.floor(0 * (1 - t) + 0 * t);
  }

  return { r, g, b };
}

/**
 * Apply heat decay to a heat value
 * Formula: heat[t] = heat[t-1] * (1 - decayRate)
 */
export function applyHeatDecay(
  currentHeat: number,
  decayRate: number
): number {
  // decayRate is 0-1, where 1 means instant decay, 0 means no decay
  return currentHeat * (1 - decayRate);
}

/**
 * Create a radial gradient for heat visualization
 * Returns a canvas gradient object
 */
export function createHeatGradient(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: RGBColor,
  alpha: number = 0.6
): CanvasGradient {
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius
  );

  // Center is fully opaque
  gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
  // Edge fades to transparent
  gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

  return gradient;
}

/**
 * Apply Gaussian blur to heatmap for smoother visualization
 * This is a simple box blur approximation
 */
export function blurHeatmap(
  imageData: ImageData,
  radius: number = 2
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;

  // Simple box blur
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            a += data[idx + 3];
            count++;
          }
        }
      }

      const idx = (y * width + x) * 4;
      imageData.data[idx] = r / count;
      imageData.data[idx + 1] = g / count;
      imageData.data[idx + 2] = b / count;
      imageData.data[idx + 3] = a / count;
    }
  }

  return imageData;
}

/**
 * Convert RGB color to CSS rgba string
 */
export function rgbToRgba(color: RGBColor, alpha: number = 1): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}
