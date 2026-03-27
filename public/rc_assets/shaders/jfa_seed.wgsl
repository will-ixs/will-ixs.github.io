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
    let light = textureSampleLevel(tex, texSampler, uv, 0);
    
    if (light.a > 0.1) {
        return vec4f(uv, 0.0, 1.0);
    }else{
        return vec4f(0.0, 0.0, 0.0, 0.0);
    }
}