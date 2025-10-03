// src/bind-group-generator.ts
function getWgslPrimitiveDatatype(typename, formatname) {
  if (formatname) return formatname;
  if (typename === "f32" || typename === "i32" || typename === "u32" || typename === "f16")
    return typename;
  if (typename.startsWith("vec") || typename.startsWith("mat")) {
    if (typename.endsWith("i")) {
      return "i32";
    } else if (typename.endsWith("u")) {
      return "u32";
    } else if (typename.endsWith("h")) {
      return "f16";
    }
  }
  return "f32";
}
function getWgslPrimitiveSize(typename) {
  if (typename.startsWith("vec2")) return 2;
  if (typename.startsWith("vec3")) return 3;
  if (typename.startsWith("vec4")) return 4;
  if (typename.startsWith("mat2")) return 4;
  if (typename.startsWith("mat3")) return 9;
  if (typename.startsWith("mat4")) return 16;
  if (typename.startsWith("mat2x3")) return 6;
  if (typename.startsWith("mat3x2")) return 6;
  if (typename.startsWith("mat2x4")) return 8;
  if (typename.startsWith("mat4x2")) return 8;
  if (typename.startsWith("mat3x4")) return 12;
  if (typename.startsWith("mat4x3")) return 12;
  return 1;
}
function setWgslPrimitive(typename, formatname, view, offset, data) {
  const datatype = getWgslPrimitiveDatatype(typename, formatname);
  const size = getWgslPrimitiveSize(typename);
  let stride = {
    i32: 4,
    f32: 4,
    u32: 4,
    f16: 2
  }[datatype];
  let method = {
    i32: "setInt32",
    f32: "setFloat32",
    u32: "setUint32",
    f16: "setFloat16"
  }[datatype];
  for (let i = 0; i < size; i++) {
    view[method](offset + stride * i, data[i], true);
  }
}
function generateUniformBufferInner(spec, values, view, offset) {
  if (spec.members) {
    for (const m of spec.members)
      generateUniformBufferInner(
        m.type,
        values[m.name],
        view,
        offset + m.offset
      );
    return;
  }
  const typename = spec.name;
  if (typename === "array") {
    for (let i = 0; i < spec.count; i++) {
      generateUniformBufferInner(
        spec.format,
        values[i],
        view,
        offset + spec.stride * i
      );
    }
  } else {
    setWgslPrimitive(
      spec.name,
      spec.format?.name,
      view,
      offset,
      Array.isArray(values) ? values : [values]
    );
  }
}
function generateUniformBuffer(spec, values) {
  const buf2 = new ArrayBuffer(spec.size);
  const view = new DataView(buf2);
  generateUniformBufferInner(spec, values, view, 0);
  return buf2;
}
function makeUniformBuffer(spec, group, binding, data) {
  return generateUniformBuffer(spec.bindGroups[group][binding].type, data);
}

// raw-ns:/mnt/c/Users/baker/Documents/GitHub/raymarcher-webgpu/src/blit-to-screen.wgsl?raw
var blit_to_screen_default = "struct VSInput {\r\n  @builtin(vertex_index) vertexIndex: u32,\r\n}\r\n\r\nstruct VSOutput {\r\n  @builtin(position) position: vec4f,\r\n  @location(0) uv: vec2f,\r\n}\r\n\r\n@group(0) @binding(0) var mySampler : sampler;\r\n@group(0) @binding(1) var myTexture : texture_2d<f32>;\r\n\r\n@vertex\r\nfn VSMain(input: VSInput) -> VSOutput {\r\n  var vsOut: VSOutput;\r\n\r\n  vsOut.position = vec4(array(\r\n    vec2( 1.0,  1.0),\r\n    vec2( 1.0, -1.0),\r\n    vec2(-1.0, -1.0),\r\n    vec2( 1.0,  1.0),\r\n    vec2(-1.0, -1.0),\r\n    vec2(-1.0,  1.0),\r\n  )[input.vertexIndex], 0.5, 1.0);\r\n\r\n  vsOut.uv = array(\r\n    vec2(1.0, 0.0),\r\n    vec2(1.0, 1.0),\r\n    vec2(0.0, 1.0),\r\n    vec2(1.0, 0.0),\r\n    vec2(0.0, 1.0),\r\n    vec2(0.0, 0.0),\r\n  )[input.vertexIndex];\r\n\r\n  return vsOut;\r\n}\r\n\r\n@fragment\r\nfn FSMain(@location(0) uv: vec2f) -> @location(0) vec4f {\r\n  return textureSample(myTexture, mySampler, uv);\r\n  // return vec4f(uv, 0.0, 1.0);\r\n}";

// src/blit-to-screen.ts
var canvas = document.createElement("canvas");
canvas.width = 1024;
canvas.height = 1024;
document.body.appendChild(canvas);
function initBlitToScreen(device2, tex) {
  const ctx = canvas.getContext("webgpu");
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({
    device: device2,
    format: presentationFormat
  });
  const blitToScreenPipeline = device2.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device2.createShaderModule({
        code: blit_to_screen_default
      })
    },
    fragment: {
      module: device2.createShaderModule({
        code: blit_to_screen_default
      }),
      targets: [{ format: presentationFormat }]
    },
    primitive: {
      topology: "triangle-list"
    }
  });
  const sampler = device2.createSampler({
    minFilter: "linear",
    magFilter: "linear"
  });
  return () => {
    const commandEncoder = device2.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: ctx.getCurrentTexture().createView(),
          clearValue: [0, 0, 0, 1],
          loadOp: "clear",
          storeOp: "store"
        }
      ]
    });
    passEncoder.setPipeline(blitToScreenPipeline);
    passEncoder.setBindGroup(
      0,
      device2.createBindGroup({
        layout: blitToScreenPipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: sampler
          },
          { binding: 1, resource: tex }
        ]
      })
    );
    passEncoder.draw(6);
    passEncoder.end();
    device2.queue.submit([commandEncoder.finish()]);
  };
}

// raw-ns:/mnt/c/Users/baker/Documents/GitHub/raymarcher-webgpu/src/compute.wgsl?raw
var compute_default = "struct B {\r\n  test: array<vec4u, 4>,\r\n}\r\n\r\nstruct Params {\r\n  size: vec2<u32>,\r\n  @align(16) b: B,\r\n  deeznuts: vec4<f32>,\r\n  mvp: mat4x4<f32>\r\n}\r\n\r\n@group(0) @binding(0) var tex: texture_storage_2d<rgba8unorm, write>;\r\n@group(0) @binding(1) var<uniform> params : Params;\r\n\r\n@compute @workgroup_size(8, 8, 1) fn computeSomething(\r\n  @builtin(global_invocation_id) id: vec3<u32>\r\n) {\r\n  var value: vec3f = vec3f(0.0);\r\n\r\n  let idnorm = vec2f(id.xy) / vec2f(params.size.xy);\r\n\r\n  for (var y = 0.0; y < 1.0; y += 0.1) {\r\n    for (var x = 0.0; x < 1.0; x += 0.1) {\r\n      let fractpos = idnorm + vec2f(x, y) / vec2f(params.size.xy);\r\n\r\n      var pos = vec3f(-0.5, -0.5, -5.35);\r\n      var dir = normalize(vec3f(fractpos * 2.0 - 1.0, 1.0));\r\n      var normal: vec3f;\r\n      var didHit: bool;\r\n      var emission = vec3f(0.0);\r\n      let lightdir = normalize(vec3f(1.0, 1.0, -1.0));\r\n\r\n      for (var i = 0u; i < 6u; i++) {\r\n        let hit = marchRay(pos, dir, 512u);\r\n        pos = hit.pos + hit.normal * 0.001;\r\n        dir = reflect(dir, hit.normal);\r\n        normal = hit.normal;\r\n        didHit = hit.hit;\r\n        emission += abs(dot(lightdir, normal)) * pow(0.5, f32(i) + 1.0);\r\n      }\r\n\r\n      value += select(\r\n        emission,\r\n        vec3f(0.0, 0.0, 0.0),\r\n        !didHit,\r\n      );\r\n    }\r\n  }\r\n\r\n  textureStore(tex, id.xy, vec4f(\r\n    value / 100.0,\r\n    1.0\r\n  ));\r\n}\r\n\r\nstruct HitInfo {\r\n  hit: bool,\r\n  pos: vec3f,\r\n  normal: vec3f,\r\n}\r\n\r\nfn marchRay(\r\n  pos: vec3f,\r\n  dir: vec3f,\r\n  iters: u32\r\n) -> HitInfo {\r\n  var posTemp = pos;\r\n  for (var i = 0u; i < iters; i++) {\r\n    let dist = sdf(posTemp);\r\n    posTemp += dir * dist;\r\n  }\r\n\r\n  let distSample = sdf(posTemp);\r\n\r\n  let normal = normalize(vec3f(\r\n    sdf(posTemp + vec3f(0.01, 0.0, 0.0)) - distSample,\r\n    sdf(posTemp + vec3f(0.0, 0.01, 0.0)) - distSample,\r\n    sdf(posTemp + vec3f(0.0, 0.0, 0.01)) - distSample,\r\n  ));\r\n\r\n  return HitInfo(\r\n    distSample < 0.01,\r\n    posTemp,\r\n    normal,\r\n  );\r\n}\r\n\r\n// MARCH_FUNCTION ";

// wgsl:/mnt/c/Users/baker/Documents/GitHub/raymarcher-webgpu/src/compute.wgsl
var compute_default2 = { bindGroups: [[{ name: "tex", type: { name: "texture_storage_2d", attributes: [{ id: 23485, line: 12, name: "group", value: "0" }, { id: 23486, line: 12, name: "binding", value: "0" }], size: 0, format: { name: "rgba8unorm", attributes: null, size: 0 }, access: "write" }, group: 0, binding: 0, attributes: [{ id: 23485, line: 12, name: "group", value: "0" }, { id: 23486, line: 12, name: "binding", value: "0" }], resourceType: 4, access: "read" }, { name: "params", type: { name: "Params", attributes: null, size: 160, members: [{ name: "size", type: { name: "vec2", attributes: null, size: 8, format: { name: "u32", attributes: null, size: 4 }, access: null }, attributes: null, offset: 0, size: 8 }, { name: "b", type: { name: "B", attributes: null, size: 64, members: [{ name: "test", type: { name: "array", attributes: null, size: 64, count: 4, stride: 16, format: { name: "vec4u", attributes: null, size: 16 } }, attributes: null, offset: 0, size: 64 }], align: 16, startLine: 1, endLine: 3, inUse: true }, attributes: [{ id: 23476, line: 7, name: "align", value: "16" }], offset: 16, size: 64 }, { name: "deeznuts", type: { name: "vec4", attributes: null, size: 16, format: { name: "f32", attributes: null, size: 4 }, access: null }, attributes: null, offset: 80, size: 16 }, { name: "mvp", type: { name: "mat4x4", attributes: null, size: 64, format: { name: "f32", attributes: null, size: 4 }, access: null }, attributes: null, offset: 96, size: 64 }], align: 16, startLine: 5, endLine: 10, inUse: true }, group: 0, binding: 1, attributes: [{ id: 23489, line: 13, name: "group", value: "0" }, { id: 23490, line: 13, name: "binding", value: "1" }], resourceType: 0, access: "read" }]] };

// src/index.ts
function fail(msg) {
  window.alert(msg);
  throw new Error(msg);
}
console.log(compute_default, compute_default2);
var A = compute_default2[0];
var adapter = await navigator.gpu.requestAdapter();
var device = await adapter.requestDevice();
if (!device) {
  fail("No GPU device!");
}
var module = device.createShaderModule({
  label: "Compute Shader",
  code: compute_default.replace(
    "// MARCH_FUNCTION",
    `
fn modulo(
  a: vec3f,
  b: vec3f
) -> vec3f{
  let afloor = floor(a / b) * b;
  return (a - afloor);
}

fn grid(
    pos: vec3f,
    res: vec3f
) -> vec3f {
  return modulo(pos, res) - res * 0.5;
}

fn sdf(
    pos: vec3f,
) -> f32 {
  let postemp = grid(pos, vec3(3.0));
  return distance(postemp, vec3f(0.0)) - 1.2;  
}

  `
  )
});
var pipeline = device.createComputePipeline({
  label: "test",
  layout: "auto",
  compute: {
    module
  }
});
var uniformBuffer = device.createBuffer({
  label: "uniform buffer",
  size: 160,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.UNIFORM
});
var width = 1024;
var height = 1024;
var buf = makeUniformBuffer(
  compute_default2,
  0,
  1,
  {
    size: [width, height],
    b: {
      test: [
        [1, 2, 3, 4],
        [69, 69, 123, 456],
        [9, 7, 5, 3],
        [2, 4, 6, 8]
      ]
    },
    deeznuts: [1, 2.5, 3.14, 2.718],
    mvp: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  }
);
console.log(new Uint32Array(buf));
console.log(new Float32Array(buf));
device.queue.writeBuffer(uniformBuffer, 0, buf);
var resultTexture = device.createTexture({
  size: [width, height, 1],
  format: "rgba8unorm",
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING
});
var bindGroup = device.createBindGroup({
  label: "bindgroup for work buffer",
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    { binding: 0, resource: resultTexture },
    {
      binding: 1,
      resource: uniformBuffer
    }
  ]
});
var encoder = device.createCommandEncoder({
  label: "doubling encoder"
});
var pass = encoder.beginComputePass({
  label: "doubling compute pass"
});
pass.setPipeline(pipeline);
pass.setBindGroup(0, bindGroup);
pass.dispatchWorkgroups(width / 8, height / 8);
pass.end();
var commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);
initBlitToScreen(device, resultTexture)();
//# sourceMappingURL=index.js.map
