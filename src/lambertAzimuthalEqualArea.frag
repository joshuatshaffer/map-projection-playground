precision highp float;

// The texture coordinates passed from the vertex shader
varying vec2 vUv;

uniform sampler2D diffuse;

uniform mat4 rotation;

const float PI = 3.141592653589793;

vec3 cartesianToSpherical(vec3 c) {
  return vec3(atan(c.y, c.x), atan(c.z, length(c.xy)), length(c));
}

void main() {
  vec2 xy = (vUv * 4.0 - 2.0);

  float c = dot(xy, xy);

  if (c > 4.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  vec3 cartesian = vec3(c / 2.0 - 0.5, -xy * sqrt(1.0 - c / 4.0));

  cartesian = (vec4(cartesian, 0.0) * rotation).xyz;

  vec3 spherical = cartesianToSpherical(cartesian);

  vec2 geo = vec2(spherical.x, PI / 2.0 - spherical.y);

  vec2 uv = vec2(fract(geo.x / (PI * 2.0)), fract(geo.y / PI));

  gl_FragColor = texture2D(diffuse, uv);
}
