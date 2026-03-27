struct VertexInput {
    @location(0) pos: vec2f
}

struct VertexOutput {
    @builtin(position) pos: vec4f
}

struct Uniforms {
    width: f32,
    height: f32,
    jumpDist: f32,
    rayCountBase: f32,
    cascadeCount: f32,
    cascadeIndex: f32
}

@group(0) @binding(0) var drawTex: texture_2d<f32>;
@group(0) @binding(1) var texSampler: sampler;
@group(0) @binding(2) var<uniform> ubuf: Uniforms;
@group(0) @binding(3) var distanceTex: texture_2d<f32>;
@group(0) @binding(4) var workTex: texture_2d<f32>;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {  
    var output = VertexOutput( vec4f(input.pos, 0.0, 1.0) );
    return output;
}


fn outOfBounds(uv: vec2f) -> bool {
    return uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0;
}

fn rand11(n: f32) -> f32 { 
    return fract(sin(n) * 43758.5453123); 
}

fn rc(uv: vec2f) -> vec4f {
    let tau = radians(360);
    let maxSteps = 32;

    let resolution = vec2f(ubuf.width, ubuf.height);
    let coord = floor(uv * resolution);
    
    let rayCountBase = ubuf.rayCountBase;
    let cascadeIndex = ubuf.cascadeIndex;
    let cascadeCount = ubuf.cascadeCount;
    
    let rayCount = pow(rayCountBase, cascadeIndex + 1.0);
    let rayCountBaseSqrt = sqrt(rayCountBase);
    let oneOverRayCount = 1.0 / f32(rayCount);
    let tauOverRayCount = tau * oneOverRayCount;

    let spacing = pow(rayCountBaseSqrt, cascadeIndex);
    let size = floor(resolution / spacing);
    let probeRelPos = coord % size;
    let probeCenter = (probeRelPos + 0.5) * spacing; 
    let probeCenterNorm = probeCenter / resolution;
    
    let rayPos = floor(coord / size);

    let minSide = min(resolution.x, resolution.y);
    let scale = vec2f(minSide) / resolution;
    
    let firstLevel = abs(cascadeIndex) < 0.1;
    let intervalStart = select(4.0 * pow(rayCountBase, cascadeIndex - 1.0) / minSide, 0.0, firstLevel);
    let intervalLength = 4.0 * pow(rayCountBase, cascadeIndex) / minSide;

    let baseIndex = rayCountBase * (rayPos.x  + (spacing * rayPos.y));

    let minStepSize = 0.5 / minSide;
    var radiance = vec4f(0.0);
    
    for (var i = 0; i < i32(rayCountBase); i++) {
        let index = baseIndex + f32(i);
        let angle = tauOverRayCount * (index + 0.5);
        let rayDirection = vec2f(cos(angle), -sin(angle));
        
        var sampleUv = probeCenterNorm + rayDirection * intervalStart * scale; // offset from origin
        var traveled = 0.0;
        var radianceDelta = vec4f(0.0);
        
        let skip = outOfBounds(sampleUv);

        for (var step = 1; step < maxSteps && !skip; step++) {
            let dist = textureSampleLevel(distanceTex, texSampler, sampleUv, 0).x;
            
            sampleUv += rayDirection * dist * scale;
            if (outOfBounds(sampleUv)) { break; }

            if (dist <= minStepSize){
                let sampleLight = textureSampleLevel(drawTex, texSampler, sampleUv, 0);
                radianceDelta += vec4f(pow(sampleLight.rgb, vec3(2.2)), sampleLight.a);
                break;
            }

            traveled += dist;
            if (traveled >= intervalLength) { break; }
        } 

        let nonOpaque = radianceDelta.a == 0.0;

        if (cascadeIndex < cascadeCount - 1.001 && nonOpaque) { //verify first levle
            let upperSpacing = pow(rayCountBaseSqrt, cascadeIndex + 1.0);
            let upperSize = floor(resolution / upperSpacing);
            let upperPos = vec2f((index % upperSpacing), floor(index / upperSpacing)) * upperSize;
            let offset = (probeRelPos + 0.5) / rayCountBaseSqrt;
            let clamped = clamp(offset, vec2f(0.5), upperSize - 0.5);
            let upperUv = (upperPos + clamped) / resolution;
            let upperSample = textureSampleLevel(workTex, texSampler, upperUv, 0);
            radiance += upperSample;
        }

        radiance += radianceDelta;
    }
    radiance /= rayCountBase;
    if (firstLevel){
        radiance = vec4f(radiance.rgb, 1.0);
    }else{
        radiance = vec4f(pow(radiance.rgb, vec3f(1.0 / 2.2)), 1.0);
    }
    return radiance;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    let res = vec2f(ubuf.width, ubuf.height);
    let uv = input.pos.xy / res;
    return rc(uv);
}