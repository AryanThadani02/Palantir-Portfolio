import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { LinearSRGBColorSpace, MathUtils, Matrix4, ShaderMaterial, SRGBColorSpace, Vector2 } from 'three'
import type { Mesh } from 'three'
import { frame } from '../data/graph'
import { pointer } from '../lib/pointer'
import { FILM_MODE } from '../lib/film'
import { PORTRAIT_TEXTURES, portrait } from './portrait'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D tFace, tDepth;
  uniform vec2 uTilt;
  uniform float uReform;
  varying vec2 vUv;

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

  void main() {
    vec2 shift = uTilt * vec2(0.012, 0.008);
    float depth = texture2D(tDepth, vUv).r;
    vec2 uv = vUv - shift * (depth - 0.3);
    vec3 col = texture2D(tFace, uv).rgb;

    // Cut the person out of the studio backdrop so they sit straight on the page, like the particles did.
    float subject = smoothstep(0.3, 0.46, texture2D(tDepth, uv).r);

    // Resolve bottom → top behind a ragged front (the hero dissolve, played in reverse).
    float v = vUv.y * 0.78 + fbm(vUv * 7.0) * 0.22;
    float front = uReform * 1.08;
    float shown = 1.0 - smoothstep(front - 0.03, front, v);
    float edge = smoothstep(0.025, 0.0, abs(front - v)) * step(0.001, uReform) * (1.0 - step(0.999, uReform));
    col += vec3(0.12, 0.3, 0.75) * edge;

    float fade = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x) * smoothstep(0.0, 0.08, vUv.y);
    gl_FragColor = vec4(col, subject * fade * max(shown, edge * 0.8));
    #include <colorspace_fragment>
  }
`

const scale = new Matrix4()
const offset = new Matrix4()

/** At Contact, once the particles have regathered, the real colour photo resolves underneath them. */
export function PortraitEnd() {
  const [face, depth] = useTexture(PORTRAIT_TEXTURES)
  const mesh = useRef<Mesh>(null)
  const tilt = useRef(new Vector2())

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
        uTilt: { value: new Vector2() },
        uReform: { value: 0 },
      },
    })
  }, [face, depth])

  useFrame((_, dt) => {
    const m = mesh.current!
    m.visible = frame.reform > 0.001
    if (!m.visible) return
    m.matrix
      .copy(portrait.matrix)
      .multiply(offset.makeTranslation(portrait.endOffset.x, portrait.endOffset.y, 0))
      .multiply(scale.makeScale(portrait.endSize.x, portrait.endSize.y, 1))
    m.matrixWorldNeedsUpdate = true

    const step = Math.min(dt, 0.1)
    const live = FILM_MODE || pointer.coarse ? 0 : 1
    tilt.current.x = MathUtils.damp(tilt.current.x, pointer.x * live, 3, step)
    tilt.current.y = MathUtils.damp(tilt.current.y, pointer.y * live, 3, step)
    material.uniforms.uTilt.value.copy(tilt.current)
    material.uniforms.uReform.value = frame.reform
  })

  return (
    <mesh ref={mesh} material={material} matrixAutoUpdate={false} renderOrder={1} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  )
}
