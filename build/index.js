// r628/src/range.ts
function range(hi) {
  let arr = [];
  for (let i = 0; i < hi && i < 1e7; i++) {
    arr.push(i);
  }
  return arr;
}

// raw-ns:/mnt/c/Users/baker/Documents/GitHub/raymarcher-webgpu/src/blit-to-screen.wgsl?raw
var blit_to_screen_default = "struct VSInput {\r\n  @builtin(vertex_index) vertexIndex: u32,\r\n}\r\n\r\nstruct VSOutput {\r\n  @builtin(position) position: vec4f,\r\n  @location(0) uv: vec2f,\r\n}\r\n\r\n@group(0) @binding(0) var mySampler : sampler;\r\n@group(0) @binding(1) var myTexture : texture_2d<f32>;\r\n\r\n@vertex\r\nfn VSMain(input: VSInput) -> VSOutput {\r\n  var vsOut: VSOutput;\r\n\r\n  vsOut.position = vec4(array(\r\n    vec2( 1.0,  1.0),\r\n    vec2( 1.0, -1.0),\r\n    vec2(-1.0, -1.0),\r\n    vec2( 1.0,  1.0),\r\n    vec2(-1.0, -1.0),\r\n    vec2(-1.0,  1.0),\r\n  )[input.vertexIndex], 0.5, 1.0);\r\n\r\n  vsOut.uv = array(\r\n    vec2(1.0, 0.0),\r\n    vec2(1.0, 1.0),\r\n    vec2(0.0, 1.0),\r\n    vec2(1.0, 0.0),\r\n    vec2(0.0, 1.0),\r\n    vec2(0.0, 0.0),\r\n  )[input.vertexIndex];\r\n\r\n  return vsOut;\r\n}\r\n\r\n@fragment\r\nfn FSMain(@location(0) uv: vec2f) -> @location(0) vec4f {\r\n  // return textureSample(myTexture, mySampler, uv);\r\n  return vec4f(uv, 0.0, 1.0);\r\n}";

// src/blit-to-screen.ts
var canvas = document.createElement("canvas");
document.body.appendChild(canvas);
function initBlitToScreen(device2) {
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
    passEncoder.draw(6);
    passEncoder.end();
    device2.queue.submit([commandEncoder.finish()]);
  };
}

// raw-ns:/mnt/c/Users/baker/Documents/GitHub/raymarcher-webgpu/src/compute.wgsl?raw
var compute_default = "@group(0) @binding(0) var<storage, read_write> data: array<f32>;\r\n     \r\n@compute @workgroup_size(8, 8, 1) fn computeSomething(\r\n  @builtin(global_invocation_id) id: vec3<u32>\r\n) {\r\n  let i = id.x + id.y * 8;\r\n  data[i] = data[i] * 2.0;\r\n}";

// src/index.ts
function fail(msg) {
  window.alert(msg);
  throw new Error(msg);
}
console.log(compute_default);
var adapter = await navigator.gpu.requestAdapter();
var device = await adapter.requestDevice();
if (!device) {
  fail("No GPU device!");
}
var module = device.createShaderModule({
  label: "Compute Shader",
  code: compute_default
});
var pipeline = device.createComputePipeline({
  label: "test",
  layout: "auto",
  compute: {
    module
  }
});
var input = new Float32Array(range(64));
var workBuffer = device.createBuffer({
  label: "workbuffer",
  size: input.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
});
device.queue.writeBuffer(workBuffer, 0, input);
var resultBuffer = device.createBuffer({
  label: "result buffer",
  size: input.byteLength,
  usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
});
var bindGroup = device.createBindGroup({
  label: "bindgroup for work buffer",
  layout: pipeline.getBindGroupLayout(0),
  entries: [{ binding: 0, resource: { buffer: workBuffer } }]
});
var encoder = device.createCommandEncoder({
  label: "doubling encoder"
});
var pass = encoder.beginComputePass({
  label: "doubling compute pass"
});
pass.setPipeline(pipeline);
pass.setBindGroup(0, bindGroup);
pass.dispatchWorkgroups(Math.ceil(input.length / 64));
pass.end();
encoder.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, resultBuffer.size);
var commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);
await resultBuffer.mapAsync(GPUMapMode.READ);
var result = new Float32Array(resultBuffer.getMappedRange().slice());
console.log("AAAAA", input, result);
resultBuffer.unmap();
initBlitToScreen(device)();
//# sourceMappingURL=index.js.map
