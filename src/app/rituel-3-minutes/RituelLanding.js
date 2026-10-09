'use client'

import { useId, useState } from 'react'

const RGPD =
  "Vos coordonnées servent uniquement à vous envoyer ce rituel et la lettre hebdomadaire d'Éliane. Désinscription en un clic, à tout moment."

const MEDICAL =
  'Ce rituel est un moment de bien-être. Il ne remplace pas un avis médical. En cas de gêne inhabituelle ou persistante, consultez un professionnel de santé.'

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RituelLanding() {
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [piege, setPiege] = useState('')
  const [etat, setEtat] = useState('repos') // repos | envoi | ok | erreur
  const [messageErreur, setMessageErreur] = useState('')
  const prenomId = useId()
  const emailId = useId()
  const entrepriseId = useId()

  async function envoyer(e) {
    e.preventDefault()
    if (etat === 'envoi') return

    const prenomPropre = prenom.trim()
    const emailPropre = email.trim()

    if (!prenomPropre) {
      setEtat('erreur')
      setMessageErreur('Votre prénom, pour vous appeler par votre nom.')
      return
    }
    if (!EMAIL_VALIDE.test(emailPropre)) {
      setEtat('erreur')
      setMessageErreur('Une adresse e-mail valide, pour recevoir le rituel.')
      return
    }

    setEtat('envoi')
    try {
      const res = await fetch('/api/leads/rituel-3-minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom: prenomPropre, email: emailPropre, piege }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.erreur || 'Une erreur est survenue. Réessayez dans un instant.')
      setEtat('ok')
    } catch (err) {
      setEtat('erreur')
      setMessageErreur(err.message || 'Une erreur est survenue. Réessayez dans un instant.')
    }
  }

  return (
    <main className="r3m">
      <div className="r3m-halo" aria-hidden="true" />

      <div className="r3m-conteneur">
        <p className="r3m-maison">Éveil &amp; Harmonie</p>

        <span className="r3m-pastille">Rituels Corps</span>

        <h1 className="r3m-titre">Le Rituel 3&nbsp;Minutes</h1>
        <p className="r3m-sous-titre">Le geste du soir, pour des jambes légères. Offert.</p>

        <figure className="r3m-photo">
          <img
            src="/rituel-3-minutes/eliane-placeholder.jpg"
            alt="Mains posées sur un pied, lumière chaude du soir"
            width={560}
            height={560}
          />
        </figure>

        <ul className="r3m-recu">
          <li>
            <span className="r3m-puce" aria-hidden="true" />
            <span>
              <strong>La vidéo guidée</strong>, 3 minutes, filmée pour être suivie assise, au bord du lit.
            </span>
          </li>
          <li>
            <span className="r3m-puce" aria-hidden="true" />
            <span>
              <strong>La fiche à imprimer</strong>, pour l&rsquo;avoir sous les yeux sans l&rsquo;écran.
            </span>
          </li>
          <li>
            <span className="r3m-puce" aria-hidden="true" />
            <span>
              <strong>Une lettre d&rsquo;Éliane chaque semaine</strong>, un rituel, un geste, jamais un argumentaire.
            </span>
          </li>
        </ul>

        {etat === 'ok' ? (
          <div className="r3m-confirmation" role="status">
            <p className="r3m-confirmation-titre">C&rsquo;est envoyé.</p>
            <p>
              Regardez votre boîte mail dans les prochaines minutes, et vérifiez vos spams si vous ne voyez rien
              passer.
            </p>
          </div>
        ) : (
          <form className="r3m-formulaire" onSubmit={envoyer} noValidate>
            <div className="r3m-champ">
              <label htmlFor={prenomId}>Prénom</label>
              <input
                id={prenomId}
                name="prenom"
                type="text"
                autoComplete="given-name"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                disabled={etat === 'envoi'}
                required
              />
            </div>

            <div className="r3m-champ">
              <label htmlFor={emailId}>E-mail</label>
              <input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={etat === 'envoi'}
                required
              />
            </div>

            {/* Piège à robots : un champ qu'une personne ne voit ni ne remplit jamais. */}
            <div className="r3m-piege" aria-hidden="true">
              <label htmlFor={entrepriseId}>Entreprise</label>
              <input
                id={entrepriseId}
                name="entreprise"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={piege}
                onChange={(e) => setPiege(e.target.value)}
              />
            </div>

            {etat === 'erreur' && (
              <p className="r3m-erreur" role="alert">
                {messageErreur}
              </p>
            )}

            <button type="submit" className="r3m-bouton" disabled={etat === 'envoi'}>
              {etat === 'envoi' ? 'Envoi…' : 'Recevoir le rituel'}
            </button>
          </form>
        )}

        <p className="r3m-mention">{RGPD}</p>
        <p className="r3m-mention">{MEDICAL}</p>

        <p className="r3m-signature">
          <span className="r3m-signature-phrase">
            On commence par les pieds, parce que prendre soin de soi commence par revenir à soi.
          </span>
          <span className="r3m-signature-nom">Éliane</span>
        </p>
      </div>
    </main>
  )
}
