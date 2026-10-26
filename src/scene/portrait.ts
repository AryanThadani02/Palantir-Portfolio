import { Matrix4, Vector2, Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'

/**
 * The headshot at 1672×941, or 2× for screens with the pixels to show it (retina laptops, and phones, which
 * crop into the photo to cover a tall screen).
 */
const SHARP = Math.max(screen.width, screen.height, innerWidth, innerHeight) * devicePixelRatio > 1700
export const PORTRAIT_TEXTURES = [SHARP ? '/hero/face@2x.webp' : '/hero/face.webp', '/hero/depth.png']

/** Source image aspect (headshot-final is 6688×3764, served at 1672×941 and 3344×1882). */
export const PORTRAIT_ASPECT = 1672 / 941

/** Centre of the face (uv, y up): the tilt pivot and the autopilot's path. Measured on headshot-final. */
export const FACE_UV = { x: 0.5, y: 0.585 }

/** The camera is fixed; everything (portrait, table, particle shapes) lives on a plane at this point. */
export const CAMERA_POS = new Vector3(0, 0, 20)
export const TABLE_CENTER = new Vector3(0, 0, 6)

/**
 * Placement of the portrait: a plane facing the camera at `depth`, sized to cover the viewport.
 * Shared so the image and the particles that peel off it agree on every pixel's world position.
 */
export const portrait = {
  /** camera.matrixWorld × translate(0, 0, -depth): the plane's frame. */
  matrix: new Matrix4(),
  /** Hero placement: world-space size of the image and offset of its centre from the view centre. */
  size: new Vector2(1, 1),
  offset: new Vector2(),
  /** Contact placement, where the particles re-form the portrait in colour. */
  endSize: new Vector2(1, 1),
  endOffset: new Vector2(),
  /** World-space size of the visible viewport at the plane's depth. */
  view: new Vector2(1, 1),
}

const translate = new Matrix4()

export function updatePortrait(camera: PerspectiveCamera, depth: number, narrow: boolean) {
  const h = 2 * depth * Math.tan((camera.fov * Math.PI) / 360)
  const w = h * camera.aspect
  portrait.view.set(w, h)

  // Desktop: sized by height so the whole head (hair included) fits, sitting right of the headline and a
  // touch low to clear the top bar. Phones: fill the width, top of the screen.
  if (narrow) {
    portrait.size.set(h * PORTRAIT_ASPECT * 0.86, h * 0.86)
    portrait.offset.set(0, h * 0.17)
  } else {
    const ph = h * 0.98
    portrait.size.set(ph * PORTRAIT_ASPECT, ph)
    portrait.offset.set(w * 0.17, -h * 0.045)
  }

  // Phones: a smaller portrait in the top third, above the contact copy.
  // Sized so the whole head, hair included, fits under the top edge (the image's top sits at ~0.44h).
  const endH = h * (narrow ? 0.42 : 0.92)
  portrait.endSize.set(endH * PORTRAIT_ASPECT, endH)
  portrait.endOffset.set(narrow ? 0 : w * 0.25, narrow ? h * 0.25 : -h * 0.02)

  camera.updateMatrixWorld()
  portrait.matrix.copy(camera.matrixWorld).multiply(translate.makeTranslation(0, 0, -depth))
}

/** Converts normalised device coordinates to hero image uv (y up). */
export function ndcToPortraitUv(x: number, y: number, out: Vector2) {
  return out.set(
    ((x * portrait.view.x) / 2 - portrait.offset.x) / portrait.size.x + 0.5,
    ((y * portrait.view.y) / 2 - portrait.offset.y) / portrait.size.y + 0.5,
  )
}
