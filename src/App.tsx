import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { initScroll } from './lib/scroll'
import { Scene } from './scene/Scene'
import { CAMERA_POS } from './scene/portrait'
import { Page } from './ui/Page'
import { Cursor } from './ui/Cursor'
import { Loader } from './ui/Loader'

export default function App() {
  useEffect(() => initScroll(), [])

  return (
    <>
      <div className="canvas-wrap">
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          camera={{ fov: 45, near: 0.1, far: 200, position: CAMERA_POS.toArray() }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>
      <Page />
      <div className="grain" aria-hidden />
      <Cursor />
      <Loader />
    </>
  )
}
