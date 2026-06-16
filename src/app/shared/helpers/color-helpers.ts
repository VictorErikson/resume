export default class ColorHelpers {
  static hexToHsl(hex: string): { h: number; s: number; l: number } {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }

    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  static excludeDarkAndLightColors(hexColors: string[]): string[] {
    return hexColors.filter((hex) => {
      if (hex.toLowerCase() === '#ffffff') return false;
      const { s, l } = ColorHelpers.hexToHsl(hex);
      if (s < 20) return false;
      if (l < 20 || l > 80) return false;
      if (s < 40 && l > 70) return false;
      return true;
    });
  }

  static getContrastColor(backgroundColor: string, target: number = 128): '#000000' | '#ffffff' {
    const hex = backgroundColor.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= target ? '#000000' : '#ffffff';
  }
}
