# Stockage du studio

Le studio enregistre trois choses : les visuels rendus (PNG), les inspirations
(images chargées par marque) et les données (`style.json`, posts, marques).

Le moteur est choisi automatiquement par `src/lib/studio/storage.ts` :

| Priorité | Moteur | S'active quand |
|---|---|---|
| 1 | **S3** (R2, B2, MinIO, AWS…) | `S3_BUCKET` + `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY` présents |
| 2 | Vercel Blob | `BLOB_READ_WRITE_TOKEN` présent, pas de S3 |
| 3 | Disque local | dev uniquement |

`STORAGE_DRIVER=s3|blob|local` force un moteur.

## Pourquoi Vercel Blob a été suspendu

Le plan Hobby donne 2 000 « opérations avancées » par mois. Chaque `list()`
en est une. L'ancien code listait le store à **chaque lecture** de fichier
(style, marque, post). Quelques sessions de studio suffisaient à vider le quota.

Corrigé dans tous les cas : les lectures font désormais un GET direct par clé.

## Configuration recommandée : Cloudflare R2

10 Go gratuits, **zéro frais de sortie**, API S3. Au-delà : 0,015 $/Go/mois.

1. dash.cloudflare.com → **R2** → *Create bucket* → nom `bbold-studio`.
2. Bucket → *Settings* → **Public Development URL** → *Allow*. Copie l'URL `https://pub-xxxx.r2.dev`.
   (Plus tard, si ton domaine est sur Cloudflare : *Custom Domain* `media.bboldagency.fr`.)
3. R2 → **Manage API tokens** → *Create API token* → permission **Object Read & Write**, limitée au bucket.
   Note l'*Access Key ID*, le *Secret Access Key* et l'endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
4. Vercel → projet → *Settings* → *Environment Variables* (Production + Preview) :

   ```
   S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   S3_REGION=auto
   S3_BUCKET=bbold-studio
   S3_ACCESS_KEY_ID=...
   S3_SECRET_ACCESS_KEY=...
   S3_PUBLIC_URL=https://pub-xxxx.r2.dev
   ```

5. Redéploie. Vercel Blob est ignoré dès que S3 est configuré, inutile de le supprimer.

Sans `S3_PUBLIC_URL`, le bucket peut rester privé : les images passent par
`/api/studio/content/file` (protégée par le code d'accès). Ça marche, mais la
bande passante sort de Vercel au lieu de R2.

## Option Hostinger

- **Hébergement mutualisé / Cloud Hostinger** : pas d'API S3. Non compatible
  sans écrire un relais PHP maison. Déconseillé.
- **VPS Hostinger (KVM)** : oui. Installe MinIO (serveur S3 open source),
  mets-le derrière un sous-domaine en HTTPS, puis :

  ```
  S3_ENDPOINT=https://s3.bboldagency.fr
  S3_REGION=us-east-1
  S3_BUCKET=bbold-studio
  S3_ACCESS_KEY_ID=...
  S3_SECRET_ACCESS_KEY=...
  S3_PUBLIC_URL=https://s3.bboldagency.fr/bbold-studio
  S3_FORCE_PATH_STYLE=true
  ```

  Stockage = disque du VPS, sans quota d'opérations. Contrepartie : sauvegardes,
  mises à jour et certificats HTTPS sont à ta charge.

## Récupérer les fichiers de l'ancien store Blob

```bash
node --env-file=.env.local scripts/migrate-blob-to-s3.mjs
```

Nécessite que le store Blob soit lisible. S'il reste suspendu, recharge
simplement les inspirations dans le studio : le profil de style se recalcule.
