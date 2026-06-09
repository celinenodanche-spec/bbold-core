'use client'
import { useState, useEffect, useRef } from 'react'

const B = {
  violetDeep: '#6b0f6e', magenta: '#c000c0', gold: '#c9a84c',
  goldLight: '#e8cc7a', black: '#0a0008', lilas: '#d9a0d9',
  white: '#faf8fb', surface: 'rgba(107,15,110,0.09)', border: 'rgba(201,168,76,0.2)',
}

const AGENTS = [
  { id:'stratege',     emoji:'🎯', prenom:'Maeva', title:'Stratège & Brief',    model:'OPUS',   color:B.magenta,    accent:B.lilas },
  { id:'createur',     emoji:'✍️', prenom:'Lola',  title:'Créatrice Contenu',  model:'SONNET', color:B.violetDeep, accent:'#c4b5fd' },
  { id:'designer',     emoji:'🎨', prenom:'Zara',  title:'Designer',            model:'SONNET', color:B.gold,       accent:B.goldLight },
  { id:'analyste',     emoji:'📊', prenom:'Inès',  title:'Analyste & Plan 3D', model:'OPUS',   color:B.magenta,    accent:B.lilas },
  { id:'presentateur', emoji:'🎤', prenom:'Naïa',  title:'Présentatrice',       model:'SONNET', color:B.violetDeep, accent:'#c4b5fd' },
]

const SUPPORT_AGENTS = [
  { id:'gmail',     emoji:'📧', name:'Gmail',         subtitle:'Email professionnel — objet + corps + CTA en 30 secondes.',   color:'#3b82f6', accent:'#93c5fd' },
  { id:'fireflies', emoji:'🔥', name:'Fireflies',     subtitle:'Extrait un brief structuré depuis un transcript de réunion.', color:'#10b981', accent:'#6ee7b7' },
  { id:'cv',        emoji:'📁', name:'Content Vault', subtitle:'Archive et versionne tes livrables avec frontmatter YAML.',   color:'#f97316', accent:'#fdba74' },
]

const PIPELINE_STEPS = [
  { id:'stratege',     prenom:'Maeva', emoji:'🎯', folder:'briefs/',         color:B.magenta    },
  { id:'createur',     prenom:'Lola',  emoji:'✍️', folder:'content/',        color:B.violetDeep },
  { id:'designer',     prenom:'Zara',  emoji:'🎨', folder:'prompts-images/', color:B.gold       },
  { id:'analyste',     prenom:'Inès',  emoji:'📊', folder:'analytics/',      color:B.magenta    },
  { id:'presentateur', prenom:'Naïa',  emoji:'🎤', folder:'decks/',          color:B.violetDeep },
]

function getAvatarPath(id) {
  const map = { stratege:'maeva', createur:'lola', designer:'zara', analyste:'ines', presentateur:'naia' }
  return `/avatars/${map[id]}.png`
}

const FORMS = {
  stratege: {
    title: 'Brief Stratégique', subtitle: 'Maeva construit ton positionnement et ta Value Proposition Canvas.',
    system: `Tu es Maeva, Stratège & Brief de B.BOLD Agency, experte en brand strategy pour les territoires insulaires français. Ton style : cash, structuré, bullet points pour les insights.`,
    fields: [
      { key:'client',   label:'Nom du client',      type:'text',     placeholder:'Ex: Caraïb Ediprint' },
      { key:'secteur',  label:"Secteur d'activité", type:'text',     placeholder:'Ex: Imprimerie digitale, Martinique' },
      { key:'objectif', label:'Objectif principal', type:'select',   options:['Notoriété de marque','Génération de leads','Augmenter les ventes','Fidéliser la communauté'] },
      { key:'icp',      label:'Cible / ICP',        type:'textarea', placeholder:'Ex: TPE locales 30-50 ans, budget com < 2k/mois' },
      { key:'budget',   label:'Budget mensuel',     type:'text',     placeholder:'Ex: 1 500€/mois' },
    ],
    userPrompt: (d) => `CLIENT : ${d.client||'—'}\nSECTEUR : ${d.secteur||'—'}\nOBJECTIF : ${d.objectif||'—'}\nCIBLE / ICP : ${d.icp||'—'}\nBUDGET : ${d.budget||'—'}\n\nMission :\n1. 3 insights clés sur ce marché local\n2. ICP détaillé\n3. Positionnement différenciant en 1 phrase\n4. Value Proposition Canvas complet\n5. 3 piliers éditoriaux`,
  },
  createur: {
    title: 'Brief Contenu', subtitle: 'Lola rédige tes posts, scripts et captions qui convertissent.',
    system: `Tu es Lola, Créatrice de Contenu de B.BOLD Agency. Hook = 15 mots max. Jamais de listes à puces dans le corps. Prose fluide, 3 paragraphes max. Style authentique et territorial si pertinent.`,
    fields: [
      { key:'plateforme', label:'Plateforme cible',    type:'select',   options:['LinkedIn','Instagram','Facebook','YouTube','TikTok'] },
      { key:'thematique', label:'Thématique',          type:'text',     placeholder:'Ex: Lancement nouvelle gamme, conseils impression' },
      { key:'ton',        label:'Ton souhaité',        type:'select',   options:['Inspirationnel','Éducatif','Humoristique','Persuasif','Authentique'] },
      { key:'cta',        label:"Appel à l'action",   type:'text',     placeholder:'Ex: Visiter le site, Envoyer un DM' },
      { key:'brand',      label:'Spécificités marque', type:'textarea', placeholder:'Ex: Ton cash, pas de clichés, références antillaises' },
    ],
    userPrompt: (d) => `PLATEFORME : ${d.plateforme||'—'}\nTHÉMATIQUE : ${d.thematique||'—'}\nTON : ${d.ton||'—'}\nCTA : ${d.cta||'—'}\nSPÉCIFICITÉS : ${d.brand||'—'}\n\nMission : 3 versions du post (angle différent), hook 15 mots max pour chacune, CTA intégré, 5-10 hashtags optimisés.`,
  },
  designer: {
    title: 'Brief Visuel', subtitle: 'Zara génère tes prompts images prêts pour Midjourney ou Flux.',
    system: `Tu es Zara, Designer de B.BOLD Agency, experte en direction artistique et prompts génératifs (Midjourney v6, Flux, DALL-E 3). Fournis des prompts techniques précis avec paramètres.`,
    fields: [
      { key:'format',  label:'Format',             type:'select',   options:['Post carré 1:1','Story 9:16','Bannière LinkedIn 16:9','Thumbnail YouTube'] },
      { key:'style',   label:'Style visuel',       type:'select',   options:['Minimaliste & épuré','Énergique & contrasté','Luxe & premium','Naturel & organique','Disruptif & bold'] },
      { key:'palette', label:'Palette couleurs',   type:'text',     placeholder:'Ex: violet #6b0f6e, or #c9a84c, fond noir' },
      { key:'sujet',   label:'Description visuel', type:'textarea', placeholder:'Ex: Femme créole souriante en studio, ambiance pro' },
      { key:'mood',    label:'Mood / Références',  type:'text',     placeholder:'Ex: Ambiance magazine Vogue, lumière dorée' },
    ],
    userPrompt: (d) => `FORMAT : ${d.format||'—'}\nSTYLE : ${d.style||'—'}\nPALETTE : ${d.palette||'—'}\nSUJET : ${d.sujet||'—'}\nMOOD : ${d.mood||'—'}\n\nMission : 3 prompts Midjourney v6 (en anglais, avec --ar --v 6 --style raw), puis version Flux/DALL-E en français.`,
  },
  analyste: {
    title: 'Brief Analytique', subtitle: 'Inès lit tes analytics et construit ton plan 3D sur 4 semaines.',
    system: `Tu es Inès, Analyste & Architecte du Plan 3D de B.BOLD Agency. Tableaux clairs, bullet points, chiffres précis. Plan 4 semaines x 3 actions SMART par semaine.`,
    fields: [
      { key:'plateformes', label:'Plateformes',          type:'select',   options:['LinkedIn + Meta','LinkedIn seul','Meta (FB+IG)','YouTube','Tout'] },
      { key:'periode',     label:"Période d'analyse",    type:'select',   options:['30 derniers jours','90 jours','6 mois','12 mois'] },
      { key:'kpi',         label:'KPI prioritaire',      type:'select',   options:["Portée & impressions","Taux d'engagement","Leads / Clics","Croissance abonnés","Conversions"] },
      { key:'contexte',    label:'Contexte / Résultats', type:'textarea', placeholder:'Ex: Post du 15/05 a fait +400% portée, budget ads 500€/mois' },
      { key:'objectif_g',  label:'Objectif croissance',  type:'text',     placeholder:'Ex: +30% engagement en 3 mois' },
    ],
    userPrompt: (d) => `PLATEFORMES : ${d.plateformes||'—'}\nPÉRIODE : ${d.periode||'—'}\nKPI : ${d.kpi||'—'}\nCONTEXTE : ${d.contexte||'—'}\nOBJECTIF : ${d.objectif_g||'—'}\n\nMission : 3 quick wins, plan 4 semaines (tableau), dashboard KPI avec seuils d'alerte.`,
  },
  presentateur: {
    title: 'Brief Présentation', subtitle: 'Naïa transforme ton brief en deck slide-par-slide.',
    system: `Tu es Naïa, Présentatrice de B.BOLD Agency, experte en storytelling (SOZA, Pyramide de Minto, Before/After). Structure narrative claire, slide-par-slide.`,
    fields: [
      { key:'type_deck', label:'Type de présentation', type:'select',   options:['Pitch commercial','Rapport de performance','Formation équipe','Webinar','Présentation institutionnelle'] },
      { key:'audience',  label:'Audience cible',       type:'text',     placeholder:'Ex: Dirigeants PME Martinique' },
      { key:'nb_slides', label:'Volume',               type:'select',   options:['5-8 slides (express)','10-15 slides (standard)','20+ slides (formation)'] },
      { key:'message',   label:'Message clé',          type:'textarea', placeholder:'Ex: Montrer ROI Q1, convaincre de renouveler le contrat' },
      { key:'data',      label:'Données / chiffres',   type:'text',     placeholder:'Ex: +127% engagement, 45 leads mars, ROI x4.2' },
    ],
    userPrompt: (d) => `TYPE : ${d.type_deck||'—'}\nAUDIENCE : ${d.audience||'—'}\nVOLUME : ${d.nb_slides||'—'}\nMESSAGE CLÉ : ${d.message||'—'}\nDONNÉES : ${d.data||'—'}\n\nMission : structure narrative (choix framework), plan slide-par-slide avec titre + message + visuel recommandé, notes speaker pour les 3 slides critiques.`,
  },
}

const SUPPORT_FORMS = {
  gmail: {
    title: 'Agent Gmail',
    subtitle: 'Email B.BOLD — objet + corps + CTA en 30 secondes.',
    fields: [
      { key:'destinataire', label:'Destinataire / Contexte', type:'text',     placeholder:'Ex: Directeur marketing, relance après réunion' },
      { key:'sujet',        label:'Sujet de l\'email',       type:'text',     placeholder:'Ex: Bilan campagne mai — vos résultats' },
      { key:'contexte',     label:"Type d'email",            type:'select',   options:["Suivi client","Présentation d'offre","Rapport de performance","Relance prospect","Brief réunion","Remerciement"] },
      { key:'contenu',      label:'Points clés à inclure',   type:'textarea', placeholder:'Ex: Résultats +40% engagement, RDV jeudi, lien rapport' },
    ],
  },
  fireflies: {
    title: 'Agent Fireflies',
    subtitle: 'Colle ton transcript — Fireflies en extrait un brief actionnable.',
    fields: [
      { key:'transcript', label:'Transcript ou notes de réunion', type:'textarea', placeholder:'Colle ici ton transcript Fireflies.ai ou tes notes brutes de réunion...' },
    ],
  },
  cv: {
    title: 'Content Vault',
    subtitle: 'Archive un livrable avec frontmatter YAML + changelog.',
    fields: [
      { key:'client',   label:'Client',   type:'text',     placeholder:'Ex: Caraïb Ediprint' },
      { key:'version',  label:'Version',  type:'text',     placeholder:'Ex: v1.0' },
      { key:'livrable', label:'Livrable', type:'textarea', placeholder:'Colle ici le contenu à archiver et versionner...' },
    ],
  },
}

const CAMPAIGN_FIELDS = [
  { key:'client',      label:'Nom du client',        type:'text',     placeholder:'Ex: Caraïb Ediprint' },
  { key:'secteur',     label:'Secteur & territoire', type:'text',     placeholder:'Ex: Imprimerie digitale, Martinique' },
  { key:'objectif',    label:'Objectif principal',   type:'select',   options:['Notoriété de marque','Génération de leads','Augmenter les ventes','Fidéliser la communauté','Lancement produit/service'] },
  { key:'cible',       label:'Cible / ICP',          type:'textarea', placeholder:'Ex: TPE locales 30-50 ans, budget com < 2k/mois' },
  { key:'budget',      label:'Budget mensuel',       type:'text',     placeholder:'Ex: 1 500€/mois' },
  { key:'plateformes', label:'Plateformes cibles',   type:'select',   options:['LinkedIn + Meta','Instagram seul','LinkedIn seul','Meta (FB+IG)','Tous les canaux'] },
  { key:'ton',         label:'Ton de marque',        type:'select',   options:['Cash & direct','Inspirationnel','Éducatif','Humoristique','Premium & luxe'] },
]

// ─── SVG Eye ─────────────────────────────────────────────────────────────────

function Eye({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <polygon points="30,4 56,30 30,56 4,30" stroke={B.gold} strokeWidth="1.5" fill="none"/>
      <polygon points="30,10 50,30 30,50 10,30" stroke={B.magenta} strokeWidth="1" fill="none" opacity="0.55"/>
      <ellipse cx="30" cy="30" rx="12" ry="8" stroke={B.gold} strokeWidth="1.5" fill="none"/>
      <circle cx="30" cy="30" r="4" fill={B.gold}/>
      <circle cx="30" cy="30" r="2" fill={B.black}/>
    </svg>
  )
}

// ─── Shared field renderer ────────────────────────────────────────────────────

function FieldGroup({ field, value, onChange, accentColor }) {
  const baseStyle = {
    width:'100%', padding:'10px 14px', borderRadius:'10px',
    background:'rgba(107,15,110,0.15)', border:`1px solid ${accentColor || B.gold}33`,
    color:B.white, fontSize:'13px', outline:'none',
  }
  return (
    <div style={{ marginBottom:'14px' }}>
      <label style={{ display:'block', fontSize:'10px', fontWeight:'700', color:accentColor || B.goldLight,
        letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'5px' }}>
        {field.label}
      </label>
      {field.type === 'select' ? (
        <select value={value||''} onChange={e=>onChange(e.target.value)}
          style={{ ...baseStyle, cursor:'pointer' }}>
          <option value="" style={{background:'#120010'}}>Choisir…</option>
          {field.options.map(o=><option key={o} value={o} style={{background:'#120010'}}>{o}</option>)}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea value={value||''} onChange={e=>onChange(e.target.value)}
          placeholder={field.placeholder} rows={field.key==='transcript' ? 8 : 3}
          style={{ ...baseStyle, resize:'vertical', fontFamily:'system-ui,sans-serif', lineHeight:'1.5' }}/>
      ) : (
        <input type="text" value={value||''} onChange={e=>onChange(e.target.value)}
          placeholder={field.placeholder} style={baseStyle}/>
      )}
    </div>
  )
}

// ─── Modal (agent individuel) ─────────────────────────────────────────────────

function Modal({ agent, onClose }) {
  const form = FORMS[agent.id]
  const [data, setData] = useState({})
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true); setResponse(''); setError('')
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, systemPrompt: form.system, userPrompt: form.userPrompt(data) }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setResponse(text)
      }
    } catch (e) { setError(e.message || 'Erreur inconnue') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(10,0,8,0.9)', backdropFilter:'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'linear-gradient(160deg,#120010 0%,#0a0008 60%)',
        border:`1px solid ${agent.color}44`, borderRadius:'20px', padding:'32px',
        width:'100%', maxWidth:'660px', maxHeight:'90vh', overflowY:'auto',
        position:'relative', boxShadow:`0 0 60px ${agent.color}22` }}>
        <button onClick={onClose} style={{ position:'absolute', top:'16px', right:'16px',
          background:'transparent', border:'1px solid rgba(250,248,251,0.15)', borderRadius:'8px',
          color:'rgba(250,248,251,0.5)', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>×</button>

        <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px' }}>
          <img src={getAvatarPath(agent.id)} alt={agent.prenom}
            style={{ width:'56px', height:'56px', borderRadius:'50%', objectFit:'cover', objectPosition:'top',
              border:`2px solid ${agent.color}66` }}/>
          <div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:'20px', fontWeight:'900', color:B.white }}>{form.title}</div>
            <div style={{ fontSize:'12px', color:'rgba(250,248,251,0.45)' }}>{form.subtitle}</div>
          </div>
        </div>
        <div style={{ height:'1px', background:`linear-gradient(90deg,transparent,${agent.color}88,transparent)`, marginBottom:'24px' }}/>

        {!response && !loading && (
          <>
            {form.fields.map(field => (
              <FieldGroup key={field.key} field={field} value={data[field.key]}
                onChange={v => setData({...data,[field.key]:v})} accentColor={agent.accent}/>
            ))}
            {error && <div style={{ color:'#ff6b6b', fontSize:'12px', marginBottom:'12px' }}>⚠ {error}</div>}
            <button onClick={generate} style={{ width:'100%', padding:'14px',
              background:`linear-gradient(135deg,${agent.color},${B.violetDeep})`,
              border:`1px solid ${agent.color}66`, borderRadius:'12px',
              color:B.white, fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>
              ✦ Activer {agent.prenom} →
            </button>
          </>
        )}
        {loading && (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'50%', margin:'0 auto 16px',
              border:`2px solid ${agent.color}22`, borderTop:`2px solid ${agent.color}`,
              animation:'spin 0.8s linear infinite' }}/>
            <p style={{ color:'rgba(250,248,251,0.5)', fontSize:'13px' }}>{agent.prenom} analyse le brief…</p>
          </div>
        )}
        {response && (
          <>
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'700', color:agent.accent,
                letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px' }}>
                Réponse de {agent.prenom}
              </div>
              <div style={{ background:'rgba(10,0,8,0.5)', border:`1px solid ${agent.color}33`,
                borderRadius:'12px', padding:'18px', fontSize:'13px', color:'rgba(250,248,251,0.85)',
                lineHeight:'1.75', whiteSpace:'pre-wrap', maxHeight:'360px', overflowY:'auto',
                fontFamily:'system-ui,sans-serif' }}>
                {response}
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', marginBottom:'12px' }}>
              <button onClick={() => { navigator.clipboard.writeText(response).then(() => { setCopied(true); setTimeout(()=>setCopied(false),2000) }) }}
                style={{ flex:1, padding:'12px',
                  background: copied ? 'rgba(201,168,76,0.2)' : 'rgba(107,15,110,0.3)',
                  border:`1px solid ${copied ? B.gold : agent.color}55`, borderRadius:'10px',
                  color: copied ? B.goldLight : B.white, fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                {copied ? '✓ Copié !' : '📋 Copier la réponse'}
              </button>
            </div>
            <button onClick={() => { setResponse(''); setData({}) }} style={{ width:'100%', padding:'10px',
              background:'transparent', border:'1px solid rgba(250,248,251,0.12)', borderRadius:'10px',
              color:'rgba(250,248,251,0.4)', fontSize:'12px', cursor:'pointer' }}>
              ← Nouveau brief
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── SupportModal ─────────────────────────────────────────────────────────────

function SupportModal({ agent, onClose }) {
  const form = SUPPORT_FORMS[agent.id]
  const [data, setData] = useState({})
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true); setResponse(''); setError('')
    try {
      const res = await fetch('/api/agents/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, ...data }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setResponse(text)
      }
    } catch (e) { setError(e.message || 'Erreur inconnue') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(10,0,8,0.9)', backdropFilter:'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'linear-gradient(160deg,#120010 0%,#0a0008 60%)',
        border:`1px solid ${agent.color}55`, borderRadius:'20px', padding:'32px',
        width:'100%', maxWidth:'660px', maxHeight:'90vh', overflowY:'auto',
        position:'relative', boxShadow:`0 0 60px ${agent.color}18` }}>
        <button onClick={onClose} style={{ position:'absolute', top:'16px', right:'16px',
          background:'transparent', border:'1px solid rgba(250,248,251,0.15)', borderRadius:'8px',
          color:'rgba(250,248,251,0.5)', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>×</button>

        <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'50%', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:'26px', background:`${agent.color}18`,
            border:`2px solid ${agent.color}55`, flexShrink:0 }}>
            {agent.emoji}
          </div>
          <div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:'20px', fontWeight:'900', color:B.white }}>{form.title}</div>
            <div style={{ fontSize:'12px', color:'rgba(250,248,251,0.45)' }}>{form.subtitle}</div>
          </div>
        </div>
        <div style={{ height:'1px', background:`linear-gradient(90deg,transparent,${agent.color}88,transparent)`, marginBottom:'24px' }}/>

        {!response && !loading && (
          <>
            {form.fields.map(field => (
              <FieldGroup key={field.key} field={field} value={data[field.key]}
                onChange={v => setData({...data,[field.key]:v})} accentColor={agent.accent}/>
            ))}
            {error && <div style={{ color:'#ff6b6b', fontSize:'12px', marginBottom:'12px' }}>⚠ {error}</div>}
            <button onClick={generate} style={{ width:'100%', padding:'14px',
              background:`linear-gradient(135deg,${agent.color}cc,${agent.color}66)`,
              border:`1px solid ${agent.color}77`, borderRadius:'12px',
              color:B.white, fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>
              ✦ Activer {agent.name} →
            </button>
          </>
        )}
        {loading && (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'50%', margin:'0 auto 16px',
              border:`2px solid ${agent.color}22`, borderTop:`2px solid ${agent.color}`,
              animation:'spin 0.8s linear infinite' }}/>
            <p style={{ color:'rgba(250,248,251,0.5)', fontSize:'13px' }}>Agent {agent.name} en cours…</p>
          </div>
        )}
        {response && (
          <>
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'700', color:agent.accent,
                letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px' }}>
                Résultat — {agent.name}
              </div>
              <div style={{ background:'rgba(10,0,8,0.5)', border:`1px solid ${agent.color}33`,
                borderRadius:'12px', padding:'18px', fontSize:'13px', color:'rgba(250,248,251,0.85)',
                lineHeight:'1.75', whiteSpace:'pre-wrap', maxHeight:'380px', overflowY:'auto',
                fontFamily:'system-ui,sans-serif' }}>
                {response}
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', marginBottom:'12px' }}>
              <button onClick={() => { navigator.clipboard.writeText(response).then(() => { setCopied(true); setTimeout(()=>setCopied(false),2000) }) }}
                style={{ flex:1, padding:'12px',
                  background: copied ? `${agent.color}22` : 'rgba(107,15,110,0.3)',
                  border:`1px solid ${copied ? agent.color : agent.color}55`, borderRadius:'10px',
                  color: copied ? agent.accent : B.white, fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                {copied ? '✓ Copié !' : '📋 Copier'}
              </button>
            </div>
            <button onClick={() => { setResponse(''); setData({}) }} style={{ width:'100%', padding:'10px',
              background:'transparent', border:'1px solid rgba(250,248,251,0.12)', borderRadius:'10px',
              color:'rgba(250,248,251,0.4)', fontSize:'12px', cursor:'pointer' }}>
              ← Nouvelle requête
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── CampaignModal ────────────────────────────────────────────────────────────

function CampaignModal({ onClose }) {
  const [phase, setPhase] = useState('form') // 'form' | 'running' | 'done'
  const [brief, setBrief] = useState({})
  const [stepStatuses, setStepStatuses] = useState(
    PIPELINE_STEPS.map(s => ({ ...s, status:'pending', output:'' }))
  )
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [currentStreamText, setCurrentStreamText] = useState('')
  const [expandedStep, setExpandedStep] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(null)
  const outputRef = useRef(null)
  const currentOutputRef = useRef('')

  async function launch() {
    if (!brief.client) return
    setPhase('running')
    setError('')
    currentOutputRef.current = ''
    setStepStatuses(PIPELINE_STEPS.map(s => ({ ...s, status:'pending', output:'' })))
    setCurrentStepIndex(-1)
    setCurrentStreamText('')

    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      })
      if (!res.ok) throw new Error(`Erreur API ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          try { processEvent(JSON.parse(line)) } catch (_) {}
        }
      }
    } catch (e) {
      setError(e.message || 'Erreur inconnue')
      setPhase('done')
    }
  }

  function processEvent(event) {
    switch (event.type) {
      case 'step_start':
        setCurrentStepIndex(event.index)
        currentOutputRef.current = ''
        setCurrentStreamText('')
        setStepStatuses(prev => prev.map((s, i) =>
          i === event.index ? { ...s, status:'active' } :
          i < event.index  ? { ...s, status:'done' } : s
        ))
        break

      case 'step_chunk':
        currentOutputRef.current += event.text
        setCurrentStreamText(currentOutputRef.current)
        if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight
        break

      case 'step_done': {
        const out = currentOutputRef.current
        setStepStatuses(prev => prev.map((s, i) =>
          i === event.index ? { ...s, status:'done', output: out } : s
        ))
        break
      }

      case 'step_error':
        setStepStatuses(prev => prev.map((s, i) =>
          i === event.index ? { ...s, status:'error' } : s
        ))
        setError(event.error || 'Erreur inconnue')
        setPhase('done')
        break

      case 'pipeline_done':
        setPhase('done')
        setCurrentStepIndex(-1)
        setExpandedStep(0)
        break
    }
  }

  const activeStep = currentStepIndex >= 0 ? PIPELINE_STEPS[currentStepIndex] : null

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(10,0,8,0.96)', backdropFilter:'blur(16px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{
        background:'linear-gradient(160deg,#120010 0%,#0a0008 60%)',
        border:`1px solid ${B.gold}44`, borderRadius:'20px',
        width:'100%', maxWidth: phase === 'form' ? '620px' : '1060px',
        maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:`0 0 100px ${B.magenta}12`,
        transition:'max-width 0.4s ease',
      }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <Eye size={26}/>
            <div>
              <div style={{ fontFamily:'Georgia,serif', fontSize:'17px', fontWeight:'900', color:B.white }}>
                {phase === 'form' && 'Campagne Complète'}
                {phase === 'running' && `En cours — ${brief.client || ''}`}
                {phase === 'done' && `✓ Terminé — ${brief.client || ''}`}
              </div>
              <div style={{ fontSize:'9px', color:B.gold, letterSpacing:'0.18em', marginTop:'2px' }}>
                {phase === 'form' && '5 AGENTS · PIPELINE SÉQUENTIEL · 5 LIVRABLES'}
                {phase === 'running' && `AGENT ${currentStepIndex + 1} / 5 EN COURS`}
                {phase === 'done' && 'PIPELINE COMPLET · TOUS LES LIVRABLES DISPONIBLES'}
              </div>
            </div>
          </div>
          {phase !== 'running' && (
            <button onClick={onClose} style={{ background:'transparent', border:'1px solid rgba(250,248,251,0.15)',
              borderRadius:'8px', color:'rgba(250,248,251,0.5)', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>×</button>
          )}
        </div>
        <div style={{ height:'1px', background:`linear-gradient(90deg,transparent,${B.gold}66,transparent)`, margin:'16px 0 0' }}/>

        {/* Body */}
        <div style={{ flex:1, overflow:'hidden', display:'flex' }}>

          {/* ── PHASE : FORM ──────────────────────────────────── */}
          {phase === 'form' && (
            <div style={{ flex:1, padding:'20px 24px 24px', overflowY:'auto' }}>
              {/* Pipeline preview */}
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'22px', padding:'12px 14px',
                background:B.surface, border:`1px solid ${B.border}`, borderRadius:'12px', overflowX:'auto' }}>
                {PIPELINE_STEPS.map((step, i) => (
                  <div key={step.id} style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
                    <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:'700',
                      background:`${step.color}18`, border:`1px solid ${step.color}44`, color:B.white }}>
                      {step.emoji} {step.prenom}
                    </span>
                    {i < PIPELINE_STEPS.length - 1 && <span style={{ fontSize:'10px', color:B.gold, opacity:0.45 }}>→</span>}
                  </div>
                ))}
              </div>

              {CAMPAIGN_FIELDS.map(field => (
                <FieldGroup key={field.key} field={field} value={brief[field.key]}
                  onChange={v => setBrief({...brief,[field.key]:v})} accentColor={B.goldLight}/>
              ))}

              <button onClick={launch} disabled={!brief.client} style={{
                width:'100%', padding:'15px', marginTop:'8px',
                background: brief.client ? `linear-gradient(135deg,${B.magenta},${B.violetDeep})` : 'rgba(107,15,110,0.15)',
                border:`1px solid ${brief.client ? B.magenta+'88' : 'rgba(250,248,251,0.08)'}`,
                borderRadius:'12px', color:B.white, fontSize:'15px', fontWeight:'800',
                cursor: brief.client ? 'pointer' : 'not-allowed', letterSpacing:'0.04em',
                opacity: brief.client ? 1 : 0.45,
              }}>
                🚀 Lancer la Campagne Complète →
              </button>
            </div>
          )}

          {/* ── PHASE : RUNNING / DONE ────────────────────────── */}
          {(phase === 'running' || phase === 'done') && (
            <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

              {/* Sidebar — pipeline steps */}
              <div style={{ width:'210px', flexShrink:0, borderRight:`1px solid ${B.border}`,
                padding:'14px 10px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'5px' }}>
                {stepStatuses.map((step, i) => {
                  const isActive  = step.status === 'active'
                  const isDone    = step.status === 'done'
                  const isPending = step.status === 'pending'
                  const isError   = step.status === 'error'
                  return (
                    <div key={step.id}
                      onClick={() => isDone && setExpandedStep(expandedStep === i ? null : i)}
                      style={{ padding:'10px 11px', borderRadius:'10px',
                        background: isActive ? `${step.color}22` : isDone ? `${step.color}10` : 'transparent',
                        border:`1px solid ${isActive ? step.color+'66' : isDone ? step.color+'28' : 'rgba(250,248,251,0.05)'}`,
                        cursor: isDone ? 'pointer' : 'default', transition:'all 0.2s',
                      }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <img src={getAvatarPath(step.id)} alt={step.prenom}
                          style={{ width:'28px', height:'28px', borderRadius:'50%', objectFit:'cover', objectPosition:'top',
                            border:`1.5px solid ${step.color}${isActive ? '' : '55'}`,
                            opacity: isPending ? 0.3 : 1, flexShrink:0 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'12px', fontWeight:'700', color: isPending ? 'rgba(250,248,251,0.25)' : B.white, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{step.prenom}</div>
                          <div style={{ fontSize:'8px', color:step.color, opacity: isPending ? 0.3 : 0.8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{step.folder}</div>
                        </div>
                        <div style={{ fontSize:'11px', flexShrink:0, color: isDone ? '#4ade80' : isError ? '#f87171' : isActive ? step.color : 'rgba(250,248,251,0.15)' }}>
                          {isDone ? '✓' : isError ? '✕' : isActive ? <span style={{ animation:'bpulse 1s infinite', display:'inline-block' }}>●</span> : '○'}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {phase === 'done' && (
                  <button onClick={() => {
                    setPhase('form')
                    setStepStatuses(PIPELINE_STEPS.map(s=>({...s,status:'pending',output:''})))
                    setExpandedStep(null)
                    setError('')
                  }} style={{ marginTop:'10px', padding:'9px 11px', background:'transparent',
                    border:`1px solid ${B.border}`, borderRadius:'10px',
                    color:'rgba(250,248,251,0.35)', fontSize:'11px', cursor:'pointer' }}>
                    ← Nouvelle campagne
                  </button>
                )}
              </div>

              {/* Output area */}
              <div style={{ flex:1, padding:'16px 20px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'12px' }}
                ref={phase === 'running' ? outputRef : null}>

                {/* Running: affiche le stream actif */}
                {phase === 'running' && activeStep && (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                      <img src={getAvatarPath(activeStep.id)} alt={activeStep.prenom}
                        style={{ width:'38px', height:'38px', borderRadius:'50%', objectFit:'cover', objectPosition:'top',
                          border:`2px solid ${activeStep.color}88`, flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'14px', fontWeight:'700', color:B.white }}>{activeStep.prenom} génère…</div>
                        <div style={{ fontSize:'10px', color:activeStep.color }}>→ {activeStep.folder}</div>
                      </div>
                      <div style={{ width:'18px', height:'18px', borderRadius:'50%', flexShrink:0,
                        border:`2px solid ${activeStep.color}22`, borderTop:`2px solid ${activeStep.color}`,
                        animation:'spin 0.8s linear infinite' }}/>
                    </div>
                    <div style={{ background:'rgba(10,0,8,0.5)', border:`1px solid ${activeStep.color}33`,
                      borderRadius:'12px', padding:'16px', fontSize:'12.5px',
                      color:'rgba(250,248,251,0.82)', lineHeight:'1.78', whiteSpace:'pre-wrap',
                      fontFamily:'system-ui,sans-serif', minHeight:'180px' }}>
                      {currentStreamText || <span style={{opacity:0.25}}>Initialisation…</span>}
                    </div>
                  </div>
                )}

                {/* Done: accordion des résultats */}
                {phase === 'done' && (
                  <>
                    {error && (
                      <div style={{ color:'#ff6b6b', fontSize:'12px', padding:'10px 14px',
                        background:'rgba(255,107,107,0.06)', borderRadius:'8px', border:'1px solid rgba(255,107,107,0.18)' }}>
                        ⚠ {error}
                      </div>
                    )}

                    {stepStatuses.filter(s => s.status === 'done').map((step) => {
                      const idx = stepStatuses.indexOf(step)
                      const isOpen = expandedStep === idx
                      const wordCount = step.output ? step.output.trim().split(/\s+/).length : 0
                      return (
                        <div key={step.id} style={{ border:`1px solid ${step.color}33`, borderRadius:'12px', overflow:'hidden' }}>
                          <div onClick={() => setExpandedStep(isOpen ? null : idx)}
                            style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px',
                              cursor:'pointer', background:`${step.color}0d` }}>
                            <img src={getAvatarPath(step.id)} alt={step.prenom}
                              style={{ width:'30px', height:'30px', borderRadius:'50%', objectFit:'cover', objectPosition:'top',
                                border:`1.5px solid ${step.color}55`, flexShrink:0 }}/>
                            <div style={{ flex:1 }}>
                              <span style={{ fontSize:'13px', fontWeight:'700', color:B.white }}>{step.prenom}</span>
                              <span style={{ fontSize:'10px', color:step.color, marginLeft:'8px' }}>→ {step.folder}</span>
                            </div>
                            <span style={{ fontSize:'9px', color:B.gold, opacity:0.7 }}>✓ {wordCount} mots</span>
                            <span style={{ fontSize:'11px', color:'rgba(250,248,251,0.25)', marginLeft:'6px' }}>{isOpen ? '▲' : '▼'}</span>
                          </div>
                          {isOpen && (
                            <div style={{ padding:'0 16px 14px' }}>
                              <div style={{ background:'rgba(10,0,8,0.45)', borderRadius:'10px', padding:'14px',
                                fontSize:'12px', color:'rgba(250,248,251,0.8)', lineHeight:'1.78',
                                whiteSpace:'pre-wrap', maxHeight:'340px', overflowY:'auto', marginBottom:'8px',
                                fontFamily:'system-ui,sans-serif' }}>
                                {step.output}
                              </div>
                              <button onClick={() => {
                                navigator.clipboard.writeText(step.output).then(() => {
                                  setCopied(idx); setTimeout(()=>setCopied(null),2000)
                                })
                              }} style={{ padding:'7px 14px',
                                background: copied === idx ? `${step.color}18` : 'rgba(107,15,110,0.2)',
                                border:`1px solid ${step.color}44`, borderRadius:'8px',
                                color: copied === idx ? step.color : B.white,
                                fontSize:'11px', cursor:'pointer' }}>
                                {copied === idx ? '✓ Copié' : '📋 Copier'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {stepStatuses.every(s => s.status === 'done') && (
                      <div style={{ textAlign:'center', padding:'18px', background:`${B.gold}07`,
                        border:`1px solid ${B.gold}28`, borderRadius:'12px' }}>
                        <div style={{ fontSize:'22px', marginBottom:'6px' }}>✦</div>
                        <div style={{ fontSize:'13px', fontWeight:'700', color:B.goldLight }}>Pipeline complet</div>
                        <div style={{ fontSize:'11px', color:'rgba(250,248,251,0.4)', marginTop:'4px', marginBottom:'14px' }}>
                          5 livrables — clique sur chaque agente pour lire et copier son output
                        </div>
                        <button onClick={() => {
                          const date = new Date().toISOString().split('T')[0]
                          const slug = (brief.client || 'client').toLowerCase().replace(/\s+/g, '-')
                          let md = `# Campagne B.BOLD — ${brief.client || '—'}\n`
                          md += `**Date :** ${date}  \n`
                          md += `**Objectif :** ${brief.objectif || '—'}  \n`
                          md += `**Plateformes :** ${brief.plateformes || '—'}  \n`
                          md += `**Budget :** ${brief.budget || '—'}  \n\n---\n\n`
                          stepStatuses.filter(s => s.status === 'done').forEach(s => {
                            md += `## ${s.emoji} ${s.prenom} → ${s.folder}\n\n${s.output}\n\n---\n\n`
                          })
                          const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `bbold-${slug}-${date}.md`
                          a.click()
                          URL.revokeObjectURL(url)
                        }} style={{
                          padding:'10px 24px',
                          background:`linear-gradient(135deg,${B.gold}cc,${B.goldLight}88)`,
                          border:`1px solid ${B.gold}88`, borderRadius:'10px',
                          color:B.black, fontSize:'13px', fontWeight:'800', cursor:'pointer',
                        }}>
                          ⬇ Télécharger tout (.md)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── AgentCard ────────────────────────────────────────────────────────────────

function AgentCard({ agent, onActivate }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ background: hovered ? `linear-gradient(135deg,${agent.color}20,rgba(107,15,110,0.15))` : B.surface,
        border:`1px solid ${hovered ? agent.color+'66' : B.border}`, borderRadius:'16px', padding:'20px',
        cursor:'default', transition:'all 0.25s', position:'relative', overflow:'hidden',
        boxShadow: hovered ? `0 8px 28px ${agent.color}20` : 'none', display:'flex', flexDirection:'column' }}>
      {hovered && <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:'1px',
        background:`linear-gradient(90deg,transparent,${B.gold},transparent)` }}/>}
      <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'12px' }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <img src={getAvatarPath(agent.id)} alt={agent.prenom}
            style={{ width:'68px', height:'68px', borderRadius:'50%', objectFit:'cover', objectPosition:'top center',
              border:`2px solid ${agent.color}66`, boxShadow:`0 0 16px ${agent.color}33` }}/>
          <div style={{ position:'absolute', bottom:0, right:0, width:'20px', height:'20px', background:agent.color,
            borderRadius:'50%', border:`1.5px solid ${B.black}`, display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:'10px' }}>{agent.emoji}</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'17px', fontWeight:'900', color:B.white }}>{agent.prenom}</div>
          <div style={{ fontSize:'10px', color:agent.color, fontWeight:'600', letterSpacing:'0.1em', margin:'1px 0' }}>{agent.title}</div>
          <div style={{ display:'inline-block', padding:'1px 7px', background:`${agent.color}18`,
            border:`1px solid ${agent.color}30`, borderRadius:'10px', fontSize:'8px', color:agent.accent, fontWeight:'600' }}>{agent.model}</div>
        </div>
      </div>
      <p style={{ fontSize:'11.5px', color:'rgba(250,248,251,0.5)', lineHeight:'1.65', margin:'0 0 14px', flex:1 }}>
        {FORMS[agent.id].subtitle}
      </p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
        <button onClick={()=>onActivate(agent)} style={{ padding:'8px 20px',
          background:`linear-gradient(135deg,${agent.color}cc,${B.violetDeep}cc)`,
          border:`1px solid ${agent.color}88`, borderRadius:'20px',
          color:B.white, fontSize:'12px', fontWeight:'700', cursor:'pointer',
          boxShadow: hovered ? `0 4px 14px ${agent.color}44` : 'none', transition:'all 0.2s' }}>
          Activer →
        </button>
      </div>
    </div>
  )
}

// ─── SupportCard ──────────────────────────────────────────────────────────────

function SupportCard({ agent, onActivate }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ background: hovered ? `${agent.color}12` : B.surface,
        border:`1px solid ${hovered ? agent.color+'55' : B.border}`, borderRadius:'14px', padding:'18px',
        cursor:'default', transition:'all 0.22s', display:'flex', flexDirection:'column',
        boxShadow: hovered ? `0 6px 20px ${agent.color}18` : 'none' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
        <div style={{ width:'46px', height:'46px', borderRadius:'50%', display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:'20px', background:`${agent.color}15`,
          border:`1.5px solid ${agent.color}44`, flexShrink:0 }}>
          {agent.emoji}
        </div>
        <div>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'15px', fontWeight:'800', color:B.white }}>{agent.name}</div>
          <div style={{ fontSize:'9px', color:agent.color, fontWeight:'600', letterSpacing:'0.1em' }}>AGENT SUPPORT</div>
        </div>
      </div>
      <p style={{ fontSize:'11px', color:'rgba(250,248,251,0.45)', lineHeight:'1.6', margin:'0 0 12px', flex:1 }}>
        {agent.subtitle}
      </p>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button onClick={()=>onActivate(agent)} style={{ padding:'6px 16px',
          background:`${agent.color}cc`, border:`1px solid ${agent.color}88`,
          borderRadius:'16px', color:B.white, fontSize:'11px', fontWeight:'700', cursor:'pointer' }}>
          Activer →
        </button>
      </div>
    </div>
  )
}

// ─── BBoldCore (main) ─────────────────────────────────────────────────────────

export default function BBoldCore() {
  const [tab, setTab] = useState('agents')
  const [activeAgent, setActiveAgent] = useState(null)
  const [activeSupportAgent, setActiveSupportAgent] = useState(null)
  const [showCampaign, setShowCampaign] = useState(false)

  useEffect(() => { document.title = 'B.BOLD Core — Multi-Agent Platform' }, [])

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg,#120010 0%,#0a0008 55%,#0f000e 100%)`,
      color:B.white, fontFamily:'system-ui,sans-serif' }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${B.gold}44; border-radius:2px; }
        input::placeholder, textarea::placeholder { color:rgba(250,248,251,0.22); }
        input:focus, textarea:focus, select:focus { border-color:rgba(201,168,76,0.5) !important; }
        button:hover { opacity:0.87; }
        select option { background:#120010; }
        @keyframes bfadein { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bpulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.8)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      {activeAgent       && <Modal        agent={activeAgent}        onClose={()=>setActiveAgent(null)}/>}
      {activeSupportAgent && <SupportModal agent={activeSupportAgent} onClose={()=>setActiveSupportAgent(null)}/>}
      {showCampaign       && <CampaignModal onClose={()=>setShowCampaign(false)}/>}

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ borderBottom:`1px solid ${B.border}`, padding:'0 28px', height:'68px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'rgba(10,0,8,0.88)', backdropFilter:'blur(16px)',
        position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <Eye size={36}/>
          <div>
            <div style={{ fontSize:'18px', fontWeight:'900', fontFamily:'Georgia,serif',
              background:`linear-gradient(90deg,${B.white},${B.lilas})`,
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              B.BOLD <span style={{ fontWeight:'300', fontSize:'14px', WebkitTextFillColor:B.gold }}>Core</span>
            </div>
            <div style={{ fontSize:'8px', color:B.gold, letterSpacing:'0.22em', fontWeight:'600' }}>MULTI-AGENT PLATFORM</div>
          </div>
        </div>
        <nav style={{ display:'flex', gap:'4px' }}>
          {[{id:'agents',label:'Agents'},{id:'stack',label:'Stack'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'7px 16px',
              background: tab===t.id ? `linear-gradient(135deg,${B.magenta}22,${B.violetDeep}22)` : 'transparent',
              border:`1px solid ${tab===t.id ? B.gold+'55' : 'transparent'}`,
              borderRadius:'8px', color: tab===t.id ? B.goldLight : 'rgba(250,248,251,0.4)',
              fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Main ───────────────────────────────────────────── */}
      <main style={{ padding:'32px', maxWidth:'1200px', margin:'0 auto' }}>

        {/* ── TAB : AGENTS ──────────────────────────────────── */}
        {tab === 'agents' && (
          <div style={{ animation:'bfadein 0.35s ease' }}>

            {/* Orchestrateur banner */}
            <div style={{ background:`linear-gradient(135deg,rgba(107,15,110,0.2),rgba(201,168,76,0.07))`,
              border:`1px solid ${B.gold}40`, borderRadius:'18px', padding:'20px 24px', marginBottom:'24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'20px', flexWrap:'wrap' }}>
                <Eye size={40}/>
                <div style={{ flex:1, minWidth:'220px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'Georgia,serif', fontSize:'19px', fontWeight:'700', color:B.white }}>Orchestrateur</span>
                    <span style={{ padding:'2px 9px', background:`${B.gold}18`, border:`1px solid ${B.gold}50`,
                      borderRadius:'20px', fontSize:'9px', color:B.goldLight, fontWeight:'600', letterSpacing:'0.12em' }}>
                      CLAUDE OPUS
                    </span>
                    <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                      <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:B.goldLight,
                        boxShadow:`0 0 8px ${B.gold}`, animation:'bpulse 2s infinite' }}/>
                      <span style={{ fontSize:'9px', color:B.gold, fontWeight:'600' }}>ACTIF</span>
                    </div>
                  </div>
                  <p style={{ fontSize:'12px', color:'rgba(250,248,251,0.55)', lineHeight:'1.65' }}>
                    Route, consolide, enchaîne. <strong style={{ color:B.goldLight }}>Répond directement dans l'interface.</strong> Zéro copier-coller.
                  </p>
                </div>
              </div>
            </div>

            {/* Les 5 agentes */}
            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'14px' }}>
              <div style={{ height:'1px', flex:1, background:`linear-gradient(90deg,transparent,${B.gold}55)` }}/>
              <span style={{ fontSize:'9px', color:B.gold, fontWeight:'600', letterSpacing:'0.2em' }}>LES 5 AGENTES</span>
              <div style={{ height:'1px', flex:1, background:`linear-gradient(90deg,${B.gold}55,transparent)` }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:'12px', marginBottom:'28px' }}>
              {AGENTS.map(agent => <AgentCard key={agent.id} agent={agent} onActivate={setActiveAgent}/>)}
            </div>

            {/* Campaign CTA */}
            <div style={{ background:`linear-gradient(135deg,rgba(192,0,192,0.12),rgba(107,15,110,0.18))`,
              border:`1px solid ${B.magenta}44`, borderRadius:'18px', padding:'22px 28px', marginBottom:'28px',
              display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
                  <span style={{ fontSize:'20px' }}>🚀</span>
                  <span style={{ fontFamily:'Georgia,serif', fontSize:'17px', fontWeight:'800', color:B.white }}>Campagne Complète</span>
                  <span style={{ padding:'2px 8px', background:`${B.magenta}18`, border:`1px solid ${B.magenta}44`,
                    borderRadius:'20px', fontSize:'8px', color:B.lilas, fontWeight:'600' }}>NOUVEAU</span>
                </div>
                <p style={{ fontSize:'12px', color:'rgba(250,248,251,0.5)', margin:0 }}>
                  Un brief → 5 agents en séquence → 5 livrables versionnés (briefs / content / visuels / analytics / deck)
                </p>
              </div>
              <button onClick={() => setShowCampaign(true)} style={{
                padding:'12px 28px', flexShrink:0,
                background:`linear-gradient(135deg,${B.magenta},${B.violetDeep})`,
                border:`1px solid ${B.magenta}88`, borderRadius:'12px',
                color:B.white, fontSize:'13px', fontWeight:'800', cursor:'pointer',
                boxShadow:`0 4px 20px ${B.magenta}33`,
              }}>
                Lancer →
              </button>
            </div>

            {/* Agents support */}
            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'14px' }}>
              <div style={{ height:'1px', flex:1, background:`linear-gradient(90deg,transparent,rgba(250,248,251,0.15))` }}/>
              <span style={{ fontSize:'9px', color:'rgba(250,248,251,0.4)', fontWeight:'600', letterSpacing:'0.2em' }}>AGENTS SUPPORT</span>
              <div style={{ height:'1px', flex:1, background:`linear-gradient(90deg,rgba(250,248,251,0.15),transparent)` }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'12px' }}>
              {SUPPORT_AGENTS.map(agent => <SupportCard key={agent.id} agent={agent} onActivate={setActiveSupportAgent}/>)}
            </div>
          </div>
        )}

        {/* ── TAB : STACK ───────────────────────────────────── */}
        {tab === 'stack' && (
          <div style={{ animation:'bfadein 0.35s ease' }}>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:'26px', fontWeight:'900', margin:'0 0 8px', color:B.white }}>
              Stack <code style={{ fontFamily:'monospace', fontSize:'18px', color:B.gold, background:`${B.gold}10`, padding:'2px 9px', borderRadius:'5px' }}>naïom-platform</code>
            </h2>
            <p style={{ fontSize:'13px', color:'rgba(250,248,251,0.45)', margin:'0 0 24px' }}>8 agents · 3 API routes · streaming · pipeline orchestré</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'12px' }}>
              {[
                { n:'Next.js 14',         r:'Framework · App Router · React 18 · deploy Vercel' },
                { n:'Anthropic SDK',      r:'claude-opus-4-5 (Stratège, Analyste, Orchestrateur) · claude-sonnet-4-5 (Créatrice, Designer, Présentatrice)' },
                { n:'API Routes',         r:'/api/brief · /api/orchestrate · /api/agents/support — clé serveur sécurisée' },
                { n:'Pipeline orchestré', r:'Séquentiel NDJSON — contexte passé de step en step — 5 livrables versionnés' },
                { n:'Agents support',     r:'Gmail · Fireflies · Content Vault — streaming indépendant' },
                { n:'Netlify / Vercel',   r:'Deploy instantané · HTTPS · CDN global · .env.local jamais exposée' },
              ].map((s,i)=>(
                <div key={i} style={{ background:B.surface, border:`1px solid ${B.border}`, borderRadius:'12px', padding:'16px 18px' }}>
                  <div style={{ fontSize:'13px', fontWeight:'700', color:B.goldLight, marginBottom:'5px' }}>{s.n}</div>
                  <div style={{ fontSize:'11.5px', color:'rgba(250,248,251,0.42)', lineHeight:'1.55' }}>{s.r}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
