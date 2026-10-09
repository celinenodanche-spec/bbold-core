import { titre, texte, signature } from './fonts'
import RituelLanding from './RituelLanding'
import './rituel.css'

export const metadata = {
  title: 'Le Rituel 3 Minutes — Éveil & Harmonie',
  description:
    "Le geste du soir, pour des jambes légères. Offert par Éliane : une vidéo guidée de 3 minutes et une fiche à imprimer.",
  robots: { index: true, follow: false },
}

export default function Page() {
  return (
    <div className={`${titre.variable} ${texte.variable} ${signature.variable} rituel3min`}>
      <RituelLanding />
    </div>
  )
}
