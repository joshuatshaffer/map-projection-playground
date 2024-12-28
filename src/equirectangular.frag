precision highp float;

// The texture coordinates passed from the vertex shader
varying vec2 vUv;

uniform sampler2D diffuse;

uniform float centerLon;

const float PI = 3.141592653589793;

void main() {
  gl_FragColor =
      texture2D(diffuse, vec2(fract(vUv.x + centerLon / (PI * 2.0)), vUv.y));
}
