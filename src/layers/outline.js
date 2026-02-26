/**
 * outline.js: Generates "halo" geometry for clusters.
 */
import concaveman from 'concaveman';
import earcut from 'earcut';

class OutlineGenerator {
  /**
   * Generates a mesh for the cluster boundary.
   * @param {Array} points - Array of [x, y] coordinates.
   * @param {number} concavity - 1 = convex, higher = more concave.
   * @param {number} padding - Extra space around the points.
   */
  static generate(points, concavity = 2.0, padding = 0.05) {
    if (points.length < 3) return null;

    const hullPoints = concaveman(points, concavity, padding);

    const flatPoints = [];
    for (const p of hullPoints) {
      flatPoints.push(p[0], p[1]);
    }

    const indices = earcut(flatPoints);

    return {
      vertices: new Float32Array(flatPoints),
      indices: new Uint16Array(indices),
      count: indices.length
    };
  }
}

export class OutlineLayer {
  constructor(gl) {
    this.gl = gl;
    this.vertexBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();
    this.count = 0;
  }

  update(points, style = {}) {
    const geo = OutlineGenerator.generate(points);
    if (!geo) return;

    const gl = this.gl;
    this.count = geo.count;
    this.style = {
      fillColor: style.fillColor || [0, 0.5, 1, 0.3], // RGBA
      strokeColor: style.strokeColor || [0, 0.5, 1, 1]
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);
  }

  draw(program, cameraMatrix) {
    if (this.count === 0) return;

    const gl = this.gl;
    gl.useProgram(program);

    gl.uniformMatrix4fv(program.u_matrix, false, cameraMatrix);
    gl.uniform4fv(program.u_color, this.style.fillColor);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(program.a_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_position);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    
    gl.uniform4fv(program.u_color, this.style.strokeColor);
    gl.drawArrays(gl.LINE_LOOP, 0, this.count / 3);
  }
}
