import { useState, useEffect } from 'react';

// Preset fallback palette of rich Spotify-like vibrant accents
const FALLBACK_PALETTE = [
  { r: 83, g: 38, b: 122 },  // Deep Purple
  { r: 30, g: 85, b: 160 },  // Midnight Blue
  { r: 180, g: 30, b: 40 },  // Crimson Red
  { r: 200, g: 80, b: 20 },  // Amber Orange
  { r: 20, g: 130, b: 90 },  // Teal Forest
  { r: 140, g: 25, b: 95 },  // Magenta
  { r: 45, g: 70, b: 120 },  // Indigo
  { r: 30, g: 110, b: 70 },  // Spotify Green variant
];

/**
 * Returns a deterministic fallback color from a string
 */
function getHashColor(str: string): { r: number; g: number; b: number } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index];
}

export function useColorExtractor(imageUrl?: string, titleFallback = 'Madhu Leka Music') {
  const [dominantColor, setDominantColor] = useState<{ r: number; g: number; b: number }>(() => 
    getHashColor(titleFallback)
  );

  useEffect(() => {
    if (!imageUrl) {
      setDominantColor(getHashColor(titleFallback));
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (isMounted) setDominantColor(getHashColor(titleFallback));
          return;
        }

        // Downscale to 30x30 for fast extraction
        canvas.width = 30;
        canvas.height = 30;
        ctx.drawImage(img, 0, 0, 30, 30);

        const imgData = ctx.getImageData(0, 0, 30, 30).data;
        let rTotal = 0;
        let gTotal = 0;
        let bTotal = 0;
        let count = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];

          // Skip extremely dark (near black) or extremely bright (near white) pixels
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness > 30 && brightness < 225) {
            rTotal += r;
            gTotal += g;
            bTotal += b;
            count++;
          }
        }

        if (count > 0 && isMounted) {
          const rAvg = Math.round(rTotal / count);
          const gAvg = Math.round(gTotal / count);
          const bAvg = Math.round(bTotal / count);
          setDominantColor({ r: rAvg, g: gAvg, b: bAvg });
        } else if (isMounted) {
          setDominantColor(getHashColor(titleFallback));
        }
      } catch (err) {
        // Cross-origin canvas security restriction fallback
        if (isMounted) {
          setDominantColor(getHashColor(titleFallback));
        }
      }
    };

    img.onerror = () => {
      if (isMounted) {
        setDominantColor(getHashColor(titleFallback));
      }
    };

    img.src = imageUrl;

    return () => {
      isMounted = false;
    };
  }, [imageUrl, titleFallback]);

  return {
    ...dominantColor,
    rgbString: `rgb(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b})`,
    rgba: (alpha: number) => `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, ${alpha})`,
  };
}

