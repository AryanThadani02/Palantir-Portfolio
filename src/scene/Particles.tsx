import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import {
  BufferAttribute, BufferGeometry, DataTexture, FloatType, Matrix4, NearestFilter, RGBAFormat, ShaderMaterial,
  UnsignedByteType, Vector2, Vector4,
} from 'three'
import type { PerspectiveCamera, Points } from 'three'
import { MAX_PILLS, PILL_STRIDE, frame } from '../data/graph'
import { ABOUT_WORDS, EXPERIENCE, STEPS_PER_PROJECT, WORK_STEPS } from '../data/content'
import { ICONS } from '../ui/icons'
import { PORTRAIT_TEXTURES, TABLE_CENTER, portrait } from './portrait'
import { stepRegion, visualRegion, wordLayout } from './layouts'

// The raw table: fields of varying width, rows of "text" whose length varies per cell.
const FIELD_WIDTHS = [20, 32, 18, 28, 15, 25]
const FIELD_GAP = 4
const ROWS = 60
const TABLE_W = 17
const TABLE_H = 7

/** Company logos, oldest first — the order the Experience chapter morphs through. */
const LOGOS = EXPERIENCE.map((e) => e.logo)
const LOGO_TEX_W = 128
/**
 * Every "glyph" the particles can spell sits in one target texture, a block of rows per glyph:
 * the company logos, then the About words, then the Work step pictograms.
 */
const WORD_BASE = LOGOS.length
const STEP_BASE = WORD_BASE + ABOUT_WORDS.length
const BLOCKS = STEP_BASE + WORK_STEPS.length
const WORD_FONT = '500 260px Geist, system-ui, sans-serif'

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

/** Stratified sampling: one jittered point per grid cell, kept with probability `weight(x, y)`; exactly `count`. */
function stratified<T>(w: number, h: number, count: number, rand: () => number, weight: (x: number, y: number) => number, make: (x: number, y: number) => T) {
  let area = 0
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) area += weight(x, y) * 4
  const step = Math.sqrt(Math.max(1, area) / count)
  const out: T[] = []
  for (let gy = 0; gy < h; gy += step) {
    for (let gx = 0; gx < w; gx += step) {
      const x = Math.min(w - 1, Math.floor(gx + rand() * step))
      const y = Math.min(h - 1, Math.floor(gy + rand() * step))
      if (rand() > weight(x, y)) continue
      out.push(make(x, y))
    }
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  while (out.length < count && out.length) out.push(out[Math.floor(rand() * out.length)])
  return out.slice(0, count)
}

/** Points evenly over the person in the portrait (near in the depth map). */
function samplePortrait(image: Img, depthImage: Img, count: number, rand: () => number) {
  const w = 600
  const h = Math.round(w / (image.width / image.height))
  const data = pixels(image, w, h)
  const depth = pixels(depthImage, w, h)
  return stratified(
    w, h, count, rand,
    (x, y) => Math.min(1, Math.max(0, (depth[(y * w + x) * 4] / 255 - 0.32) / 0.12)),
    (x, y) => {
      const i = (y * w + x) * 4
      return { u: (x + 0.5) / w, v: 1 - (y + 0.5) / h, r: data[i] / 255, g: data[i + 1] / 255, b: data[i + 2] / 255 }
    },
  )
}

/**
 * Points over a logo's mark (anything that differs from the background, read off the corners), in -1..1 keeping
 * the aspect, with colours lifted so they read on the dark Experience chapter.
 */
function sampleLogo(image: Img, count: number, rand: () => number, w = 200) {
  const h = Math.max(1, Math.round(w / (image.width / image.height)))
  const d = pixels(image, w, h)
  const corner = (x: number, y: number) => [d[(y * w + x) * 4], d[(y * w + x) * 4 + 1], d[(y * w + x) * 4 + 2]]
  const cs = [corner(1, 1), corner(w - 2, 1), corner(1, h - 2), corner(w - 2, h - 2)]
  const bg = [0, 1, 2].map((k) => cs.reduce((a, c) => a + c[k], 0) / 4)
  const fg = (x: number, y: number) => {
    const i = (y * w + x) * 4
    const dist = Math.hypot(d[i] - bg[0], d[i + 1] - bg[1], d[i + 2] - bg[2]) / 441
    return Math.min(1, Math.max(0, (dist - 0.1) / 0.18))
  }
  const k = Math.max(w, h) / 2
  return stratified(w, h, count, rand, fg, (x, y) => {
    const i = (y * w + x) * 4
    let r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255
    const lum = 0.3 * r + 0.59 * g + 0.11 * b
    const lift = Math.min(1, Math.max(0, (0.6 - lum) * 1.3))
    r += (0.86 - r) * lift
    g += (0.9 - g) * lift
    b += (1 - b) * lift
    return { x: (x - w / 2) / k, y: -(y - h / 2) / k, r, g, b }
  })
}

/** A Blueprint pictogram, filled dark on white with a margin (so the corners read as background). */
function iconCanvas(key: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 240
  const g = c.getContext('2d')!
  g.fillStyle = '#fff'
  g.fillRect(0, 0, 240, 240)
  g.setTransform(10, 0, 0, 10, 20, 20)
  g.fillStyle = '#000'
  for (const d of ICONS[key].paths) g.fill(new Path2D(d), 'evenodd')
  return c
}

/** The About words, all on one canvas size so every word shares one type size. */
function wordCanvases() {
  const probe = document.createElement('canvas').getContext('2d')!
  probe.font = WORD_FONT
  probe.letterSpacing = '-10px'
  const w = Math.ceil(Math.max(...ABOUT_WORDS.map((a) => probe.measureText(a.word).width)) * 1.06)
  return ABOUT_WORDS.map(({ word }) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = 340
    const g = c.getContext('2d')!
    g.fillStyle = '#fff'
    g.fillRect(0, 0, c.width, c.height)
    g.font = WORD_FONT
    g.letterSpacing = '-10px'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = '#000'
    g.fillText(word, c.width / 2, c.height / 2 + 10)
    return c
  })
}

/** (Re)writes the word blocks of the glyph texture — called again once Geist has loaded. */
function writeWords(tex: DataTexture, n: number, rowsPer: number) {
  const rand = mulberry32(11)
  const data = tex.image.data as Float32Array
  wordCanvases().forEach((c, wi) => {
    sampleLogo(c, n, rand, 900).forEach((p, i) => data.set([p.x, p.y, 0, 1], ((WORD_BASE + wi) * rowsPer * LOGO_TEX_W + i) * 4))
  })
  tex.needsUpdate = true
}

function buildGeometry(face: Img, depth: Img, logos: Img[]) {
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

  // Portrait samples mapped onto table cells band by band (top of the face → top rows of the table).
  const samples = samplePortrait(face, depth, n, rand).sort((p, q) => q.v - p.v)
  const perRow = n / ROWS
  const ordered = Array.from({ length: ROWS }, (_, row) =>
    samples.slice(Math.round(row * perRow), Math.round((row + 1) * perRow)).sort((p, q) => p.u - q.u),
  ).flat()

  // Logo targets in a texture: row block per logo, one texel per particle (xy position, rgb colour).
  const rowsPer = Math.ceil(n / LOGO_TEX_W)
  const logoPos = new Float32Array(LOGO_TEX_W * rowsPer * BLOCKS * 4)
  const logoCol = new Uint8Array(LOGO_TEX_W * rowsPer * BLOCKS * 4)
  const glyphs: Img[] = [...logos, ...wordCanvases(), ...WORK_STEPS.map((st) => iconCanvas(st.icon))]
  glyphs.forEach((img, li) => {
    const pts = sampleLogo(img, n, rand, li >= WORD_BASE && li < STEP_BASE ? 900 : 200)
    pts.forEach((p, i) => {
      const t = (li * rowsPer * LOGO_TEX_W + i) * 4
      logoPos.set([p.x, p.y, 0, 1], t)
      logoCol.set([p.r * 255, p.g * 255, p.b * 255, 255], t)
    })
  })
  const mkTex = (data: Float32Array | Uint8Array, type: typeof FloatType | typeof UnsignedByteType) => {
    const tex = new DataTexture(data, LOGO_TEX_W, rowsPer * BLOCKS, RGBAFormat, type)
    tex.minFilter = tex.magFilter = NearestFilter
    tex.needsUpdate = true
    return tex
  }

  const attr = (size: number) => new Float32Array(n * size)
  const table = attr(3), portraitUv = attr(2), portraitColor = attr(3), meta = attr(4)
  const rnd = attr(4), sphere = attr(4)

  cells.forEach((cell, i) => {
    table.set([TABLE_CENTER.x + cell.x, TABLE_CENTER.y + cell.y, TABLE_CENTER.z], i * 3)
    const p = ordered[i] ?? ordered[ordered.length - 1]
    portraitUv.set([p.u, p.v], i * 2)
    portraitColor.set([p.r, p.g, p.b], i * 3)
    // t0 · table → next stagger (left-to-right sweep) · dissolve delay (matches the image front) · table dot size
    meta.set([rand(), cell.xn * 0.36 + rand() * 0.1, ((1 - p.v) * 0.75 + rand() * 0.25) * 0.6, cell.size], i * 4)
    // id + three independent randoms for the procedural shapes.
    rnd.set([i, rand(), rand(), rand()], i * 4)
    // Resting cloud (certificates + stack, invisible).
    const sy = 1 - (2 * (i + 0.5)) / n
    const sr = Math.sqrt(1 - sy * sy)
    sphere.set([Math.cos(i * 2.399963) * sr, sy, Math.sin(i * 2.399963) * sr, 0], i * 4)
  })

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(table, 3))
  geometry.setAttribute('aPortrait', new BufferAttribute(portraitUv, 2))
  geometry.setAttribute('aPColor', new BufferAttribute(portraitColor, 3))
  geometry.setAttribute('aMeta', new BufferAttribute(meta, 4))
  geometry.setAttribute('aRand', new BufferAttribute(rnd, 4))
  geometry.setAttribute('aSphere', new BufferAttribute(sphere, 4))
  return { geometry, n, rowsPer, logoPos: mkTex(logoPos, FloatType), logoCol: mkTex(logoCol, UnsignedByteType) }
}

const vertexShader = /* glsl */ `
  #define WORD_BASE ${WORD_BASE.toFixed(1)}
  #define STEP_BASE ${STEP_BASE.toFixed(1)}
  #define BLOCKS ${BLOCKS.toFixed(1)}
  #define MAX_PILLS ${MAX_PILLS}
  uniform mat4 uPortraitM;
  uniform vec2 uPortraitSize, uPortraitOffset, uEndSize, uEndOffset, uHalf;
  uniform vec3 uCenter, uRegion, uStepRegion, uWordLayout;
  uniform float uTableScale, uTime, uShape, uLight, uScale, uDpr, uNarrow, uReform, uCount;
  uniform float uWord, uLogo, uStep, uStepCount, uStepsPer, uRowsPer;
  uniform sampler2D tLogoPos, tLogoCol;
  // Stack floor: arena (centre, half-size in view units), its px size, the pills (see frame.pills) and cursor.
  uniform vec4 uBox;
  uniform vec2 uBoxPx;
  uniform vec4 uPillA[MAX_PILLS];
  uniform vec4 uPillB[MAX_PILLS];
  uniform vec3 uCursor;
  attribute vec2 aPortrait;
  attribute vec3 aPColor;
  attribute vec4 aSphere;   // resting-cloud position
  attribute vec4 aMeta;     // t0, table stagger, dissolve delay, table size
  attribute vec4 aRand;     // id, r1, r2, r3
  varying vec3 vColor;
  varying float vAlpha;

  const vec3 DARK_INK = vec3(0.80, 0.87, 1.0);
  const vec3 LIGHT_INK = vec3(0.05, 0.08, 0.16);
  const vec3 DARK_ACC = vec3(0.33, 0.6, 1.0);
  const vec3 LIGHT_ACC = vec3(0.14, 0.35, 0.84);
  const float PI = 3.14159265;

  float easeInOut(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }
  // Normalised view coordinates (x, y in -1..1 of the viewport) → world, on the shared plane.
  vec3 norm(vec3 n) { return uCenter + vec3(n.x * uHalf.x, n.y * uHalf.y, n.z * uHalf.y); }
  // A point in the chapter's visual region; local units keep a square aspect.
  vec3 regionOf(vec3 r, vec2 l) { return norm(vec3(r.x + l.x * r.z * uHalf.y / uHalf.x, r.y + l.y * r.z, 0.0)); }
  vec3 region(vec2 l) { return regionOf(uRegion, l); }

  // A glyph's sampled target (see the texture blocks in buildGeometry).
  vec4 glyphTexel(sampler2D t, float block) {
    float idx = aRand.x + block * uRowsPer * 128.0;
    vec2 uv = (vec2(mod(idx, 128.0), floor(idx / 128.0)) + 0.5) / vec2(128.0, uRowsPer * BLOCKS);
    return texture2D(t, uv);
  }
  // Continuous index s over 0..last -> (from-glyph, eased progress to the next), staggered per dot.
  vec2 morphOf(float s, float last) {
    float i = min(floor(s), last - 1.0);
    return vec2(i, easeInOut(clamp((s - i) * 1.2 - aRand.y * 0.2, 0.0, 1.0)));
  }
  float near(float s, float k) { return max(0.0, 1.0 - abs(s - k) * 1.6); }

  vec3 cloudPos() {
    float a = uTime * 0.08;
    vec3 v = aSphere.xyz;
    v = vec3(v.x * cos(a) + v.z * sin(a), v.y, -v.x * sin(a) + v.z * cos(a));
    return uCenter + v * uHalf.y * 0.6;
  }

  // ---- 2: About title sequence — the dots write one giant word per beat
  vec2 wordLocal() {
    float s = clamp(uWord, 0.0, 3.0);
    vec2 m = morphOf(s, 3.0);
    vec2 q = mix(glyphTexel(tLogoPos, WORD_BASE + m.x).xy, glyphTexel(tLogoPos, WORD_BASE + m.x + 1.0).xy, m.y);
    // Between words the letters burst apart a little and re-form.
    q += (vec2(aRand.z, aRand.w) - 0.5) * vec2(0.9, 0.5) * sin(m.y * PI);
    return q;
  }
  vec3 wordPos() {
    float s = clamp(uWord, 0.0, 3.0);
    vec2 q = wordLocal();
    // Raw data: every dot jitters, and a few strays wander off the letters.
    float raw = near(s, 0.0);
    q += vec2(sin(uTime * 1.9 + aRand.y * 40.0), cos(uTime * 1.5 + aRand.z * 40.0)) * 0.016 * raw;
    if (aRand.w > 0.88) q += (vec2(aRand.y, aRand.z) - 0.5) * vec2(1.7, 1.2) * raw
      + vec2(sin(uTime * 0.3 + aRand.x), cos(uTime * 0.25 + aRand.y * 9.0)) * 0.05 * raw;
    // Pipelines: a share of the dots stream left to right through the letters, along their own row.
    if (aRand.w < 0.26) q.x = mix(q.x, fract(aRand.y + uTime * (0.08 + aRand.z * 0.06)) * 2.3 - 1.15, near(s, 2.0));
    vec2 o = uWordLayout.xy + q * uWordLayout.z * vec2(1.0, uHalf.x / uHalf.y);
    return norm(vec3(o, 0.0));
  }
  vec3 wordColor(vec3 ink, vec3 acc) {
    float s = clamp(uWord, 0.0, 3.0);
    vec3 c = mix(ink, acc, near(s, 1.0));
    c = mix(c, acc, near(s, 2.0) * step(aRand.w, 0.26));
    // Apps: a soft light sweeps across the letters.
    float sweep = fract(uTime * 0.16) * 3.0 - 1.5;
    return mix(c, acc * 1.15, near(s, 3.0) * smoothstep(0.22, 0.0, abs(wordLocal().x - sweep)));
  }

  // ---- 4: company logos from the sampled texture
  vec4 logoTexel(sampler2D t, float logo) { return glyphTexel(t, logo); }
  vec3 logoPos() {
    float s = clamp(uLogo, 0.0, 4.0);
    float i = min(floor(s), 3.0);
    float k = easeInOut(clamp((s - i) * 1.2 - aRand.y * 0.2, 0.0, 1.0));
    vec2 a = logoTexel(tLogoPos, i).xy;
    vec2 b = logoTexel(tLogoPos, i + 1.0).xy;
    vec2 swirl = vec2(-a.y, a.x) * sin(k * PI) * 0.35;
    return region(mix(a, b, k) * 0.82 + swirl);
  }
  vec3 logoColor() {
    float s = clamp(uLogo, 0.0, 4.0);
    float i = min(floor(s), 3.0);
    float k = easeInOut(clamp((s - i) * 1.2 - aRand.y * 0.2, 0.0, 1.0));
    return mix(logoTexel(tLogoCol, i).rgb, logoTexel(tLogoCol, i + 1.0).rgb, k);
  }

  // ---- 5: Work — one big pictogram per pipeline step, morphing step to step
  vec3 stepPos() {
    float last = uStepCount - 1.0;
    float s = clamp(uStep, 0.0, last);
    vec2 m = morphOf(s, last);
    vec2 q = mix(glyphTexel(tLogoPos, STEP_BASE + m.x).xy, glyphTexel(tLogoPos, STEP_BASE + m.x + 1.0).xy, m.y) * 0.82;
    // Each change bursts outward toward the camera; the change of project is a full explosion.
    float burst = sin(m.y * PI) * (mod(m.x + 1.0, uStepsPer) < 0.5 ? 1.0 : 0.35);
    vec2 dir = normalize(vec2(aRand.z, aRand.w) - 0.5 + 1e-4);
    q += dir * (0.25 + aRand.y * 0.6) * burst;
    q *= 1.0 + sin(uTime * 0.7 + aRand.y) * 0.006;
    return regionOf(uStepRegion, q) + vec3(0.0, 0.0, burst * 0.35 * uHalf.y);
  }

  // ---- 6: Stack — the arena's dotted floor, bent around the physics pills like iron filings
  const float PITCH = 15.0;
  const float INSET = 10.0;
  vec3 gFloor;       // world position
  float gFloorLight; // 0 resting … 1 disturbed
  float gFloorOn;    // 0 for dots the grid doesn't need

  vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

  void computeFloor() {
    vec2 inner = max(uBoxPx - 2.0 * INSET, vec2(1.0));
    float cols = max(1.0, floor(inner.x / PITCH) + 1.0);
    float rows = max(1.0, floor(inner.y / PITCH) + 1.0);
    float cells = cols * rows;
    float id = aRand.x;
    gFloorOn = id < cells ? 1.0 : 0.0;
    float k = mod(id, cells);
    vec2 g = vec2(mod(k, cols), floor(k / cols));
    // Centre the lattice in the box.
    vec2 p = INSET + (inner - (vec2(cols, rows) - 1.0) * PITCH) * 0.5 + g * PITCH;

    vec2 push = vec2(0.0);
    float light = 0.0;
    for (int j = 0; j < MAX_PILLS; j++) {
      vec4 a = uPillA[j];
      if (a.z <= 0.0) continue;
      vec4 b = uPillB[j];
      float heat = floor(b.w / 1000.0);
      float age = b.w - heat * 1000.0;
      float gain = heat < 0.5 ? 0.35 : heat > 1.5 ? 1.45 : 1.0;
      // Distance to the rotated pill (a capsule: a segment of half-length (w - h) with radius h).
      vec2 d = rot(p - a.xy, -b.x);
      float r = a.w;
      vec2 core = vec2(clamp(d.x, -(a.z - r), a.z - r), 0.0);
      vec2 off = d - core;
      float len = length(off);
      float dist = len - r;
      vec2 n = rot(len > 0.001 ? off / len : vec2(0.0, 1.0), b.x);
      float f = smoothstep(64.0, 0.0, dist) * gain;
      vec2 vel = b.yz;
      push += n * f * 22.0 + vel * f * 1.6;
      light += f * (0.55 + min(length(vel), 12.0) * 0.06);
      // Impact ripple: a ring running out from the pill for ~1.4s.
      if (age < 1.4) {
        vec2 c = p - a.xy;
        float cd = length(c);
        float ring = exp(-pow((cd - age * 520.0) / 26.0, 2.0)) * (1.0 - age / 1.4);
        push += (cd > 0.001 ? c / cd : vec2(0.0)) * ring * 12.0;
        light += ring * 0.9;
      }
    }
    if (uCursor.z > 0.5) {
      vec2 c = p - uCursor.xy;
      float cd = length(c);
      float f = smoothstep(120.0, 0.0, cd);
      push += (cd > 0.001 ? c / cd : vec2(0.0)) * f * 16.0;
      light += f * 0.35;
    }
    float pl = length(push);
    if (pl > 48.0) push *= 48.0 / pl;
    p += push;
    gFloorLight = clamp(light, 0.0, 1.0);
    // Dots shoved past the arena's edge fade out instead of spilling over the page.
    vec2 over = max(vec2(4.0) - p, p - (uBoxPx - 4.0));
    gFloorOn *= 1.0 - smoothstep(0.0, 6.0, max(over.x, over.y));

    vec2 uv = p / uBoxPx;
    gFloor = norm(vec3(uBox.x + (uv.x * 2.0 - 1.0) * uBox.z, uBox.y + (1.0 - uv.y * 2.0) * uBox.w, 0.0));
  }

  vec3 shapePos(int s) {
    if (s == 0) return (uPortraitM * vec4((aPortrait - 0.5) * uPortraitSize + uPortraitOffset, 0.0, 1.0)).xyz;
    if (s == 1) return uCenter + (position - uCenter) * vec3(uTableScale, uTableScale, 1.0);
    if (s == 2) return wordPos();
    if (s == 3) return logoPos();
    if (s == 4) return stepPos();
    if (s == 5) return cloudPos();
    if (s == 6) return gFloor;
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
    if (s == 2) return wordColor(ink, acc);
    if (s == 3) return logoColor();
    if (s == 4) return aMeta.x > 0.82 ? ink : acc;
    if (s == 6) return mix(ink * 0.8, acc * 1.25, gFloorLight);
    if (s == 7) return aPColor * 1.1;
    return aMeta.x > 0.8 ? acc : ink;
  }

  float shapeAlpha(int s) {
    if (s == 0) return 0.9;
    if (s == 1) return 0.85;
    if (s == 2) return 0.9;
    if (s == 3) return 0.95;
    if (s == 4) return 0.9;
    if (s == 5) return 0.0;
    if (s == 6) return gFloorOn * (0.26 + gFloorLight * 0.7);
    return 0.95;
  }

  float shapeSize(int s) {
    if (s == 0) return 0.05;
    if (s == 1) return aMeta.w;
    if (s == 2) return mix(0.046, 0.032, uNarrow);
    if (s == 3) return 0.05;
    if (s == 6) return 0.03 + gFloorLight * 0.016;
    if (s == 7) return 0.09;
    return 0.042;
  }

  void main() {
    float v = clamp(uShape, 0.0, 7.0);
    int i = int(min(floor(v), 6.0));
    // The floor loops over every pill: only pay for it while the Stack is on screen.
    gFloor = vec3(0.0);
    gFloorLight = 0.0;
    gFloorOn = 0.0;
    if (v > 5.0 && v < 7.0) computeFloor();
    float f = v - float(i);
    float k;
    if (i == 0) k = easeInOut(clamp((f - aMeta.z) / 0.38, 0.0, 1.0));
    else if (i == 1) k = easeInOut(clamp((f - 0.1 - aMeta.y) / 0.42, 0.0, 1.0));
    else k = easeInOut(clamp((f - aMeta.x * 0.3) / 0.7, 0.0, 1.0));

    // Mid-morph each point arcs out toward the camera, then settles into the next shape.
    float flight = sin(k * PI);
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
  const [face, depth, ...logoTex] = useTexture([...PORTRAIT_TEXTURES, ...LOGOS])
  const points = useRef<Points>(null)
  const narrowRef = useRef<boolean | null>(null)

  const { geometry, material } = useMemo(() => {
    const built = buildGeometry(
      face.image as HTMLImageElement,
      depth.image as HTMLImageElement,
      logoTex.map((t) => t.image as HTMLImageElement),
    )
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
        uRegion: { value: { x: 0, y: 0, z: 1 } },
        uTableScale: { value: 1 },
        uTime: { value: 0 },
        uShape: { value: 0 },
        uLight: { value: 0 },
        uNarrow: { value: 0 },
        uScale: { value: 800 },
        uDpr: { value: 1 },
        uReform: { value: 0 },
        uCount: { value: built.n },
        uRowsPer: { value: built.rowsPer },
        uWord: { value: 0 },
        uLogo: { value: 0 },
        uStep: { value: 0 },
        uStepCount: { value: WORK_STEPS.length },
        uStepsPer: { value: STEPS_PER_PROJECT },
        uStepRegion: { value: { x: 0, y: 0, z: 1 } },
        uWordLayout: { value: { x: 0, y: 0, z: 1 } },
        tLogoPos: { value: built.logoPos },
        tLogoCol: { value: built.logoCol },
        uBox: { value: new Vector4() },
        uBoxPx: { value: new Vector2(1, 1) },
        uPillA: { value: Array.from({ length: MAX_PILLS }, () => new Vector4()) },
        uPillB: { value: Array.from({ length: MAX_PILLS }, () => new Vector4()) },
        uCursor: { value: { x: -999, y: -999, z: 0 } },
      },
    })
    // The words were first drawn in a fallback face; redraw them in Geist once it's loaded.
    document.fonts.load(WORD_FONT).then(() => writeWords(built.logoPos, built.n, built.rowsPer))
    return { geometry: built.geometry, material: mat }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [face, depth])

  useFrame((state) => {
    const cam = state.camera as PerspectiveCamera
    const tan = Math.tan((cam.fov * Math.PI) / 360)
    const halfH = (cam.position.z - TABLE_CENTER.z) * tan
    const u = material.uniforms
    const narrow = state.size.width / state.size.height < 0.85

    // Layouts depend only on the breakpoint.
    if (narrowRef.current !== narrow) {
      narrowRef.current = narrow
      const r = visualRegion(narrow)
      u.uRegion.value = { x: r.cx, y: r.cy, z: r.s }
      const st = stepRegion(narrow)
      u.uStepRegion.value = { x: st.cx, y: st.cy, z: st.s }
      const w = wordLayout(narrow)
      u.uWordLayout.value = { x: w.cx, y: w.cy, z: w.s }
    }

    points.current!.visible = frame.shape > 0.001
    u.uHalf.value.set(halfH * cam.aspect, halfH)
    u.uScale.value = (state.size.height * state.viewport.dpr) / (2 * tan)
    u.uDpr.value = state.viewport.dpr
    u.uTableScale.value = Math.min(1, (halfH * 2 * cam.aspect * 0.9) / TABLE_W)
    u.uTime.value = state.clock.elapsedTime
    u.uShape.value = frame.shape
    u.uLight.value = frame.light
    u.uNarrow.value = narrow ? 1 : 0
    u.uReform.value = frame.reform
    u.uWord.value = frame.word
    u.uLogo.value = frame.logo
    u.uStep.value = frame.step
    if (frame.shape > 5 && frame.shape < 7) {
      const b = frame.box
      u.uBox.value.set(b.x, b.y, b.hx, b.hy)
      u.uBoxPx.value.set(b.w, b.h)
      const pa = u.uPillA.value as Vector4[]
      const pb = u.uPillB.value as Vector4[]
      const f = frame.pills
      for (let j = 0; j < MAX_PILLS; j++) {
        const o = j * PILL_STRIDE
        pa[j].set(f[o], f[o + 1], f[o + 2], f[o + 3])
        pb[j].set(f[o + 4], f[o + 5], f[o + 6], f[o + 7])
      }
      u.uCursor.value = { x: frame.cursor.x, y: frame.cursor.y, z: frame.cursor.on }
    }
    u.uPortraitM.value.copy(portrait.matrix)
    u.uPortraitSize.value.copy(portrait.size)
    u.uPortraitOffset.value.copy(portrait.offset)
    u.uEndSize.value.copy(portrait.endSize)
    u.uEndOffset.value.copy(portrait.endOffset)
  })

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}
