# Ebook Idea Finder

Outil interne (usage personnel) pour trouver des idees de guides PDF/ebooks en croisant
Google Trends, les suggestions Google, Reddit et YouTube, a partir d'un univers/marque
existant ou d'un mot-cle libre.

Bloc actuel : gestion des univers + recherche sur 4 sources (Google Trends, Suggestions
Google, Reddit, YouTube), avec dedoublonnage, filtrage des mots hors-sujet (`mots_exclus`)
et tri simple par pertinence (correspondance avec les mots-cles de l'univers en premier).

## 1. Creer le projet Supabase

1. Va sur https://supabase.com et connecte-toi (ou cree un compte).
2. Clique sur **New project**.
   - Donne-lui un nom, ex. `ebook-idea-finder`.
   - Choisis un mot de passe pour la base (garde-le de cote, pas indispensable ici).
   - Choisis une region proche (ex. `eu-west` / Paris).
3. Attends que le projet soit provisionne (~1-2 minutes).

## 2. Creer la table `univers`

1. Dans le menu de gauche du projet Supabase, ouvre **SQL Editor**.
2. Colle le contenu de [`sql/001_create_univers.sql`](sql/001_create_univers.sql) puis clique **Run**.
3. Colle ensuite le contenu de [`sql/002_seed_univers.sql`](sql/002_seed_univers.sql) puis clique **Run**.
   (Ce script est idempotent : tu peux le relancer sans creer de doublons.)
4. Colle enfin le contenu de [`sql/003_add_mots_cles.sql`](sql/003_add_mots_cles.sql) puis clique **Run**.
   (Ajoute la colonne `mots_cles` et renseigne les 7 univers de depart, sans toucher aux
   donnees existantes.)
5. Colle enfin le contenu de [`sql/004_add_mots_exclus.sql`](sql/004_add_mots_exclus.sql) puis
   clique **Run**. (Ajoute la colonne `mots_exclus` et renseigne MaraDigitalPlanner et
   Business FCFA, sans toucher au reste.)
6. Colle enfin le contenu de [`sql/005_create_idees.sql`](sql/005_create_idees.sql) puis clique
   **Run**. (Cree la table `idees`, utilisee par la page "Mes idees" pour sauvegarder des
   resultats de recherche.)

Si tu sautes une de ces etapes, ce n'est pas grave : `npm run seed` (voir plus bas) fait la
meme chose cote Node pour les colonnes deja existantes, et le serveur pre-remplit aussi la
table automatiquement au demarrage si elle est vide. En revanche, `npm run seed` ne peut pas
creer une colonne manquante (`ALTER TABLE`) : la migration SQL reste necessaire pour ca.

## 3. Recuperer l'URL et la cle API

1. Dans le projet Supabase, va dans **Project Settings > API**.
2. Note :
   - **Project URL** -> variable `SUPABASE_URL`
   - **service_role secret** (section "Project API keys") -> variable `SUPABASE_SERVICE_ROLE_KEY`

⚠️ La cle `service_role` donne un acces complet a la base, en contournant les regles RLS.
Elle est utilisee ici uniquement cote serveur (jamais envoyee au navigateur) car l'app est
strictement personnelle, sans authentification. Ne la partage jamais publiquement et ne la
mets pas dans le frontend.

Transmets-moi ces deux valeurs quand tu es pret, ou renseigne-les toi-meme dans `.env`.

## 4. Creer une cle API YouTube (a faire toi-meme)

La source YouTube utilise l'API officielle **YouTube Data API v3**, qui necessite une cle API
Google (gratuite, avec un quota journalier largement suffisant pour un usage personnel).

1. Va sur https://console.cloud.google.com/ et connecte-toi avec un compte Google.
2. Cree un nouveau projet (ou reutilise un projet existant) via le selecteur de projet en haut.
3. Dans le menu, va sur **APIs & Services > Library**, cherche `YouTube Data API v3` et clique
   sur **Enable** (activer).
4. Va sur **APIs & Services > Credentials**, clique **Create Credentials > API key**.
5. Copie la cle generee -> variable `YOUTUBE_API_KEY` dans `.env`.
6. (Recommande) Clique sur la cle pour la restreindre a l'API `YouTube Data API v3` uniquement,
   afin d'eviter qu'elle serve pour autre chose si elle fuite.

Si tu ne renseignes pas `YOUTUBE_API_KEY`, l'app continue de fonctionner normalement : la
source YouTube est simplement ignoree (log d'avertissement cote serveur), les 3 autres
sources (Trends, Suggestions Google, Reddit) restent actives.

Transmets-moi cette cle quand tu es pret, ou renseigne-la toi-meme dans `.env`.

## 5. Configurer et lancer le projet en local

```bash
cd ebook-idea-finder
npm install
cp .env.example .env
# puis remplis SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et YOUTUBE_API_KEY dans .env
npm run dev
```

L'app est servie sur http://localhost:3000.

(Optionnel) Pour forcer le seed manuellement (insere les univers manquants et met a jour
les `mots_cles` des univers de depart deja presents) :

```bash
npm run seed
```

## Structure du projet

```
ebook-idea-finder/
  server.js                  Serveur Express (API + fichiers statiques)
  src/
    db.js                    Client Supabase (service_role)
    seedData.js               Liste des 7 univers de depart
    routes/
      univers.js              CRUD univers
      search.js                Recherche combinee (4 sources) + dedoublonnage/filtrage/tri
      idees.js                  CRUD idees sauvegardees (avec deduplication)
    services/
      googleTrends.js          Requetes associees/en hausse (FR + SN)
      googleSuggest.js         Suggestions d'autocompletion Google
      reddit.js                 Titres de posts Reddit (recherche publique)
      youtube.js                 Titres de videos YouTube (YouTube Data API v3)
  public/
    index.html, app.js         Page de recherche (frontend sans framework)
    idees.html, idees.js       Page "Mes idees"
    style.css                  Styles partages entre les deux pages
  sql/
    001_create_univers.sql
    002_seed_univers.sql
    003_add_mots_cles.sql
    004_add_mots_exclus.sql
    005_create_idees.sql
  scripts/
    seed.js                   Script de seed manuel (npm run seed)
```

## API

- `GET /api/univers` - liste des univers (inclut `mots_cles`, `mots_exclus`)
- `POST /api/univers` - creer `{ nom, description, mots_cles, mots_exclus }`
- `PUT /api/univers/:id` - modifier `{ nom, description, mots_cles, mots_exclus }`
- `DELETE /api/univers/:id` - supprimer
- `GET /api/search?univers_id=<uuid>` ou `GET /api/search?keyword=<texte>` -
  retourne `{ motsCles: string[], resultats: [{ texte, source, motCle }] }`
  (deja dedoublonnes, filtres et tries, voir sections ci-dessous)
- `GET /api/idees?univers_id=<uuid>&statut=<statut>` - liste les idees sauvegardees (filtres
  optionnels), avec l'univers associe embarque (`idee.univers.nom`)
- `POST /api/idees` - sauvegarder `{ univers_id, texte, source, mot_cle }` (409 si l'idee
  existe deja pour cet univers, meme texte insensible a la casse)
- `PATCH /api/idees/:id` - changer uniquement `{ statut }` (`a_explorer`, `en_cours` ou `publie`)
- `DELETE /api/idees/:id` - supprimer une idee sauvegardee

## Mots-cles de recherche vs nom de l'univers

Le champ `nom` d'un univers est un nom de marque (ex. `G40ans+`, `Waajal Salat`) : personne
ne tape ca sur Google, donc il n'est **jamais** utilise comme mot-cle de recherche.

Le champ `mots_cles` contient un ou plusieurs mots-cles reels separes par des virgules
(ex. `femme 40 ans, beaute apres 40 ans, sante femme mature`). Quand on choisit un univers
dans le menu deroulant, l'app lance une recherche (les 4 sources) pour **chaque** mot-cle de
la liste, et combine tous les resultats dans le meme tableau, avec une colonne indiquant quel
mot-cle a produit chaque ligne. Le mode "mot-cle libre" continue de chercher directement le
texte saisi, sans changement.

## Dedoublonnage, filtrage et tri

`src/routes/search.js` applique, dans l'ordre, sur les resultats combines des 4 sources :

1. **Dedoublonnage** : deux entrees dont le texte est identique une fois mis en minuscules et
   normalise (espaces multiples reduits a un seul), meme si elles viennent de sources ou de
   mots-cles differents, ne comptent que pour une seule ligne (la premiere rencontree est
   conservee).
2. **Filtrage (`mots_exclus`)** : si l'univers recherche a des mots a exclure, toute ligne dont
   le texte contient (insensible a la casse) un de ces mots est retiree. Sans effet en mode
   "mot-cle libre" (pas de `mots_exclus` associe) ni si le champ est vide.
3. **Tri par pertinence** : les lignes restantes dont le texte contient au moins un des
   mots-cles recherches passent en premier (tri stable, pas de score complexe) ; les autres
   suivent dans leur ordre d'origine.

## Sauvegarder des idees ("Mes idees")

Chaque ligne du tableau de resultats a un bouton **Sauvegarder**. Au clic, l'idee est
enregistree dans la table `idees` avec le statut par defaut `a_explorer`, en gardant le texte,
la source, le mot-cle utilise et l'univers de la recherche en cours (ou aucun univers en mode
"mot-cle libre"). Le bouton devient alors un badge "✓ Sauvegarde" (desactive), sans recharger
la page.

Si la meme idee (meme texte, insensible a la casse, pour le meme univers) a deja ete
sauvegardee, l'API renvoie une erreur 409 et le bouton affiche "Deja sauvegardee" au lieu de
dupliquer la ligne. Cette regle est doublement appliquee : verification cote route avant
l'insertion, et index unique en base ([sql/005_create_idees.sql](sql/005_create_idees.sql))
comme filet de securite si deux clics partent en meme temps.

La page **Mes idees** (`idees.html`) liste toutes les idees sauvegardees en 3 colonnes (A
explorer / En cours / Publie). Pour chaque idee : un menu deroulant pour changer son statut, et
un bouton Supprimer (avec confirmation).

## Notes sur les sources

- **Google Trends** (`google-trends-api`) : requetes associees (top + en hausse) pour `geo=FR`
  et `geo=SN`. Google Trends peut renvoyer une erreur ou un tableau vide pour un mot-cle a
  faible volume de recherche, ou etre bloque par Google (page HTML au lieu de JSON) : c'est
  gere sans planter l'app, le service ignore l'erreur et continue.
- **Suggestions Google** : appel direct a
  `http://suggestqueries.google.com/complete/search?client=firefox&hl=fr&q=<motcle>`,
  endpoint public non officiel de Google (peut changer sans preavis).
- **Reddit** : appel direct a `https://www.reddit.com/search.json?q=<motcle>&sort=relevance&limit=25`,
  avec un header `User-Agent` personnalise (obligatoire, Reddit rejette les requetes sans
  User-Agent distinct). En cas de rate-limit (429) ou d'erreur, la source est ignoree pour ce
  mot-cle sans planter l'app.
- **YouTube** (YouTube Data API v3, endpoint `search`) : necessite `YOUTUBE_API_KEY` (voir
  etape 4 ci-dessus). Sans cle, ou en cas de quota depasse/cle invalide, la source est ignoree
  (log d'avertissement) et les autres sources continuent de fonctionner.
