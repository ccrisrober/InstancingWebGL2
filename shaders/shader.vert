#version 300 es
precision mediump float;

layout (location = 0) in vec2 position;
layout (location = 1) in vec3 color;
layout (location = 2) in vec2 offset;

out vec3 fColor;

void main()
{
    vec2 pos = position/10.0;// * (float(100-gl_InstanceID) / 100.0);
    gl_Position = vec4(pos + offset, 0.0f, 1.0f);
    fColor = color;
}  