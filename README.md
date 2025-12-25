# Copyfy Remake - Plateforme d'Outils IA pour E-commerce

Application Next.js 15 moderne avec shadcn/ui et TypeScript pour gérer des outils IA destinés à l'e-commerce.

## 🚀 Fonctionnalités

- ✅ **Next.js 15** - Framework React avec App Router
- ✅ **TypeScript** - Typage statique pour plus de sécurité
- ✅ **shadcn/ui** - Composants UI modernes et accessibles
- ✅ **Tailwind CSS** - Framework CSS utility-first
- ✅ **SCSS** - Styles personnalisés avec variables
- ✅ **Lucide Icons** - Icônes modernes et légères

## 📦 Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Lancer le serveur de développement**
```bash
npm run dev
```

3. **Ouvrir le navigateur**
Accédez à [http://localhost:3000](http://localhost:3000)

## 🏗️ Structure du Projet

```
copyfy-remake/
├── src/
│   ├── app/                  # Pages Next.js (App Router)
│   │   ├── dashboard/        # Pages du dashboard
│   │   ├── login/           # Page de connexion
│   │   ├── layout.tsx       # Layout racine
│   │   └── page.tsx         # Page d'accueil (redirect)
│   ├── components/          # Composants React
│   │   ├── ui/              # Composants shadcn/ui
│   │   ├── Sidebar.tsx      # Menu latéral du dashboard
│   │   └── DashboardHeader.tsx
│   ├── lib/                 # Utilitaires
│   │   └── utils.ts         # Fonctions helper
│   └── styles/              # Styles personnalisés
│       ├── variables.scss   # Variables SCSS
│       └── custom.scss      # Styles globaux
├── public/                  # Assets statiques
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

## 🎨 Pages

### Page de Connexion (`/login`)
- Authentification par email/mot de passe
- Connexion avec Google
- Design moderne avec fond en dégradé bleu
- Formulaire validé côté client

### Dashboard (`/dashboard`)
- Sidebar avec navigation complète
- Header avec statistiques et profil utilisateur
- Plan d'action vers la première vente
- Cartes promotionnelles (Shopify, Coaching, TikTok Ads)
- Système de badges (NEW, BETA)

## 🔧 Configuration

### Styles Personnalisés
Les styles sont organisés en SCSS avec des variables réutilisables dans `src/styles/`:
- `variables.scss` - Couleurs, espacements, ombres
- `custom.scss` - Classes utilitaires et composants

### Composants shadcn/ui
Configurés dans `components.json` avec les composants suivants:
- Button
- Input
- Card
- Avatar
- Dropdown Menu
- Tabs

## 📝 Logo

Le logo doit être placé dans le dossier `public/` et peut être intégré en remplaçant les placeholders dans:
- `src/app/login/page.tsx` (ligne 46)
- `src/components/Sidebar.tsx` (ligne 85)

## 🚧 À Venir

- [ ] Authentification complète avec NextAuth.js
- [ ] Intégration API backend Python (IA)
- [ ] Pages de détails pour chaque section
- [ ] Système de notifications
- [ ] Gestion des abonnements

## 📜 Scripts Disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Compile l'application pour la production
- `npm run start` - Lance le serveur de production
- `npm run lint` - Vérifie les erreurs de linting

## 🌐 Déploiement

Le projet peut être déployé sur Vercel avec un simple push Git:

```bash
# Connectez votre repository Git à Vercel
vercel
```

## 📄 Licence

Propriétaire - Tous droits réservés

---

Développé avec ❤️ pour optimiser l'e-commerce avec l'IA



