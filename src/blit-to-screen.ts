import BlitToScreen from "./blit-to-screen.wgsl?raw";

const canvas = document.createElement("canvas");
canvas.width = 1024;
canvas.height = 1024;
document.body.appendChild(canvas);

export function initBlitToScreen(
  device: GPUDevice,
  colorTex: GPUTexture,
  positionTex: GPUTexture
) {
  const ctx = canvas.getContext("webgpu");

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  ctx.configure({
    device,
    format: presentationFormat,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        sampler: { type: "non-filtering" },
        visibility: GPUShaderStage.FRAGMENT,
      },
      {
        binding: 1,
        texture: {
          sampleType: "unfilterable-float",
        },
        visibility: GPUShaderStage.FRAGMENT,
      },
      {
        binding: 2,
        texture: {
          sampleType: "unfilterable-float",
        },
        visibility: GPUShaderStage.FRAGMENT,
      },
    ],
  });

  const blitToScreenPipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
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
    minFilter: "nearest",
    magFilter: "nearest",
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: sampler,
      },
      { binding: 1, resource: colorTex },
      { binding: 2, resource: positionTex },
    ],
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
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.draw(6);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  };
}
