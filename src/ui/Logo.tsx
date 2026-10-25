import { useState } from 'react'
import { ICONS } from './icons'

/** A brand/tool mark from the icon registry (inherits `currentColor`); renders nothing for unknown keys. */
export function IconMark({ icon, className = '' }: { icon: string; className?: string }) {
  const ic = ICONS[icon]
  if (!ic) return null
  return (
    <svg className={`icon-mark ${className}`} viewBox={ic.viewBox} aria-hidden>
      {ic.paths.map((d, i) => (
        <path key={i} d={d} fill="currentColor" fillRule="evenodd" />
      ))}
    </svg>
  )
}

/** A tile with an organisation's logo (public/logos); falls back to an icon when there's no image. */
export function LogoTile({ src, icon, dark = false }: { src?: string; icon?: string; dark?: boolean }) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed
  return (
    <span className={`logo-tile ${dark ? 'logo-tile--dark' : ''} ${showImage ? '' : 'logo-tile--icon'}`} aria-hidden>
      {showImage ? <img src={src} alt="" onError={() => setFailed(true)} /> : icon && <IconMark icon={icon} />}
    </span>
  )
}
