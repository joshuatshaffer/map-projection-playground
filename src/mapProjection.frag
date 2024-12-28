precision highp float;

// The texture coordinates passed from the vertex shader
varying vec2 vUv;

uniform sampler2D diffuse;

uniform float centerLat;
uniform float centerLon;
uniform float centerHeading;

const float PI = 3.141592653589793;

void main() {
  vec2 xy = (vUv * 2.0 - 1.0) * PI;

  float c = length(xy);

  if (c > PI) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  xy = mat2(
           cos(-centerHeading),
           -sin(-centerHeading),
           sin(-centerHeading),
           cos(-centerHeading)
       ) *
       xy;

  float lat =
      asin(cos(c) * sin(centerLat) + (xy.y * sin(c) * cos(centerLat) / c));

  float lon = centerLon +
              atan(
                  xy.x * sin(c),
                  c * cos(centerLat) * cos(c) - xy.y * sin(centerLat) * sin(c)
              );

  vec2 uv = vec2(fract(lon / (PI * 2.0) + 0.5), fract(lat / PI + 0.5));
  gl_FragColor = texture2D(diffuse, uv);
}
