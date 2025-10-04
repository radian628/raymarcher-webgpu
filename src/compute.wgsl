struct B {
  test: array<vec4u, 4>,
}

struct Params {
  size: vec2<u32>,
  rand: vec2f,
  transform: mat4x4f,
  transformInv: mat4x4f,
  lastTransformInverse: mat4x4f,
  lastTransform: mat4x4f,
  brightnessFactor: f32,
  shouldReset: u32,
  aspect: f32,
}

@group(0) @binding(0) var tex: texture_storage_2d_array<rgba32float, write>;
@group(0) @binding(1) var prevTex: texture_storage_2d_array<rgba32float, read>;

@group(1) @binding(0) var<uniform> params : Params;
@group(1) @binding(1) var smpl : sampler;


fn rand(co: vec2f) -> f32 {
  return fract(sin(dot(co, vec2f(12.9898, 78.233))) * 43758.5453); 
}

fn r(hsv: vec3f) -> f32 {
  return pow(cos(hsv.x * 3.141592 * 2.0) * 0.5 * hsv.y + 0.5 * hsv.z, 0.6);
}

fn hsl2rgb(hsl: vec3f) -> vec3f {
  return vec3f(
    r(hsl),
    r(hsl - 0.33333333),
    r(hsl - 0.66666666)
  );
}

@compute @workgroup_size(8, 8, 1) fn computeSomething(
  @builtin(global_invocation_id) id: vec3<u32>
) {

  _ = smpl;

  var value: vec3f = vec3f(0.0);

  let idnorm = vec2f(id.xy) / vec2f(params.size.xy);

  let fractpos = idnorm + params.rand / vec2f(params.size.xy);

  var originalPos = (vec4f(0.0, 0.0, 0.0, 1.0) * params.transform).xyz;

  // var originalPos = params.transform[3].xyz;

  var pos = originalPos;
  var originalDir = (
    vec4(normalize(vec3f(1.0, params.aspect, 1.0) * vec3f(fractpos * 2.0 - 1.0, 1.0)), 0.0) 
    * params.transform
  ).xyz;
  var dir = originalDir;
      
  var normal: vec3f;
  var didHit: bool;
  var emission = vec3f(0.0);
  let lightdir = normalize(vec3f(1.0, 1.0, -1.0));
  var totaldist = 0.0;

  for (var i = 0u; i < 8u; i++) {
    let hit = marchRay(pos, dir, 256u);
    totaldist += distance(pos, hit.pos);
    pos = hit.pos + hit.normal * 0.001;
    dir = reflect(dir, normalize(
      hit.normal + (vec3f(
        rand(idnorm + params.rand),
        rand(idnorm + params.rand + 1.0),
        rand(idnorm + params.rand + 2.0)
       ) - 0.5) * vec3f(0.0)
    ));
    normal = hit.normal;
    didHit = hit.hit;
    let factor = f32(i % 2u) * 2.0 - 1.0;
    let colorBase = hsl2rgb(vec3f(f32(i) / 8.0 * 2.9 + 0.2, 1.0, 1.0));
    let incidence = max(0.0, select(0.0, 1.0, dot(dir, normal) < 0.2 + f32(i) * 0.01));

    value += factor * colorBase * 0.0 + colorBase * incidence * 2.0;
  }

  let prevcol = textureLoad(prevTex, id.xy, 0u);
  let prevpos = textureLoad(prevTex, id.xy, 1u);

  let currColor = vec4f(value / 1.0, 1.0);
  let mixColor = prevcol + currColor;

  if (params.shouldReset == 1u) {
    textureStore(tex, id.xy, 0u, currColor);
    textureStore(tex, id.xy, 1u, vec4f(
      pos,
      1.0
    ));
  } else {
    textureStore(tex, id.xy, 0u, mixColor);
    textureStore(tex, id.xy, 1u, vec4f(
      pos,
      prevpos.w + 1.0
    ));
  }
}

struct HitInfo {
  hit: bool,
  pos: vec3f,
  normal: vec3f,
}

fn marchRay(
  pos: vec3f,
  dir: vec3f,
  iters: u32
) -> HitInfo {
  var posTemp = pos;
  for (var i = 0u; i < iters; i++) {
    let dist = sdf(posTemp);
    posTemp += dir * dist;
  }

  let distSample = sdf(posTemp);

  let normal = normalize(vec3f(
    sdf(posTemp + vec3f(0.01, 0.0, 0.0)) - distSample,
    sdf(posTemp + vec3f(0.0, 0.01, 0.0)) - distSample,
    sdf(posTemp + vec3f(0.0, 0.0, 0.01)) - distSample,
  ));

  return HitInfo(
    distSample < 0.01,
    posTemp,
    normal,
  );
}

// MARCH_FUNCTION 