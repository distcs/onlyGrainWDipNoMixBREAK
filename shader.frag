#ifdef GL_ES
precision highp float;
precision highp int;
#endif
#define PI 3.14159265359
const float PHI = 1.61803398874989484820459;
const float SEED = 43758.0;
const float SEED1 = 12.0;
const float SEED2 = 78.0;
const float SEED3 = 437.0;

uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D img;
uniform sampler2D randomTex;
uniform float u_t;
uniform float u_colorFreq;
uniform float u_dir;
uniform float u_tex;
uniform float u_grid;
uniform float u_clear;
uniform float u_chro;
uniform float u_speed;
uniform float u_bri;

uniform vec3 u_col1;
uniform vec3 u_col2;
uniform vec3 u_col3;
uniform vec3 u_col4;

float rand(in vec2 co) {
    return texture2D(randomTex, mod(co.xy / 0.7, 0.2) * PI).x;///1.4 ile 

}

float noise(in vec2 st) {
    vec2 i = floor(st);
    vec2 fu = fract(st);
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));
    vec2 u = fu * fu * (3.0 - 2.0 * fu);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// float rand(vec2 co) {
//     return fract(sin(dot(co.xy, vec2(SEED1, SEED2))) * SEED3);

// }

// float noise(vec2 st) {
//     vec2 i = floor(st);
//     vec2 f = fract(st);
//     vec2 u = f * f * (3.0 - 2.0 * f);

//     return mix(mix(rand(i), rand(i + vec2(1.0, 0.0)), u.x), mix(rand(i + vec2(0.0, 1.0)), rand(i + vec2(1.0, 1.0)), u.x), u.y);
// }

// float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

// float noise(vec2 x) {
// 	vec2 i = floor(x);
// 	vec2 f = fract(x);

// 	// Four corners in 2D of a tile
// 	float a = hash(i);
// 	float b = hash(i + vec2(1.0, 0.0));
// 	float c = hash(i + vec2(0.0, 1.0));
// 	float d = hash(i + vec2(1.0, 1.0));

// 	vec2 u = f * f * (3.0 - 2.0 * f);
// 	return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
// }

float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.8;
    vec2 shift = vec2(10.0);
    for(int i = 0; i < 10; i++) {
        value += amplitude * noise(st);
        st = st * 2.0 + shift + u_time * u_speed;
        amplitude *= 0.6;
    }
    return value;
}

vec3 colorGradient(float t) {
    if(t < 0.33) {
        return mix(u_col1, u_col2, t * 3.0);
    } else if(t < 0.66) {
        return mix(u_col2, u_col3, (t - 0.33) * 3.0);
    } else {
        return mix(u_col3, u_col4, (t - 0.66) * 3.0);
    }
}

vec2 computeDisplacement(vec2 uv, float time) {
    float noiseScale = 500.0;
    float noiseSpeed = 0.1 * (u_dir * -1.0);
    float displacementStrength = 0.0005;

    float n = fbm(uv * noiseScale + time * noiseSpeed);

    float angle = n * PI * 2.0;

    vec2 displacement = vec2(cos(angle), sin(angle)) * displacementStrength;

    return displacement;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
vec2 displacement = computeDisplacement(uv, u_time);

    vec2 displacedUV = uv + displacement;
    ;// // 

    vec2 sortedUV = displacedUV;

    float sortValue = rand(displacedUV * 1.0);

    if(u_t < 0.5) {
        sortedUV.y = mix(displacedUV.y, sortValue, 0.04);
    } else {
        sortedUV.x = mix(displacedUV.x, sortValue, 0.04);
    }

    float grain = fbm(sortedUV * u_clear);

    float distortion = noise(vec2(sortedUV.x, sortedUV.x) * 5.0 - (u_time * u_speed) * u_dir);
    sortedUV.x += distortion * 0.05;

    float blendScale = u_grid;
    float timeScale = 1.0;
    float blendFactor = noise(vec2(uv.x, uv.y) * blendScale * timeScale);

    float finalPattern;


    // if(u_tex == 1.0) {
    //     finalPattern = mix(grain, distortion, 0.5 * (blendFactor * u_colorFreq));
    // } else if(u_tex == 2.0) {
    //     finalPattern = mix(grain, distortion, 0.5 / (blendFactor * u_colorFreq));
    // }

    finalPattern = grain;//mix(grain, distortion, 0.0);

    vec3 baseColor = colorGradient(finalPattern);

    vec3 c = baseColor;

    vec3 prevColor = texture2D(img, uv).rgb;

    vec3 frameDifference = c - prevColor;

    vec2 motionVector = frameDifference.rg * 0.1;

    vec2 moshUV = uv + motionVector;// * rand(uv);///////////////Grain

    moshUV = mod(moshUV, 1.0);

    vec3 moshColor = texture2D(img, moshUV).rgb;

    float feedbackAmount = 0.9;
    c = mix(c, moshColor, feedbackAmount);

    c = clamp(c, 0.0, 1.0);

    float nweFloat = 0.02;

    float randomOffset = rand(sortedUV) * nweFloat;

    c += texture2D(img, sortedUV - randomOffset).rgb * nweFloat;
    c -= texture2D(img, vec2(sortedUV.x, sortedUV.y) * sortedUV).rgb * nweFloat;

    float offset = 1.0 / min(u_resolution.x, u_resolution.y);

    float aberrationAmount = 0.002;
    vec2 aberrationOffset = vec2(aberrationAmount, 0.0);

    float r = texture2D(img, uv - offset + vec2(aberrationOffset.x, 0.0)).r;
    float g = texture2D(img, uv - offset).g;
    float b = texture2D(img, uv - offset - vec2(aberrationOffset.x, 0.0)).b;

    vec3 chro = vec3(r, g, b);

    c = mix(c, chro, u_chro);

    c += vec3(u_bri);

    gl_FragColor = vec4(c, 1.0);
}