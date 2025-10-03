import { range } from "../r628/src/range";
import {
  generateUniformBuffer,
  makeUniformBuffer,
} from "./bind-group-generator";
import { initBlitToScreen } from "./blit-to-screen";
import ComputeShader from "./compute.wgsl?raw";
import ComputeWGSLJson from "compute.wgsl";

function fail(msg: string) {
  window.alert(msg);
  throw new Error(msg);
}

console.log(ComputeShader, ComputeWGSLJson);

const A = ComputeWGSLJson[0];

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
if (!device) {
  fail("No GPU device!");
}

const module = device.createShaderModule({
  label: "Compute Shader",
  code: ComputeShader.replace(
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
  ),
});

const pipeline = device.createComputePipeline({
  label: "test",
  layout: "auto",
  compute: {
    module,
  },
});

const uniformBuffer = device.createBuffer({
  label: "uniform buffer",
  size: 160,
  usage:
    GPUBufferUsage.STORAGE |
    GPUBufferUsage.COPY_DST |
    GPUBufferUsage.COPY_SRC |
    GPUBufferUsage.UNIFORM,
});

const width = 1024;
const height = 1024;

const buf = makeUniformBuffer<typeof ComputeWGSLJson, 0, 1>(
  ComputeWGSLJson,
  0,
  1,
  {
    size: [width, height],
    b: {
      test: [
        [1, 2, 3, 4],
        [69, 69, 123, 456],
        [9, 7, 5, 3],
        [2, 4, 6, 8],
      ],
    },
    deeznuts: [1.0, 2.5, 3.14, 2.718],
    mvp: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  }
);

console.log(new Uint32Array(buf));
console.log(new Float32Array(buf));

device.queue.writeBuffer(uniformBuffer, 0, buf);

// const input = new Float32Array(range(64));

// const workBuffer = device.createBuffer({
//   label: "workbuffer",
//   size: input.byteLength,
//   usage:
//     GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
// });

// device.queue.writeBuffer(workBuffer, 0, input);

// const resultBuffer = device.createBuffer({
//   label: "result buffer",
//   size: input.byteLength,
//   usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
// });
const resultTexture = device.createTexture({
  size: [width, height, 1],
  format: "rgba8unorm",
  usage:
    GPUTextureUsage.TEXTURE_BINDING |
    GPUTextureUsage.COPY_DST |
    GPUTextureUsage.STORAGE_BINDING,
});

const bindGroup = device.createBindGroup({
  label: "bindgroup for work buffer",
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    { binding: 0, resource: resultTexture },
    {
      binding: 1,
      resource: uniformBuffer,
    },
  ],
});

const encoder = device.createCommandEncoder({
  label: "doubling encoder",
});

const pass = encoder.beginComputePass({
  label: "doubling compute pass",
});

pass.setPipeline(pipeline);
pass.setBindGroup(0, bindGroup);
pass.dispatchWorkgroups(width / 8, height / 8);
pass.end();

const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);

initBlitToScreen(device, resultTexture)();
