/**
 * Customer.io Integration Service
 * 
 * Handles user sync and event tracking for marketing automation.
 * Mirrors the Laravel CustomerIoService functionality.
 */

// Customer.io API Configuration
const CUSTOMERIO_SITE_ID = process.env.CUSTOMER_IO_SITE_ID || '';
const CUSTOMERIO_API_KEY = process.env.CUSTOMER_IO_API_KEY || '';
const CUSTOMERIO_API_URL = 'https://track-eu.customer.io/api/v1/customers';

// Check if Customer.io is configured
export const isCustomerIoConfigured = () => {
  return !!(CUSTOMERIO_SITE_ID && CUSTOMERIO_API_KEY);
};

// Get Basic Auth token
const getAuthToken = (): string => {
  return Buffer.from(`${CUSTOMERIO_SITE_ID}:${CUSTOMERIO_API_KEY}`).toString('base64');
};

// Types
export interface CustomerIoUserPayload {
  id: number;
  email: string;
  created_at: number;
  lang?: string;
  username?: string;
  
  // Email verification
  email_verified?: boolean;
  email_verified_at?: number;
  
  // UTM tracking
  utm_source?: string;
  
  // Subscription status
  plan_identifier?: string;
  plan_title?: string;
  is_on_trial?: boolean;
  is_subscribed?: boolean;
  is_expired?: boolean;
  
  // Store/Shop imports
  has_imported_shops?: boolean;
  total_shops_imported?: number;
  first_imported_store_created_at?: number;
  hours_to_first_store?: number;
  created_store_within_48h?: boolean;
  
  // Generated products/stores
  has_generated_shops?: boolean;
  total_shops_generated?: number;
  first_generated_shops_created_at?: number;
  
  // Shopify integration
  shopify_setup_completed?: boolean;
  shopify_domain?: string;
  has_shopify_domain?: boolean;
  hours_to_shopify_link?: number;
  linked_shopify_within_48h?: boolean;
  
  // Activity metrics
  last_login?: number;
  product_search_count?: number;
  shops_search_count?: number;
  ads_search_count?: number;
  shop_tracking_count?: number;
  subscription_start_date?: number;
}

export interface CustomerIoEvent {
  name: string;
  data?: Record<string, unknown>;
}

/**
 * Sync a user's data to Customer.io
 * PUT /customers/{userId}
 */
export async function syncUserToCustomerIo(payload: CustomerIoUserPayload): Promise<boolean> {
  if (!isCustomerIoConfigured()) {
    console.log('[CustomerIO] Skipping sync - not configured');
    return true; // Return true to not break the flow
  }

  try {
    console.log(`[CustomerIO] Syncing user ${payload.id}...`);
    
    const response = await fetch(`${CUSTOMERIO_API_URL}/${payload.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[CustomerIO] User ${payload.id} synced successfully`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`[CustomerIO] Failed to sync user ${payload.id}:`, response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error(`[CustomerIO] Error syncing user ${payload.id}:`, error);
    return false;
  }
}

/**
 * Send an event to Customer.io for a user
 * POST /customers/{userId}/events
 */
export async function sendCustomerIoEvent(
  userId: number,
  eventName: string,
  eventData: Record<string, unknown> = {}
): Promise<boolean> {
  if (!isCustomerIoConfigured()) {
    console.log('[CustomerIO] Skipping event - not configured');
    return true;
  }

  try {
    console.log(`[CustomerIO] Sending event '${eventName}' for user ${userId}...`);
    
    const payload = {
      name: eventName,
      data: eventData,
    };

    const response = await fetch(`${CUSTOMERIO_API_URL}/${userId}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[CustomerIO] Event '${eventName}' sent for user ${userId}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`[CustomerIO] Failed to send event for user ${userId}:`, response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error(`[CustomerIO] Error sending event for user ${userId}:`, error);
    return false;
  }
}

/**
 * Delete a user from Customer.io
 * DELETE /customers/{userId}
 */
export async function deleteUserFromCustomerIo(userId: number): Promise<boolean> {
  if (!isCustomerIoConfigured()) {
    console.log('[CustomerIO] Skipping delete - not configured');
    return true;
  }

  try {
    console.log(`[CustomerIO] Deleting user ${userId}...`);
    
    const response = await fetch(`${CUSTOMERIO_API_URL}/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${getAuthToken()}`,
      },
    });

    // 200 = deleted, 404 = already deleted (both are success)
    if (response.ok || response.status === 404) {
      console.log(`[CustomerIO] User ${userId} deleted successfully`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`[CustomerIO] Failed to delete user ${userId}:`, response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error(`[CustomerIO] Error deleting user ${userId}:`, error);
    return false;
  }
}

/**
 * Build user payload from database user object
 * Matches Laravel's buildUserPayload method
 */
export async function buildUserPayload(
  user: {
    id: bigint | number;
    email: string;
    name: string;
    createdAt?: Date | null;
    lang?: string;
    emailVerifiedAt?: Date | null;
    utmSource?: string | null;
    shopifyDomain?: string | null;
    shopifySetupCompleted?: boolean;
    shopifyDomainLinkedAt?: Date | null;
    lastLogin?: Date | null;
  },
  additionalData?: {
    activePlan?: { identifier: string; title: string } | null;
    generateStoresCount?: number;
    firstStoreCreatedAt?: Date | null;
    generateProductsCount?: number;
    firstProductCreatedAt?: Date | null;
    productSearchCount?: number;
    shopsSearchCount?: number;
    adsSearchCount?: number;
    shopTrackingCount?: number;
    subscriptionStartDate?: Date | null;
  }
): Promise<CustomerIoUserPayload> {
  const userId = typeof user.id === 'bigint' ? Number(user.id) : user.id;
  const createdAt = user.createdAt ? Math.floor(user.createdAt.getTime() / 1000) : Math.floor(Date.now() / 1000);
  
  const payload: CustomerIoUserPayload = {
    id: userId,
    email: user.email,
    created_at: createdAt,
    lang: user.lang || 'en',
    username: user.name,
  };

  // Email verification
  if (user.emailVerifiedAt) {
    payload.email_verified = true;
    payload.email_verified_at = Math.floor(user.emailVerifiedAt.getTime() / 1000);
  } else {
    payload.email_verified = false;
  }

  // UTM source
  if (user.utmSource) {
    payload.utm_source = user.utmSource;
  }

  // Subscription status
  if (additionalData?.activePlan) {
    payload.plan_identifier = additionalData.activePlan.identifier;
    payload.plan_title = additionalData.activePlan.title;
    payload.is_on_trial = additionalData.activePlan.identifier === 'trial';
    payload.is_subscribed = !['trial', 'expired'].includes(additionalData.activePlan.identifier);
    payload.is_expired = additionalData.activePlan.identifier === 'expired';
  }

  // Generated stores
  const storesCount = additionalData?.generateStoresCount ?? 0;
  if (storesCount > 0) {
    payload.has_imported_shops = true;
    payload.total_shops_imported = storesCount;

    if (additionalData?.firstStoreCreatedAt && user.createdAt) {
      payload.first_imported_store_created_at = Math.floor(additionalData.firstStoreCreatedAt.getTime() / 1000);
      const hoursDiff = Math.floor(
        (additionalData.firstStoreCreatedAt.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60)
      );
      payload.hours_to_first_store = hoursDiff;
      payload.created_store_within_48h = hoursDiff <= 48;
    }
  } else {
    payload.has_imported_shops = false;
    payload.total_shops_imported = 0;
  }

  // Generated products
  const productsCount = additionalData?.generateProductsCount ?? 0;
  payload.has_generated_shops = productsCount > 0;
  payload.total_shops_generated = productsCount;
  
  // First generated product timestamp
  if (additionalData?.firstProductCreatedAt) {
    payload.first_generated_shops_created_at = Math.floor(additionalData.firstProductCreatedAt.getTime() / 1000);
  }

  // Shopify integration
  payload.shopify_setup_completed = user.shopifySetupCompleted ?? false;
  if (user.shopifyDomain) {
    payload.shopify_domain = user.shopifyDomain;
    payload.has_shopify_domain = true;

    if (user.shopifyDomainLinkedAt && user.createdAt) {
      const hoursToLink = Math.floor(
        (user.shopifyDomainLinkedAt.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60)
      );
      payload.hours_to_shopify_link = hoursToLink;
      payload.linked_shopify_within_48h = hoursToLink <= 48;
    }
  } else {
    payload.has_shopify_domain = false;
  }

  // Last login
  if (user.lastLogin) {
    payload.last_login = Math.floor(user.lastLogin.getTime() / 1000);
  }

  // Search counts
  payload.product_search_count = additionalData?.productSearchCount ?? 0;
  payload.shops_search_count = additionalData?.shopsSearchCount ?? 0;
  payload.ads_search_count = additionalData?.adsSearchCount ?? 0;

  // Shop tracking count
  payload.shop_tracking_count = additionalData?.shopTrackingCount ?? 0;

  // Subscription start date
  if (additionalData?.subscriptionStartDate) {
    payload.subscription_start_date = Math.floor(additionalData.subscriptionStartDate.getTime() / 1000);
  }

  return payload;
}

// Event name constants (matching Laravel events)
export const CustomerIoEvents = {
  FREE_TRIAL: 'free_trial',
  SUBSCRIBED: 'subscribed',
  STORE_WITHIN_48H: 'store_within_48h',
  STORE_AFTER_48H: 'store_after_48h',
  SHOPIFY_CONNECTED: 'shopify_connected',
  EMAIL_VERIFIED: 'email_verified',
} as const;

// =============================================================================
// TRANSACTIONAL EMAILS (via Customer.io)
// =============================================================================

// Transactional email API - uses the SAME CUSTOMER_IO_API_KEY but as Bearer token
const CUSTOMERIO_TRANSACTIONAL_API_URL = 'https://api.customer.io/v1/send/email';

// Check if transactional emails are configured (same key as tracking)
export const isCustomerIoTransactionalConfigured = () => {
  return !!CUSTOMERIO_API_KEY;
};

// Transactional message IDs (must match Customer.io dashboard)
export const CustomerIoTransactionalMessages = {
  EMAIL_VERIFICATION: 21,
  BACKUP_CODE: 24,
  PASSWORD_RESET: 25, // You may need to create this in Customer.io
} as const;

interface TransactionalEmailOptions {
  to: string;
  transactional_message_id: number;
  message_data: Record<string, string | number>;
  language?: string;
  identifiers: {
    id: number;
    email: string;
  };
}

/**
 * Send a transactional email via Customer.io
 * POST https://api.customer.io/v1/send/email
 * 
 * This is used for:
 * - Email verification
 * - Password reset
 * - Backup codes / 2FA
 */
export async function sendTransactionalEmail(options: TransactionalEmailOptions): Promise<boolean> {
  if (!isCustomerIoTransactionalConfigured()) {
    console.log('[CustomerIO Transactional] Skipping - not configured');
    return false;
  }

  try {
    console.log(`[CustomerIO Transactional] Sending email (message_id: ${options.transactional_message_id}) to ${options.to}...`);

    const response = await fetch(CUSTOMERIO_TRANSACTIONAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CUSTOMERIO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (response.ok) {
      console.log(`[CustomerIO Transactional] Email sent successfully to ${options.to}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`[CustomerIO Transactional] Failed to send email:`, response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error(`[CustomerIO Transactional] Error sending email:`, error);
    return false;
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  userId: number,
  email: string,
  username: string,
  verificationUrl: string,
  language: string = 'en'
): Promise<boolean> {
  // First, ensure user exists in Customer.io
  await syncUserToCustomerIo({
    id: userId,
    email,
    username,
    created_at: Math.floor(Date.now() / 1000),
    lang: language,
    email_verified: false,
  });

  return sendTransactionalEmail({
    to: email,
    transactional_message_id: CustomerIoTransactionalMessages.EMAIL_VERIFICATION,
    message_data: {
      url: verificationUrl,
      email,
      username,
    },
    language,
    identifiers: {
      id: userId,
      email,
    },
  });
}

/**
 * Send backup code email (for 2FA)
 */
export async function sendBackupCodeEmail(
  userId: number,
  email: string,
  username: string,
  backupCode: string,
  language: string = 'en'
): Promise<boolean> {
  return sendTransactionalEmail({
    to: email,
    transactional_message_id: CustomerIoTransactionalMessages.BACKUP_CODE,
    message_data: {
      username,
      backup_code: backupCode,
    },
    language,
    identifiers: {
      id: userId,
      email,
    },
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userId: number,
  email: string,
  username: string,
  resetUrl: string,
  language: string = 'en'
): Promise<boolean> {
  return sendTransactionalEmail({
    to: email,
    transactional_message_id: CustomerIoTransactionalMessages.PASSWORD_RESET,
    message_data: {
      url: resetUrl,
      email,
      username,
    },
    language,
    identifiers: {
      id: userId,
      email,
    },
  });
}
