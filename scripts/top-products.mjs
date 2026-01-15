#!/usr/bin/env node
/**
 * Top Products CLI Script
 * 
 * Replicates the Laravel DashboardController::topproductsMaterialized() endpoint
 * Uses top_products_materialized view with DISTINCT ON (product_handle)
 * 
 * Usage: node scripts/top-products.mjs [options]
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  limit: 50,
  page: 1,
  sort: 'recommended',  // Laravel default
  direction: 'desc',
  currency: null,
  country: null,
  search: null,
  minPrice: null,
  maxPrice: null,
  minRevenue: null,
  maxRevenue: null,
  minTraffic: null,
  maxTraffic: null,
  minSales: null,
  maxSales: null,
  minGrowth: null,
  maxGrowth: null,
  minAds: null,
  maxAds: null,
  json: false,
};

for (const arg of args) {
  if (arg.startsWith('--limit=')) options.limit = parseInt(arg.split('=')[1]) || 50;
  else if (arg.startsWith('--page=')) options.page = parseInt(arg.split('=')[1]) || 1;
  else if (arg.startsWith('--sort=')) options.sort = arg.split('=')[1] || 'recommended';
  else if (arg.startsWith('--direction=')) options.direction = arg.split('=')[1] || 'desc';
  else if (arg.startsWith('--currency=')) options.currency = arg.split('=')[1];
  else if (arg.startsWith('--country=')) options.country = arg.split('=')[1];
  else if (arg.startsWith('--search=')) options.search = arg.split('=')[1];
  else if (arg.startsWith('--min-price=')) options.minPrice = parseFloat(arg.split('=')[1]);
  else if (arg.startsWith('--max-price=')) options.maxPrice = parseFloat(arg.split('=')[1]);
  else if (arg.startsWith('--min-revenue=')) options.minRevenue = parseInt(arg.split('=')[1]);
  else if (arg.startsWith('--max-revenue=')) options.maxRevenue = parseInt(arg.split('=')[1]);
  else if (arg.startsWith('--min-traffic=')) options.minTraffic = parseInt(arg.split('=')[1]);
  else if (arg.startsWith('--max-traffic=')) options.maxTraffic = parseInt(arg.split('=')[1]);
  else if (arg.startsWith('--min-sales=')) options.minSales = parseInt(arg.split('=')[1]);
  else if (arg.startsWith('--max-sales=')) options.maxSales = parseInt(arg.split('=')[1]);
  else if (arg.startsWith('--min-growth=')) options.minGrowth = parseInt(arg.split('=')[1]);
  else if (arg.startsWith('--max-growth=')) options.maxGrowth = parseInt(arg.split('=')[1]);
  else if (arg.startsWith('--min-ads=')) options.minAds = parseInt(arg.split('=')[1]);
  else if (arg.startsWith('--max-ads=')) options.maxAds = parseInt(arg.split('=')[1]);
  else if (arg === '--json') options.json = true;
  else if (arg === '--help' || arg === '-h') {
    console.log(`
Top Products CLI Script (Production - Materialized View)

Replicates: DashboardController::topproductsMaterialized()
Table: top_products_materialized (DISTINCT ON product_handle)

Usage: node scripts/top-products.mjs [options]

Options:
  --limit=N              Number of products (default: 50)
  --page=N               Page number (default: 1)
  --sort=field           Sort by: recommended, estimated_monthly, estimated_order, 
                         last_month_visits, growth_rate, active_ads_count, price (default: recommended)
  --direction=dir        Sort direction: asc, desc (default: desc)
  --currency=USD         Filter by currency (comma-separated)
  --country=US           Filter by country (comma-separated)
  --search=text          Search in title, handle, shop_url
  --min-price=N          Minimum price (default: 0.5)
  --max-price=N          Maximum price
  --min-revenue=N        Minimum revenue (default: > 0)
  --max-revenue=N        Maximum revenue (default: < 100000000)
  --min-traffic=N        Minimum traffic
  --max-traffic=N        Maximum traffic
  --min-sales=N          Minimum sales (orders)
  --max-sales=N          Maximum sales
  --min-growth=N         Minimum growth rate
  --max-growth=N         Maximum growth rate
  --min-ads=N            Minimum active ads
  --max-ads=N            Maximum active ads
  --json                 Output as JSON

Sort Options:
  recommended            AI ranking (growth + ads + orders + daily randomization)
  estimated_monthly      Revenue
  estimated_order        Orders/Sales
  last_month_visits      Traffic
  growth_rate            Traffic growth %
  active_ads_count       Number of active ads
  price                  Product price

Examples:
  node scripts/top-products.mjs
  node scripts/top-products.mjs --limit=20 --sort=estimated_monthly
  node scripts/top-products.mjs --currency=USD,EUR --min-revenue=10000
  node scripts/top-products.mjs --search=hoodie --json
  node scripts/top-products.mjs --sort=active_ads_count --min-ads=50
`);
    process.exit(0);
  }
}

async function fetchTopProducts() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const timings = {
    start: Date.now(),
    dbConnect: 0,
    mainQuery: 0,
    countQuery: 0,
    total: 0,
  };

  try {
    timings.dbConnect = Date.now();
    
    // Build conditions array (like Laravel)
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Base filters from Laravel (always applied in the subquery)
    // price >= 0.5 AND estimated_monthly > 0 are in the subquery
    
    // Additional price filter
    if (options.minPrice !== null && options.minPrice > 0.5) {
      conditions.push(`price >= $${paramIndex}`);
      params.push(options.minPrice);
      paramIndex++;
    }
    if (options.maxPrice !== null) {
      conditions.push(`price <= $${paramIndex}`);
      params.push(options.maxPrice);
      paramIndex++;
    }

    // Revenue filters (Laravel: min_revenue, max_revenue with max default 100000000)
    if (options.minRevenue !== null) {
      conditions.push(`estimated_monthly >= $${paramIndex}`);
      params.push(options.minRevenue);
      paramIndex++;
    }
    if (options.maxRevenue !== null) {
      conditions.push(`estimated_monthly <= $${paramIndex}`);
      params.push(options.maxRevenue);
      paramIndex++;
    }

    // Traffic filters
    if (options.minTraffic !== null) {
      conditions.push(`last_month_visits >= $${paramIndex}`);
      params.push(options.minTraffic);
      paramIndex++;
    }
    if (options.maxTraffic !== null) {
      conditions.push(`last_month_visits <= $${paramIndex}`);
      params.push(options.maxTraffic);
      paramIndex++;
    }

    // Sales/Orders filters
    if (options.minSales !== null) {
      conditions.push(`estimated_order >= $${paramIndex}`);
      params.push(options.minSales);
      paramIndex++;
    }
    if (options.maxSales !== null) {
      conditions.push(`estimated_order <= $${paramIndex}`);
      params.push(options.maxSales);
      paramIndex++;
    }

    // Growth rate filters
    if (options.minGrowth !== null) {
      conditions.push(`growth_rate >= $${paramIndex}`);
      params.push(options.minGrowth);
      paramIndex++;
    }
    if (options.maxGrowth !== null) {
      conditions.push(`growth_rate <= $${paramIndex}`);
      params.push(options.maxGrowth);
      paramIndex++;
    }

    // Active ads filters
    if (options.minAds !== null) {
      conditions.push(`active_ads_count >= $${paramIndex}`);
      params.push(options.minAds);
      paramIndex++;
    }
    if (options.maxAds !== null) {
      conditions.push(`active_ads_count <= $${paramIndex}`);
      params.push(options.maxAds);
      paramIndex++;
    }

    // Currency filter
    if (options.currency) {
      const currencies = options.currency.split(',').map(c => c.trim()).filter(c => c);
      if (currencies.length > 0) {
        const placeholders = currencies.map((_, i) => `$${paramIndex + i}`).join(', ');
        conditions.push(`currency IN (${placeholders})`);
        params.push(...currencies);
        paramIndex += currencies.length;
      }
    }

    // Country filter
    if (options.country) {
      const countries = options.country.split(',').map(c => c.trim()).filter(c => c);
      if (countries.length > 0) {
        const placeholders = countries.map((_, i) => `$${paramIndex + i}`).join(', ');
        conditions.push(`country IN (${placeholders})`);
        params.push(...countries);
        paramIndex += countries.length;
      }
    }

    // Search filter (ILIKE fallback like Laravel)
    if (options.search) {
      const searchTerm = options.search.toLowerCase().trim();
      conditions.push(`(title ILIKE $${paramIndex} OR product_handle ILIKE $${paramIndex} OR shop_url ILIKE $${paramIndex + 1})`);
      params.push(`%${searchTerm}%`, `${searchTerm}%`);
      paramIndex += 2;
    }

    // Build WHERE clause for outer query
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause (like Laravel's switch statement)
    let orderByClause = '';
    const dailySeed = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const seedHash = parseInt(dailySeed) % 1000;
    const dir = options.direction.toUpperCase();

    switch (options.sort) {
      case 'recommended':
        // Laravel: (growth_rate * 0.3 + active_ads_count * 10000 + estimated_order * 0.1 + MOD(ABS(HASHTEXT(product_handle || seedHash)), 50000))
        orderByClause = `ORDER BY (COALESCE(growth_rate, 0) * 0.3 + COALESCE(active_ads_count, 0) * 10000 + COALESCE(estimated_order, 0) * 0.1 + MOD(ABS(HASHTEXT(product_handle || '${seedHash}')), 50000)) ${dir}`;
        break;
      case 'most_active_ads':
      case 'live_ads':
      case 'active_ads_count':
        orderByClause = `ORDER BY active_ads_count ${dir}`;
        break;
      case 'highest_revenue':
      case 'estimated_monthly':
        orderByClause = `ORDER BY estimated_monthly ${dir}`;
        break;
      case 'most_traffic':
      case 'last_month_visits':
        orderByClause = `ORDER BY last_month_visits ${dir}`;
        break;
      case 'estimated_order':
        orderByClause = `ORDER BY estimated_order ${dir}`;
        break;
      case 'newest_products':
      case 'most_recent':
      case 'created_at':
        orderByClause = `ORDER BY created_at ${dir}`;
        break;
      case 'traffic_growth':
      case 'growth_rate':
        orderByClause = `ORDER BY growth_rate ${dir}`;
        break;
      case 'lowest_price':
        orderByClause = `ORDER BY price ASC`;
        break;
      case 'highest_price':
        orderByClause = `ORDER BY price DESC`;
        break;
      case 'price':
        orderByClause = `ORDER BY price ${dir}`;
        break;
      default:
        orderByClause = `ORDER BY ${options.sort} ${dir}`;
    }

    // Calculate offset
    const offset = (options.page - 1) * options.limit;

    // Main query - exactly like Laravel's topproductsMaterialized
    // Uses DISTINCT ON (product_handle) in subquery, then applies filters
    const query = `
      SELECT *
      FROM (
        SELECT DISTINCT ON (product_handle) *
        FROM top_products_materialized
        WHERE price >= 0.5 AND estimated_monthly > 0 AND estimated_monthly < 100000000
          AND (
            last_month_visits <= 0
            OR (last_month_visits > 0 AND last_month_visits <= 21474836 AND estimated_monthly <= (last_month_visits * 100))
            OR (last_month_visits > 21474836 AND estimated_monthly <= 2147483600)
          )
        ORDER BY product_handle, updated_at DESC
      ) as unique_products
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(options.limit, offset);

    // Execute main query
    const mainQueryStart = Date.now();
    const result = await pool.query(query, params);
    timings.mainQuery = Date.now() - mainQueryStart;

    // Count query
    const countQueryStart = Date.now();
    const countQuery = `
      SELECT COUNT(*) as total
      FROM (
        SELECT DISTINCT ON (product_handle) *
        FROM top_products_materialized
        WHERE price >= 0.5 AND estimated_monthly > 0 AND estimated_monthly < 100000000
          AND (
            last_month_visits <= 0
            OR (last_month_visits > 0 AND last_month_visits <= 21474836 AND estimated_monthly <= (last_month_visits * 100))
            OR (last_month_visits > 21474836 AND estimated_monthly <= 2147483600)
          )
        ORDER BY product_handle, updated_at DESC
      ) as unique_products
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, params.slice(0, -2));
    timings.countQuery = Date.now() - countQueryStart;
    const total = parseInt(countResult.rows[0].total);
    
    timings.total = Date.now() - timings.start;
    timings.dbConnect = timings.dbConnect - timings.start;

    // Output
    if (options.json) {
      console.log(JSON.stringify({
        data: result.rows,
        pagination: {
          page: options.page,
          perPage: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit),
          nextPage: options.page * options.limit < total ? options.page + 1 : null,
        },
        filters: {
          sort: options.sort,
          direction: options.direction,
          currency: options.currency,
          country: options.country,
          search: options.search,
        },
        timings: {
          mainQueryMs: timings.mainQuery,
          mainQuerySec: (timings.mainQuery/1000).toFixed(2),
          countQueryMs: timings.countQuery,
          countQuerySec: (timings.countQuery/1000).toFixed(2),
          totalMs: timings.total,
          totalSec: (timings.total/1000).toFixed(2),
        }
      }, null, 2));
    } else {
      console.log(`\n🏆 TOP PRODUCTS (Materialized View)`);
      console.log(`   Sort: ${options.sort} ${options.direction.toUpperCase()} | Page ${options.page}/${Math.ceil(total / options.limit)} | Total: ${total.toLocaleString()}`);
      console.log(`   ⏱️  Main Query: ${timings.mainQuery}ms (${(timings.mainQuery/1000).toFixed(2)}s) | Count Query: ${timings.countQuery}ms (${(timings.countQuery/1000).toFixed(2)}s) | Total: ${timings.total}ms (${(timings.total/1000).toFixed(2)}s)`);
      console.log('─'.repeat(130));
      
      result.rows.forEach((product, index) => {
        const num = offset + index + 1;
        const revenue = product.estimated_monthly 
          ? `$${(product.estimated_monthly / 100).toLocaleString()}` 
          : 'N/A';
        const orders = product.estimated_order?.toLocaleString() || 'N/A';
        const traffic = product.last_month_visits?.toLocaleString() || 'N/A';
        const growth = product.growth_rate !== null ? `${product.growth_rate}%` : 'N/A';
        const price = product.price ? `${product.currency || ''} ${product.price}` : 'N/A';
        
        console.log(`${num.toString().padStart(4)}. ${(product.title || 'N/A').substring(0, 55).padEnd(55)}`);
        console.log(`      Shop: ${product.shop_url || 'N/A'}`);
        console.log(`      Price: ${price.padEnd(12)} | Revenue: ${revenue.padEnd(12)} | Orders: ${orders.padEnd(8)} | Traffic: ${traffic.padEnd(10)} | Growth: ${growth}`);
        console.log(`      Ads: ${product.active_ads_count || 0} | Country: ${product.country || 'N/A'} | ID: ${product.id}`);
        console.log('─'.repeat(130));
      });

      if (result.rows.length === 0) {
        console.log('   No products found matching your criteria.\n');
      } else {
        console.log(`\n   Showing ${result.rows.length} of ${total.toLocaleString()} products\n`);
      }
    }

    await pool.end();
  } catch (error) {
    console.error('Error fetching products:', error.message);
    if (error.message.includes('top_products_materialized')) {
      console.error('\nNote: The materialized view may not exist. Run migrations or use daily_top_products table.');
    }
    process.exit(1);
  }
}

fetchTopProducts();
