import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import {
  HalfFloatType, LinearFilter, LinearSRGBColorSpace, MathUtils, Matrix4, Mesh, OrthographicCamera, PlaneGeometry,
  Scene, ShaderMaterial, SRGBColorSpace, Vector2, WebGLRenderTarget,
} from 'three'
import { frame } from '../data/graph'
import { pointer } from '../lib/pointer'
import { FILM_MODE } from '../lib/film'
import { FACE_UV, PORTRAIT_ASPECT, PORTRAIT_TEXTURES, ndcToPortraitUv, portrait } from './portrait'

const NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
`

// ---------- Ink simulation: a ping-pong texture in image space ----------
// Each frame the previous ink drifts on a noise field, diffuses a little and fades; the cursor's path since the
// last frame is painted in with a noisy brush. Only movement paints, so a resting cursor never leaves a disc.

const SIM_W = 512
const SIM_H = 288
/** Brush radius in image-height units, before noise modulation. */
const BRUSH = 0.06
/** Seconds for ink to fade to half strength. */
const HALF_LIFE = 2.6

const simVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const simFragment = /* glsl */ `
  uniform sampler2D tPrev;
  uniform vec2 uA, uB, uTexel;
  uniform float uAmount, uRadius, uAspect, uDecay, uTime;
  varying vec2 vUv;
  ${NOISE}
  void main() {
    vec2 drift = vec2(fbm(vUv * 5.0 + uTime * 0.12), fbm(vUv * 5.0 + vec2(4.7, 2.1) - uTime * 0.12)) - 0.5;
    vec2 s = vUv - drift * 0.0035;
    float c = texture2D(tPrev, s).r * 0.52
      + (texture2D(tPrev, s + vec2(uTexel.x, 0.0)).r + texture2D(tPrev, s - vec2(uTexel.x, 0.0)).r
       + texture2D(tPrev, s + vec2(0.0, uTexel.y)).r + texture2D(tPrev, s - vec2(0.0, uTexel.y)).r) * 0.12;
    c *= uDecay;

    vec2 k = vec2(uAspect, 1.0);
    vec2 pa = (vUv - uA) * k, ba = (uB - uA) * k;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    float d = length(pa - ba * h);
    float r = uRadius * (0.45 + fbm(vUv * 11.0 + uTime * 0.6) * 1.2);
    float splat = smoothstep(r, r * 0.15, d) * uAmount;
    gl_FragColor = vec4(clamp(c + splat * (1.0 - c), 0.0, 1.0), 0.0, 0.0, 1.0);
  }
`

// ---------- Portrait ----------

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D tFace, tDepth, tInk;
  uniform vec2 uTilt;
  uniform float uAppear, uDissolve;
  varying vec2 vUv;
  ${NOISE}

  void main() {
    // Depth parallax: near pixels (white) shift with the pointer, far ones stay — a real head tilt.
    // Entrance: the image settles from a slight zoom while it is revealed (uAppear 0 → 1, eased).
    vec2 base = vec2(0.5, 0.55) + (vUv - vec2(0.5, 0.55)) * (1.0 - (1.0 - uAppear) * 0.1);
    vec2 shift = uTilt * vec2(0.016, 0.011);
    float depth = texture2D(tDepth, base).r;
    vec2 uv = base - shift * (depth - 0.3);
    depth = texture2D(tDepth, uv).r;
    uv = base - shift * (depth - 0.3);

    // Texture is decoded to linear; grade in sRGB-ish space so the curve matches the photo as you see it.
    vec3 color = texture2D(tFace, uv).rgb;
    vec3 srgb = pow(color, vec3(1.0 / 2.2));
    float g = pow(clamp(dot(srgb, vec3(0.299, 0.587, 0.114)), 0.0, 1.0), 0.85);
    // Black & white with a faint blue lift in the midtones so it sits on the site's palette.
    vec3 mono = pow(vec3(g) + vec3(0.0, 0.015, 0.05) * g * (1.0 - g) * 2.0, vec3(2.2));

    float ink = texture2D(tInk, uv).r;
    float reveal = smoothstep(0.06, 0.7, ink);
    vec3 col = mix(mono, color, reveal);
    // Cold fringe where the ink is thin.
    col += vec3(0.25, 0.5, 1.0) * smoothstep(0.02, 0.2, ink) * (1.0 - reveal) * 0.16;

    // Scroll: dissolve top → bottom with a ragged front; the particles take over.
    float v = (1.0 - vUv.y) * 0.75 + fbm(vUv * 7.0) * 0.25;
    float front = uDissolve / 0.6;
    float alive = 1.0 - smoothstep(v - 0.025, v, front);
    float subject = smoothstep(0.3, 0.5, texture2D(tDepth, vUv).r);
    float edge = smoothstep(0.02, 0.0, abs(front - v)) * step(0.001, uDissolve) * subject;
    col += vec3(0.35, 0.62, 1.0) * edge * 0.35;

    // Entrance wipe: bottom → top behind a ragged front with a thin line of blue light; exposure rises with it.
    float rv = vUv.y * 0.9 + fbm(vUv * 5.0 + 3.0) * 0.1;
    float wf = uAppear * 1.2;
    float shown = smoothstep(rv - 0.07, rv, wf);
    // A hairline of light that only traces the person, not the backdrop.
    float wedge = smoothstep(0.012, 0.0, abs(wf - rv)) * (1.0 - step(0.999, uAppear)) * step(0.001, uAppear) * subject;
    col *= mix(0.35, 1.0, smoothstep(0.0, 1.0, uAppear));
    col += vec3(0.45, 0.7, 1.0) * wedge * 0.7;

    // Feather the frame into the page.
    float fade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x) * smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.975, vUv.y);
    gl_FragColor = vec4(col, fade * max(shown * max(alive, edge), wedge * 0.6));
    #include <colorspace_fragment>
  }
`

const scale = new Matrix4()
const offset = new Matrix4()

export function PortraitHero() {
  const [face, depth] = useTexture(PORTRAIT_TEXTURES)
  const mesh = useRef<Mesh>(null)

  const sim = useMemo(() => {
    const opts = { type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false }
    const material = new ShaderMaterial({
      vertexShader: simVertex,
      fragmentShader: simFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tPrev: { value: null },
        uA: { value: new Vector2(-9, -9) },
        uB: { value: new Vector2(-9, -9) },
        uTexel: { value: new Vector2(1 / SIM_W, 1 / SIM_H) },
        uAmount: { value: 0 },
        uRadius: { value: BRUSH },
        uAspect: { value: PORTRAIT_ASPECT },
        uDecay: { value: 1 },
        uTime: { value: 0 },
      },
    })
    const scene = new Scene()
    scene.add(new Mesh(new PlaneGeometry(2, 2), material))
    return {
      read: new WebGLRenderTarget(SIM_W, SIM_H, opts),
      write: new WebGLRenderTarget(SIM_W, SIM_H, opts),
      material,
      scene,
      camera: new OrthographicCamera(-1, 1, 1, -1, 0, 1),
      cleared: false,
    }
  }, [])

  useEffect(
    () => () => {
      sim.read.dispose()
      sim.write.dispose()
      sim.material.dispose()
    },
    [sim],
  )

  const material = useMemo(() => {
    face.colorSpace = SRGBColorSpace
    depth.colorSpace = LinearSRGBColorSpace
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        tFace: { value: face },
        tDepth: { value: depth },
        tInk: { value: sim.read.texture },
        uTilt: { value: new Vector2() },
        uAppear: { value: 0 },
        uDissolve: { value: 0 },
      },
    })
  }, [face, depth, sim])

  const state = useRef({ target: new Vector2(FACE_UV.x, FACE_UV.y), lag: new Vector2(FACE_UV.x, FACE_UV.y), prev: new Vector2(FACE_UV.x, FACE_UV.y), tilt: new Vector2() })

  useFrame(({ gl, clock }, dt) => {
    const step = Math.min(dt, 0.1)
    const t = clock.elapsedTime
    const m = mesh.current!
    m.visible = frame.appear > 0 && frame.dissolve < 0.999
    if (!m.visible) return
    m.matrix
      .copy(portrait.matrix)
      .multiply(offset.makeTranslation(portrait.offset.x, portrait.offset.y, 0))
      .multiply(scale.makeScale(portrait.size.x, portrait.size.y, 1))
    m.matrixWorldNeedsUpdate = true

    // The brush follows a smoothed cursor. Touch, film, and visitors who haven't moved yet get an autopilot
    // that paints a slow figure-eight across the face.
    const s = state.current
    const autopilot = FILM_MODE || pointer.coarse || !pointer.movedAt
    if (autopilot) s.target.set(FACE_UV.x + Math.sin(t * 0.55) * 0.085, FACE_UV.y + 0.03 + Math.sin(t * 1.1) * 0.12)
    else ndcToPortraitUv(pointer.x, pointer.y, s.target)
    s.prev.copy(s.lag)
    s.lag.x = MathUtils.damp(s.lag.x, s.target.x, 10, step)
    s.lag.y = MathUtils.damp(s.lag.y, s.target.y, 10, step)
    const speed = step > 0 ? s.prev.distanceTo(s.lag) / step : 0

    // Ink pass.
    if (!sim.cleared) {
      for (const rt of [sim.read, sim.write]) {
        gl.setRenderTarget(rt)
        gl.clear()
      }
      sim.cleared = true
    }
    const su = sim.material.uniforms
    su.tPrev.value = sim.read.texture
    su.uA.value.copy(s.prev)
    su.uB.value.copy(s.lag)
    su.uAmount.value = MathUtils.clamp(speed * 2.4, 0, 1) * (frame.appear > 0.35 && frame.dissolve < 0.05 ? 1 : 0)
    su.uDecay.value = Math.pow(0.5, step / HALF_LIFE)
    su.uTime.value = t
    gl.setRenderTarget(sim.write)
    gl.render(sim.scene, sim.camera)
    gl.setRenderTarget(null)
    ;[sim.read, sim.write] = [sim.write, sim.read]

    // Tilt toward the cursor, relative to the face.
    const tx = MathUtils.clamp(((s.lag.x - FACE_UV.x) * portrait.size.x) / (portrait.view.x * 0.35), -1, 1)
    const ty = MathUtils.clamp(((s.lag.y - FACE_UV.y) * portrait.size.y) / (portrait.view.y * 0.35), -1, 1)
    s.tilt.x = MathUtils.damp(s.tilt.x, tx, 3, step)
    s.tilt.y = MathUtils.damp(s.tilt.y, ty, 3, step)

    const u = material.uniforms
    u.tInk.value = sim.read.texture
    u.uTilt.value.copy(s.tilt)
    const a = frame.appear
    u.uAppear.value = a < 0.5 ? 4 * a * a * a : 1 - Math.pow(-2 * a + 2, 3) / 2
    u.uDissolve.value = frame.dissolve
  })

  return (
    <mesh ref={mesh} material={material} matrixAutoUpdate={false} renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  )
}
