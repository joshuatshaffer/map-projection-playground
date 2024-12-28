precision highp float;

// The texture coordinates passed from the vertex shader
varying vec2 vUv;

uniform sampler2D diffuse;

uniform mat4 rotation;

const float PI = 3.141592653589793;

vec3 sphericalToCartesian(vec3 s) {
  return vec3(
      cos(s.y) * cos(s.x) * s.z, cos(s.y) * sin(s.x) * s.z, sin(s.y) * s.z
  );
}

vec3 cartesianToSpherical(vec3 c) {
  return vec3(
      atan(c.y, c.x), atan(c.z, sqrt(c.x * c.x + c.y * c.y)), length(c)
  );
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
