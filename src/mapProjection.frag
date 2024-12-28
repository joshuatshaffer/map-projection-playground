precision highp float;

// The texture coordinates passed from the vertex shader
varying vec2 vUv;

uniform sampler2D diffuse;

uniform float centerLat;
uniform float centerLon;

const float PI = 3.141592653589793;

void main() {
  vec2 foo = (vUv * 2.0 - 1.0) * PI;
  float c = length(foo);

  if (c > PI) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float lat =
      asin(cos(c) * sin(centerLat) + (foo.y * sin(c) * cos(centerLat) / c));

  float lon = centerLon +
              atan(
                  foo.x * sin(c),
                  c * cos(centerLat) * cos(c) - foo.y * sin(centerLat) * sin(c)
              );

  vec2 uv = vec2(fract(lon / (PI * 2.0) + 0.5), fract(lat / PI + 0.5));
  gl_FragColor = texture2D(diffuse, uv);
}
