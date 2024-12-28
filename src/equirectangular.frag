precision highp float;

// The texture coordinates passed from the vertex shader
varying vec2 vUv;

uniform sampler2D diffuse;

uniform float centerLat;
uniform float centerLon;
uniform float centerHeading;

const float PI = 3.141592653589793;

const int xyz = 0;
const int yxz = 1;
const int zxy = 2;
const int zyx = 3;
const int yzx = 4;
const int xzy = 5;

vec4 eulerToQuaternion(vec3 euler, int order) {
  float x = euler.x, y = euler.y, z = euler.z;

  // http://www.mathworks.com/matlabcentral/fileexchange/
  // 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
  //	content/SpinCalc.m

  float c1 = cos(x / 2.0), c2 = cos(y / 2.0), c3 = cos(z / 2.0);
  float s1 = sin(x / 2.0), s2 = sin(y / 2.0), s3 = sin(z / 2.0);

  if (order == xyz) {
    return vec4(
        s1 * c2 * c3 + c1 * s2 * s3,
        c1 * s2 * c3 - s1 * c2 * s3,
        c1 * c2 * s3 + s1 * s2 * c3,
        c1 * c2 * c3 - s1 * s2 * s3
    );
  } else if (order == yxz) {
    return vec4(
        s1 * c2 * c3 + c1 * s2 * s3,
        c1 * s2 * c3 - s1 * c2 * s3,
        c1 * c2 * s3 - s1 * s2 * c3,
        c1 * c2 * c3 + s1 * s2 * s3
    );
  } else if (order == zxy) {
    return vec4(
        s1 * c2 * c3 - c1 * s2 * s3,
        c1 * s2 * c3 + s1 * c2 * s3,
        c1 * c2 * s3 + s1 * s2 * c3,
        c1 * c2 * c3 - s1 * s2 * s3
    );
  } else if (order == zyx) {
    return vec4(
        s1 * c2 * c3 - c1 * s2 * s3,
        c1 * s2 * c3 + s1 * c2 * s3,
        c1 * c2 * s3 - s1 * s2 * c3,
        c1 * c2 * c3 + s1 * s2 * s3
    );
  } else if (order == yzx) {
    return vec4(
        s1 * c2 * c3 + c1 * s2 * s3,
        c1 * s2 * c3 + s1 * c2 * s3,
        c1 * c2 * s3 - s1 * s2 * c3,
        c1 * c2 * c3 - s1 * s2 * s3
    );
  } else if (order == xzy) {
    return vec4(
        s1 * c2 * c3 - c1 * s2 * s3,
        c1 * s2 * c3 - s1 * c2 * s3,
        c1 * c2 * s3 + s1 * s2 * c3,
        c1 * c2 * c3 + s1 * s2 * s3
    );
  } else {
    return vec4(0.0, 0.0, 0.0, 1.0);
  }
}

mat4 quaternionToRotationMatrix(vec4 q) {
  float x = q.x, y = q.y, z = q.z, w = q.w;
  float x2 = x + x, y2 = y + y, z2 = z + z;
  float xx = x * x2, xy = x * y2, xz = x * z2;
  float yy = y * y2, yz = y * z2, zz = z * z2;
  float wx = w * x2, wy = w * y2, wz = w * z2;

  return mat4(
      1.0 - (yy + zz),
      xy + wz,
      xz - wy,
      0.0,

      xy - wz,
      1.0 - (xx + zz),
      yz + wx,
      0.0,

      xz + wy,
      yz - wx,
      1.0 - (xx + yy),
      0.0,

      0.0,
      0.0,
      0.0,
      1.0
  );
}

vec3 rotationMatrixToEuler(mat4 m, int order) {
  // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
  float m11 = m[0][0], m12 = m[1][0], m13 = m[2][0];
  float m21 = m[0][1], m22 = m[1][1], m23 = m[2][1];
  float m31 = m[0][2], m32 = m[1][2], m33 = m[2][2];

  vec3 e;

  if (order == xyz) {
    e.y = asin(clamp(m13, -1.0, 1.0));

    if (abs(m13) < 0.9999999) {
      e.x = atan(-m23, m33);
      e.z = atan(-m12, m11);
    } else {
      e.x = atan(m32, m22);
      e.z = 0.0;
    }
  } else if (order == yxz) {
    e.x = asin(-clamp(m23, -1.0, 1.0));

    if (abs(m23) < 0.9999999) {
      e.y = atan(m13, m33);
      e.z = atan(m21, m22);
    } else {
      e.y = atan(-m31, m11);
      e.z = 0.0;
    }
  } else if (order == zxy) {
    e.x = asin(clamp(m32, -1.0, 1.0));

    if (abs(m32) < 0.9999999) {
      e.y = atan(-m31, m33);
      e.z = atan(-m12, m22);
    } else {
      e.y = 0.0;
      e.z = atan(m21, m11);
    }
  } else if (order == zyx) {
    e.y = asin(-clamp(m31, -1.0, 1.0));

    if (abs(m31) < 0.9999999) {
      e.x = atan(m32, m33);
      e.z = atan(m21, m11);
    } else {
      e.x = 0.0;
      e.z = atan(-m12, m22);
    }
  } else if (order == yzx) {
    e.z = asin(clamp(m21, -1.0, 1.0));

    if (abs(m21) < 0.9999999) {
      e.x = atan(-m23, m22);
      e.y = atan(-m31, m11);
    } else {
      e.x = 0.0;
      e.y = atan(m13, m33);
    }
  } else if (order == xzy) {
    e.z = asin(-clamp(m12, -1.0, 1.0));

    if (abs(m12) < 0.9999999) {
      e.x = atan(m32, m22);
      e.y = atan(m13, m11);
    } else {
      e.x = atan(-m23, m33);
      e.y = 0.0;
    }
  }

  return e;
}

vec3 quaternionToEuler(vec4 q, int order) {
  mat4 matrix = quaternionToRotationMatrix(q);

  return rotationMatrixToEuler(matrix, order);
}

vec4 quaternionMultiply(vec4 a, vec4 b) {
  return vec4(
      a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
      a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
      a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
      a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
  );
}

void main() {
  vec3 e = quaternionToEuler(
      quaternionMultiply(
          eulerToQuaternion(vec3(vUv.x * PI * 2.0, vUv.y * PI, 0.0), xyz),
          eulerToQuaternion(vec3(centerLon, centerLat, centerHeading), xyz)
      ),
      xyz
  );

  if (false) {
    gl_FragColor = vec4(
        fract(e.x / (PI * 2.0)),
        fract(e.y / (PI * 2.0)),
        fract(e.z / (PI * 2.0)),
        1.0
    );
  } else {
    gl_FragColor =
        texture2D(diffuse, vec2(fract(e.x / (PI * 2.0)), fract(e.y / PI)));
  }
}
