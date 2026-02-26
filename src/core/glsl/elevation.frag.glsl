#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_density;
uniform vec4 u_elevationColor; // RGB + scale

void main() {
    float density = texture(u_density, v_texCoord).r;
    
    // Simulate "Topographic" ridges
    float elevation = density * 25.0;
    float levels = 10.0;
    float isolines = abs(fract(elevation * levels - 0.5) - 0.5) / fwidth(elevation * levels);
    float line = 1.0 - smoothstep(0.0, 1.5, isolines);

    // Color based on density (mountain peak logic)
    vec3 baseCol = u_elevationColor.rgb;
    vec3 mountainCol = mix(baseCol * 0.2, baseCol, density);
    
    // Add contour lines
    vec3 finalCol = mix(mountainCol, vec3(1.0, 1.0, 1.0), line * 0.3 * density);
    
    outColor = vec4(finalCol, density * u_elevationColor.a);
}
