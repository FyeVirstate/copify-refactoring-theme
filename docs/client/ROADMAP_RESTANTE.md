# 🗺️ Roadmap - Ce qu'il reste à faire

> **Vision claire** de ce qui doit encore être développé pour finaliser la migration de Copyfy.

---

## 📊 Vue d'ensemble

```
Terminé       ████████████████████░░░░  ~85%
En attente    ████░░░░░░░░░░░░░░░░░░░░  ~15%
```

---

## 🎯 Priorités de développement

| Priorité | Fonctionnalité | Effort estimé | Statut |
|----------|----------------|---------------|--------|
| 🔴 **P1** | Boutique IA | Important | En attente de refactoring Laravel |
| 🟠 **P2** | Génération Vidéo | Moyen | Interface prête, backend à connecter |
| 🟡 **P3** | Export Produits | Moyen | Partiellement fait |
| 🟢 **P4** | Fonctionnalités secondaires | Faible | À planifier |

---

## 🔴 PRIORITÉ 1 : Boutique IA (Gros Chantier)

### Qu'est-ce que c'est ?

La fonctionnalité **Boutique IA** permet de générer automatiquement une boutique Shopify complète à partir d'un simple lien produit (AliExpress ou Amazon).

C'est l'une des fonctionnalités **les plus puissantes** de Copyfy : l'utilisateur donne un lien, et l'IA crée tout :
- Le nom de la boutique
- Le logo
- Les pages produits
- Les descriptions
- Les images optimisées
- La structure du site

### Pourquoi c'est en attente ?

> ⚠️ **Cette fonctionnalité est actuellement en cours de refactoring côté Laravel** (ancienne version).
> 
> L'équipe Laravel est en train de **reconstruire entièrement** cette fonctionnalité pour la rendre plus performante et plus fiable.
> 
> **Notre stratégie** : Attendre que cette nouvelle version soit finalisée pour la migrer directement vers Next.js. Cela évite de :
> 1. Migrer une version obsolète
> 2. Faire le travail deux fois
> 3. Risquer des incohérences

### Ce qui est déjà prêt côté Next.js

| Élément | Statut |
|---------|--------|
| Page d'interface utilisateur | ✅ Créée (placeholder) |
| Structure de la page | ✅ En place |
| Système de crédits | ✅ Fonctionnel |
| Historique des générations | 🔄 Structure prête |

### Ce qui sera à faire une fois le refactoring Laravel terminé

1. **Récupérer la nouvelle logique** depuis Laravel
2. **Adapter les APIs** pour Next.js
3. **Connecter l'interface** avec le backend
4. **Tester** la génération complète
5. **Optimiser** les performances

### Timeline estimée

```
Refactoring Laravel    ████████████░░░░  En cours (équipe Laravel)
Migration Next.js      ░░░░░░░░░░░░░░░░  À venir
Tests & Déploiement    ░░░░░░░░░░░░░░░░  À venir
```

---

## 🟠 PRIORITÉ 2 : Génération Vidéo Créatives

### Qu'est-ce que c'est ?

Création de vidéos publicitaires avec l'IA, spécialement conçues pour les publicités Facebook/TikTok.

### État actuel

| Élément | Statut |
|---------|--------|
| Interface utilisateur | ✅ Créée |
| Sélection de langue | ✅ Fonctionnel |
| Upload de produit | ✅ En place |
| Connexion avec Hoox (service vidéo) | ❌ À faire |
| Historique des vidéos | 🔄 Structure prête |

### Ce qui reste à faire

1. **Connecter le service Hoox** (API de génération vidéo)
2. **Implémenter le webhook** pour récupérer les vidéos générées
3. **Afficher l'historique** des vidéos de l'utilisateur
4. **Gérer les crédits** vidéo

### Effort estimé
- Développement : 2-3 jours
- Tests : 1 jour

---

## 🟡 PRIORITÉ 3 : Export de Produits

### Qu'est-ce que c'est ?

Permettre aux utilisateurs d'exporter des produits directement vers leur boutique Shopify connectée.

### État actuel

| Élément | Statut |
|---------|--------|
| Interface utilisateur | ✅ Créée |
| Sélection de langue | ✅ Fonctionnel |
| Connexion Shopify OAuth | ✅ Fonctionnel |
| API d'export | 🔄 Partiellement fait |
| Historique des exports | 🔄 Structure prête |

### Ce qui reste à faire

1. **Finaliser l'API d'export** vers Shopify
2. **Gérer les images** (téléchargement et upload)
3. **Traduction automatique** des descriptions
4. **Gestion des erreurs** (produit déjà existant, etc.)

### Effort estimé
- Développement : 2 jours
- Tests : 1 jour

---

## 🟢 PRIORITÉ 4 : Fonctionnalités Secondaires

Ces fonctionnalités sont moins prioritaires mais devront être complétées :

### 4.1 Formations / Cours

| Élément | Statut |
|---------|--------|
| Page de liste des cours | ✅ Créée |
| Contenu des cours | ❌ À intégrer |
| Lecteur vidéo | ❌ À ajouter |

**Effort** : 1-2 jours (principalement du contenu)

---

### 4.2 Fournisseurs (AutoDS / Zendrop)

| Élément | Statut |
|---------|--------|
| Page d'interface | ✅ Placeholder |
| Intégration AutoDS | ❌ À faire |
| Intégration Zendrop | ❌ À faire |

**Effort** : 2-3 jours

---

### 4.3 Diagnostic de Funnel

| Élément | Statut |
|---------|--------|
| Interface | ❌ À créer |
| Logique d'analyse | ❌ À migrer |

**Effort** : 3-4 jours

---

### 4.4 Support / Chat

| Élément | Statut |
|---------|--------|
| Widget de chat | ❌ À intégrer |
| Base de connaissances | ❌ À créer |

**Effort** : 1-2 jours (intégration d'un outil externe)

---

## 📅 Planning Suggéré

### Phase 1 : Priorités immédiates (1-2 semaines)
- [ ] Finaliser la Génération Vidéo
- [ ] Compléter l'Export de Produits

### Phase 2 : Boutique IA (2-4 semaines)
- [ ] Attendre fin du refactoring Laravel
- [ ] Migrer vers Next.js
- [ ] Tests approfondis

### Phase 3 : Fonctionnalités secondaires (1-2 semaines)
- [ ] Formations
- [ ] Fournisseurs
- [ ] Diagnostic Funnel
- [ ] Support

### Phase 4 : Finalisation (1 semaine)
- [ ] Tests utilisateurs
- [ ] Corrections de bugs
- [ ] Optimisations performances
- [ ] Déploiement final

---

## 🔍 Points d'attention

### Dépendances externes

| Service | Utilisation | Statut |
|---------|-------------|--------|
| **Stripe** | Paiements | ✅ Connecté |
| **Replicate** | Génération images | ✅ Connecté |
| **Hoox** | Génération vidéo | 🔄 À connecter |
| **Shopify** | Export produits | ✅ OAuth prêt |
| **AutoDS** | Fournisseurs | ❌ À intégrer |
| **Zendrop** | Fournisseurs | ❌ À intégrer |

### Base de données

La structure de la base de données est **100% prête** pour toutes les fonctionnalités. Aucune modification majeure n'est nécessaire.

---

## ✅ Critères de validation finale

Avant de considérer la migration comme **terminée**, tous ces points doivent être validés :

- [ ] Toutes les fonctionnalités de l'ancienne version sont disponibles
- [ ] Les performances sont équivalentes ou meilleures
- [ ] L'interface est responsive sur tous les appareils
- [ ] Les paiements fonctionnent correctement
- [ ] Les données utilisateurs sont préservées
- [ ] Aucune régression fonctionnelle

---

## 📞 Questions fréquentes

### "Quand sera disponible la Boutique IA ?"

Dès que l'équipe Laravel aura terminé le refactoring de leur côté. Nous sommes en attente active et prêts à migrer dès que possible.

### "Peut-on déjà utiliser la nouvelle version ?"

Oui, la majorité des fonctionnalités sont opérationnelles. Seules quelques fonctionnalités avancées sont encore en développement.

### "Les données seront-elles conservées ?"

Oui, toutes les données utilisateurs, abonnements, et historiques seront préservés lors de la migration finale.

---

## 📈 Indicateurs de suivi

| Métrique | Objectif | Actuel |
|----------|----------|--------|
| Pages migrées | 21 | 18 |
| APIs fonctionnelles | 28 | 25 |
| Tests passants | 100% | En cours |
| Couverture mobile | 100% | 100% |

---

*Document mis à jour le : Décembre 2024*

*Pour toute question, contactez l'équipe de développement.*
