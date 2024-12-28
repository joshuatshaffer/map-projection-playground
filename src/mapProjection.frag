precision highp float;

// The texture coordinates passed from the vertex shader
varying vec2 vUv;

uniform sampler2D diffuse;

uniform float centerLon;

void main() {
    gl_FragColor = texture2D(diffuse, vec2(fract(vUv.x - centerLon / 360.0), vUv.y));
}
