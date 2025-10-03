import { range } from "../r628/src/range";
import { initBlitToScreen } from "./blit-to-screen";
import ComputeShader from "./compute.wgsl?raw";

function fail(msg: string) {
  window.alert(msg);
  throw new Error(msg);
}

console.log(ComputeShader);

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
if (!device) {
  fail("No GPU device!");
}

const module = device.createShaderModule({
  label: "Compute Shader",
  code: ComputeShader,
});

const pipeline = device.createComputePipeline({
  label: "test",
  layout: "auto",
  compute: {
    module,
  },
});

const input = new Float32Array(range(64));

const workBuffer = device.createBuffer({
  label: "workbuffer",
  size: input.byteLength,
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
});

device.queue.writeBuffer(workBuffer, 0, input);

const resultBuffer = device.createBuffer({
  label: "result buffer",
  size: input.byteLength,
  usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
});

const bindGroup = device.createBindGroup({
  label: "bindgroup for work buffer",
  layout: pipeline.getBindGroupLayout(0),
  entries: [{ binding: 0, resource: { buffer: workBuffer } }],
});

const encoder = device.createCommandEncoder({
  label: "doubling encoder",
});

const pass = encoder.beginComputePass({
  label: "doubling compute pass",
});

pass.setPipeline(pipeline);
pass.setBindGroup(0, bindGroup);
pass.dispatchWorkgroups(Math.ceil(input.length / 64));
pass.end();

encoder.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, resultBuffer.size);

const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);

await resultBuffer.mapAsync(GPUMapMode.READ);
const result = new Float32Array(resultBuffer.getMappedRange().slice());

console.log("AAAAA", input, result);

resultBuffer.unmap();

initBlitToScreen(device)();
