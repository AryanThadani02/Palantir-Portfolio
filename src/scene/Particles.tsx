import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { BufferAttribute, BufferGeometry, Matrix4, ShaderMaterial, Vector2 } from 'three'
import type { PerspectiveCamera, Points } from 'three'
import { frame } from '../data/graph'
import { EXPERIENCE } from '../data/content'
import { PORTRAIT_TEXTURES, TABLE_CENTER, portrait } from './portrait'

// The raw table: fields of varying width, rows of "text" whose length varies per cell.
const FIELD_WIDTHS = [20, 32, 18, 28, 15, 25]
const FIELD_GAP = 4
const ROWS = 60
const TABLE_W = 17
const TABLE_H = 7

/** Career skyline: one tower per experience entry, each taller than the last. */
const TOWERS = EXPERIENCE.length
const towerHeight = (k: number) => 0.42 + k * 0.24

/** Deterministic PRNG so the layout is identical on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Img = CanvasImageSource & { width: number; height: number }

function pixels(image: Img, w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(image, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h).data
}

/**
 * Samples `count` points evenly over the person in the portrait (near in the depth map): one jittered point per
 * grid cell, so dark hair and beard are covered as densely as the bright skin and headphones.
 */
function samplePortrait(image: Img, depthImage: Img, count: number, rand: () => number) {
  const w = 600
  const h = Math.round(w / (image.width / image.height))
  const data = pixels(image, w, h)
  const depth = pixels(depthImage, w, h)
  const nearAt = (x: number, y: number) => Math.min(1, Math.max(0, (depth[(y * w + x) * 4] / 255 - 0.32) / 0.12))

  let area = 0
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) area += nearAt(x, y) * 4
  const step = Math.sqrt(area / count)

  const out: { u: number; v: number; r: number; g: number; b: number }[] = []
  for (let gy = 0; gy < h; gy += step) {
    for (let gx = 0; gx < w; gx += step) {
      const x = Math.min(w - 1, Math.floor(gx + rand() * step))
      const y = Math.min(h - 1, Math.floor(gy + rand() * step))
      if (rand() > nearAt(x, y)) continue
      const i = (y * w + x) * 4
      out.push({ u: (x + 0.5) / w, v: 1 - (y + 0.5) / h, r: data[i] / 255, g: data[i + 1] / 255, b: data[i + 2] / 255 })
    }
  }
  // Trim or top up to exactly `count` (top-ups double up on existing points, which is invisible).
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  while (out.length < count) out.push(out[Math.floor(rand() * out.length)])
  return out.slice(0, count)
}

function buildGeometry(face: Img, depth: Img) {
  const rand = mulberry32(7)
  const slots = FIELD_WIDTHS.reduce((a, b) => a + b, 0) + FIELD_GAP * (FIELD_WIDTHS.length - 1)

  const cells: { x: number; y: number; size: number; xn: number }[] = []
  for (let row = 0; row < ROWS; row++) {
    let slot = 0
    for (const width of FIELD_WIDTHS) {
      const textLength = row === 0 ? width * 0.7 : width * (0.25 + rand() * 0.75)
      const isNull = row > 0 && rand() < 0.06
      for (let col = 0; col < width; col++, slot++) {
        const filled = !isNull && col < textLength
        cells.push({
          x: (slot / (slots - 1) - 0.5) * TABLE_W,
          y: (0.5 - row / (ROWS - 1)) * TABLE_H - (row > 0 ? 0.25 : 0),
          size: row === 0 ? 0.09 : filled ? 0.06 : 0.025,
          xn: slot / (slots - 1),
        })
      }
      slot += FIELD_GAP
    }
  }
  const n = cells.length

  // Portrait samples mapped onto table cells band by band (top of the face → top rows of the table),
  // so the dissolve reads as the image unfolding into rows.
  const samples = samplePortrait(face, depth, n, rand).sort((p, q) => q.v - p.v)
  const perRow = n / ROWS
  const ordered = Array.from({ length: ROWS }, (_, row) =>
    samples.slice(Math.round(row * perRow), Math.round((row + 1) * perRow)).sort((p, q) => p.u - q.u),
  ).flat()

  const heights = Array.from({ length: TOWERS }, (_, k) => towerHeight(k))
  const heightSum = heights.reduce((a, b) => a + b, 0)

  const attr = (size: number) => new Float32Array(n * size)
  const table = attr(3), portraitUv = attr(2), portraitColor = attr(3), meta = attr(4)
  const horizon = attr(3), timeline = attr(4), sphere = attr(4)

  cells.forEach((cell, i) => {
    table.set([TABLE_CENTER.x + cell.x, TABLE_CENTER.y + cell.y, TABLE_CENTER.z], i * 3)

    const p = ordered[i] ?? ordered[ordered.length - 1]
    portraitUv.set([p.u, p.v], i * 2)
    portraitColor.set([p.r, p.g, p.b], i * 3)

    const t0 = rand()
    // t0 · table → next stagger (left-to-right sweep) · dissolve delay (matches the image front) · table dot size
    meta.set([t0, cell.xn * 0.36 + rand() * 0.1, ((1 - p.v) * 0.75 + rand() * 0.25) * 0.6, cell.size], i * 4)

    // Horizon: a thin band low across the page.
    horizon.set([rand() * 2.3 - 1.15, -0.88 + (rand() - 0.5) * 0.03, (rand() - 0.5) * 0.1], i * 3)

    // Skyline: a ground line plus towers made of "windows" (columns × floors).
    if (rand() < 0.2) {
      timeline.set([-0.8 + rand() * (TOWERS - 1 + 1.6), (rand() - 0.5) * 0.012, (rand() - 0.5) * 0.04, -1], i * 4)
    } else {
      let pick = rand() * heightSum
      let k = 0
      while (pick > heights[k] && k < TOWERS - 1) pick -= heights[k++]
      const floors = Math.round(heights[k] / 0.05)
      const col = Math.floor(rand() * 5)
      const floor = Math.floor(rand() * floors)
      timeline.set([k + (col / 4 - 0.5) * 0.085, ((floor + 0.5) / floors) * heights[k], (rand() - 0.5) * 0.05, k], i * 4)
    }

    // Resting cloud (Work + Stack, invisible): a sphere the particles wait on before regathering at Contact.
    const sy = 1 - (2 * (i + 0.5)) / n
    const sr = Math.sqrt(1 - sy * sy)
    sphere.set([Math.cos(i * 2.399963) * sr, sy, Math.sin(i * 2.399963) * sr, 0], i * 4)
  })

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(table, 3))
  geometry.setAttribute('aPortrait', new BufferAttribute(portraitUv, 2))
  geometry.setAttribute('aPColor', new BufferAttribute(portraitColor, 3))
  geometry.setAttribute('aMeta', new BufferAttribute(meta, 4))
  geometry.setAttribute('aHorizon', new BufferAttribute(horizon, 3))
  geometry.setAttribute('aTimeline', new BufferAttribute(timeline, 4))
  geometry.setAttribute('aSphere', new BufferAttribute(sphere, 4))
  return geometry
}

const vertexShader = /* glsl */ `
  uniform mat4 uPortraitM;
  uniform vec2 uPortraitSize, uPortraitOffset, uEndSize, uEndOffset, uHalf;
  uniform vec3 uCenter;
  uniform float uTableScale, uTime, uShape, uLight, uTrackBase, uSlideW, uActive, uTowerScale, uScale, uDpr, uNarrow;
  uniform float uReform;
  attribute vec2 aPortrait;
  attribute vec3 aPColor, aHorizon;
  attribute vec4 aSphere;   // resting-cloud position
  attribute vec4 aMeta;     // t0, table stagger, dissolve delay, table size
  attribute vec4 aTimeline; // slide units, height above ground, depth, tower (-1 = ground)
  varying vec3 vColor;
  varying float vAlpha;

  const vec3 DARK_INK = vec3(0.80, 0.87, 1.0);
  const vec3 LIGHT_INK = vec3(0.05, 0.08, 0.16);
  const vec3 DARK_ACC = vec3(0.33, 0.6, 1.0);
  const vec3 LIGHT_ACC = vec3(0.14, 0.35, 0.84);

  float easeInOut(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }
  // Normalised view coordinates (x, y in -1..1 of the viewport) → world, on the shared plane.
  vec3 norm(vec3 n) { return uCenter + vec3(n.x * uHalf.x, n.y * uHalf.y, n.z * uHalf.y); }
  float towerAct() { return aTimeline.w < 0.0 ? 0.0 : 1.0 - clamp(abs(aTimeline.w - uActive), 0.0, 1.0); }
  vec3 cloudPos() {
    float a = uTime * 0.08;
    vec3 v = aSphere.xyz;
    v = vec3(v.x * cos(a) + v.z * sin(a), v.y, -v.x * sin(a) + v.z * cos(a));
    return uCenter + v * uHalf.y * 0.6;
  }

  vec3 shapePos(int s) {
    if (s == 0) return (uPortraitM * vec4((aPortrait - 0.5) * uPortraitSize + uPortraitOffset, 0.0, 1.0)).xyz;
    if (s == 1) return uCenter + (position - uCenter) * vec3(uTableScale, uTableScale, 1.0);
    if (s == 2) {
      vec3 h = aHorizon;
      h.y += sin(h.x * 3.0 + uTime * 0.5) * 0.015 - uNarrow * 0.09;
      return norm(h);
    }
    // 3 (Experience) onwards the particles rest, invisible, until Contact regathers them.
    if (s == 3) return cloudPos();
    // 4 (Work) is invisible and already sits on the globe, so Stack simply fades the globe in.
    if (s == 4 || s == 5) return cloudPos();
    return (uPortraitM * vec4((aPortrait - 0.5) * uEndSize + uEndOffset, 0.0, 1.0)).xyz;
  }

  vec3 shapeColor(int s) {
    vec3 ink = mix(DARK_INK, LIGHT_INK, uLight);
    vec3 acc = mix(DARK_ACC, LIGHT_ACC, uLight);
    if (s == 0) {
      float g = dot(aPColor, vec3(0.299, 0.587, 0.114));
      return mix(vec3(0.05, 0.07, 0.12), vec3(0.95, 0.96, 1.0), g);
    }
    if (s == 1) return vec3(0.82, 0.88, 1.0);
    if (s == 6) return aPColor * 1.1;
    vec3 c = aMeta.x > 0.8 ? acc : ink;
    if (s == 3) c = mix(c, acc * 1.15, towerAct());
    return c;
  }

  float shapeAlpha(int s) {
    if (s == 0) return 0.9;
    if (s == 1) return 0.85;
    if (s == 2) return mix(0.55, 0.3, uNarrow);
    // On phones the towers sit behind the copy, so they stay a quiet texture.
    if (s == 3) return 0.0;
    if (s == 4) return 0.0;
    if (s == 5) return 0.0;
    return 0.95;
  }

  float shapeSize(int s) {
    if (s == 0) return 0.05;
    if (s == 1) return aMeta.w;
    if (s == 3) return 0.045 + 0.012 * towerAct();
    if (s == 6) return 0.09;
    return 0.04;
  }

  void main() {
    float v = clamp(uShape, 0.0, 6.0);
    int i = int(min(floor(v), 5.0));
    float f = v - float(i);
    float k;
    if (i == 0) k = easeInOut(clamp((f - aMeta.z) / 0.38, 0.0, 1.0));
    else if (i == 1) k = easeInOut(clamp((f - 0.1 - aMeta.y) / 0.42, 0.0, 1.0));
    else k = easeInOut(clamp((f - aMeta.x * 0.3) / 0.7, 0.0, 1.0));

    // Mid-morph each point arcs out toward the camera, then settles into the next shape.
    float flight = sin(k * 3.14159);
    vec3 scatter = vec3(aMeta.x - 0.5, fract(aMeta.x * 7.13) - 0.5, 0.35) * uHalf.y * 0.35;
    vec3 p = mix(shapePos(i), shapePos(i + 1), k) + scatter * flight;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // Before the dissolve reaches a point, the portrait image is still showing it.
    float released = smoothstep(aMeta.z - 0.01, aMeta.z + 0.03, uShape);
    vColor = mix(shapeColor(i), shapeColor(i + 1), k);
    // At Contact the dots hand over to the real photo.
    vAlpha = mix(shapeAlpha(i), shapeAlpha(i + 1), k) * released * mix(1.0, 0.85, uLight) * (1.0 - uReform);
    float size = mix(shapeSize(i), shapeSize(i + 1), k) * (1.0 - uReform * 0.4);
    gl_PointSize = clamp(size * uScale / -mv.z, 1.0, 9.0 * uDpr);
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.1, d) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

export function Particles() {
  const [face, depth] = useTexture(PORTRAIT_TEXTURES)
  const points = useRef<Points>(null)

  const { geometry, material } = useMemo(() => {
    const mat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uPortraitM: { value: new Matrix4() },
        uPortraitSize: { value: new Vector2(1, 1) },
        uPortraitOffset: { value: new Vector2() },
        uEndSize: { value: new Vector2(1, 1) },
        uEndOffset: { value: new Vector2() },
        uHalf: { value: new Vector2(1, 1) },
        uCenter: { value: TABLE_CENTER },
        uTableScale: { value: 1 },
        uTime: { value: 0 },
        uShape: { value: 0 },
        uLight: { value: 0 },
        uTrackBase: { value: 0 },
        uSlideW: { value: 1 },
        uActive: { value: 0 },
        uTowerScale: { value: 1 },
        uNarrow: { value: 0 },
        uScale: { value: 800 },
        uDpr: { value: 1 },
        uReform: { value: 0 },
      },
    })
    return { geometry: buildGeometry(face.image as HTMLImageElement, depth.image as HTMLImageElement), material: mat }
  }, [face, depth])

  useFrame((state) => {
    const cam = state.camera as PerspectiveCamera
    const tan = Math.tan((cam.fov * Math.PI) / 360)
    const halfH = (cam.position.z - TABLE_CENTER.z) * tan
    const u = material.uniforms
    points.current!.visible = frame.shape > 0.001
    u.uHalf.value.set(halfH * cam.aspect, halfH)
    u.uScale.value = (state.size.height * state.viewport.dpr) / (2 * tan)
    u.uDpr.value = state.viewport.dpr
    u.uTableScale.value = Math.min(1, (halfH * 2 * cam.aspect * 0.9) / TABLE_W)
    u.uTime.value = state.clock.elapsedTime
    u.uShape.value = frame.shape
    u.uLight.value = frame.light
    u.uTrackBase.value = frame.trackBase
    u.uSlideW.value = frame.slideW
    u.uActive.value = frame.activeTower
    u.uTowerScale.value = frame.towerScale
    u.uNarrow.value = state.size.width / state.size.height < 0.85 ? 1 : 0
    u.uReform.value = frame.reform
    u.uPortraitM.value.copy(portrait.matrix)
    u.uPortraitSize.value.copy(portrait.size)
    u.uPortraitOffset.value.copy(portrait.offset)
    u.uEndSize.value.copy(portrait.endSize)
    u.uEndOffset.value.copy(portrait.endOffset)
  })

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}
