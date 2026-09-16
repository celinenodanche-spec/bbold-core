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


---

# Correction · les agents ignoraient la date du jour

## Le symptôme

Des contenus datés d'une année périmée. Exemple relevé dans une sortie de
Maya Angelou : « Mariage — Martinique — Juin 2024 », alors qu'on est en 2026.

## La cause

Sur les dix-huit agents, **un seul recevait la date du jour** : Marie Kondo,
parce que son archivage en a besoin pour le frontmatter.

Tous les autres l'ignoraient. Un modèle de langage qui ne connaît pas la date
se rabat sur ce que son entraînement lui a appris, et écrit une année passée.

C'est un vrai problème de qualité pour :

- Hermione Granger — calendrier éditorial sur 30 jours
- Olivia Pope — veille communicationnelle
- Ada Lovelace — articles SEO
- Kris Jenner — campagnes d'influence
- les cinq agentes du pipeline — briefs, plannings, échéances

## La correction

Un bloc `=== DATE DU JOUR ===` est ajouté en tête de **tous** les prompts
système, dans les trois routes. Il donne la date complète, l'année en cours,
et la consigne de ne jamais partir d'une autre année.

Fuseau : `America/Martinique` (UTC-4). Sans ce réglage, le serveur — qui tourne
en UTC — aurait affiché le lendemain à partir de 20 h heure locale.

Rien à maintenir : la date est calculée à chaque appel.

---

# Retouches · Historique complet · Pipeline par client

## 1. Demander une modification

Sous chaque livrable — agent support **et** étape de pipeline — un bouton
« ✎ Demander une modification ». Tu écris ce que tu veux changer, l'agent
reprend **son propre travail** au lieu de repartir de zéro.

Techniquement : les routes acceptent désormais une conversation complète
(demande initiale → réponse → retouche). Sans ça, chaque appel repartait à
blanc et l'agent réécrivait tout.

Les retouches successives s'empilent : chacune apparaît en étiquette au-dessus
du bouton, et l'agent garde le fil.

Sur une étape de pipeline, la retouche ne rejoue **que cette agente**. Les
autres étapes ne bougent pas.

## 2. Retrouver chaque réponse

**Les agents support n'enregistraient rien.** Fermer la fenêtre effaçait le
livrable. C'est corrigé : chaque sortie part dans l'Historique.

L'onglet Historique contient maintenant deux types d'entrées :

| Type | Contenu |
|---|---|
| Campagne | un passage de pipeline, plusieurs livrables |
| Agent seul | un agent support lancé isolément |

Chaque entrée conserve la conversation. Rouvrir un livrable depuis l'historique
permet d'enchaîner une nouvelle retouche — le fil n'est pas perdu.

Capacité portée de 20 à 60 entrées.

## 3. Composer le pipeline par client

Le bandeau des agentes était figé. Il devient un sélecteur : clique sur une
agente pour la retirer ou la remettre. Le pipeline ne peut jamais tomber à
zéro, et l'ordre est toujours préservé — les étapes se nourrissent l'une
l'autre, Lola a besoin du positionnement de Maeva.

**Configurations mémorisées.** Tu composes un pipeline, tu le mémorises sous le
nom du client. Au prochain lancement, un clic le rétablit. Une cliente qui n'a
jamais besoin de deck garde un pipeline à quatre agentes, sans y penser.

L'orchestrateur continue de proposer une sélection : elle devient un point de
départ modifiable au lieu d'un choix imposé.

## Limite connue

Tout ceci vit dans le stockage local du navigateur. Vider le cache efface
l'historique et les configurations. Sur un poste unique c'est tenable ; le jour
où ces livrables deviennent un actif, il faudra le même traitement que pour les
leads de MDS — un stockage serveur.

---

# Studio de Zara — déploiement sur Vercel

Le studio de Zara (posts 4:5, carrousels 4:5, stories 9:16, inspirations, styles,
export ZIP) fonctionne **en local** sans rien de plus. Pour qu'il marche aussi sur
la version **déployée sur Vercel**, deux réglages une seule fois :

## 1. Variables d'environnement (Vercel → Project → Settings → Environment Variables)
- `ANTHROPIC_API_KEY` — obligatoire (déjà utilisée par les autres agents).
- `OPENAI_API_KEY` — optionnelle : active les **fonds d'image GPT Image 2.5**
  générés à partir des inspirations. Sans elle, les visuels utilisent la palette.
- `OPENAI_IMAGE_MODEL` / `OPENAI_IMAGE_MODEL_BATCH` — optionnelles
  (`gpt-image-2.5-sunburst` pour une pièce, `gpt-image-2.5-flare` en série).

## 2. Stockage — Vercel Blob (indispensable en prod)
Le disque des fonctions Vercel est en lecture seule : les posts, les inspirations
et les visuels rendus doivent aller sur **Vercel Blob**.
1. Vercel → onglet **Storage** → **Create Database** → **Blob** → connecte-le au projet.
2. Vercel injecte alors automatiquement `BLOB_READ_WRITE_TOKEN`. Rien d'autre à faire :
   le studio détecte ce jeton et bascule tout seul du disque local vers Blob.

> Sans store Blob, le studio tourne quand même en **local** (`npm run dev`), mais
> les enregistrements échoueront sur le déploiement Vercel.

## 3. Rendu des visuels (Chrome headless)
Géré automatiquement : en local, Chrome via `puppeteer` ; sur Vercel,
`@sparticuz/chromium` + `puppeteer-core` (aucune config). Si un rendu de gros
carrousel dépasse le temps imparti sur l'offre **Hobby** (60 s max), passe la
fonction en plan **Pro** ou réduis le nombre de slides.

## Local — rappel
`npm install` puis `npm run dev`. Le rendu Chrome utilise le navigateur mis en
cache par `npx puppeteer browsers install chrome` (à lancer une fois si besoin).

---

# Code d'accès

L'URL était publique. N'importe qui la connaissant lançait les agents, donc
dépensait les crédits API. C'est fermé.

## Ce que tu dois faire, une fois

Dans Vercel → ton projet → Settings → Environment Variables, ajoute :

    ACCESS_CODE = <ta phrase secrète>

Coche les trois environnements (Production, Preview, Development), puis
redéploie. Sans cette variable, **toutes les routes `/api` répondent 503** et
l'app ne sert à rien. C'est voulu : une app qui a l'air protégée sans l'être
serait pire que pas de protection du tout.

En local, la même ligne dans `.env.local`.

Prends une phrase longue plutôt qu'un mot court. C'est ce qui sépare tes crédits
API du premier venu.

## Ce que voit la personne qui ouvre l'app

Un écran noir aux couleurs de la marque, un champ, un bouton. Le code saisi est
mémorisé dans le navigateur : on ne le retape pas à chaque visite.

## Où la protection se joue vraiment

Pas dans l'écran d'entrée. Dans `src/middleware.js`, qui intercepte **toutes**
les routes `/api` et refuse celles qui n'ont pas le bon code. Contourner
l'affichage ne donne accès à rien : ni aux agents, ni au studio de Zara, ni à un
seul appel facturé.

Un seul point de contrôle, donc aucune route oubliée — et celles qu'on ajoutera
demain sont protégées d'office, sans rien faire.

La comparaison se fait à temps constant. Un `===` classique sort au premier
caractère qui diffère : le temps de réponse laisse alors deviner le code,
caractère après caractère.

## Deux façons de présenter le code

| Cas | Mécanisme |
|---|---|
| Tous les appels `fetch` | en-tête `x-bbold-access` |
| `<img src>`, lien de téléchargement ZIP | paramètre `?k=` |

Le second existe parce qu'une balise `<img>` ou un lien de téléchargement ne
peut pas porter d'en-tête. Les deux passent par `src/lib/access.ts` : `apiFetch()`
pour le premier cas, `withAccess()` pour le second.

Si tu ajoutes un appel à une route `/api`, passe par `apiFetch()`. Un `fetch()`
brut recevra un 401.

## Stockage local, pas un cookie

L'app est faite pour tourner dans une iframe Systeme.io, donc en contexte tiers.
Safari y bloque les cookies purement et simplement : un cookie aurait exclu tous
les visiteurs iPhone. Le stockage local, lui, fonctionne.

## Si le code est refusé en cours de route

Un 401 vide le code mémorisé et fait réapparaître l'écran d'entrée. L'app reste
montée derrière : un livrable en cours d'écriture n'est pas perdu.

## Changer le code

Modifie `ACCESS_CODE` dans Vercel et redéploie. Tous les navigateurs qui avaient
l'ancien code sont éjectés à leur prochain appel et devront retaper le nouveau.

## Ce que ça ne protège pas

Les visuels déjà générés, servis en statique depuis `/content-out/`. Ils restent
accessibles à qui connaît leur URL exacte. Les mettre derrière le code demande
de les servir par une route `/api`, ce qui est un autre chantier.
