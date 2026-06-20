# RiftLens — Ce qu'il reste à faire

Dernière mise à jour : 2026-06-20

---

## 🔴 1. Bloquant immédiat — appliquer la migration DB

Sans ça, rien ne se persiste (LP chart vide, compteurs champions limités, rang moyen
limité à 3 parties).

1. Supabase → **SQL Editor**.
2. Coller + exécuter le contenu de `packages/db/migrations/0001_many_dragon_lord.sql`.
3. Vercel → **Redeploy** (le code est déjà poussé).
4. Visiter ton profil **2-3 fois** : l'ingestion accumule (~20 parties/visite). Les
   compteurs champions, le rang moyen (jusqu'à 20 parties) et les points LP se remplissent.

> Vérif rapide après migration : `select count(*) from summoner_matches;` doit augmenter
> à chaque visite de profil.

---

## 🟢 2. Avant d'ouvrir l'app à d'autres que toi (clé API prod)

La **dev key** (20 req/s) n'est légalement valable que pour **toi seul**. Dès qu'un ami
accède à l'app, il faut une **production key** (review Riot 2–4 semaines).

Prérequis à réunir pour la soumission sur developer.riotgames.com :

- [ ] **Prototype déployé** et accessible (Vercel) — ✅ presque, finir le build produit.
- [ ] **Privacy Policy** (URL publique) — à rédiger (cf. §4).
- [ ] **Terms of Service** (URL publique) — à rédiger.
- [ ] **Description des endpoints** utilisés :
  - `account-v1` (by-riot-id, by-puuid)
  - `summoner-v4` (by-puuid)
  - `league-v4` (entries/by-puuid)
  - `match-v5` (ids by-puuid, match detail)
  - `spectator-v5` (live game) si activé
- [ ] **App Note** expliquant :
  - le « rang moyen des parties » = médiane des **rangs publics** league-v4, **pas** un
    MMR caché (sinon refus pour « alternative au classement officiel »).
  - le buddy panel adverse = angle **self-improvement** (adapter sa stratégie).
- [ ] **Démo du rate limiting** : p-queue déjà en place (`packages/riot-api/src/client.ts`). ✅
- [ ] **Clé jamais exposée client** : déjà OK (uniquement route handlers / server). ✅
- [ ] **App 100 % gratuite** : déjà OK (aucun premium en code). ✅
- [ ] **Tags non-shaming** : déjà OK (tilting/smurf-risk retirés). ✅

---

## 🟡 3. Build produit — features incomplètes

### Pages vides (placeholders 8 lignes)
- [ ] **Leaderboard** (`app/(dashboard)/leaderboard/page.tsx`) : nécessite
  `league-v4/challengerleagues|grandmasterleagues|masterleagues` + stockage. Sinon
  laisser un « bientôt disponible ».
- [ ] **Champions** (page) (`app/(dashboard)/champions/page.tsx`) : réutiliser
  `getChampionStats` agrégé sur plus de parties.

### Profil — éléments de la maquette pas encore branchés
- [ ] **LP Chart** : se remplit via les snapshots (après migration). Vérifier le rendu réel.
- [ ] **Peak saison** : déductible des `lp_snapshots` (max value) — à afficher dans la RankedCard.
- [ ] **Historique des saisons** : ⚠️ **impossible** de backfiller (Riot n'expose pas le
  passé). Table `rank_history` prête pour archiver les fins de saison **à partir de maintenant**.
- [ ] **Rang ladder (#/top %)**, **MMR numérique**, **+/- LP par partie**, **score/placement
  par match** : non fournis par Riot. À retirer définitivement de la maquette ou approximer.
- [ ] **Ranked Flex card** (la maquette montre Solo **et** Flex côte à côte) : ajouter une
  carte Flex à côté de la Solo/Duo.

### Feature « Déjà joué avec/contre »
- [ ] Le hook `usePreviouslyPlayed` existe + testé mais **n'est monté nulle part** dans le
  web. À brancher (les données viennent de `match_participants`, déjà ingéré).

### Champions — représentativité
- [ ] Les compteurs deviennent fiables au fur et à mesure que la DB se remplit. Pour couvrir
  une **saison entière** d'un coup, prévoir un **backfill complet** (job qui ingère tous les
  matchs classés de la saison, pas seulement 20/visite).

---

## 🟡 4. Légal / rédactionnel (toi, pas du code)

- [ ] **Privacy Policy** : ce que l'app stocke (puuid, riot id, rangs, matchs classés,
  snapshots LP), pourquoi, durée de conservation, contact, suppression sur demande.
- [ ] **Terms of Service** : usage, disclaimer Riot (« RiftLens isn't endorsed by Riot
  Games… »), pas de garantie, gratuité.
- [ ] Héberger les deux à une **URL publique** (ex. `/privacy`, `/terms`).

---

## 🔵 5. Dette technique / vérifications

- [ ] **Tester l'ingestion DB en vrai** : aucun code DB n'a été testé localement (pas de
  `DATABASE_URL`). Après migration, vérifier ingestion + lectures (champion-stats,
  lp-history, average-rank).
- [ ] **Rate limiting sous charge** : l'ingestion (jusqu'à 20 getMatch/visite) + champion
  stats + average-rank peuvent s'approcher du quota dev (100 req/2min). Surveiller les 429 ;
  le cache DB amortit au fil du temps.
- [ ] **Desktop (Tauri)** : overlay / champ-select / rune importer présents mais **non
  vérifiés fonctionnellement**.
- [ ] **Better Auth** : login + callback présents, flux end-to-end **non vérifié**.
- [ ] **Clé dev expire toutes les 24 h** → 403. Régénérer, ou passer en prod key.

---

## 🟣 6. Demandé — encore à faire (gros morceaux)

- [ ] **Connexion Riot (RSO)** : login « via Riot » = Riot Sign-On, **nécessite une
  approbation Riot séparée** + enregistrement d'un client OAuth (redirect URI, scopes).
  À préparer comme provider Better Auth, activable seulement après accord Riot. Tant que ce
  n'est pas approuvé, garder le login actuel.
- [ ] **Onglet Détails — build/skill order** : ordre d'achat d'objets **horodaté** et ordre de
  montée des sorts viennent de `match-v5/{matchId}/timeline` (appel séparé, lourd). À ajouter :
  endpoint timeline + parsing des events ITEM_PURCHASED / SKILL_LEVEL_UP.
- [ ] **Panel « joueurs croisés »** : « les 5 derniers croisés plusieurs fois » avec WR.
  Données dans `match_participants` (déjà ingéré) — agréger par puuid rencontré ≥2 fois,
  WR avec/contre. Nécessite la DB peuplée (migration appliquée).
- [ ] **Performances par rôle** (panel sidebar comme DPM : parties + WR par rôle). Agrégeable
  depuis `summoner_matches` (champ `position` à stocker — actuellement non persisté ; l'ajouter).
- [ ] **Icônes de pings** : actuellement le breakdown affiche les **libellés + compteurs**.
  Pour les icônes CDN, mapper chaque type de ping vers `assets/ux/pings/…` (chemins à fiabiliser).

## ✅ Déjà fait

- Recherche enrichie (icône/niveau/rang), profil (header, rang, historique, champions
  Total/Solo/Flex, rang moyen des parties).
- Vraies icônes Community Dragon, badge région coloré (NA…).
- Filtres jour/session/all, pagination « voir plus ».
- Schéma + migration DB (lp_snapshots, rank_history, cache rang, queue_id).
- Conformité policy Riot : gratuit, tags non-shaming, clé serveur, agrégation de rangs publics.
- Fixes API : IDs chiffrés optionnels, pseudos spéciaux, chemins CDN icônes.
- Détail de partie en 3 onglets (Général objets/sorts/runes, Détails stats+pings, Runes).
- Score de carry par partie, filtre historique par rôle, backfill saison + bouton Actualiser.
