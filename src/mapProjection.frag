precision highp float;

// The texture coordinates passed from the vertex shader
varying vec2 vUv;

uniform sampler2D diffuse;

void main() {
    gl_FragColor = texture2D(diffuse, vUv);
}
