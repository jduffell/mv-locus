/**
 * src/core/shaders.js
 * Consolidated GLSL for markers, elevation, and labels.
 */
import markerVert from './glsl/marker.vert.glsl';
import markerFrag from './glsl/marker.frag.glsl';

export const MarkerShaders = {
  vertex: markerVert,
  fragment: markerFrag
};

export const ElevationShaders = {
  vertex: `#version 300 es
    in vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
    }`,
  fragment: `#version 300 es
    precision highp float;

    uniform sampler2D u_density;
    uniform vec4 u_colorBands[10]; // [r, g, b, threshold]
    uniform int u_bandCount;

    // Lighting params
    uniform float u_lightAzimuth;   // Direction (0 to 2PI)
    uniform float u_lightAltitude;  // Height (0 to PI/2, where PI/4 is 'noon')
    uniform float u_lightIntensity;

    // Contour params
    uniform float u_contourWidth;   // pixels
    uniform float u_contourOpacity;

    in vec2 v_texCoord;
    out vec4 outColor;

    void main() {
        float d = texture(u_density, v_texCoord).r;
        if (d < 0.001) discard; // The "sea" layer

        // 1. Map Density to Color Band
        vec3 baseColor = u_colorBands[0].rgb;
        for(int i = 0; i < u_bandCount - 1; i++) {
            if(d > u_colorBands[i].a) baseColor = u_colorBands[i+1].rgb;
        }

        // 2. Hill Shading (Normal Mapping)
        float step = 1.0 / 512.0; 
        float s01 = texture(u_density, v_texCoord + vec2(-step, 0.0)).r;
        float s21 = texture(u_density, v_texCoord + vec2(step, 0.0)).r;
        float s10 = texture(u_density, v_texCoord + vec2(0.0, -step)).r;
        float s12 = texture(u_density, v_texCoord + vec2(0.0, step)).r;
        
        vec3 normal = normalize(vec3(s01 - s21, s10 - s12, 0.1));

        vec3 lightDir = vec3(
            cos(u_lightAzimuth) * cos(u_lightAltitude),
            sin(u_lightAzimuth) * cos(u_lightAltitude),
            sin(u_lightAltitude)
        );

        float shading = max(0.2, dot(normal, lightDir)) * u_lightIntensity;
        
        // 3. Contour Lines
        float contour = 0.0;
        for(int i = 0; i < u_bandCount; i++) {
            float threshold = u_colorBands[i].a;
            float dist = abs(d - threshold) / fwidth(d);
            if (dist < u_contourWidth) {
                contour = 1.0 - smoothstep(u_contourWidth * 0.5, u_contourWidth, dist);
            }
        }

        vec3 finalColor = mix(baseColor * shading, vec3(0.0), contour * u_contourOpacity);
        outColor = vec4(finalColor, 1.0);
    }`
};
