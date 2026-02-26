/**
 * src/utils/color.js
 * High-performance color utility for OurayAtlas.
 * Handles conversions for WebGL buffers and Shader Uniforms.
 */

export const ColorUtils = {
  /**
   * Converts HSL values to a normalized RGB array [r, g, b].
   * Useful for setting shader uniforms.
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} l - Lightness (0-100)
   * @returns {Float32Array} [r, g, b] normalized 0.0 - 1.0
   */
  hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = this._hueToRgb(p, q, h + 1 / 3);
      g = this._hueToRgb(p, q, h);
      b = this._hueToRgb(p, q, h - 1 / 3);
    }

    return new Float32Array([r, g, b]);
  },

  _hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  },

  /**
   * Converts a Hex string to a normalized RGB array.
   * @param {string} hex - e.g. "#FF0000" or "FF0000"
   */
  hexToRgb(hex) {
    const r = parseInt(hex.slice(-6, -4), 16) / 255;
    const g = parseInt(hex.slice(-4, -2), 16) / 255;
    const b = parseInt(hex.slice(-2), 16) / 255;
    return new Float32Array([r, g, b]);
  },

  /**
   * Packs an RGB color into a single Float32 for compact GPU storage.
   * Used in the Renderer to keep point data buffers lean.
   */
  packColor(r, g, b, a = 1.0) {
    const rgba = 
      ((a * 255) << 24) |
      ((b * 255) << 16) |
      ((g * 255) << 8) |
      (r * 255);
    // Use a view to interpret the integer as a float without conversion
    const view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, rgba, true);
    return view.getFloat32(0, true);
  },

  /**
   * Generates a smooth gradient array between two HSL colors.
   * Perfect for generating dotAtlas style 'colorBands' automatically.
   */
  interpolateHsl(colorA, colorB, factor) {
    const h = colorA.h + factor * (colorB.h - colorA.h);
    const s = colorA.s + factor * (colorB.s - colorA.s);
    const l = colorA.l + factor * (colorB.l - colorA.l);
    return this.hslToRgb(h, s, l);
  }
};
