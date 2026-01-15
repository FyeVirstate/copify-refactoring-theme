# TRIER (Sort) Filter - Documentation

## Vue d'ensemble

Le filtre **TRIER** permet de trier les produits selon differents criteres. Il fonctionne avec un **ordre** (croissant/decroissant) controle par le bouton fleche.

---

## Options de tri disponibles

| Option | Valeur API | Icone | Description | Colonne DB |
|--------|------------|-------|-------------|------------|
| **Pertinence** | `recommended` | `ri-sparkling-line` | Algorithme IA combinant plusieurs facteurs | Score calcule |
| **Chiffre d'affaires** | `estimated_monthly` | `ri-money-euro-circle-line` | Revenus mensuels estimes | `estimated_monthly` |
| **Commandes** | `estimated_order` | `ri-shopping-cart-line` | Nombre de commandes estimees | `estimated_order` |
| **Trafic** | `last_month_visits` | `ri-line-chart-line` | Visiteurs du mois dernier | `last_month_visits` |
| **Croissance** | `growth_rate` | `ri-arrow-up-circle-line` | Taux de croissance du trafic | `growth_rate` |
| **Publicites actives** | `active_ads_count` | `ri-advertisement-line` | Nombre de pubs actives | `active_ads_count` |
| **Prix** | `price` | `ri-price-tag-3-line` | Prix du produit | `price` |
| **Date d'ajout** | `created_at` | `ri-calendar-line` | Date de creation | `created_at` |

---

## Paramètres API

### URL de l'API
```
GET /api/products?sortBy={value}&sortOrder={asc|desc}
```

### Paramètres

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `sortBy` | string | `recommended` | Critère de tri |
| `sortOrder` | string | `desc` | Direction: `asc` (croissant) ou `desc` (décroissant) |

### Exemple de requête
```
/api/products?page=1&perPage=25&sortBy=estimated_monthly&sortOrder=desc
```

---

## Requêtes SQL générées

### 1. Pertinence (`recommended`)
```sql
ORDER BY (
  COALESCE(growth_rate, 0) * 0.3 + 
  COALESCE(active_ads_count, 0) * 10000 + 
  COALESCE(estimated_order, 0) * 0.1 + 
  (MOD(ABS(HASHTEXT(product_handle || '{dailySeed}')), 50000))
) DESC
```
**Explication**: Score combiné basé sur:
- Croissance (30% poids)
- Publicités actives (poids élevé)
- Commandes (10% poids)
- Variation quotidienne (seed daily pour diversité)

### 2. Chiffre d'affaires (`estimated_monthly`)
```sql
ORDER BY COALESCE(estimated_monthly, 0) DESC  -- ou ASC si sortOrder=asc
```

### 3. Commandes (`estimated_order`)
```sql
ORDER BY COALESCE(estimated_order, 0) DESC
```

### 4. Trafic (`last_month_visits`)
```sql
ORDER BY COALESCE(last_month_visits, 0) DESC
```

### 5. Croissance (`growth_rate`)
```sql
ORDER BY COALESCE(growth_rate, 0) DESC
```

### 6. Publicités actives (`active_ads_count`)
```sql
ORDER BY COALESCE(active_ads_count, 0) DESC
```

### 7. Prix (`price`)
```sql
ORDER BY COALESCE(price, 0) DESC  -- ou ASC
```

### 8. Date d'ajout (`created_at`)
```sql
ORDER BY created_at DESC  -- ou ASC
```

---

## Table utilisée

Les données proviennent de la **vue matérialisée** `top_products_materialized`:

```sql
SELECT 
  id, title, product_handle, shop_id, price, img_src,
  shop_url, currency, country, active_ads_count,
  estimated_order, last_month_visits, estimated_monthly,
  growth_rate, created_at
FROM top_products_materialized m
-- JOINs conditionnels si filtres spécifiques actifs
LEFT JOIN shops s ON m.shop_id = s.id  -- si pixels/themes/apps filter
LEFT JOIN traffic t ON m.shop_id = t.shop_id  -- si socialNetworks filter
WHERE ...
ORDER BY {sortByClause}
LIMIT {perPage} OFFSET {offset}
```

---

## Bouton Ordre

| Etat | Icone | Comportement |
|------|-------|--------------|
| **Decroissant** | `ri-sort-desc` | Du plus grand au plus petit |
| **Croissant** | `ri-sort-asc` | Du plus petit au plus grand |

### Comportement par defaut selon le tri

| Tri | Ordre par defaut | Logique |
|-----|------------------|---------|
| Pertinence | DESC | Meilleurs scores en premier |
| Chiffre d'affaires | DESC | Plus gros revenus en premier |
| Commandes | DESC | Plus de commandes en premier |
| Trafic | DESC | Plus de visiteurs en premier |
| Croissance | DESC | Meilleure croissance en premier |
| Publicites | DESC | Plus de pubs en premier |
| Prix | DESC | Plus cher en premier |
| Date | DESC | Plus recent en premier |

---

## Flux de données

```
[UI] User clique sur option tri
         ↓
[State] setSortBy(value) + setPage(1)
         ↓
[Hook] useProducts() détecte changement dans filters
         ↓
[Query] TanStack Query fait GET /api/products?sortBy=...&sortOrder=...
         ↓
[API] Construit ORDER BY clause selon sortBy + sortOrder
         ↓
[DB] PostgreSQL exécute sur top_products_materialized
         ↓
[Response] JSON avec produits triés
         ↓
[UI] Affichage mis à jour
```

---

## Code Frontend

### État
```typescript
const [sortBy, setSortBy] = useState("recommended");
const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
```

### Filters object
```typescript
const filters = useMemo((): ProductsFilters => {
  const f: ProductsFilters = { sortBy, sortOrder };
  // ... autres filtres
  return f;
}, [sortBy, sortOrder, ...]);
```

### UI
```tsx
<select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
  {SORT_OPTIONS.map(option => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>

<button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}>
  {sortOrder === 'desc' ? '↓' : '↑'}
</button>
```

---

## Performance

- **Table source**: `top_products_materialized` (~373k lignes vs 44M raw)
- **Cache count**: Résultats de COUNT mis en cache 30s
- **Pagination**: LIMIT/OFFSET pour charges réduites
- **Index utilisés**: Les colonnes de tri ont des index
