# Merveille Mode & Élégance

Boutique de mode (chaussures, vêtements, sacs, perruques, accessoires, beauté).

- **Application mobile** : React Native (Expo SDK 54, Expo Router, TypeScript).
- **API** : Node.js 22 + Express (dossier `backend/`).
- **Base de données** : **PostgreSQL 16** (Docker).
- **Couleurs** : noir, blanc et beige sable, en thème clair et sombre.

## Fonctionnalités
- **Visiteur sans compte** : voit seulement quelques articles « aperçu » (6 au départ), plus des vignettes floutées « Réservé aux membres ». Le bouton **Se connecter à l'application** apparaît dans l'accueil, la boutique et en bas des listes. La restriction est appliquée **par le serveur** : l'API ne renvoie jamais les autres articles à un visiteur.
- **Connexion / inscription** : e-mail + mot de passe, ou compte Google. Les mots de passe sont hachés (bcrypt) ; la session est un jeton gardé dans le stockage sécurisé du téléphone.
- **Catalogue** : recherche, catégories, tri par prix, promotions, fiche produit (galerie, tailles), favoris, panier.
- **Paramètres** : langue FR/EN, photo de profil, clair/sombre/système, moyen de paiement préféré.
- **Commande** : choix MTN MoMo / Orange Money / carte, puis message WhatsApp prérempli vers la boutique (voir « Paiement »).
- **Tableau de bord administrateur** : prix et promotions, ajout/modification/suppression d'articles avec **import d'images**, stock, tailles, nouveautés, publication, « aperçu visiteurs ».

## 1. Lancer le backend (PostgreSQL 16 + API) avec Docker
```bash
cp backend/.env.example backend/.env
# Éditez backend/.env : mot de passe PostgreSQL (aussi dans DATABASE_URL) et JWT_SECRET (openssl rand -base64 48)
docker compose up -d --build
curl http://localhost:3000/health        # -> {"ok":true}
```
À la **première** création, PostgreSQL exécute `backend/db/01-schema.sql` (tables) puis `02-seed.sql` (59 articles de départ, dont 6 en aperçu visiteurs). Les données vivent dans les volumes Docker `pgdata` (base) et `uploads` (images importées).

**Premier administrateur** : inscrivez-vous d'abord dans l'application, puis :
```bash
docker compose exec api node scripts/make-admin.js votre-email@exemple.com
```
Reconnectez-vous : « Tableau de bord administrateur » apparaît dans l'onglet Compte.

**Sauvegarde / restauration** :
```bash
docker compose exec db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > sauvegarde.sql
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' < sauvegarde.sql
```
Sans Docker : installez PostgreSQL 16, créez la base, exécutez les deux fichiers de `backend/db/`, puis `cd backend && npm install && node --env-file=.env src/server.js`.

## 2. Lancer l'application mobile
```bash
cp .env.example .env     # puis renseignez EXPO_PUBLIC_API_URL
npm install
npx expo install --fix   # aligne les versions sur votre SDK Expo
npx expo start
npx expo export --platform web --clear
```
`EXPO_PUBLIC_API_URL` : émulateur Android `http://10.0.2.2:3000` ; téléphone réel sur le même Wi-Fi `http://IP-DE-VOTRE-PC:3000`.

## 3. Connexion Google (facultatif)
1. Google Cloud Console > APIs & Services > Credentials : créez des identifiants OAuth 2.0 (types **Web**, **Android** avec le package `com.merveille.modeelegance` + empreinte SHA-1, et **iOS** avec le bundle `com.merveille.modeelegance`).
2. Mettez ces identifiants dans `.env` (`EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`) **et** la liste complète séparée par des virgules dans `backend/.env` (`GOOGLE_CLIENT_IDS`) : le serveur vérifie chaque jeton Google.
3. La connexion Google nécessite un build de développement (`npx expo run:android` ou EAS), pas Expo Go.
Sans ces réglages, le bouton Google affiche « Google n'est pas configuré » ; la connexion par e-mail fonctionne toujours.

## Mise en production
- Placez l'API derrière **HTTPS** (Caddy ou Nginx + Let's Encrypt), mettez `TRUST_PROXY=1`, et utilisez `https://…` dans `EXPO_PUBLIC_API_URL` : Android refuse le HTTP simple dans une application publiée.
- Ne publiez jamais le port 5432 de PostgreSQL. Changez les secrets d'exemple. Faites des sauvegardes régulières.
- Build mobile : `eas build --profile preview --platform android`.

## Paiement — ce qui est réel et ce qui ne l'est pas
Le moyen choisi (MTN MoMo, Orange Money ou carte) et le numéro Mobile Money sont transmis dans la commande WhatsApp ; la boutique finalise le paiement avec le client. **L'application ne débite rien et ne confirme aucune commande automatiquement** : cela exige un contrat avec un agrégateur (Campay, CinetPay, Flutterwave, NotchPay…) et un service serveur qui garde les clés secrètes. Aucune donnée de carte n'est collectée ni stockée. Quand vous aurez choisi un agrégateur, l'étape se branche dans `backend/` (route de paiement) et `app/(tabs)/cart.tsx`.

## Personnaliser
- Couleurs clair/sombre et polices : `src/theme.ts`. Textes FR/EN : `src/i18n.ts`. Catégories : `src/config.ts` (et la contrainte `category` de `backend/db/01-schema.sql`).
- Les **prix des articles de départ sont provisoires** : ajustez-les depuis le tableau de bord.
- Les noms/descriptions d'articles restent dans la langue saisie par l'administrateur.

## Structure
```
app/              écrans (Expo Router) : (auth), (tabs), product/[id], settings, admin/
src/              store (Zustand), composants, thème, i18n, client API
backend/          API Express + Dockerfile + db/ (schéma et données PostgreSQL 16)
docker-compose.yml  PostgreSQL 16 + API
```
