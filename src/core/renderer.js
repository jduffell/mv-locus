import { MarkerShaders, ElevationShaders } from './shaders.js';
import { ColorUtils } from '../utils/color.js';

export class Renderer {
  constructor(container) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    container.appendChild(this.canvas);
    this.gl = this.canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: false });
    
    if (!this.gl) throw new Error("WebGL2 not supported");

    this.state = { zoom: 1, center: { x: 0, y: 0 } };
    this.pointsCount = 0;
    this._initPipeline();
    this.resize();
  }

  _initPipeline() {
    const gl = this.gl;
    this.markerProgram = this._createProgram(MarkerShaders.vertex, MarkerShaders.fragment);
    this.markerProgram.uniforms = {
        u_matrix: gl.getUniformLocation(this.markerProgram, 'u_matrix'),
        u_marker_scale: gl.getUniformLocation(this.markerProgram, 'u_marker_scale'),
    };

    this.markerVAO = gl.createVertexArray();
    gl.bindVertexArray(this.markerVAO);

    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 16, 0);
    gl.vertexAttribDivisor(1, 1); 
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 16, 12);
    gl.vertexAttribDivisor(2, 1);
  }

  updateData(points) {
    const data = new Float32Array(points.length * 4);
    const colors = new Uint8Array(data.buffer);
    
    points.forEach((p, i) => {
      const off = i * 4;
      data[off] = p.x;
      data[off+1] = p.y;
      data[off+2] = p.size || 20.0; // Increased default size
      const c = ColorUtils.hexToRgb(p.color || "#ff0000"); // Red markers
      colors[off * 4 + 12] = c[0] * 255;
      colors[off * 4 + 13] = c[1] * 255;
      colors[off * 4 + 14] = c[2] * 255;
      colors[off * 4 + 15] = 255; // Full opacity
    });

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
    this.pointsCount = points.length;
  }

  render(layers, labels, cameraPos, zoom, elevationLayer, outlineLayer) {
    const gl = this.gl;
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const screenWidth = this.canvas.width;
    const screenHeight = this.canvas.height;

    // Define matrix variables BEFORE use
    const left = -screenWidth / 2;
    const right = screenWidth / 2;
    const bottom = -screenHeight / 2;
    const top = screenHeight / 2;
    const tx = -cameraPos.x;
    const ty = -cameraPos.y;

    const matrix = new Float32Array([
        2 / (right - left) * zoom, 0, 0, 0,
        0, 2 / (top - bottom) * zoom, 0, 0,
        0, 0, -1, 0,
        ((left + right) / (left - right) + tx * (2 / (right - left)) * zoom), 
        ((top + bottom) / (bottom - top) + ty * (2 / (top - bottom)) * zoom), 
        0, 1
    ]);

    // 1. Draw Elevation (Topographic) Background if enabled
    if (layers && layers.find(l => l.type === 'elevation')) {
      const elev = layers.find(l => l.type === 'elevation');
      elevationLayer.draw(matrix, elev.color || [0.2, 0.5, 1.0, 0.8]);
    }

    // 2. Draw Markers
    const markerScale = Math.sqrt(zoom);

    gl.useProgram(this.markerProgram);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.uniformMatrix4fv(this.markerProgram.uniforms.u_matrix, false, matrix);
    gl.uniform1f(this.markerProgram.uniforms.u_marker_scale, markerScale);

    gl.bindVertexArray(this.markerVAO);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.pointsCount);

    gl.disable(gl.BLEND);

    // 3. Render Labels (using Canvas 2D overlay)
    this._renderLabels(labels, cameraPos, zoom, matrix);
  }

  _renderLabels(labels, cameraPos, zoom, matrix) {
    // If not already created, create a 2D overlay for labels
    if (!this.labelCtx) {
        this.labelCanvas = document.createElement('canvas');
        this.labelCanvas.style.position = 'absolute';
        this.labelCanvas.style.top = '0';
        this.labelCanvas.style.left = '0';
        this.labelCanvas.style.pointerEvents = 'none';
        this.canvas.parentElement.style.position = 'relative';
        this.canvas.parentElement.appendChild(this.labelCanvas);
        this.labelCtx = this.labelCanvas.getContext('2d');
    }

    const dpr = window.devicePixelRatio || 1;
    if (this.labelCanvas.width !== this.canvas.width) {
        this.labelCanvas.width = this.canvas.width;
        this.labelCanvas.height = this.canvas.height;
        this.labelCanvas.style.width = this.canvas.style.width;
        this.labelCanvas.style.height = this.canvas.style.height;
    }

    const ctx = this.labelCtx;
    ctx.clearRect(0, 0, this.labelCanvas.width, this.labelCanvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = `${12 * dpr}px Arial`;
    ctx.textAlign = 'center';

    for (const label of labels) {
        // Project world coordinates to screen coordinates
        const x = (label.x - cameraPos.x) * zoom + this.canvas.width / (2 * dpr);
        const y = (label.y - cameraPos.y) * zoom + this.canvas.height / (2 * dpr);
        
        ctx.fillText(label.label, x * dpr, y * dpr);
    }
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  destroy() {
    this.canvas.remove();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  getViewport() {
    return {
      minX: -this.canvas.width / 2,
      minY: -this.canvas.height / 2,
      maxX: this.canvas.width / 2,
      maxY: this.canvas.height / 2
    };
  }

  _createProgram(vs, fs) {
    const gl = this.gl;
    const program = gl.createProgram();
    const vShader = this._createShader(vs, gl.VERTEX_SHADER);
    const fShader = this._createShader(fs, gl.FRAGMENT_SHADER);
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Cannot link program:", gl.getProgramInfoLog(program));
    }
    return program;
  }

  _createShader(source, type) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Cannot compile shader:", gl.getShaderInfoLog(shader));
    }
    return shader;
  }
}
