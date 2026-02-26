#version 300 es
layout(location = 0) in vec2 a_quad;
layout(location = 1) in vec3 a_inst_pos; // x, y, size
layout(location = 2) in vec4 a_inst_col; // packed rgba
layout(location = 3) in float a_shape_id;
uniform mat4 u_matrix;
out vec2 v_texCoord;
out vec4 v_color;
out float v_shapeID;
void main() {
    v_texCoord = a_quad;
    v_color = a_inst_col;
    v_shapeID = a_shape_id;
    vec4 worldPos = vec4(a_inst_pos.xy + a_quad * a_inst_pos.z * 0.01, 0, 1);
    gl_Position = u_matrix * worldPos;
}
