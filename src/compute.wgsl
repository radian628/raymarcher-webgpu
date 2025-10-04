struct B {
  test: array<vec4u, 4>,
}

struct Params {
  size: vec2<u32>,
  rand: vec2f,
  transformInv: mat4x4f,
  transform: mat4x4f,
  lastTransformInverse: mat4x4f,
  lastTransform: mat4x4f,
  brightnessFactor: f32
}

@group(0) @binding(0) var color: texture_storage_2d<rgba32float, write>;
@group(0) @binding(1) var prevColor: texture_storage_2d<rgba32float, read>;
@group(0) @binding(2) var worldSpacePosition: texture_storage_2d<rgba32float, write>;
@group(0) @binding(3) var prevWorldSpacePosition: texture_storage_2d<rgba32float, read>;
@group(0) @binding(4) var accumulatedReprojectionError: texture_storage_2d<rgba32float, write>;
@group(0) @binding(5) var prevAccumulatedReprojectionError: texture_storage_2d<rgba32float, read>;

@group(1) @binding(0) var<uniform> params : Params;
@group(1) @binding(1) var smpl : sampler;


fn rand(co: vec2f) -> f32 {
  return fract(sin(dot(co, vec2f(12.9898, 78.233))) * 43758.5453); 
}

@compute @workgroup_size(8, 8, 1) fn computeSomething(
  @builtin(global_invocation_id) id: vec3<u32>
) {

  _ = smpl;
  _ = accumulatedReprojectionError;
  _ = prevAccumulatedReprojectionError;

  var value: vec3f = vec3f(0.0);

  let idnorm = vec2f(id.xy) / vec2f(params.size.xy);

  let fractpos = idnorm + vec2f(0.0, 0.0) / vec2f(params.size.xy);

  _ = textureLoad(prevWorldSpacePosition, id.xy);
  // let prevpos = textureLoad(prevWorldSpacePosition, id.xy);
  // let prevorigin = (vec4f(0.0, 0.0, 0.0, 1.0) * params.lastTransform).xyz;
  // let reprojectedPos = prevpos * params.lastTransformInverse;
  // let sampleCoord = reprojectedPos.xy / reprojectedPos.z;
  // let prevcol = textureSampleLevel(prevColor, smpl, vec2f(sampleCoord * 0.5 + 0.5), 0);

      var originalPos = (vec4f(0.0, 0.0, 0.0, 1.0) * params.transform).xyz;
      var pos = originalPos;
      var originalDir = (
        vec4(normalize(vec3f(fractpos * 2.0 - 1.0, 1.0)), 0.0) 
        * params.transform
      ).xyz;
      var dir = originalDir;
      
      var normal: vec3f;
      var didHit: bool;
      var emission = vec3f(0.0);
      let lightdir = normalize(vec3f(1.0, 1.0, -1.0));

      for (var i = 0u; i < 1u; i++) {
        let hit = marchRay(pos, dir, 128u);
        pos = hit.pos + hit.normal * 0.001;
        dir = reflect(dir, hit.normal);
        normal = hit.normal;
        didHit = hit.hit;
        emission += abs(dot(lightdir, normal)) * pow(0.5, f32(i) + 1.0);
      }

      value += select(
        select(vec3f(1.0 * params.brightnessFactor, 0.0, 0.0), vec3f(fract(length(pos)) * 0.5), fract(length(pos) * 1.0) > 0.2),
        vec3f(0.0),
        !didHit || (rand(idnorm + params.rand) > length(emission)),
      );

  let posInCurrentFramePerspective = vec4f(pos, 1.0) * params.transformInv;
  let posInLastFramePerspective = vec4f(pos, 1.0) * params.lastTransformInverse;
  let lastFrameCoords = posInLastFramePerspective.xy / posInLastFramePerspective.z;
  let lastFrameUV = lastFrameCoords * 0.5 + 0.5;

  let reprojOffset = (lastFrameUV - fractpos) * 1.0 + vec2(0.5, 0.5) / vec2f(params.size.xy); 
  
  let reprojNormalizedPos = fractpos + reprojOffset;

  let reprojSamplePos = vec2u(
    vec2f(params.size.xy) * reprojNormalizedPos
  );

  let prevcol = textureLoad(prevColor, reprojSamplePos);
  let prevpos = textureLoad(prevWorldSpacePosition, reprojSamplePos);

  var reprojFactor = 0.0;

  let reprojFailed = 
    abs(length(prevpos.xyz - pos)) > 0.1
    || reprojNormalizedPos.x > 1.0 
    || reprojNormalizedPos.x < 0.0 
    || reprojNormalizedPos.y > 1.0 
    || reprojNormalizedPos.y < 0.0;

  if (
    reprojFailed
  ) {
    reprojFactor = 1.0;
  }

  let currColor = vec4f(value / 1.0, 1.0);
  let mixColor = mix(prevcol + currColor, currColor, reprojFactor);
  // let mixColor = prevcol + currColor;

  textureStore(color, id.xy, mixColor);
  textureStore(worldSpacePosition, id.xy, vec4f(
    pos,
    select(prevpos.w + 1.0, 0.0, reprojFailed)
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