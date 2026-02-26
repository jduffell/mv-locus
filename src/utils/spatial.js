import RBush from 'rbush';

export class SpatialIndex {
  constructor() {
    this.tree = new RBush();
  }

  load(points) {
    const items = points.map((p, i) => ({
      minX: p.x, minY: p.y, maxX: p.x, maxY: p.y,
      index: i,
      data: p
    }));
    this.tree.clear();
    this.tree.load(items);
  }

  query(x, y, zoom) {
    const radius = 0.05 / zoom; 
    const results = this.tree.search({
      minX: x - radius, minY: y - radius,
      maxX: x + radius, maxY: y + radius
    });

    if (results.length === 0) return null;

    return results.sort((a, b) => {
      const distA = Math.hypot(a.minX - x, a.minY - y);
      const distB = Math.hypot(b.minX - x, b.minY - y);
      return distA - distB;
    })[0].data;
  }
}
