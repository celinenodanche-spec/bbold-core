'use client'
import { useState, useEffect } from 'react'
import { lireCode, ecrireCode, EVENEMENT_REFUS } from '../lib/access'

const B = {
  violetDeep: '#6b0f6e', magenta: '#c000c0', gold: '#c9a84c',
  goldLight: '#e8cc7a', black: '#0a0008', white: '#faf8fb',
}

/**
 * Porte d'entrée. Tant que le code n'est pas saisi, un voile couvre l'app.
 *
 * Le voile est cosmétique : ce qui protège vraiment, c'est le middleware, qui
 * refuse toute requête /api sans le bon code. Contourner l'affichage ne donne
 * donc accès à rien — ni aux agents, ni aux crédits API.
 *
 * L'app reste montée derrière le voile : si le serveur refuse le code en cours
 * de route, on ne perd pas le livrable en cours d'écriture.
 */
export default function AccessGate({ children }) {
  // 'verif' tant que le stockage local n'est pas lu. Le serveur ne connaît pas
  // localStorage : afficher quoi que ce soit avant désynchroniserait l'hydratation.
  const [etat, setEtat] = useState('verif')
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    setEtat(lireCode() ? 'ouvert' : 'ferme')
    const surRefus = () => {
      setEtat('ferme')
      setErreur('Le serveur a refusé ce code. Retape-le.')
    }
    window.addEventListener(EVENEMENT_REFUS, surRefus)
    return () => window.removeEventListener(EVENEMENT_REFUS, surRefus)
  }, [])

  async function valider(e) {
    e.preventDefault()
    const saisi = code.trim()
    if (!saisi || envoi) return
    setEnvoi(true); setErreur('')
    try {
      // fetch brut, pas apiFetch : on teste le code saisi, pas le code mémorisé.
      const res = await fetch('/api/auth/check', {
        method: 'POST', headers: { 'x-bbold-access': saisi },
      })
      if (res.status === 401) { setErreur('Code incorrect.'); return }
      if (res.status === 503) { setErreur("Aucun code n'est configuré côté serveur (ACCESS_CODE)."); return }
      if (!res.ok) { setErreur(`Erreur ${res.status}.`); return }
      ecrireCode(saisi); setCode(''); setEtat('ouvert')
    } catch {
      setErreur('Serveur injoignable.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      {children}
      {etat !== 'ouvert' && (
        <div style={{
          position:'fixed', inset:0, zIndex:9999,
          background:'linear-gradient(160deg,#120010 0%,#0a0008 55%,#0f000e 100%)',
          display:'flex', alignItems:'center', justifyContent:'center', padding:20,
        }}>
          <div style={{ width:'100%', maxWidth:380, textAlign:'center' }}>
            <svg width="52" height="52" viewBox="0 0 60 60" fill="none" style={{ marginBottom:18 }}>
              <polygon points="30,4 56,30 30,56 4,30" stroke={B.gold} strokeWidth="1.5" fill="none" />
              <polygon points="30,10 50,30 30,50 10,30" stroke={B.magenta} strokeWidth="1" fill="none" opacity="0.55" />
              <ellipse cx="30" cy="30" rx="12" ry="8" stroke={B.gold} strokeWidth="1.5" fill="none" />
              <circle cx="30" cy="30" r="4" fill={B.gold} />
              <circle cx="30" cy="30" r="2" fill={B.black} />
            </svg>

            <div style={{
              fontFamily:'Georgia,serif', fontSize:22, fontWeight:900, color:B.white, marginBottom:6,
            }}>B.BOLD <span style={{ fontWeight:300, fontSize:16, color:B.gold }}>Core</span></div>

            {etat === 'verif' ? (
              <div style={{ fontSize:12, color:'rgba(250,248,251,0.4)' }}>Vérification…</div>
            ) : (
              <form onSubmit={valider}>
                <p style={{ fontSize:12.5, color:'rgba(250,248,251,0.5)', lineHeight:1.65, margin:'0 0 22px' }}>
                  Cet espace est privé. Entre ton code d'accès.
                </p>

                <input
                  type="password"
                  value={code}
                  onChange={(ev) => { setCode(ev.target.value); setErreur('') }}
                  placeholder="Code d'accès"
                  autoFocus
                  autoComplete="current-password"
                  style={{
                    width:'100%', padding:'13px 16px', textAlign:'center',
                    background:'rgba(107,15,110,0.12)',
                    border:`1px solid ${erreur ? '#dc2626' : 'rgba(201,168,76,0.3)'}`,
                    borderRadius:12, color:B.white, fontSize:15, letterSpacing:'0.1em',
                    outline:'none', marginBottom:12,
                  }}
                />

                <button
                  type="submit"
                  disabled={envoi || !code.trim()}
                  style={{
                    width:'100%', padding:'13px 20px',
                    background: envoi || !code.trim()
                      ? 'rgba(201,168,76,0.25)'
                      : `linear-gradient(135deg,${B.gold}cc,${B.goldLight}88)`,
                    border:`1px solid ${B.gold}88`, borderRadius:12,
                    color: envoi || !code.trim() ? 'rgba(250,248,251,0.4)' : B.black,
                    fontSize:13, fontWeight:800,
                    cursor: envoi || !code.trim() ? 'default' : 'pointer',
                  }}
                >{envoi ? 'Vérification…' : 'Entrer →'}</button>

                <div style={{ minHeight:20, marginTop:12 }}>
                  {erreur && <span style={{ fontSize:11.5, color:'#f87171' }}>{erreur}</span>}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
