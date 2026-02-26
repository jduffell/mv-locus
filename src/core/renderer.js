import { MarkerShaders, ElevationShaders } from './shaders.js';
import { ColorUtils } from '../utils/color.js';

export class Renderer {
  constructor(container) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
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
      data[off+2] = p.size || 1.0;
      const c = ColorUtils.hexToRgb(p.color || "#ff0000");
      colors[off * 4 + 12] = c[0] * 255;
      colors[off * 4 + 13] = c[1] * 255;
      colors[off * 4 + 14] = c[2] * 255;
      colors[off * 4 + 15] = (p.opacity ?? 1.0) * 255;
    });

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
    this.pointsCount = points.length;
  }

  render(layers, labels, cameraPos, zoom) {
    const gl = this.gl;
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    const markerScale = Math.sqrt(zoom);

    gl.useProgram(this.markerProgram);
    gl.bindVertexArray(this.markerVAO);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.pointsCount);
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
    // Simplified viewport calculation
    return { minX: -1, minY: -1, maxX: 1, maxY: 1 };
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
