export function desaturateRGB(rgb: string, amount: number): string {
    const matches = rgb.match(/\d+/g);
    if (matches) {
      const [r, g, b] = matches.map(Number);
      const gray = Math.round(0.499 * r + 0.787 * g + 0.314 * b);
      const desaturatedR = Math.round(r + amount * (gray - r));
      const desaturatedG = Math.round(g + amount * (gray - g));
      const desaturatedB = Math.round(b + amount * (gray - b));
      return `rgb(${desaturatedR}, ${desaturatedG}, ${desaturatedB})`;
    }
    return rgb;
  }

export function desaturateRGBAdjusted(rgb: string, amount: number, threshold: number): string {
    const matches = rgb.match(/\d+/g);
    if (matches) {
      const [r, g, b] = matches.map(Number);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
  
      if (saturation > threshold) {
        const gray = Math.round(0.499 * r + 0.787 * g + 0.314 * b);
        const desaturatedR = Math.round(r + amount * (gray - r));
        const desaturatedG = Math.round(g + amount * (gray - g));
        const desaturatedB = Math.round(b + amount * (gray - b));
        return `rgb(${desaturatedR}, ${desaturatedG}, ${desaturatedB})`;
      }
    }
    return rgb;
  }

export async function getAccentColor(albumCover: string, cutoffPercentage: number = 10): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'Anonymous';
  
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
  
        // Calculate the starting row for the bottom half of the image
        const startRow = Math.floor(imageData.height / 2);
  
        for (let i = startRow * imageData.width; i < totalPixels; i++) {
          const offset = i * 4;
          const brightness = (data[offset] + data[offset + 1] + data[offset + 2]) / 3;
          const lowCutoff = 255 * (cutoffPercentage / 100);
          const highCutoff = 255 * (1 - cutoffPercentage / 100);
  
          if (brightness >= lowCutoff && brightness <= highCutoff) {
            r += data[offset];
            g += data[offset + 1];
            b += data[offset + 2];
            pixelCount++;
          }
        }
  
        const avgR = Math.round(r / pixelCount);
        const avgG = Math.round(g / pixelCount);
        const avgB = Math.round(b / pixelCount);
  
        const accentColor = `rgb(${avgR}, ${avgG}, ${avgB})`;
        resolve(accentColor);
      };
  
      img.onerror = () => {
        reject(new Error('Failed to load the album cover image.'));
      };
  
      img.src = albumCover;
    });
  }