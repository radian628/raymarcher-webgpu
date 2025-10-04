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

@group(0) @binding(0) var tex: texture_storage_2d_array<rgba32float, write>;
@group(0) @binding(1) var prevTex: texture_storage_2d_array<rgba32float, read>;

@group(1) @binding(0) var<uniform> params : Params;
@group(1) @binding(1) var smpl : sampler;


fn rand(co: vec2f) -> f32 {
  return fract(sin(dot(co, vec2f(12.9898, 78.233))) * 43758.5453); 
}

@compute @workgroup_size(8, 8, 1) fn computeSomething(
  @builtin(global_invocation_id) id: vec3<u32>
) {

  _ = smpl;

  var value: vec3f = vec3f(0.0);

  let idnorm = vec2f(id.xy) / vec2f(params.size.xy);

  let fractpos = idnorm + vec2f(0.0, 0.0) / vec2f(params.size.xy);


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
      var totaldist = 0.0;

      for (var i = 0u; i < 4u; i++) {
        let hit = marchRay(pos, dir, 128u);
        totaldist += distance(pos, hit.pos);
        pos = hit.pos + hit.normal * 0.001;
        dir = reflect(dir, normalize(
          hit.normal + vec3f(
            rand(idnorm + params.rand),
            rand(idnorm + params.rand + 1.0),
            rand(idnorm + params.rand + 2.0)
          ) * 0.1
        ));
        normal = hit.normal;
        didHit = hit.hit;
        emission += abs(dot(lightdir, normal)) * pow(0.5, f32(i) + 1.0);
        value += vec3(0.5) * pow(0.5, f32(i)) * max(0.0, dot(normal, dir));
      }


  let fwdpos = originalPos + originalDir * totaldist;

  let posInCurrentFramePerspective = vec4f(fwdpos, 1.0) * params.transformInv;
  let posInLastFramePerspective = vec4f(fwdpos, 1.0) * params.lastTransformInverse;
  let lastFrameCoords = posInLastFramePerspective.xy / posInLastFramePerspective.z;
  let lastFrameUV = lastFrameCoords * 0.5 + 0.5;
  let preverr = textureLoad(prevTex, id.xy, 2u).xy;

  let reprojOffset = 
    modf(
      (lastFrameUV - fractpos) * vec2f(params.size.xy)
      + vec2(0.5, 0.5) * 0.0 
      + preverr
    ); 
  
  let reprojSamplePos = vec2i(
    vec2f(id.xy) + reprojOffset.whole
  );

  let prevcol = textureLoad(prevTex, reprojSamplePos, 0u);
  let prevpos = textureLoad(prevTex, reprojSamplePos, 1u);

  var reprojFactor = 1.0 / clamp(prevpos.w, 1.0, 30.0);

  let reprojFailed = 
    abs(length(prevpos.xyz - fwdpos)) > 0.2
    || reprojSamplePos.x >= i32(params.size.x)
    || reprojSamplePos.y >= i32(params.size.y)
    || reprojSamplePos.x < 0 
    || reprojSamplePos.y < 0;

  if (
    reprojFailed
  ) {
    reprojFactor = 1.0;
  }

  let currColor = vec4f(value / 1.0, 1.0);
  let mixColor = mix(prevcol, currColor, reprojFactor);
  // let mixColor = prevcol + currColor;

  textureStore(tex, id.xy, 0u, mixColor);
  textureStore(tex, id.xy, 1u, vec4f(
    fwdpos,
    select(prevpos.w + 1.0, 0.0, reprojFailed)
  ));
  textureStore(tex, id.xy, 2u, vec4f(reprojOffset.fract, 0.0, 0.0));
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