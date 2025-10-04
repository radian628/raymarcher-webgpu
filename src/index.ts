import { rotate, translate } from "../r628/src/webgl/mesh";
import { range } from "../r628/src/range";
import {
  generateUniformBuffer,
  makeUniformBuffer,
} from "./bind-group-generator";
import { initBlitToScreen } from "./blit-to-screen";
import ComputeShader from "./compute.wgsl?raw";
import ComputeWGSLJson from "compute.wgsl";
import {
  add2,
  add3,
  Mat4,
  mulMat4,
  mulVec4ByMat4,
  scale3,
  Vec2,
  Vec3,
  xyz,
} from "../r628/src/math/vector";
import { inv4 } from "./matrix-inverse";
import { add } from "../r628/src";

function fail(msg: string) {
  window.alert(msg);
  throw new Error(msg);
}

console.log(ComputeShader, ComputeWGSLJson);

const A = ComputeWGSLJson[0];

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
device.pushErrorScope("internal");
device.addEventListener("uncapturederror", (event) =>
  console.error(event.error)
);
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

let width = 1024;
let height = 1024;
let textures: GPUTexture[] = [];
let textureFlipFlopBindGroups: GPUBindGroup[] = [];

const makeEverythingTexture = () =>
  device.createTexture({
    size: [width, height, 3],
    format: "rgba32float",
    dimension: "2d",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.STORAGE_BINDING,
  });

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

device.popErrorScope().then((e) => {
  console.log(e);
});

const makeTextureFlipFlopBindGroup = (prev: number, curr: number) =>
  device.createBindGroup({
    label: "bindgroup for flip-flopping textures",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: textures[curr] },
      { binding: 1, resource: textures[prev] },
    ],
  });

let frameIndex = 0;

let lastTransform = rotate([0, 1, 0], 0);

function resize() {
  width = window.innerWidth * window.devicePixelRatio;
  height = window.innerHeight * window.devicePixelRatio;

  textures = [makeEverythingTexture(), makeEverythingTexture()];
  textureFlipFlopBindGroups = [
    makeTextureFlipFlopBindGroup(0, 1),
    makeTextureFlipFlopBindGroup(1, 0),
  ];
}

window.addEventListener("resize", resize);

resize();

let viewerPos: Vec3 = [0, 0.1, -3];
let viewerVel: Vec3 = [0, 0, 0];

let rotationMatrix: Mat4 = rotate([0, 1, 0], 0.1);

let keysDown = new Set<string>();

document.addEventListener("keydown", (e) => {
  keysDown.add(e.key.toLowerCase());
});
document.addEventListener("keyup", (e) => {
  keysDown.delete(e.key.toLowerCase());
});

document.addEventListener("mousedown", (e) => {
  document.body.requestPointerLock();
});

document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== document.body) return;

  const invrot = inv4(rotationMatrix);
  const localXAxis = mulVec4ByMat4([1, 0, 0, 0], invrot);
  const localYAxis = mulVec4ByMat4([0, 1, 0, 0], invrot);

  const r1 = rotate(xyz(localYAxis), -e.movementX * 0.001);
  const r2 = rotate(xyz(localXAxis), e.movementY * 0.001);

  rotationMatrix = mulMat4(mulMat4(r1, r2), rotationMatrix);
  // rotationMatrix = mulMat4(rotate([1, 0, 0], 0), rotationMatrix);
});

let lastTime = 0;

function loop(t?: number) {
  frameIndex++;
  t ??= 0;
  let dt = (t - lastTime) / 1000;

  viewerPos = add3(viewerPos, scale3(viewerVel, dt));

  const accel = mulVec4ByMat4(
    [
      keysDown.has("d") ? 1 : keysDown.has("a") ? -1 : 0,
      keysDown.has("shift") ? 1 : keysDown.has(" ") ? -1 : 0,
      keysDown.has("w") ? 1 : keysDown.has("s") ? -1 : 0,
      0,
    ],
    inv4(rotationMatrix)
  );

  viewerVel = add3(viewerVel, xyz(accel));
  viewerVel = scale3(viewerVel, 0.1 ** dt);
  if (Math.hypot(...viewerVel) < 0.2) {
    viewerVel = [0, 0, 0];
  }

  let currTransform = mulMat4(translate(viewerPos), rotationMatrix);

  // let currTransform = translate(viewerPos);

  // console.log(currTransform);

  let shouldReset = lastTransform.every((e, i) => e === currTransform[i])
    ? 0
    : 1;

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
      shouldReset,
      aspect: height / width,
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

  initBlitToScreen(device, textures[currTexIndex])();

  lastTime = t;
  requestAnimationFrame(loop);
}

loop();
