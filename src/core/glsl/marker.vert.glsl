#version 300 es
layout(location = 0) in vec2 a_quad;
layout(location = 1) in vec3 a_inst_pos;
layout(location = 2) in vec4 a_inst_col;

uniform mat4 u_matrix;
uniform float u_marker_scale;

out vec2 v_texCoord;
out vec4 v_color;

void main() {
    v_texCoord = a_quad;
    v_color = a_inst_col;
    
    float size = a_inst_pos.z * u_marker_scale;
    vec2 pos = a_inst_pos.xy + a_quad * size;
    
    gl_Position = u_matrix * vec4(pos, 0.0, 1.0);
}
