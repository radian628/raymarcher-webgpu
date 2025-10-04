struct VSInput {
  @builtin(vertex_index) vertexIndex: u32,
}

struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@group(0) @binding(0) var samp : sampler;
@group(0) @binding(1) var color : texture_2d<f32>;
@group(0) @binding(2) var position : texture_2d<f32>;

@vertex
fn VSMain(input: VSInput) -> VSOutput {
  var vsOut: VSOutput;

  vsOut.position = vec4(array(
    vec2( 1.0,  1.0),
    vec2( 1.0, -1.0),
    vec2(-1.0, -1.0),
    vec2( 1.0,  1.0),
    vec2(-1.0, -1.0),
    vec2(-1.0,  1.0),
  )[input.vertexIndex], 0.5, 1.0);

  vsOut.uv = array(
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0),
    vec2(1.0, 0.0),
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
  )[input.vertexIndex];

  return vsOut;
}

@fragment
fn FSMain(@location(0) uv: vec2f) -> @location(0) vec4f {
  let pos = textureSample(position, samp, uv);
  return textureSample(color, samp, uv) / max(1.0, pos.w);
  // return vec4f(uv, 0.0, 1.0);
}