struct VertexInput {
    @location(0) pos: vec2f
}

struct VertexOutput {
    @builtin(position) pos: vec4f
}

@group(0) @binding(0) var tex: texture_2d<f32>;
@group(0) @binding(1) var texSampler: sampler;
@group(0) @binding(2) var<uniform> ubuf: vec3f;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {  
    var output = VertexOutput( vec4f(input.pos, 0.0, 1.0) );
    return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    let res = ubuf.xy;
    let uv = input.pos.xy / res;
    let jumpDist = ubuf.z / res.x;
    
    var minSeed = vec4(0.0, 0.0, 0.0, 999999.0);
    for (var y = -1.0; y <= 1.0; y += 1.0) {
    for (var x = -1.0; x <= 1.0; x += 1.0) {
        let sampleUV = uv + (vec2(x, y) * jumpDist);
        let texelCoord = clamp(vec2u(sampleUV * res), vec2u(0), vec2u(res) - vec2u(1));
        let sampleValue = textureLoad(tex, texelCoord, 0);

        if (sampleValue.x != 0.0 || sampleValue.y != 0.0) {
        let diff = sampleValue.xy - uv;
        let dist = dot(diff, diff);

        if (dist < minSeed.w) {
            minSeed.w = dist; 
            minSeed.x = sampleValue.x;
            minSeed.y = sampleValue.y;
        }
        }
 
    }
    }

    return vec4f(minSeed.x, minSeed.y, minSeed.z, minSeed.w);
}