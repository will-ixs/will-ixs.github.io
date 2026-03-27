async function loadShader(url) {
  const response = await fetch(url);
  return await response.text();
}

let drawing = false;
let erasing = false;
let drawRadius = 10;
let drawColor = {r: 255, g: 255, b: 255, a: 255};
let drawLastMousePos = {x: 0, y: 0};
const CANVAS_SIZE = 512;
let rayCountBase = 64.0;
let cascadeCount = 0.0;
let cascadeIndex = 0.0;

function update(){
  //JFA SEED PASS
  const seedEncoder = device.createCommandEncoder();
  seedEncoder.copyTextureToTexture({ texture: drawTexture },{ texture: jfaTextures[0] },{ width: CANVAS_SIZE, height: CANVAS_SIZE });
  const jfaSeedPass = seedEncoder.beginRenderPass({
    label: "Jfa Seed",
    colorAttachments: [{
      view: jfaTextures[1].createView(), //WRITE TO B
      loadOp: "clear",
      clearValue: { r: 0, g: 0, b: 99999.0, a: 0 },
      storeOp: "store",
      }]
    });

  jfaSeedPass.setPipeline(jfaSeedPipeline);
  jfaSeedPass.setVertexBuffer(0, vertexBuffer);
  jfaSeedPass.setBindGroup(0, bindGroupsJFA[0]); //READ FROM A
  
  jfaSeedPass.draw(vertices.length / 2);
  jfaSeedPass.end();
  device.queue.submit([seedEncoder.finish()]);

  //JFA PASS
  const passes = Math.ceil(Math.log2(CANVAS_SIZE));
  let jumpDist = CANVAS_SIZE;
  for (let i = 0.0; i < passes; i++) {
    const readIdx  = i % 2 === 0 ? 1 : 0; // first iteration reads B (seed output)
    const writeIdx = i % 2 === 0 ? 0 : 1;

    jumpDist /= 2.0;
    uniformArray.set([512.0, 512.0, jumpDist, rayCountBase, cascadeCount, cascadeIndex]);
    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);
    
    const jfaEncoder = device.createCommandEncoder();

    const jfaPass = jfaEncoder.beginRenderPass({
      label: "jfa",
      colorAttachments: [{
        view: jfaTextures[writeIdx].createView(), //WRITE TO A
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 99999.0, a: 0 },
        storeOp: "store",
      }]
    });
    jfaPass.setPipeline(jfaPipeline);
    jfaPass.setVertexBuffer(0, vertexBuffer);
    jfaPass.setBindGroup(0, bindGroupsJFA[readIdx]); //READ FROM B
    jfaPass.draw(vertices.length / 2);
    jfaPass.end();

    device.queue.submit([jfaEncoder.finish()]);
  }
  //DF pass
  const distanceEncoder = device.createCommandEncoder();
  const dfPass = distanceEncoder.beginRenderPass({
    label: "distance field",
    colorAttachments: [{
      view: distanceTexture.createView(),
      loadOp: "clear",
      clearValue: { r: 0, g: 0, b: 0, a: 255 },
      storeOp: "store",
    }]
  });
  dfPass.setPipeline(dfPipeline);
  dfPass.setVertexBuffer(0, vertexBuffer);
  dfPass.setBindGroup(0, bindGroupsJFA[1]);
  dfPass.draw(vertices.length / 2);
  dfPass.end();
  device.queue.submit([distanceEncoder.finish()]);
  
  //RC PASS
  //just in case its ever not a square u know
  const diag = Math.sqrt(CANVAS_SIZE * CANVAS_SIZE + CANVAS_SIZE * CANVAS_SIZE);
  cascadeCount = Math.ceil(Math.log(diag) / Math.log(rayCountBase)) + 1;
  for (let i = cascadeCount - 1; i >= 0; i--){
    cascadeIndex = i;
    uniformArray.set([CANVAS_SIZE, CANVAS_SIZE, jumpDist, rayCountBase, cascadeCount, cascadeIndex]);
    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);
    
    const readIdx  = i % 2 === 0 ? 1 : 0;
    const writeIdx = i % 2 === 0 ? 0 : 1;
    const rcEncoder = device.createCommandEncoder();
    const rcPass = rcEncoder.beginRenderPass({
      label: "rc",
      colorAttachments: [{
        view: jfaTextures[writeIdx].createView(), //WRITE TO A
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
        storeOp: "store",
      }]
    });
    rcPass.setPipeline(rcPipeline);
    rcPass.setVertexBuffer(0, vertexBuffer);
    rcPass.setBindGroup(0, bindGroupsRC[readIdx]); //READ FROM B
    rcPass.draw(vertices.length / 2);
    rcPass.end();

    device.queue.submit([rcEncoder.finish()]);
  }
  
  // RENDER PASS
  const renderEncoder = device.createCommandEncoder();
  const renderPass = renderEncoder.beginRenderPass({
    label: "resolve",
    colorAttachments: [{
      view: context.getCurrentTexture().createView(), //WRITE TO SCREEN
      loadOp: "load",
      storeOp: "store",
    }]
  });
  renderPass.setPipeline(resolvePipeline);
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.setBindGroup(0, bindGroupResolve); //READ FROM A & B, DIST IN binding 0 and draw in binding 2
  renderPass.draw(vertices.length / 2);
  
  renderPass.end();

  device.queue.submit([renderEncoder.finish()]);
}

function startDrawing(e){
  drawing = true;
  drawLastMousePos = getMousePosInCoordinates(e);
}

function stopDrawing(){
  if(!drawing){
    return;
  }
  
  drawing = false;
}

function getMousePosInCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const relX = e.clientX - rect.left;
  const relY = e.clientY - rect.top;
  const x = Math.min(Math.max(relX, 0), canvas.width);
  const y = Math.min(Math.max(relY, 0), canvas.height);

  return { x: x, y: y };
}

function fillPoint(point){
  const halfRadius = drawRadius / 2;
  let color = erasing ? {r: 0, g: 0, b: 0, a: 0} : drawColor;
  for (let y = point.y - halfRadius; y < point.y + halfRadius; y++){
  for (let x = point.x - halfRadius; x < point.x + halfRadius; x++){
      if(((point.x - x) * (point.x - x)) + ((point.y - y) * (point.y - y)) < drawRadius){
        const i = (y * CANVAS_SIZE + x) * 4;
        drawTextureData[i + 0] = color.r;
        drawTextureData[i + 1] = color.g;
        drawTextureData[i + 2] = color.b;
        drawTextureData[i + 3] = color.a; 
      }
  }
  }
}

function drawLine(from, to){
  const dx = Math.abs(from.x - to.x);
  const dy = Math.abs(from.y - to.y);
  const steps = Math.max(dx, dy);
  
  if (steps === 0) {
    fillPoint({ x: from.x, y: from.y} );
    return;
  }

  for (let i = 0; i < steps; i++){
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(from.x + (from.x - to.x) * t);
    const y = Math.round(from.y + (from.y - to.y) * t);
    fillPoint({x: x, y: y});
  }
}

function onMouseMove(e){
  if(!drawing){
    return;
  }

  const events = e.getCoalescedEvents();
  for(const ce of events){
    const mousePos = getMousePosInCoordinates(ce);
    drawLine(drawLastMousePos, mousePos);
    drawLastMousePos = mousePos;
  }

  device.queue.writeTexture({texture: drawTexture}, drawTextureData, {offset: 0, bytesPerRow: CANVAS_SIZE * 4, rowsPerImage: CANVAS_SIZE * 4}, {width: CANVAS_SIZE, height: CANVAS_SIZE});
  update();
}

function toggleEraser(){
  erasing = !erasing;
  eraser.classList.toggle('active');
}

function clearScreen(){
  drawTextureData.fill(0);  
  device.queue.writeTexture({texture: drawTexture}, drawTextureData, {offset: 0, bytesPerRow: CANVAS_SIZE * 4, rowsPerImage: CANVAS_SIZE * 4}, {width: CANVAS_SIZE, height: CANVAS_SIZE});
  update();
}

function updateColor(){
  const hex = picker.value;
  drawColor = {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
    a: 255
  };
}

const picker = document.getElementById('colorPicker');
picker.addEventListener('input', updateColor);

const eraser = document.getElementById('eraser');
eraser.addEventListener('click', toggleEraser);

const clear = document.getElementById('clear');
clear.addEventListener('click', clearScreen);

//Device setup
const canvas = document.querySelector("canvas");
if (!navigator.gpu) {
  throw new Error("WebGPU not supported on this browser.");
}
canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', onMouseMove);
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointerleave', stopDrawing);

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();
const context = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
  device: device,
  format: canvasFormat,
  usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
});


//Input Data
const vertices = new Float32Array([
  -1, -1,
   1, -1,
   1,  1,

  -1, -1,
   1,  1,
  -1,  1,
]);
const vertexBuffer = device.createBuffer({
  label: "Cell vertices",
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
const vertexBufferLayout = {
  arrayStride: 8,
  attributes: [{
    format: "float32x2",
    offset: 0,
    shaderLocation: 0,
  }],
};
device.queue.writeBuffer(vertexBuffer, 0, vertices);

//canvasx, canvasy, jumpDist, rayCountBase, cascadeCount, cascadeIndex
const uniformArray = new Float32Array([CANVAS_SIZE, CANVAS_SIZE, 0.0, rayCountBase, cascadeCount, cascadeIndex]);
const uniformBuffer = device.createBuffer({
  label: "Jfa Uniforms",
  size: uniformArray.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(uniformBuffer, 0, uniformArray);


const drawTextureData = new Uint8Array(CANVAS_SIZE * CANVAS_SIZE * 4);
const drawTexture = device.createTexture({
  label: "Draw texture",
  size: {width: CANVAS_SIZE, height: CANVAS_SIZE},
  format: "rgba8unorm",
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
});
device.queue.writeTexture({texture: drawTexture}, drawTextureData, {offset: 0, bytesPerRow: CANVAS_SIZE * 4, rowsPerImage: CANVAS_SIZE * 4}, {width: CANVAS_SIZE, height: CANVAS_SIZE});


const jfaTextures = [
  device.createTexture({
    label: "JFA-A texture",
    size: {width: CANVAS_SIZE, height: CANVAS_SIZE},
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
  }),
  device.createTexture({
    label: "JFA-B texture",
    size: {width: CANVAS_SIZE, height: CANVAS_SIZE},
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
  })];

const distanceTexture = device.createTexture({
  label: "Distance field texture",
  size: {width: CANVAS_SIZE, height: CANVAS_SIZE},
  format: "rgba8unorm",
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
});


const drawSampler = device.createSampler({
  addressModeU: "repeat",
  addressModeV: "repeat",
  magFilter: "linear",
  minFilter: "linear",
  mipmapFilter: "linear",
});

//Shader and pipeline creation
const jfaSeedShaderCode = await loadShader("/rc_assets/shaders/jfa_seed.wgsl");
const jfaSeedShaderModule = device.createShaderModule({
  label: "jfa seed shader",
  code: jfaSeedShaderCode
});
const jfaShaderCode = await loadShader("/rc_assets/shaders/jfa.wgsl");
const jfaShaderModule = device.createShaderModule({
  label: "jfa shader",
  code: jfaShaderCode
});

const dfShaderCode = await loadShader("/rc_assets/shaders/df.wgsl");
const dfShaderModule = device.createShaderModule({
  label: "df shader",
  code: dfShaderCode
});

const rcShaderCode = await loadShader("/rc_assets/shaders/cascade.wgsl");
const rcShaderModule = device.createShaderModule({
  label: "rc shader",
  code: rcShaderCode
});

const resolveShaderCode = await loadShader("/rc_assets/shaders/resolve.wgsl");
const resolveShaderModule = device.createShaderModule({
  label: "Resolve shader",
  code: resolveShaderCode
});

//Bind group layouts
const bindGroupLayoutGI = device.createBindGroupLayout({
  label: "GI Bind Group Layout",
  entries: [{
    binding: 0,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    texture: { access: "read", format: "rgba8unorm" }
  }, {
    binding: 1,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    sampler: {}
  },{
    binding: 2,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    texture: { access: "read", format: "rgba8unorm" }
  }]
});
const bindGroupLayoutJFA = device.createBindGroupLayout({
  label: "JFA Bind Group Layout",
  entries: [{
    binding: 0,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    texture: { access: "read", format: "rgba8unorm" }
  }, {
    binding: 1,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    sampler: {}
  }, {
    binding: 2,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    buffer: {}
  }]
});
const bindGroupLayoutRC = device.createBindGroupLayout({
  label: "RC Group Layout",
  entries: [{
    binding: 0,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, //draw
    texture: { access: "read", format: "rgba8unorm" }
  }, {
    binding: 1,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    sampler: {}
  }, {
    binding: 2,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    buffer: {}
  },{
    binding: 3,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, //df
    texture: { access: "read", format: "rgba8unorm" }
  },{
    binding: 4,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, //work - jfa0/jfa1
    texture: { access: "read", format: "rgba8unorm" }
  }]
});
const bindGroupLayoutResolve = device.createBindGroupLayout({
  label: "Resolve Group Layout",
  entries: [{
    binding: 0,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    texture: { access: "read", format: "rgba8unorm" }
  }, {
    binding: 1,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    sampler: {}
  }, {
    binding: 2,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    buffer: {}
  }]
});


//Bind groups
const bindGroupGI = device.createBindGroup({
    label: "GI Bind Group 1",
    layout: bindGroupLayoutGI,
    entries: [{
      binding: 0,
      resource: distanceTexture.createView()
    }, {
      binding: 1,
      resource: drawSampler
    }, {
      binding: 2,
      resource: jfaTextures[0].createView()
    }],
  });

const bindGroupsJFA = [
  device.createBindGroup({
    label: "JFA Bind Group 1",
    layout: bindGroupLayoutJFA,
    entries: [{
      binding: 0,
      resource: jfaTextures[0].createView()
    }, {
      binding: 1,
      resource: drawSampler
    }, {
      binding: 2,
      resource: { buffer: uniformBuffer }
    },],
  }),
  device.createBindGroup({
    label: "JFA Bind Group 2",
    layout: bindGroupLayoutJFA,
    entries: [{
      binding: 0,
      resource: jfaTextures[1].createView()
    }, {
      binding: 1,
      resource: drawSampler
    }, {
      binding: 2,
      resource: { buffer: uniformBuffer }
    }]
})];

const bindGroupsRC = [device.createBindGroup({
    label: "RC Bind group A",
    layout: bindGroupLayoutRC,
    entries: [{
      binding: 0,
      resource: drawTexture.createView()
    }, {
      binding: 1,
      resource: drawSampler
    }, {
      binding: 2,
      resource: { buffer: uniformBuffer }
    }, {
      binding: 3,
      resource: distanceTexture.createView()
    }, {
      binding: 4,
      resource: jfaTextures[0].createView()
    }]
}),
device.createBindGroup({
    label: "RC Bind group B",
    layout: bindGroupLayoutRC,
    entries: [{
      binding: 0,
      resource: drawTexture.createView()
    }, {
      binding: 1,
      resource: drawSampler
    }, {
      binding: 2,
      resource: { buffer: uniformBuffer }
    }, {
      binding: 3,
      resource: distanceTexture.createView()
    }, {
      binding: 4,
      resource: jfaTextures[1].createView()
    }]
})
]

const bindGroupResolve = device.createBindGroup({
    label: "Resolve Bind Group",
    layout: bindGroupLayoutResolve,
    entries: [{
      binding: 0,
      resource: jfaTextures[0].createView()
    }, {
      binding: 1,
      resource: drawSampler
    }, {
      binding: 2,
      resource: { buffer: uniformBuffer }
    },]
});

//Pipeline layouts
const pipelineLayoutGI = device.createPipelineLayout({
  label: "GI Pipeline Layout",
  bindGroupLayouts: [ bindGroupLayoutGI ],
});

const pipelineLayoutJFA = device.createPipelineLayout({
  label: "JFA Pipeline Layout",
  bindGroupLayouts: [ bindGroupLayoutJFA ],
});

const pipelineLayoutRC = device.createPipelineLayout({
  label: "RC pipeline layout",
  bindGroupLayouts: [ bindGroupLayoutRC ],
});

const pipelineLayoutResolve = device.createPipelineLayout({
  label: "Resolve pipeline layout",
  bindGroupLayouts: [ bindGroupLayoutResolve ],
});

//Pipelines
const jfaSeedPipeline = device.createRenderPipeline({
  label: "Jfa Seed pipeline",
  layout: pipelineLayoutJFA,
  vertex: {
    module: jfaSeedShaderModule,
    entryPoint: "vertexMain",
    buffers: [vertexBufferLayout]
  },
  fragment: {
    module: jfaSeedShaderModule,
    entryPoint: "fragmentMain",
    targets: [{
      format: jfaTextures[0].format
    }]
  }
});

const jfaPipeline = device.createRenderPipeline({
  label: "Jfa Pipeline",
  layout: pipelineLayoutJFA,
  vertex: {
    module: jfaShaderModule,
    entryPoint: "vertexMain",
    buffers: [vertexBufferLayout]
  },
  fragment: {
    module: jfaShaderModule,
    entryPoint: "fragmentMain",
    targets: [{
      format: jfaTextures[0].format
    }]
  }
});

//use bindgroupjfa[1]
const dfPipeline = device.createRenderPipeline({
  label: "df pipeline",  
  layout: pipelineLayoutJFA,
  vertex: {
    module: dfShaderModule,
    entryPoint: "vertexMain",
    buffers: [vertexBufferLayout]
  },
  fragment: {
    module: dfShaderModule,
    entryPoint: "fragmentMain",
    targets: [{
      format: distanceTexture.format
    }]
  }
});

const rcPipeline = device.createRenderPipeline({
  label: "Rc pipeline",
  layout: pipelineLayoutRC,
  vertex: {
    module: rcShaderModule,
    entryPoint: "vertexMain",
    buffers: [vertexBufferLayout]
  },
  fragment: {
    module: rcShaderModule,
    entryPoint: "fragmentMain",
    targets: [{
      format: jfaTextures[0].format
    }]
  }
});


const resolvePipeline = device.createRenderPipeline({
  label: "Resolve pipeline",
  layout: pipelineLayoutResolve,
    vertex: {
    module: resolveShaderModule,
    entryPoint: "vertexMain",
    buffers: [vertexBufferLayout]
  },
  fragment: {
    module: resolveShaderModule,
    entryPoint: "fragmentMain",
    targets: [{
      format: canvasFormat
    }]
  }
});

update();