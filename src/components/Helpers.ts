// Neutral dark shown while accent extraction is pending or when it fails,
// so spines never render with an empty background-color.
export const FALLBACK_ACCENT = "rgb(32, 32, 32)";

export function desaturateRGBAdjusted(
  rgb: string,
  amount: number,
  threshold: number,
): string {
  const matches = rgb.match(/\d+/g);
  if (matches) {
    const [r, g, b] = matches.map(Number);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;

    if (saturation > threshold) {
      // Rec. 601 luma coefficients (sum to 1) so desaturation preserves brightness.
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      const desaturatedR = Math.round(r + amount * (gray - r));
      const desaturatedG = Math.round(g + amount * (gray - g));
      const desaturatedB = Math.round(b + amount * (gray - b));
      return `rgb(${desaturatedR}, ${desaturatedG}, ${desaturatedB})`;
    }
  }
  return rgb;
}

// Memoized by cover URL so component remounts (orientation changes, query
// refetches) reuse the extracted color instead of re-decoding the image.
const accentCache = new Map<string, Promise<string>>();

export function getAccentColor(
  albumCover: string,
  cutoffPercentage: number = 10,
): Promise<string> {
  const cached = accentCache.get(albumCover);
  if (cached) return cached;
  const promise = extractAccentColor(albumCover, cutoffPercentage);
  accentCache.set(albumCover, promise);
  // Don't cache failures; allow a retry on the next call.
  promise.catch(() => accentCache.delete(albumCover));
  return promise;
}

function extractAccentColor(
  albumCover: string,
  cutoffPercentage: number,
): Promise<string> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.crossOrigin = "Anonymous";

  return new Promise<string>((resolve, reject) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx!.drawImage(img, 0, 0, img.width, img.height);

      const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const totalPixels = imageData.width * imageData.height;
      let r = 0;
      let g = 0;
      let b = 0;
      let pixelCount = 0;
      // Unfiltered totals, kept as a fallback when every pixel is outside the
      // brightness cutoffs (e.g. mostly-black covers) — avoids rgb(NaN, ...).
      let allR = 0;
      let allG = 0;
      let allB = 0;
      let allCount = 0;

      // Calculate the starting row for the bottom half of the image
      const startRow = Math.floor(imageData.height / 2);

      for (let i = startRow * imageData.width; i < totalPixels; i++) {
        const offset = i * 4;
        const brightness =
          (data[offset] + data[offset + 1] + data[offset + 2]) / 3;
        const lowCutoff = 255 * (cutoffPercentage / 100);
        const highCutoff = 255 * (1 - cutoffPercentage / 100);

        allR += data[offset];
        allG += data[offset + 1];
        allB += data[offset + 2];
        allCount++;

        if (brightness >= lowCutoff && brightness <= highCutoff) {
          r += data[offset];
          g += data[offset + 1];
          b += data[offset + 2];
          pixelCount++;
        }
      }

      if (pixelCount === 0) {
        if (allCount === 0) {
          resolve(FALLBACK_ACCENT);
          return;
        }
        r = allR;
        g = allG;
        b = allB;
        pixelCount = allCount;
      }

      const avgR = Math.round(r / pixelCount);
      const avgG = Math.round(g / pixelCount);
      const avgB = Math.round(b / pixelCount);

      resolve(`rgb(${avgR}, ${avgG}, ${avgB})`);
    };

    img.onerror = () => {
      reject(new Error("Failed to load the album cover image."));
    };

    img.src = albumCover;
  });
}
