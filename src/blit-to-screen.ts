import BlitToScreen from "./blit-to-screen.wgsl?raw";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

export function initBlitToScreen(device: GPUDevice) {
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

  // const sampler = device.createSampler({
  //   minFilter: "linear",
  //   magFilter: "linear"
  // });

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
    passEncoder.draw(6);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  };
}
