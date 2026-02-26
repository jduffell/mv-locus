export class ElevationLayer {
    constructor(gl) {
        this.gl = gl;
        this.texture = null;
        this.setupProgram();
        this.setupBuffers();
    }

    setupProgram() {
        const gl = this.gl;
        const vsSource = `#version 300 es
            layout(location = 0) in vec2 a_position;
            layout(location = 1) in vec2 a_texCoord;
            uniform mat4 u_matrix;
            out vec2 v_texCoord;
            void main() {
                v_texCoord = a_texCoord;
                gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
            }`;

        const fsSource = `#version 300 es
            precision highp float;
            in vec2 v_texCoord;
            out vec4 outColor;
            uniform sampler2D u_density;
            uniform vec4 u_color;
            void main() {
                float d = texture(u_density, v_texCoord).r;
                if (d < 0.005) discard;
                
                // Topographic effect logic
                float levels = 10.0;
                float contour = abs(fract(d * levels - 0.5) - 0.5) / fwidth(d * levels);
                float line = 1.0 - smoothstep(0.0, 1.2, contour);
                
                vec3 base = u_color.rgb * (0.4 + d * 0.6);
                vec3 final = mix(base, vec3(1.0), line * 0.3 * d);
                outColor = vec4(final, u_color.a * min(1.0, d * 4.0));
            }`;

        const vs = this.createShader(gl.VERTEX_SHADER, vsSource);
        const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource);
        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);
        
        this.uniforms = {
            u_matrix: gl.getUniformLocation(this.program, 'u_matrix'),
            u_density: gl.getUniformLocation(this.program, 'u_density'),
            u_color: gl.getUniformLocation(this.program, 'u_color')
        };
    }

    createShader(type, source) {
        const gl = this.gl;
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error('Elevation shader error:', gl.getShaderInfoLog(s));
        }
        return s;
    }

    setupBuffers() {
        const gl = this.gl;
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        
        this.posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        // Placeholders
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
        gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    }

    update(points) {
        if (!points || points.length === 0) return;
        const gl = this.gl;
        const size = 256; 
        const data = new Uint8Array(size * size);
        const density = new Float32Array(size * size);
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        points.forEach(p => {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
        });

        const pad = Math.max(maxX - minX, maxY - minY) * 0.1 || 500;
        minX -= pad; maxX += pad; minY -= pad; maxY += pad;
        this.bounds = { minX, maxX, minY, maxY };

        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        const verts = new Float32Array([
            minX, minY,
            maxX, minY,
            minX, maxY,
            maxX, maxY
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

        let maxD = 0;
        points.forEach(p => {
            const ix = Math.floor(((p.x - minX) / (maxX - minX)) * size);
            const iy = Math.floor(((p.y - minY) / (maxY - minY)) * size);
            if (ix >= 0 && ix < size && iy >= 0 && iy < size) {
                for (let ox = -10; ox <= 10; ox++) {
                    for (let oy = -10; oy <= 10; oy++) {
                        const ni = ix + ox;
                        const nj = iy + oy;
                        if (ni >= 0 && ni < size && nj >= 0 && nj < size) {
                            const dist = Math.sqrt(ox*ox + oy*oy);
                            const val = Math.max(0, (1.0 - dist/10.0));
                            density[nj * size + ni] += val;
                            if (density[nj * size + ni] > maxD) maxD = density[nj * size + ni];
                        }
                    }
                }
            }
        });

        if (maxD > 0) {
            for (let i = 0; i < density.length; i++) {
                data[i] = Math.min(255, (density[i] / maxD) * 255);
            }
        }

        if (this.texture) gl.deleteTexture(this.texture);
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, size, size, 0, gl.RED, gl.UNSIGNED_BYTE, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    draw(matrix, color = [0.2, 0.5, 1.0, 0.8]) {
        if (!this.texture || !this.bounds) {
            return;
        }
        const gl = this.gl;
        
        gl.useProgram(this.program);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.uniforms.u_density, 0);
        gl.uniform4fv(this.uniforms.u_color, color);
        gl.uniformMatrix4fv(this.uniforms.u_matrix, false, matrix);
        
        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.disable(gl.BLEND);
    }
}
