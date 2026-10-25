# Aryan Thadani — Portfolio

A black-and-white portrait you paint into colour with the cursor. On scroll it dissolves into a raw table of
particles, and the same ~4,600 particles keep reshaping for each section: a horizon, a career skyline, a data
pipeline, a sphere, and finally the portrait again — in colour. Sections alternate dark and light.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve dist/ on http://localhost:4173
```

`?film` plays the whole page hands-free for screen-recording (e.g. a 4:5 LinkedIn video). Any scroll, click or
key press exits back to the normal site.

## Edit content

- `src/data/content.ts` — manifesto, stats, experience order, case studies (with pipeline flows), stack, certifications
- `src/data/ontology.ts` — `PROFILE` (email, LinkedIn/GitHub — empty links are hidden, résumé), the ontology objects
  (roles, projects, skills…) and their links, and `ANCHORS` (3D positions of the main nodes)

## How it's put together

- `src/ui/Page.tsx` — the DOM page. Sections declare `data-theme="dark|light"` (the page crossfades to whichever owns
  the middle of the viewport), `data-shape="<n>"` (the particle shape it morphs to), `data-reveal` (animate in) and
  `data-film` / `data-film-run` (film-mode stops).
- `src/scene/Scene.tsx` — the rig: reads the page each frame and drives shape, theme and the experience skyline
- `src/scene/PortraitHero.tsx` — portrait shader (B&W → colour via an ink simulation, depth tilt, scroll dissolve)
- `src/scene/Particles.tsx` — the particles and every shape they morph between

## Hero portrait

`public/hero/` holds `face.webp` (the portrait) and `depth.png` (Depth Anything V2 depth map, blurred). Sources live in `raw-photos/` (git-ignored).
If you replace the portraits, regenerate the depth map and keep `PORTRAIT_ASPECT` / `FACE_UV` in
`src/scene/portrait.ts` in sync.

## Stack

React + TypeScript + Vite · React Three Fiber / drei · Lenis · Geist (stand-in for Palantir's
Alliance No.1/No.2, which is commercially licensed)
