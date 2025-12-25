# 🚀 Migration Copyfy - Full Next.js Stack

## 🎯 Vision & Architecture

**Objectif:** Migrer 100% du code Laravel vers Next.js 15 avec une stack moderne et performante.

### **Stack Technique Finale**

```
Frontend + Backend: Next.js 15 (App Router)
├── React 19 (UI)
├── API Routes (Backend Logic)
├── Server Actions (Mutations)
├── Prisma ORM (Database)
├── PostgreSQL (Database)
├── NextAuth.js v5 (Authentication)
├── Stripe SDK (Payments)
├── Vercel/Railway (Hosting)
└── Redis/Upstash (Cache & Queues)
```

### **Pourquoi cette stack ?**

✅ **Une seule codebase** TypeScript  
✅ **Performance optimale** avec Server Components  
✅ **Déploiement simple** sur Vercel  
✅ **Type-safety complète** du frontend au backend  
✅ **Scalable** avec edge functions  
✅ **Coûts réduits** (pas de serveur PHP séparé)

---

## 📊 Mapping Laravel → Next.js

| Laravel | Next.js 15 Équivalent |
|---------|----------------------|
| Routes web.php | `app/*/page.tsx` |
| Routes api.php | `app/api/*/route.ts` |
| Controllers | API Routes + Server Actions |
| Models (Eloquent) | Prisma Models |
| Migrations | Prisma Migrations |
| Middleware | `middleware.ts` + Route Handlers |
| Blade Views | React Server Components |
| Validation | Zod Schemas |
| Queue Jobs | Vercel Cron / Inngest / QStash |
| Cache (Redis) | Upstash Redis / Vercel KV |
| Laravel Cashier | Stripe SDK direct |
| Socialite | NextAuth.js |
| Mail | Resend / SendGrid |

---

## 🗄️ Étape 1: Base de Données avec Prisma

### **1.1 Installation**

```bash
npm install prisma @prisma/client
npm install -D prisma

npx prisma init
```

### **1.2 Schema Prisma (basé sur ton Laravel)**

Créer `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USERS & AUTH
// ============================================

enum UserType {
  email
  Google
}

model User {
  id                        Int       @id @default(autoincrement())
  name                      String
  email                     String    @unique
  password                  String?   // Null pour Google users
  type                      UserType  @default(email)
  emailVerifiedAt           DateTime? @map("email_verified_at")
  
  // Profile
  lang                      String    @default("fr")
  utmSource                 String?   @map("utm_source")
  lastLogin                 DateTime? @map("last_login")
  isBanned                  Int       @default(0) @map("is_banned")
  
  // Tokens & Security
  rememberToken             String?   @map("remember_token")
  verifyToken               String?   @map("verify_token")
  backupCode                String?   @map("backup_code")
  cancelToken               String?   @map("cancel_token")
  magicLinkToken            String?   @map("magic_link_token")
  magicLinkExpiresAt        DateTime? @map("magic_link_expires_at")
  
  // Shopify Integration
  shopifyDomain             String?   @map("shopify_domain")
  shopifyAccessToken        String?   @map("shopify_access_token")
  shopifySetupCompleted     Boolean   @default(false) @map("shopify_setup_completed")
  
  // Credits & Balances
  balanceGenerateProduct    Int       @default(0) @map("balance_generate_product")
  balanceVideoGeneration    Int       @default(0) @map("balance_video_generation")
  balanceImageGeneration    Int       @default(0) @map("balance_image_generation")
  balanceProductExporter    Int       @default(0) @map("balance_product_exporter")
  balanceShopExporter       Int       @default(0) @map("balance_shop_exporter")
  balanceImportTheme        Int       @default(0) @map("balance_import_theme")
  
  // Subscription
  stripeCustomerId          String?   @unique @map("stripe_customer_id")
  startOfferDate            DateTime? @map("start_offer_date")
  nextCreditRenewalAt       DateTime? @map("next_credit_renewal_at")
  lastYearlyCreditAt        DateTime? @map("last_yearly_credit_at")
  
  // Timestamps
  createdAt                 DateTime  @default(now()) @map("created_at")
  updatedAt                 DateTime  @updatedAt @map("updated_at")
  deletedAt                 DateTime? @map("deleted_at")
  
  // Relations
  subscriptions             Subscription[]
  invoices                  Invoice[]
  savedSearches             SavedSearch[]
  favorites                 Favorite[]
  productExports            ProductExport[]
  themeExports              ThemeExport[]
  generateProducts          GenerateProduct[]
  generateStores            GenerateStore[]
  shopifyShops              ShopifyShop[]
  shopifyAdditionalStores   ShopifyAdditionalStore[]
  shopifyAppIntegrations    ShopifyAppIntegration[]
  licenseKeys               LicenseKey[]
  userDomains               UserDomain[]
  userShare                 UserShare?
  userResponse              UserResponse?
  funnelDiagnostics         FunnelDiagnostic[]
  userShops                 UserShop[]
  
  @@map("users")
}

// ============================================
// SUBSCRIPTIONS & BILLING
// ============================================

model Plan {
  id                      Int       @id @default(autoincrement())
  identifier              String    @unique
  title                   String
  titleFr                 String?   @map("title_fr")
  price                   Decimal   @db.Decimal(10, 2)
  
  // Stripe IDs
  stripeId                String?   @map("stripe_id")
  stripeIdEn              String?   @map("stripe_id_en")
  
  // Limits
  limitShopTracker        Int       @default(0) @map("limit_shop_tracker")
  limitProductTracker     Int       @default(0) @map("limit_product_tracker")
  limitProductExport      Int       @default(0) @map("limit_product_export")
  limitGenerateProduct    Int       @default(0) @map("limit_generate_product")
  limitVideoGeneration    Int       @default(0) @map("limit_video_generation")
  limitImageGeneration    Int       @default(0) @map("limit_image_generation")
  topShopsCount           Int       @default(0) @map("top_shops_count")
  topProductsCount        Int       @default(0) @map("top_products_count")
  topAdsCount             Int       @default(0) @map("top_ads_count")
  maxLicenses             Int       @default(0) @map("max_licenses")
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  subscriptions           Subscription[]
  
  @@map("plans")
}

enum SubscriptionStatus {
  active
  canceled
  incomplete
  incomplete_expired
  past_due
  trialing
  unpaid
}

model Subscription {
  id                      Int                  @id @default(autoincrement())
  userId                  Int                  @map("user_id")
  name                    String               // Plan identifier
  stripeId                String               @unique @map("stripe_id")
  stripeStatus            SubscriptionStatus   @map("stripe_status")
  stripePriceId           String?              @map("stripe_price_id")
  quantity                Int                  @default(1)
  trialEndsAt             DateTime?            @map("trial_ends_at")
  endsAt                  DateTime?            @map("ends_at")
  createdAt               DateTime             @default(now()) @map("created_at")
  updatedAt               DateTime             @updatedAt @map("updated_at")
  
  user                    User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan                    Plan?                @relation(fields: [name], references: [identifier])
  
  @@index([userId])
  @@map("subscriptions")
}

model Invoice {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  stripeInvoiceId         String    @unique @map("stripe_invoice_id")
  amount                  Decimal   @db.Decimal(10, 2)
  currency                String    @default("eur")
  status                  String
  hostedInvoiceUrl        String?   @map("hosted_invoice_url")
  invoicePdf              String?   @map("invoice_pdf")
  paidAt                  DateTime? @map("paid_at")
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("invoices")
}

// ============================================
// SHOPS & PRODUCTS
// ============================================

model Shop {
  id                      Int       @id @default(autoincrement())
  url                     String    @unique
  shopifyUrl              String?   @map("shopify_url")
  merchantName            String?   @map("merchant_name")
  screenshot              String?
  
  // Location
  locale                  String?
  country                 String?
  currency                String?
  
  // Tech Stack
  theme                   String?
  pixels                  String?   // JSON array
  apps                    String?   // JSON array
  fonts                   String?   // JSON array
  colors                  String?   // JSON array
  
  // Stats
  productsCount           Int       @default(0) @map("products_count")
  activeAds               Int       @default(0) @map("active_ads")
  allAds                  Int       @default(0) @map("all_ads")
  
  // Metadata
  disabled                Boolean   @default(false)
  shopScannedAt           DateTime? @map("shop_scanned_at")
  adsUpdatedAt            DateTime? @map("ads_updated_at")
  themeStyleUpdatedAt     DateTime? @map("theme_style_updated_at")
  whoisAt                 DateTime? @map("whois_at")
  
  // WhoisXML data
  whMd5                   String?   @map("wh_md5")
  whUpdatedAt             DateTime? @map("wh_updated_at")
  whStats                 String?   @map("wh_stats") // JSON
  
  // Facebook
  fbPageId                String?   @map("fb_page_id")
  
  token                   String?   @map("_token")
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  deletedAt               DateTime? @map("deleted_at")
  
  // Relations
  products                Product[]
  traffic                 Traffic[]
  ads                     FacebookAd[]
  userShops               UserShop[]
  shopifyShop             ShopifyShop?
  
  @@index([url])
  @@index([merchantName])
  @@index([country])
  @@index([activeAds])
  @@map("shops")
}

model UserShop {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  shopId                  Int       @map("shop_id")
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  shop                    Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  
  @@unique([userId, shopId])
  @@index([userId])
  @@index([shopId])
  @@map("user_shops")
}

model Product {
  id                      Int       @id @default(autoincrement())
  shopId                  Int       @map("shop_id")
  
  title                   String
  handle                  String
  bodyHtml                String?   @map("body_html") @db.Text
  vendor                  String?
  productType             String?   @map("product_type")
  tags                    String?   // JSON array
  
  publishedAt             DateTime? @map("published_at")
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  // Relations
  shop                    Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  images                  ProductImage[]
  variants                ProductVariant[]
  options                 ProductOption[]
  
  @@index([shopId])
  @@index([handle])
  @@map("products")
}

model ProductImage {
  id                      Int       @id @default(autoincrement())
  productId               Int       @map("product_id")
  src                     String
  position                Int       @default(0)
  width                   Int?
  height                  Int?
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  product                 Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([productId])
  @@map("product_images")
}

model ProductVariant {
  id                      Int       @id @default(autoincrement())
  productId               Int       @map("product_id")
  
  title                   String
  price                   Decimal   @db.Decimal(10, 2)
  compareAtPrice          Decimal?  @map("compare_at_price") @db.Decimal(10, 2)
  sku                     String?
  grams                   Int       @default(0)
  inventoryQuantity       Int       @default(0) @map("inventory_quantity")
  
  option1                 String?
  option2                 String?
  option3                 String?
  imageId                 Int?      @map("image_id")
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  product                 Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([productId])
  @@map("product_variants")
}

model ProductOption {
  id                      Int       @id @default(autoincrement())
  productId               Int       @map("product_id")
  
  name                    String
  position                Int
  values                  String    // JSON array
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  product                 Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([productId])
  @@map("product_options")
}

// ============================================
// FACEBOOK ADS
// ============================================

enum MediaType {
  image
  video
  carousel
  collection
}

model FacebookAd {
  id                      Int       @id @default(autoincrement())
  
  // Ad Identifiers
  adId                    String    @unique @map("ad_id")
  adCreativeId            String    @map("ad_creative_id")
  
  // Page Info
  pageId                  String    @map("page_id")
  pageName                String    @map("page_name")
  
  // Ad Content
  adCaption               String?   @map("ad_caption") @db.Text
  adLink                  String?   @map("ad_link")
  adCta                   String?   @map("ad_cta")
  adType                  String?   @map("ad_type")
  
  // Media
  mediaType               MediaType @default(image) @map("media_type")
  imageLink               String?   @map("image_link")
  videoLink               String?   @map("video_link")
  videoPreview            String?   @map("video_preview")
  
  // Dates
  firstSeenDate           DateTime  @map("first_seen_date")
  lastSeenDate            DateTime  @map("last_seen_date")
  
  // Targeting
  market                  String?   // JSON array of countries
  
  // Shop Association
  shopUrl                 String?   @map("shop_url")
  shopId                  Int?      @map("shop_id")
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  deletedAt               DateTime? @map("deleted_at")
  
  // Relations
  shop                    Shop?     @relation(fields: [shopId], references: [id], onDelete: SetNull)
  favorites               Favorite[]
  
  @@index([adId])
  @@index([adCreativeId])
  @@index([shopId])
  @@index([firstSeenDate])
  @@index([lastSeenDate])
  @@map("facebook_ads")
}

model Favorite {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  adId                    Int       @map("ad_id")
  createdAt               DateTime  @default(now()) @map("created_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  ad                      FacebookAd @relation(fields: [adId], references: [id], onDelete: Cascade)
  
  @@unique([userId, adId])
  @@index([userId])
  @@map("favorites")
}

// ============================================
// TRAFFIC DATA
// ============================================

model Traffic {
  id                      Int       @id @default(autoincrement())
  shopId                  Int       @map("shop_id")
  
  date                    DateTime
  visits                  BigInt    @default(0)
  uniqueVisitors          BigInt    @default(0) @map("unique_visitors")
  bounceRate              Decimal?  @map("bounce_rate") @db.Decimal(5, 2)
  pagesPerVisit           Decimal?  @map("pages_per_visit") @db.Decimal(5, 2)
  avgVisitDuration        Int?      @map("avg_visit_duration") // seconds
  
  // Traffic Sources
  social                  BigInt?   @default(0)
  direct                  BigInt?   @default(0)
  search                  BigInt?   @default(0)
  paid                    BigInt?   @default(0)
  referral                BigInt?   @default(0)
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  shop                    Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  
  @@unique([shopId, date])
  @@index([shopId])
  @@index([date])
  @@map("traffic")
}

// ============================================
// SHOPIFY INTEGRATION
// ============================================

model ShopifyShop {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  shopId                  Int?      @map("shop_id")
  
  domain                  String    @unique
  accessToken             String    @map("access_token")
  scope                   String?
  
  // Shop Info
  name                    String?
  email                   String?
  currency                String?
  timezone                String?
  
  installedAt             DateTime  @default(now()) @map("installed_at")
  uninstalledAt           DateTime? @map("uninstalled_at")
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  shop                    Shop?     @relation(fields: [shopId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@map("shopify_shops")
}

model ShopifyAdditionalStore {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  
  domain                  String
  accessToken             String    @map("access_token")
  isActive                Boolean   @default(true) @map("is_active")
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, domain])
  @@index([userId])
  @@map("shopify_additional_stores")
}

model ShopifyApp {
  id                      Int       @id @default(autoincrement())
  name                    String
  slug                    String    @unique
  description             String?   @db.Text
  icon                    String?
  url                     String?
  categories              String?   // JSON array
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  integrations            ShopifyAppIntegration[]
  
  @@map("shopify_apps")
}

model ShopifyAppIntegration {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  appId                   Int       @map("app_id")
  
  isActive                Boolean   @default(true) @map("is_active")
  config                  String?   @db.Text // JSON config
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  app                     ShopifyApp @relation(fields: [appId], references: [id], onDelete: Cascade)
  
  @@unique([userId, appId])
  @@index([userId])
  @@map("shopify_app_integrations")
}

// ============================================
// AI GENERATION
// ============================================

model GenerateProduct {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  
  prompt                  String    @db.Text
  productData             String    @db.Text // JSON
  status                  String    @default("pending")
  
  languageProductId       String?   @map("language_product_id")
  aiGeneratedImages       String?   @map("ai_generated_images") @db.Text // JSON
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("generate_products")
}

model GenerateStore {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  
  prompt                  String    @db.Text
  storeData               String?   @db.Text // JSON
  status                  String    @default("pending")
  
  licenseKeyId            Int?      @map("license_key_id")
  licenseUsed             Boolean   @default(false) @map("license_used")
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("generate_stores")
}

// ============================================
// EXPORTS
// ============================================

model ProductExport {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  
  productIds              String    @db.Text // JSON array
  format                  String    @default("csv")
  fileUrl                 String?   @map("file_url")
  status                  String    @default("pending")
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("product_exports")
}

model ThemeExport {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  
  shopUrl                 String    @map("shop_url")
  themeData               String?   @db.Text // JSON
  fileUrl                 String?   @map("file_url")
  status                  String    @default("pending")
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("theme_exports")
}

// ============================================
// SAVED SEARCHES & FILTERS
// ============================================

model SavedSearch {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  
  name                    String
  filters                 String    @db.Text // JSON
  type                    String    // 'ads', 'shops', 'products'
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("saved_searches")
}

// ============================================
// LICENSE KEYS
// ============================================

model LicenseKey {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  
  licenseKey              String    @unique @map("license_key")
  domain                  String?
  shopifyDomain           String?   @map("shopify_domain")
  
  isActive                Boolean   @default(true) @map("is_active")
  usedAt                  DateTime? @map("used_at")
  expiresAt               DateTime? @map("expires_at")
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([licenseKey])
  @@map("license_keys")
}

// ============================================
// USER DOMAINS
// ============================================

model UserDomain {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  
  domain                  String
  isActive                Boolean   @default(false) @map("is_active")
  isVerified              Boolean   @default(false) @map("is_verified")
  verificationToken       String?   @map("verification_token")
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, domain])
  @@index([userId])
  @@map("user_domains")
}

// ============================================
// MISC
// ============================================

model UserShare {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @unique @map("user_id")
  
  shareLink               String    @unique @map("share_link")
  clicks                  Int       @default(0)
  conversions             Int       @default(0)
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_shares")
}

model UserResponse {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @unique @map("user_id")
  
  response                String    @db.Text
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_responses")
}

model FunnelDiagnostic {
  id                      Int       @id @default(autoincrement())
  userId                  Int       @map("user_id")
  
  url                     String
  results                 String    @db.Text // JSON
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("funnel_diagnostics")
}

// ============================================
// CATEGORIES
// ============================================

model Category {
  id                      Int       @id @default(autoincrement())
  parentId                Int?      @map("parent_id")
  
  name                    String
  slug                    String    @unique
  description             String?   @db.Text
  icon                    String?
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  parent                  Category? @relation("CategoryToCategory", fields: [parentId], references: [id])
  children                Category[] @relation("CategoryToCategory")
  
  @@index([parentId])
  @@map("categories")
}

// ============================================
// TOP RANKS (Daily top shops/products)
// ============================================

model DailyTopShop {
  id                      Int       @id @default(autoincrement())
  
  shopUrl                 String    @map("shop_url")
  shopName                String?   @map("shop_name")
  rank                    Int
  date                    DateTime
  monthlyVisits           BigInt?   @map("monthly_visits")
  monthlyOrders           BigInt?   @map("monthly_orders")
  growthRate              Decimal?  @map("growth_rate") @db.Decimal(5, 2)
  whoisAt                 DateTime? @map("whois_at")
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  @@unique([shopUrl, date])
  @@index([date])
  @@index([rank])
  @@map("daily_top_shops")
}

model DailyTopProduct {
  id                      Int       @id @default(autoincrement())
  
  productHandle           String    @map("product_handle")
  productTitle            String    @map("product_title")
  shopUrl                 String    @map("shop_url")
  rank                    Int
  date                    DateTime
  
  price                   Decimal?  @db.Decimal(10, 2)
  compareAtPrice          Decimal?  @map("compare_at_price") @db.Decimal(10, 2)
  imageUrl                String?   @map("image_url")
  
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  
  @@unique([productHandle, date])
  @@index([date])
  @@index([rank])
  @@map("daily_top_products")
}
```

### **1.3 Générer le Client Prisma**

```bash
npx prisma generate
npx prisma db push  # Pour sync avec la DB
```

### **1.4 Client Prisma Singleton**

Créer `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## 🔐 Étape 2: Authentification avec NextAuth.js v5

### **2.1 Installation**

```bash
npm install next-auth@beta
npm install bcryptjs
npm install -D @types/bcryptjs
```

### **2.2 Configuration NextAuth**

Créer `src/lib/auth.ts`:

```typescript
import NextAuth, { DefaultSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      type: 'email' | 'Google';
      activePlan?: {
        identifier: string;
        title: string;
        limitGenerateProduct: number;
        // ... autres props
      };
      balanceGenerateProduct: number;
      balanceVideoGeneration: number;
      balanceImageGeneration: number;
      shopifyDomain: string | null;
      isOnTrial: boolean;
    } & DefaultSession["user"]
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password) {
          return null
        }

        // Check if Google-only account
        if (user.type === 'Google') {
          throw new Error('GOOGLE_ONLY_ACCOUNT')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // Pour Google OAuth
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })

        if (!existingUser) {
          // Créer nouveau user avec crédits trial
          const trialPlan = await prisma.plan.findUnique({
            where: { identifier: 'trial' }
          })

          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name!,
              type: 'Google',
              emailVerifiedAt: new Date(),
              balanceGenerateProduct: trialPlan?.limitGenerateProduct ?? 0,
              balanceVideoGeneration: trialPlan?.limitVideoGeneration ?? 0,
              balanceImageGeneration: trialPlan?.limitImageGeneration ?? 0,
              backupCode: Math.floor(100000 + Math.random() * 900000).toString(),
              verifyToken: crypto.randomUUID(),
            }
          })
        }
      }

      return true
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
      }

      // Rafraîchir les données utilisateur à chaque requête
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: parseInt(token.id as string) },
          include: {
            subscriptions: {
              where: {
                stripeStatus: 'active',
              },
              include: {
                plan: true
              },
              take: 1
            }
          }
        })

        if (dbUser) {
          token.type = dbUser.type
          token.balances = {
            generateProduct: dbUser.balanceGenerateProduct,
            videoGeneration: dbUser.balanceVideoGeneration,
            imageGeneration: dbUser.balanceImageGeneration,
          }
          token.shopifyDomain = dbUser.shopifyDomain
          
          // Déterminer le plan actif
          const activeSub = dbUser.subscriptions[0]
          if (activeSub) {
            token.activePlan = {
              identifier: activeSub.name,
              title: activeSub.plan?.title ?? activeSub.name,
              limitGenerateProduct: activeSub.plan?.limitGenerateProduct ?? 0,
              limitVideoGeneration: activeSub.plan?.limitVideoGeneration ?? 0,
              limitImageGeneration: activeSub.plan?.limitImageGeneration ?? 0,
            }
          } else {
            // Trial ou expired
            const trialHours = dbUser.utmSource === 'Marcuus' ? 168 : 119
            const hoursSinceCreation = Math.floor(
              (Date.now() - dbUser.createdAt.getTime()) / (1000 * 60 * 60)
            )
            
            if (hoursSinceCreation < trialHours) {
              const trialPlan = await prisma.plan.findUnique({
                where: { identifier: 'trial' }
              })
              token.activePlan = {
                identifier: 'trial',
                title: 'Trial',
                limitGenerateProduct: trialPlan?.limitGenerateProduct ?? 0,
                limitVideoGeneration: trialPlan?.limitVideoGeneration ?? 0,
                limitImageGeneration: trialPlan?.limitImageGeneration ?? 0,
              }
              token.isOnTrial = true
            } else {
              token.activePlan = {
                identifier: 'expired',
                title: 'Expired',
                limitGenerateProduct: 0,
                limitVideoGeneration: 0,
                limitImageGeneration: 0,
              }
              token.isOnTrial = false
            }
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.type = token.type as 'email' | 'Google'
        session.user.activePlan = token.activePlan as any
        session.user.balanceGenerateProduct = (token.balances as any)?.generateProduct ?? 0
        session.user.balanceVideoGeneration = (token.balances as any)?.videoGeneration ?? 0
        session.user.balanceImageGeneration = (token.balances as any)?.imageGeneration ?? 0
        session.user.shopifyDomain = token.shopifyDomain as string | null
        session.user.isOnTrial = token.isOnTrial as boolean ?? false
      }
      return session
    }
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
})
```

### **2.3 API Route Handler**

Créer `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

### **2.4 Providers Wrapper**

Créer `src/providers/session-provider.tsx`:

```typescript
'use client'

import { SessionProvider } from "next-auth/react"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

Mettre à jour `src/app/layout.tsx`:

```typescript
import AuthProvider from "@/providers/session-provider"

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### **2.5 Middleware Protection**

Créer `src/middleware.ts`:

```typescript
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  if (isLoggedIn && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### **2.6 Hooks Personnalisés**

Créer `src/lib/hooks/use-user.ts`:

```typescript
'use client'

import { useSession } from "next-auth/react"

export function useUser() {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}
```

---

## 🔌 Étape 3: API Routes (Backend Logic)

### **3.1 Structure des API Routes**

```
src/app/api/
├── auth/
│   └── [...nextauth]/route.ts
├── user/
│   ├── route.ts (GET)
│   └── update/route.ts (PATCH)
├── ads/
│   ├── route.ts (GET list)
│   ├── [id]/route.ts (GET single)
│   └── favorite/route.ts (POST)
├── shops/
│   ├── route.ts (GET list)
│   ├── [id]/route.ts (GET single)
│   └── track/route.ts (POST)
├── products/
│   ├── route.ts (GET list)
│   ├── export/route.ts (POST)
│   └── generate/route.ts (POST)
├── ai/
│   ├── generate-image/route.ts
│   ├── generate-video/route.ts
│   └── creative/route.ts
├── shopify/
│   ├── auth/route.ts
│   ├── shops/route.ts
│   └── webhook/route.ts
└── billing/
    ├── plans/route.ts
    ├── subscribe/route.ts
    ├── portal/route.ts
    └── webhooks/route.ts
```

### **3.2 Exemple: API User**

Créer `src/app/api/user/route.ts`:

```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    include: {
      subscriptions: {
        where: { stripeStatus: 'active' },
        include: { plan: true }
      },
      shopifyShops: true,
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    shopifyDomain: user.shopifyDomain,
    balances: {
      generateProduct: user.balanceGenerateProduct,
      videoGeneration: user.balanceVideoGeneration,
      imageGeneration: user.balanceImageGeneration,
    },
    activePlan: session.user.activePlan,
    shopifyShops: user.shopifyShops,
  })
}
```

### **3.3 Exemple: API Ads (avec pagination)**

Créer `src/app/api/ads/route.ts`:

```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  mediaType: z.enum(['image', 'video', 'carousel', 'collection']).optional(),
  market: z.string().optional(),
  searchQuery: z.string().optional(),
  sortBy: z.enum(['firstSeenDate', 'lastSeenDate', 'id']).default('lastSeenDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse & validate query params
  const searchParams = request.nextUrl.searchParams
  const parsed = querySchema.safeParse({
    page: searchParams.get('page'),
    perPage: searchParams.get('perPage'),
    mediaType: searchParams.get('mediaType'),
    market: searchParams.get('market'),
    searchQuery: searchParams.get('query'),
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder'),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  const { page, perPage, mediaType, market, searchQuery, sortBy, sortOrder } = parsed.data

  // Build where clause
  const where: any = {
    deletedAt: null,
  }

  if (mediaType) {
    where.mediaType = mediaType
  }

  if (market) {
    where.market = {
      contains: market
    }
  }

  if (searchQuery) {
    where.OR = [
      { adCaption: { contains: searchQuery, mode: 'insensitive' } },
      { pageName: { contains: searchQuery, mode: 'insensitive' } },
      { shopUrl: { contains: searchQuery, mode: 'insensitive' } },
    ]
  }

  // Get total count
  const total = await prisma.facebookAd.count({ where })

  // Get paginated results
  const ads = await prisma.facebookAd.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * perPage,
    take: perPage,
    include: {
      shop: {
        select: {
          id: true,
          url: true,
          merchantName: true,
          screenshot: true,
        }
      },
      favorites: {
        where: { userId: parseInt(session.user.id) },
        select: { id: true }
      }
    }
  })

  // Add isFavorited flag
  const adsWithFavorite = ads.map(ad => ({
    ...ad,
    isFavorited: ad.favorites.length > 0,
    favorites: undefined, // Remove from response
  }))

  return NextResponse.json({
    data: adsWithFavorite,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    }
  })
}
```

### **3.4 Exemple: Toggle Favorite**

Créer `src/app/api/ads/favorite/route.ts`:

```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  adId: z.number(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { adId } = parsed.data
  const userId = parseInt(session.user.id)

  // Check if already favorited
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_adId: {
        userId,
        adId,
      }
    }
  })

  if (existing) {
    // Remove favorite
    await prisma.favorite.delete({
      where: { id: existing.id }
    })
    return NextResponse.json({ favorited: false })
  } else {
    // Add favorite
    await prisma.favorite.create({
      data: {
        userId,
        adId,
      }
    })
    return NextResponse.json({ favorited: true })
  }
}
```

---

## 💳 Étape 4: Intégration Stripe (Sans Cashier)

### **4.1 Installation**

```bash
npm install stripe @stripe/stripe-js
```

### **4.2 Server-side Stripe Client**

Créer `src/lib/stripe.ts`:

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})
```

### **4.3 Client-side Stripe**

Créer `src/lib/stripe-client.ts`:

```typescript
import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)
```

### **4.4 API: Create Checkout Session**

Créer `src/app/api/billing/subscribe/route.ts`:

```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  planIdentifier: z.string(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { planIdentifier } = parsed.data
  const userId = parseInt(session.user.id)

  // Get plan
  const plan = await prisma.plan.findUnique({
    where: { identifier: planIdentifier }
  })

  if (!plan || !plan.stripeId) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Get or create Stripe customer
  let user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let customerId = user.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id.toString(),
      }
    })
    
    customerId = customer.id
    
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId }
    })
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.stripeId,
        quantity: 1,
      }
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?canceled=true`,
    metadata: {
      userId: userId.toString(),
      planIdentifier: plan.identifier,
    },
  })

  return NextResponse.json({
    sessionId: checkoutSession.id,
    url: checkoutSession.url,
  })
}
```

### **4.5 Webhooks Stripe**

Créer `src/app/api/billing/webhooks/route.ts`:

```typescript
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session)
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionUpdate(subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(subscription)
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      await handleInvoicePaid(invoice)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await handleInvoicePaymentFailed(invoice)
      break
    }
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = parseInt(session.metadata?.userId!)
  const planIdentifier = session.metadata?.planIdentifier!

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  await prisma.subscription.create({
    data: {
      userId,
      name: planIdentifier,
      stripeId: subscription.id,
      stripeStatus: subscription.status,
      stripePriceId: subscription.items.data[0].price.id,
      quantity: subscription.items.data[0].quantity ?? 1,
      trialEndsAt: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000) 
        : null,
      endsAt: null,
    }
  })

  // Update user credits based on plan
  const plan = await prisma.plan.findUnique({
    where: { identifier: planIdentifier }
  })

  if (plan) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        balanceGenerateProduct: plan.limitGenerateProduct,
        balanceVideoGeneration: plan.limitVideoGeneration,
        balanceImageGeneration: plan.limitImageGeneration,
        nextCreditRenewalAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      }
    })
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeId: subscription.id },
    data: {
      stripeStatus: subscription.status,
      stripePriceId: subscription.items.data[0].price.id,
      quantity: subscription.items.data[0].quantity ?? 1,
    }
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeId: subscription.id },
    data: {
      stripeStatus: 'canceled',
      endsAt: new Date(),
    }
  })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const userId = await getUserIdFromCustomer(invoice.customer as string)
  
  if (!userId) return

  await prisma.invoice.create({
    data: {
      userId,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: invoice.status ?? 'paid',
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      paidAt: invoice.status_transitions.paid_at 
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
    }
  })
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment (send email, etc.)
  console.error('Payment failed for invoice:', invoice.id)
}

async function getUserIdFromCustomer(customerId: string): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true }
  })
  return user?.id ?? null
}
```

### **4.6 Frontend: Billing Page**

Créer `src/app/dashboard/billing/page.tsx`:

```typescript
'use client'

import { useUser } from "@/lib/hooks/use-user"
import { stripePromise } from "@/lib/stripe-client"
import { useState } from "react"

export default function BillingPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (planIdentifier: string) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planIdentifier }),
      })

      const { url } = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <h1>Plans & Billing</h1>
      
      {user?.activePlan && (
        <div className="mb-4">
          <p>Current Plan: {user.activePlan.title}</p>
        </div>
      )}

      {/* Plans Grid */}
      <div className="row g-4">
        {/* Plan cards avec bouton Subscribe */}
      </div>
    </div>
  )
}
```

---

## 🤖 Étape 5: Services Externes (OpenAI, Claude, etc.)

### **5.1 OpenAI Service**

Créer `src/lib/services/openai.ts`:

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function generateProductDescription(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a professional e-commerce copywriter. Generate compelling product descriptions."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1000,
  })

  return completion.choices[0].message.content ?? ''
}

export async function generateImage(prompt: string): Promise<string> {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
  })

  return response.data[0].url ?? ''
}
```

### **5.2 Claude Service**

```bash
npm install @anthropic-ai/sdk
```

Créer `src/lib/services/claude.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function generateContentWithClaude(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

export async function translateWithClaude(
  text: string, 
  targetLang: string, 
  sourceLang: string
): Promise<string> {
  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Return only the translated text without any additional explanations or notes:\n\n${text}`
  
  return generateContentWithClaude(prompt)
}
```

### **5.3 API Route: Generate Product**

Créer `src/app/api/products/generate/route.ts`:

```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateProductDescription } from "@/lib/services/openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  prompt: z.string().min(10),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = parseInt(session.user.id)
  
  // Check credits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balanceGenerateProduct: true }
  })

  if (!user || user.balanceGenerateProduct <= 0) {
    return NextResponse.json({ 
      error: 'Insufficient credits' 
    }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { prompt } = parsed.data

  try {
    // Generate product with AI
    const description = await generateProductDescription(prompt)
    
    // Deduct credit
    await prisma.user.update({
      where: { id: userId },
      data: {
        balanceGenerateProduct: {
          decrement: 1
        }
      }
    })

    // Save generation
    const generation = await prisma.generateProduct.create({
      data: {
        userId,
        prompt,
        productData: JSON.stringify({ description }),
        status: 'completed',
      }
    })

    return NextResponse.json({
      id: generation.id,
      description,
    })
  } catch (error) {
    console.error('Product generation error:', error)
    return NextResponse.json({ 
      error: 'Generation failed' 
    }, { status: 500 })
  }
}
```

---

## 📧 Étape 6: Emails & Notifications

### **6.1 Installation Resend**

```bash
npm install resend
```

### **6.2 Email Service**

Créer `src/lib/services/email.ts`:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: 'Copyfy <noreply@copyfy.io>',
    to: email,
    subject: 'Bienvenue sur Copyfy!',
    html: `
      <h1>Bienvenue ${name}!</h1>
      <p>Merci de vous être inscrit sur Copyfy.</p>
    `,
  })
}

export async function sendMagicLink(email: string, token: string) {
  const magicLink = `${process.env.NEXTAUTH_URL}/auth/magic-link?token=${token}`
  
  await resend.emails.send({
    from: 'Copyfy <noreply@copyfy.io>',
    to: email,
    subject: 'Votre lien de connexion',
    html: `
      <p>Cliquez sur ce lien pour vous connecter:</p>
      <a href="${magicLink}">${magicLink}</a>
      <p>Ce lien expire dans 1 heure.</p>
    `,
  })
}
```

---

## ⚡ Étape 7: Caching & Performance

### **7.1 Redis avec Upstash**

```bash
npm install @upstash/redis
```

Créer `src/lib/redis.ts`:

```typescript
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache helpers
export async function getCached<T>(
  key: string, 
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await redis.get(key)
  
  if (cached) {
    return cached as T
  }
  
  const fresh = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(fresh))
  
  return fresh
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
```

### **7.2 Utilisation dans API Routes**

```typescript
import { getCached, redis } from "@/lib/redis"

export async function GET() {
  const stats = await getCached(
    'dashboard:stats',
    async () => {
      return await prisma.shop.count()
    },
    300 // 5 minutes
  )
  
  return NextResponse.json(stats)
}
```

---

## 🔄 Étape 8: Background Jobs & Crons

### **8.1 Vercel Cron Jobs**

Créer `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/renew-credits",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/sync-shops",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### **8.2 API Route: Renew Credits**

Créer `src/app/api/cron/renew-credits/route.ts`:

```typescript
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find users who need credit renewal
  const usersToRenew = await prisma.user.findMany({
    where: {
      nextCreditRenewalAt: {
        lte: new Date()
      },
      subscriptions: {
        some: {
          stripeStatus: 'active'
        }
      }
    },
    include: {
      subscriptions: {
        where: { stripeStatus: 'active' },
        include: { plan: true }
      }
    }
  })

  for (const user of usersToRenew) {
    const activeSub = user.subscriptions[0]
    const plan = activeSub.plan
    
    if (!plan) continue

    await prisma.user.update({
      where: { id: user.id },
      data: {
        balanceGenerateProduct: plan.limitGenerateProduct,
        balanceVideoGeneration: plan.limitVideoGeneration,
        balanceImageGeneration: plan.limitImageGeneration,
        nextCreditRenewalAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    })
  }

  return NextResponse.json({
    success: true,
    renewed: usersToRenew.length
  })
}
```

---

## 🚀 Étape 9: Déploiement

### **9.1 Variables d'Environnement**

Créer `.env.local` (development):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/copyfy"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-generate-with-openssl"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Anthropic (Claude)
ANTHROPIC_API_KEY="sk-ant-..."

# Resend (Emails)
RESEND_API_KEY="re_..."

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Shopify
SHOPIFY_CLIENT_ID="..."
SHOPIFY_CLIENT_SECRET="..."

# Cron
CRON_SECRET="your-cron-secret"
```

### **9.2 Déploiement sur Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Configuration Vercel:
- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### **9.3 Database (PostgreSQL)**

Options:
1. **Vercel Postgres** (recommandé pour démarrer)
2. **Supabase** (gratuit jusqu'à 500MB)
3. **Neon** (serverless PostgreSQL)
4. **Railway** (full stack)

---

## 📚 Étape 10: Migration des Données Laravel → Next.js

### **10.1 Script de Migration**

Créer `scripts/migrate-data.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import postgres from 'postgres'

const prisma = new PrismaClient()
const laravelDb = postgres(process.env.LARAVEL_DATABASE_URL!)

async function migrateUsers() {
  console.log('Migrating users...')
  
  const laravelUsers = await laravelDb`
    SELECT * FROM users WHERE deleted_at IS NULL
  `

  for (const user of laravelUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
        name: user.name,
        password: user.password,
        type: user.type === 'Google' ? 'Google' : 'email',
        emailVerifiedAt: user.email_verified_at,
        balanceGenerateProduct: user.balance_generate_product ?? 0,
        balanceVideoGeneration: user.balance_video_generation ?? 0,
        balanceImageGeneration: user.balance_image_generation ?? 0,
        shopifyDomain: user.shopify_domain,
        stripeCustomerId: user.stripe_id,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      update: {}
    })
  }
  
  console.log(`Migrated ${laravelUsers.length} users`)
}

async function migrateShops() {
  console.log('Migrating shops...')
  
  const laravelShops = await laravelDb`
    SELECT * FROM shops WHERE deleted_at IS NULL
  `

  for (const shop of laravelShops) {
    await prisma.shop.upsert({
      where: { url: shop.url },
      create: {
        url: shop.url,
        shopifyUrl: shop.shopify_url,
        merchantName: shop.merchant_name,
        locale: shop.locale,
        country: shop.country,
        currency: shop.currency,
        theme: shop.theme,
        pixels: shop.pixels,
        apps: shop.apps,
        productsCount: shop.products_count ?? 0,
        activeAds: shop.active_ads ?? 0,
        allAds: shop.all_ads ?? 0,
        screenshot: shop.screenshot,
        createdAt: shop.created_at,
        updatedAt: shop.updated_at,
      },
      update: {}
    })
  }
  
  console.log(`Migrated ${laravelShops.length} shops`)
}

async function main() {
  await migrateUsers()
  await migrateShops()
  // ... migrate other tables
  
  await laravelDb.end()
  await prisma.$disconnect()
}

main().catch(console.error)
```

Lancer:
```bash
npx tsx scripts/migrate-data.ts
```

---

## ✅ Checklist Finale

### **Setup Initial**
- [ ] Next.js 15 installé
- [ ] Prisma configuré
- [ ] Database PostgreSQL connectée
- [ ] NextAuth configuré
- [ ] Google OAuth fonctionnel

### **Core Features**
- [ ] Authentification complète (email + Google)
- [ ] Dashboard principal
- [ ] Liste Ads avec filtres
- [ ] Liste Shops avec filtres
- [ ] Favoris
- [ ] Profil utilisateur

### **Premium Features**
- [ ] Stripe Checkout
- [ ] Webhooks Stripe
- [ ] Gestion des crédits
- [ ] Génération produits IA
- [ ] Export produits

### **Performance & Sécurité**
- [ ] Redis caching
- [ ] Middleware de sécurité
- [ ] Rate limiting
- [ ] Error tracking (Sentry)
- [ ] Analytics (Mixpanel/Posthog)

### **Déploiement**
- [ ] Environment variables configurées
- [ ] Database migrations appliquées
- [ ] Vercel déployé
- [ ] DNS configuré
- [ ] HTTPS actif

---

## 🎯 Prochaines Étapes

**Semaine 1-2:**
1. Setup Prisma + Database
2. NextAuth complet
3. First API routes (user, auth)

**Semaine 3-4:**
4. Dashboard UI
5. Ads listing + filters
6. Shops listing

**Semaine 5-6:**
7. Stripe integration
8. AI generation features
9. Shopify integration

**Semaine 7-8:**
10. Performance optimization
11. Testing
12. Déploiement production

---

**Let's go coco ! 🚀** C'est parti pour du full Next.js sans dépendance Laravel !
