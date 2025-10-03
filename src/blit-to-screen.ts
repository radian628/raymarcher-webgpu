import BlitToScreen from "./blit-to-screen.wgsl?raw";

const canvas = document.createElement("canvas");
canvas.width = 1024;
canvas.height = 1024;
document.body.appendChild(canvas);

export function initBlitToScreen(device: GPUDevice, tex: GPUTexture) {
  const ctx = canvas.getContext("webgpu");

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  ctx.configure({
    device,
    format: presentationFormat,
  });

  const blitToScreenPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: BlitToScreen,
      }),
    },
    fragment: {
      module: device.createShaderModule({
        code: BlitToScreen,
      }),
      targets: [{ format: presentationFormat }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  const sampler = device.createSampler({
    minFilter: "linear",
    magFilter: "linear",
  });

  return () => {
    const commandEncoder = device.createCommandEncoder();

    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: ctx.getCurrentTexture().createView(),
          clearValue: [0, 0, 0, 1],
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    passEncoder.setPipeline(blitToScreenPipeline);
    passEncoder.setBindGroup(
      0,
      device.createBindGroup({
        layout: blitToScreenPipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: sampler,
          },
          { binding: 1, resource: tex },
        ],
      })
    );
    passEncoder.draw(6);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  };
}
