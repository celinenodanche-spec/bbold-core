import { T, B } from '@/config/tenant'

/**
 * Logo de l'installation.
 * - `T.logo` renseigné (image dans /public) → cette image, proportions conservées.
 * - Sinon → le losange « œil » d'origine, dessiné aux couleurs du tenant.
 */
export default function TenantLogo({ size = 28, style }) {
  if (T.logo) {
    return (
      <img src={T.logo} alt={T.name} width={size} height={size}
        style={{ objectFit:'contain', display:'inline-block', ...style }} />
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" style={style}>
      <polygon points="30,4 56,30 30,56 4,30" stroke={B.gold} strokeWidth="1.5" fill="none"/>
      <polygon points="30,10 50,30 30,50 10,30" stroke={B.magenta} strokeWidth="1" fill="none" opacity="0.55"/>
      <ellipse cx="30" cy="30" rx="12" ry="8" stroke={B.gold} strokeWidth="1.5" fill="none"/>
      <circle cx="30" cy="30" r="4" fill={B.gold}/>
      <circle cx="30" cy="30" r="2" fill={B.black}/>
    </svg>
  )
}
