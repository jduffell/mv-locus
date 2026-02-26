import { Renderer } from './core/renderer.js';
import { SpatialIndex } from './utils/spatial.js';
import { LabelManager } from './layers/labels.js';
import { Camera } from './core/camera.js';
import { OutlineLayer } from './layers/outline.js';

export class DotAtlas {
  constructor(options) {
    this.element = options.element;
    this.options = options;
    
    // Core Modules
    this.renderer = new Renderer(this.element);
    this.spatial = new SpatialIndex();
    this.labels = new LabelManager();
    this.camera = new Camera(() => this.redraw());
    this.outlineLayer = new OutlineLayer(this.renderer.gl);

    // Initial State
    if (options.points) this.set('points', options.points);
    if (options.layers) this.set('layers', options.layers);
    
    this._setupInteractions();
  }

  static supported() { return !!window.WebGL2RenderingContext; }

  static embed(opts) { return new DotAtlas(opts); }

  set(key, value) {
    this.options[key] = value;
    if (key === 'points') {
      this.spatial.load(value);
      this.labels.process(value);
      this.renderer.updateData(value);
    }
    this.redraw();
  }

  on(event, callback) {
    this.element.addEventListener(event, (e) => {
      const point = this.spatial.query(e.offsetX, e.offsetY, this.camera.zoom);
      if (point) callback({ point, originalEvent: e });
    });
  }

  redraw() {
    const visibleLabels = this.labels.getVisibleLabels(
      this.camera.zoom, 
      this.renderer.getViewport()
    );
    this.renderer.render(this.options.layers, visibleLabels, this.camera.pos, this.camera.zoom);
  }

  resize() {
    this.renderer.resize();
    this.redraw();
  }

  dispose() {
    this.renderer.destroy();
    this.element.innerHTML = '';
  }

  _setupInteractions() {
    // Basic interaction logic here
  }

  setSelection(indices) {
    const selectedPoints = indices.map(i => [this.points[i].x, this.points[i].y]);
    this.outlineLayer.update(selectedPoints, {
      fillColor: [1, 0.8, 0, 0.4],
      strokeColor: [1, 0.5, 0, 1]
    });
    this.redraw();
  }
}
