#version 300 es
precision highp float;
in vec2 v_texCoord;
in vec4 v_color;
in float v_shapeID;
out vec4 outColor;

// SDF Shape Functions
float sdCircle(vec2 p, float r) { return length(p) - r; }
float sdBox(vec2 p, vec2 b) { vec2 d = abs(p)-b; return length(max(d,0.0)) + min(max(d.x,d.y),0.0); }

void main() {
    float d = (v_shapeID < 0.5) ? sdCircle(v_texCoord, 0.8) : sdBox(v_texCoord, vec2(0.7));
    float alpha = 1.0 - smoothstep(-0.02, 0.02, d);
    if (alpha < 0.1) discard;
    outColor = vec4(v_color.rgb, v_color.a * alpha);
}
