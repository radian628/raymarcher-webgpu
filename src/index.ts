import { rotate, translate } from "../r628/src/webgl/mesh";
import { range } from "../r628/src/range";
import {
  generateUniformBuffer,
  makeUniformBuffer,
} from "./bind-group-generator";
import { initBlitToScreen } from "./blit-to-screen";
import ComputeShader from "./compute.wgsl?raw";
import ComputeWGSLJson from "compute.wgsl";
import { mulMat4 } from "../r628/src/math/vector";
import { inv4 } from "./matrix-inverse";

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

  // return -pos.y + 1.0;
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
  size: 1024,
  usage:
    GPUBufferUsage.STORAGE |
    GPUBufferUsage.COPY_DST |
    GPUBufferUsage.COPY_SRC |
    GPUBufferUsage.UNIFORM,
});

const width = 1024;
const height = 1024;

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
const makeColorTexture = () =>
  device.createTexture({
    size: [width, height, 1],
    format: "rgba32float",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.STORAGE_BINDING,
  });

const makeWorldSpacePositionTexture = () =>
  device.createTexture({
    size: [width, height, 1],
    format: "rgba32float",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.STORAGE_BINDING,
  });

const makeAccumulatedReprojectionErrorTexture = () =>
  device.createTexture({
    size: [width, height, 1],
    format: "rgba32float",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.STORAGE_BINDING,
  });

const colorTextures = [makeColorTexture(), makeColorTexture()];

const worldSpacePositionTextures = [
  makeWorldSpacePositionTexture(),
  makeWorldSpacePositionTexture(),
];

const accumulatedReprojectionErrorTextures = [
  makeAccumulatedReprojectionErrorTexture(),
  makeAccumulatedReprojectionErrorTexture(),
];

const uniformBindGroup = device.createBindGroup({
  label: "bind group for compute shader uniforms",
  layout: pipeline.getBindGroupLayout(1),
  entries: [
    { binding: 0, resource: uniformBuffer },
    {
      binding: 1,
      resource: device.createSampler({
        minFilter: "linear",
        magFilter: "linear",
      }),
    },
  ],
});

const makeTextureFlipFlopBindGroup = (prev: number, curr: number) =>
  device.createBindGroup({
    label: "bindgroup for flip-flopping textures",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: colorTextures[curr] },
      { binding: 1, resource: colorTextures[prev] },
      { binding: 2, resource: worldSpacePositionTextures[curr] },
      { binding: 3, resource: worldSpacePositionTextures[prev] },
      { binding: 4, resource: accumulatedReprojectionErrorTextures[curr] },
      { binding: 5, resource: accumulatedReprojectionErrorTextures[prev] },
    ],
  });

const textureFlipFlopBindGroups = [
  makeTextureFlipFlopBindGroup(0, 1),
  makeTextureFlipFlopBindGroup(1, 0),
];

let frameIndex = 0;

let lastTransform = rotate([0, 1, 0], 0);

function loop(t?: number) {
  frameIndex++;
  t ??= 0;
  let currTransform = mulMat4(
    rotate([0, 1, 0], t * -0.0002),
    translate([-0, -0, -3 + t / 5009])
  );
  const buf = makeUniformBuffer<typeof ComputeWGSLJson, 1, 0>(
    ComputeWGSLJson,
    1,
    0,
    {
      size: [width, height],
      rand: [Math.random(), Math.random()],
      transformInv: inv4(currTransform),
      transform: currTransform,
      lastTransformInverse: inv4(lastTransform),
      lastTransform: lastTransform,
      brightnessFactor: frameIndex % 70 === 1 || true ? 1 : 0,
    }
  );

  lastTransform = currTransform;

  device.queue.writeBuffer(uniformBuffer, 0, buf);

  const encoder = device.createCommandEncoder({
    label: "raymarch encoder",
  });

  const pass = encoder.beginComputePass({
    label: "raymarch compute pass",
  });

  pass.setPipeline(pipeline);
  pass.setBindGroup(0, textureFlipFlopBindGroups[frameIndex % 2]);
  pass.setBindGroup(1, uniformBindGroup);
  pass.dispatchWorkgroups(width / 8, height / 8);
  pass.end();

  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);

  const currTexIndex = 1 - (frameIndex % 2);

  initBlitToScreen(
    device,
    colorTextures[currTexIndex],
    worldSpacePositionTextures[currTexIndex]
  )();

  requestAnimationFrame(loop);
}

loop();
