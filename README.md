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

---

# Correction · longueur des réponses et délai d'affichage

## Le délai — c'était une ligne manquante

Les trois routes Claude utilisaient déjà `messages.stream()` correctement.
Mais aucune ne déclarait son moteur d'exécution, elles tournaient donc en
**Node**. Or Vercel met le flux en file d'attente dans ce mode : rien n'arrive
au navigateur avant que la réponse soit entièrement terminée.

D'où l'attente devant un écran vide, et les coupures sur les réponses longues.

Correction — une ligne par route :

    export const runtime = 'edge'

Le moteur Edge transmet chaque morceau dès qu'il est produit. Le texte
commence à s'écrire en deux ou trois secondes.

**Ne repasse jamais ces routes en Node**, le problème reviendrait aussitôt.

## La longueur — plafonds relevés

Ils étaient calibrés bas, sans doute pour tenir dans le délai. Cette contrainte
disparaît avec Edge : la limite n'est plus le temps, c'est la taille du livrable.

| Agent | Avant | Après |
|---|---|---|
| J.K. Rowling · email | 1 500 | 6 000 |
| Erin Brockovich · notes | 2 000 | 10 000 |
| Marie Kondo · archivage | 1 500 | 8 000 |
| Maya Angelou · brand voice | 3 500 | 14 000 |
| Madonna · repurpose | 2 800 | 12 000 |
| Hermione Granger · calendrier 30j | 5 000 | 16 000 |
| Olivia Pope · veille | 4 000 | 12 000 |
| Shonda Rhimes · script | 3 000 | 12 000 |
| Kris Jenner · influence | 3 500 | 12 000 |
| Oprah Winfrey · offre | 4 000 | 12 000 |
| Ada Lovelace · SEO | 5 000 | 16 000 |
| Anna Wintour · brand board | 6 000 | 16 000 |
| Pipeline · étapes Opus | 4 000 | 14 000 |
| Pipeline · étapes Sonnet | 2 800 | 12 000 |
| Brief · valeur par défaut | 2 048 | 10 000 |

Réglables dans `max_tokens`, agent par agent.

## Avertissement de troncature

Si un document est malgré tout coupé, le texte se termine désormais par :

    ⚠ DOCUMENT INCOMPLET — la limite de longueur a été atteinte.

Sans ça, un livrable tronqué ressemblait à un livrable fini. Dans le pipeline,
l'avertissement est aussi transmis à l'étape suivante : elle sait qu'elle
travaille sur une base incomplète.

## Ce qui reste à faire, si tu veux aller plus loin

Un bouton **« Continuer la rédaction »**, comme sur MDS : quand un texte est
coupé, l'agent reprend au caractère près au lieu de tout relancer. C'est le
vrai filet, il fonctionne quelle que soit la longueur. Demande-le quand tu
veux, il touche à l'interface.

Un **code d'accès** : l'URL est publique. N'importe qui la connaissant peut
lancer les agents, donc dépenser tes crédits API.


---

# Correction · le pipeline se coupait au dernier agent

## Ce qui s'est passé

En relevant les plafonds de longueur, j'ai rallongé chaque étape d'un facteur
trois à quatre. Or les 5 agents tournaient dans **une seule requête** : leurs
durées s'additionnaient. Le total a dépassé la durée maximale autorisée, et la
dernière étape s'est fait couper.

Rebaisser les plafonds aurait ramené la troncature. Le problème n'était pas la
longueur, c'était la conception : cinq agents dans un seul appel.

## La correction

**Une requête par agent.** Le navigateur enchaîne les appels et transporte le
contexte d'une étape à l'autre.

    avant   1 requête  →  Debelvoix + 5 agents  →  durée cumulée
    après   6 requêtes →  1 agent chacune       →  chacune très en deçà

Concrètement, la route accepte trois modes :

| Mode | Ce qu'elle fait |
|---|---|
| `prestep` | l'analyse Debelvoix seule |
| `step` + `stepIndex` + `context` | une étape, avec le contexte accumulé |
| aucun | ancien comportement, conservé par compatibilité |

L'événement `step_done` transporte désormais la sortie de l'étape : c'est le
navigateur qui garde le contexte, la route ne conserve plus rien entre deux
appels.

## Ce qui ne change pas

L'interface. Les neuf événements qu'elle attend sont tous émis à l'identique.
L'affichage progressif, les statuts par agent, l'historique : rien à retoucher.

## Effet de bord bénéfique

Le pipeline n'a plus de limite de durée globale. Tu peux relever encore les
plafonds d'un agent en particulier sans risquer de faire tomber toute la chaîne.

## Si une étape échoue

Elle arrête le pipeline et affiche l'erreur, comme avant. Seule exception :
un échec de Debelvoix n'interrompt plus rien — c'est une analyse d'appoint,
pas un livrable.
