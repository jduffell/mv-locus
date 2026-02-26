/**
 * labels.js: High-performance SDF text rendering and collision logic.
 */
export class LabelManager {
  constructor() {
    this.labels = [];
    this.visibleLabels = [];
    // Greedy collision grid size (pixels)
    this.gridSize = 32; 
  }

  process(points) {
    // Filter points that have labels and sort by priority/elevation
    this.labels = points
      .filter(p => p.label)
      .sort((a, b) => (b.elevation || 0) - (a.elevation || 0));
  }

  getVisibleLabels(zoom, viewportBounds) {
    const occupied = new Set();
    const visible = [];

    for (const label of this.labels) {
      // 1. Simple viewport culling
      if (!this._isInBounds(label, viewportBounds)) continue;

      // 2. Greedy collision detection
      const gridX = Math.floor(label.x / (this.gridSize / zoom));
      const gridY = Math.floor(label.y / (this.gridSize / zoom));
      const key = `${gridX},${gridY}`;

      if (!occupied.has(key)) {
        visible.push(label);
        occupied.add(key);
        // Mark neighbors as occupied to prevent tight clusters
        occupied.add(`${gridX+1},${gridY}`);
        occupied.add(`${gridX-1},${gridY}`);
      }
    }
    return visible;
  }

  _isInBounds(p, b) {
    return p.x >= b.minX && p.x <= b.maxX && p.y >= b.minY && p.y <= b.maxY;
  }
}
