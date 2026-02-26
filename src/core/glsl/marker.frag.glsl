#version 300 es
precision highp float;
in vec2 v_texCoord;
in vec4 v_color;
out vec4 outColor;

float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

void main() {
    float d = sdCircle(v_texCoord, 0.8);
    float alpha = 1.0 - smoothstep(-0.05, 0.05, d);
    
    if (alpha < 0.01) discard;
    
    outColor = vec4(v_color.rgb, v_color.a * alpha);
}
