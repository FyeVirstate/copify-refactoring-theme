# Guide d'Installation - Copyfy Remake

## 🚀 Démarrage Rapide

### 1. Installation des dépendances

```bash
npm install
```

### 2. Lancement du serveur de développement

```bash
npm run dev
```

Le site sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📋 Ce qui a été créé

### ✅ Structure Next.js 15
- **App Router** avec TypeScript
- **shadcn/ui** pour les composants
- **Tailwind CSS** + **SCSS** pour les styles
- **Lucide Icons** pour les icônes

### ✅ Pages créées

1. **Page de Login** (`/login`)
   - Authentification email/mot de passe
   - Connexion Google
   - Design moderne avec fond dégradé bleu

2. **Page d'Inscription** (`/register`)
   - Formulaire d'inscription complet
   - Connexion Google
   - Validation côté client

3. **Dashboard** (`/dashboard`)
   - Sidebar avec navigation complète
   - Header avec statistiques
   - Plan d'action interactif
   - Cartes promotionnelles

### ✅ Composants

- **Sidebar** - Menu latéral du dashboard avec badges (NEW, BETA)
- **DashboardHeader** - En-tête avec profil et stats
- **shadcn/ui components** - Button, Input, Card, Avatar, Dropdown, Tabs

### ✅ Styles

Les styles ont été **recodés en SCSS** et organisés en:
- `src/styles/variables.scss` - Variables réutilisables
- `src/styles/custom.scss` - Classes et composants personnalisés
- `src/app/globals.css` - Styles Tailwind et variables CSS

> ⚠️ **Les anciens fichiers CSS ont été supprimés** (app.css, bootstrap.min.css, bootstrap-select.min.css)

## 🎨 Ajouter le Logo

Le logo peut être ajouté en remplaçant les placeholders dans:

1. **Login page** - `src/app/login/page.tsx` (ligne ~46)
2. **Register page** - `src/app/register/page.tsx` (ligne ~28)
3. **Sidebar** - `src/components/Sidebar.tsx` (ligne ~85)

### Exemple de remplacement:

```tsx
{/* Remplacer ceci */}
<div className="w-9 h-9 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
  <span className="text-white font-bold text-xl">C</span>
</div>

{/* Par votre logo */}
<img src="/logo.svg" alt="Copyfy" className="w-9 h-9" />
```

## 📁 Structure du Projet

```
copyfy-remake/
├── src/
│   ├── app/                    # Pages Next.js
│   │   ├── dashboard/          # Pages du dashboard
│   │   │   ├── layout.tsx      # Layout avec Sidebar
│   │   │   └── page.tsx        # Page principale
│   │   ├── login/              # Page de connexion
│   │   ├── register/           # Page d'inscription
│   │   ├── layout.tsx          # Layout racine
│   │   ├── globals.css         # Styles globaux
│   │   └── page.tsx            # Redirect vers /login
│   ├── components/             # Composants React
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── Sidebar.tsx         # Menu latéral
│   │   └── DashboardHeader.tsx # Header du dashboard
│   ├── lib/                    # Utilitaires
│   │   └── utils.ts            # Fonction cn() pour classes
│   └── styles/                 # Styles SCSS
│       ├── variables.scss      # Variables
│       └── custom.scss         # Classes personnalisées
├── public/                     # Fichiers statiques
├── package.json                # Dépendances
├── tailwind.config.ts          # Config Tailwind
├── tsconfig.json               # Config TypeScript
└── next.config.ts              # Config Next.js
```

## 🎯 Fonctionnalités Principales

### Login Page
- ✅ Formulaire email/mot de passe
- ✅ Bouton "Se connecter avec Google"
- ✅ Affichage/masquage du mot de passe
- ✅ Lien "Mot de passe oublié"
- ✅ Lien vers page d'inscription

### Dashboard
- ✅ Sidebar avec navigation complète
- ✅ Badges NEW et BETA sur certains items
- ✅ Section "Jours d'essai restants"
- ✅ Bouton "Formation E-Commerce"
- ✅ Header avec stats (Boutiques sauvées, Produits exportés, etc.)
- ✅ Plan d'action avec progression
- ✅ Cartes promotionnelles (Shopify, Coaching, TikTok)

### Design
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Animations et transitions fluides
- ✅ Palette de couleurs cohérente
- ✅ Composants réutilisables

## 🔧 Prochaines Étapes

1. **Ajouter le logo** aux emplacements indiqués ci-dessus
2. **Configurer l'authentification** (NextAuth.js recommandé)
3. **Connecter au backend Python** pour les fonctionnalités IA
4. **Créer les pages de détails** pour chaque section du dashboard
5. **Ajouter les fonctionnalités** (analyse boutique, export produits, etc.)

## 🛠️ Technologies Utilisées

- **Next.js 15.1.3** - Framework React
- **React 19** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS 3.4** - Framework CSS
- **shadcn/ui** - Composants UI
- **SCSS** - Préprocesseur CSS
- **Lucide React** - Icônes
- **Radix UI** - Composants accessibles

## 📝 Scripts Disponibles

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run start    # Serveur de production
npm run lint     # Vérification du code
```

## ⚙️ Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes:

```bash
# Base de données
DATABASE_URL="postgresql://..."

# Authentification
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optionnel)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe (Paiement)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Churnkey (Gestion des annulations)
# Obtenir sur https://app.churnkey.co/settings/developer
CHURNKEY_KEY="your-churnkey-hmac-key"          # HMAC key pour authentification
CHURNKEY_STATUS="live"                          # "live" ou "test"
NEXT_PUBLIC_CHURNKEY_APP_ID="your-app-id"       # App ID Churnkey (ex: 3t28ew8c6)

# Customer.io (Optionnel - tracking/emails)
CUSTOMER_IO_SITE_ID="your-site-id"
CUSTOMER_IO_API_KEY="your-api-key"

# Shopify (Intégration Shopify)
SHOPIFY_CLIENT_ID="your-shopify-client-id"
SHOPIFY_CLIENT_SECRET="your-shopify-client-secret"
SHOPIFY_SCOPES="read_products,write_products,read_orders"
```

### Configuration Churnkey

Churnkey est utilisé pour:
- **Intercepter les annulations** avec un flow de rétention
- **Gérer les paiements échoués** avec une wall de récupération
- **Détecter les pauses d'abonnement**

1. Connectez-vous à [Churnkey Dashboard](https://app.churnkey.co)
2. Allez dans Settings > Developer
3. Copiez votre **HMAC Key** → `CHURNKEY_KEY`
4. Copiez votre **App ID** → `NEXT_PUBLIC_CHURNKEY_APP_ID`
5. Définissez `CHURNKEY_STATUS` sur `test` pour les tests

## 🌟 Améliorations Futures

- [x] Authentification complète (JWT, sessions)
- [ ] Intégration API Python (IA)
- [x] Système de paiement (Stripe)
- [x] Gestion des abonnements (Churnkey)
- [ ] Notifications en temps réel
- [ ] Mode sombre
- [ ] Internationalisation (i18n)

---

**Projet prêt à l'emploi!** 🎉

Vous pouvez maintenant lancer `npm install` puis `npm run dev` pour voir votre application en action.



