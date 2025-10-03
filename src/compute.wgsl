struct B {
  test: array<vec4u, 4>,
}

struct Params {
  size: vec2<u32>,
  @align(16) b: B,
  deeznuts: vec4<f32>,
  mvp: mat4x4<f32>
}

@group(0) @binding(0) var tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> params : Params;

@compute @workgroup_size(8, 8, 1) fn computeSomething(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  var value: vec3f = vec3f(0.0);

  let idnorm = vec2f(id.xy) / vec2f(params.size.xy);

  for (var y = 0.0; y < 1.0; y += 0.1) {
    for (var x = 0.0; x < 1.0; x += 0.1) {
      let fractpos = idnorm + vec2f(x, y) / vec2f(params.size.xy);

      var pos = vec3f(-0.5, -0.5, -5.35);
      var dir = normalize(vec3f(fractpos * 2.0 - 1.0, 1.0));
      var normal: vec3f;
      var didHit: bool;
      var emission = vec3f(0.0);
      let lightdir = normalize(vec3f(1.0, 1.0, -1.0));

      for (var i = 0u; i < 6u; i++) {
        let hit = marchRay(pos, dir, 512u);
        pos = hit.pos + hit.normal * 0.001;
        dir = reflect(dir, hit.normal);
        normal = hit.normal;
        didHit = hit.hit;
        emission += abs(dot(lightdir, normal)) * pow(0.5, f32(i) + 1.0);
      }

      value += select(
        emission,
        vec3f(0.0, 0.0, 0.0),
        !didHit,
      );
    }
  }

  textureStore(tex, id.xy, vec4f(
    value / 100.0,
    1.0
  ));
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