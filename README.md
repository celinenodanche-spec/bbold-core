# B.BOLD Core — Multi-Agent Platform

Dashboard multiagent de B.BOLD Agency.

## Déploiement sur Vercel (gratuit)

### Étape 1 — GitHub
1. Va sur github.com → "New repository"
2. Nomme-le `bbold-core` → Create repository
3. Upload tous les fichiers de ce dossier

### Étape 2 — Vercel
1. Va sur vercel.com → "Add New Project"
2. Connecte ton compte GitHub
3. Sélectionne le repo `bbold-core`
4. Clique "Deploy" → c'est tout !

Ton URL sera : `https://bbold-core.vercel.app`

### Étape 3 — Intégration Systeme.io
Dans ton éditeur Systeme.io, ajoute un bloc HTML :

```html
<iframe 
  src="https://bbold-core.vercel.app" 
  width="100%" 
  height="900px"
  frameborder="0"
  style="border-radius:16px;">
</iframe>
```
