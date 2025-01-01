precision highp float;

// The texture coordinates passed from the vertex shader
varying vec2 vUv;

uniform sampler2D diffuse;

uniform mat4 rotation;

const float PI = 3.141592653589793;

vec3 sphericalToCartesian(vec3 s) {
  vec2 h = vec2(cos(s.x), sin(s.x));
  vec2 v = vec2(cos(s.y), sin(s.y));
  return vec3(h * v.x, v.y) * s.z;
}

vec3 cartesianToSpherical(vec3 c) {
  return vec3(atan(c.y, c.x), atan(c.z, length(c.xy)), length(c));
}

void main() {
  vec2 geo = vec2(vUv.x * PI * 2.0, vUv.y * PI);

  vec3 spherical = vec3(geo.x, PI / 2.0 - geo.y, 1.0);

  vec3 cartesian = sphericalToCartesian(spherical);

  cartesian = (vec4(cartesian, 0.0) * rotation).xyz;

  spherical = cartesianToSpherical(cartesian);

  geo = vec2(spherical.x, PI / 2.0 - spherical.y);

  vec2 uv = vec2(fract(geo.x / (PI * 2.0)), fract(geo.y / PI));

  gl_FragColor = texture2D(diffuse, uv);
}
