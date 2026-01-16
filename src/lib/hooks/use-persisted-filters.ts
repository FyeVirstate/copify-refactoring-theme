"use client";

import { useState, useEffect, useCallback } from "react";

// Storage key prefix
const FILTER_STORAGE_KEY_PREFIX = "copyfy_filters_";

// Filter state interface for shops
export interface ShopsFilterState {
  selectedCountries: string[];
  selectedNiches: string[];
  selectedCurrencies: string[];
  selectedPixels: string[];
  selectedOrigins: string[];
  selectedLanguages: string[];
  selectedDomains: string[];
  selectedThemes: string[];
  selectedApplications: string[];
  selectedSocialNetworks: string[];
  shopCreationDate: string;
  sortBy: string;
  sortOrder: 'desc' | 'asc';
  minRevenue?: number;
  maxRevenue?: number;
  minTraffic?: number;
  maxTraffic?: number;
  minProducts?: number;
  maxProducts?: number;
  minActiveAds?: number;
  maxActiveAds?: number;
  minTrafficGrowth?: number;
  maxTrafficGrowth?: number;
  minOrders?: number;
  maxOrders?: number;
  minPrice?: number;
  maxPrice?: number;
  minCatalogSize?: number;
  maxCatalogSize?: number;
  minTrustpilotRating?: number;
  maxTrustpilotRating?: number;
  minTrustpilotReviews?: number;
  maxTrustpilotReviews?: number;
}

// Filter state interface for products
export interface ProductsFilterState {
  selectedCountries: string[];
  selectedNiches: string[];
  selectedCurrencies: string[];
  selectedPixels: string[];
  selectedOrigins: string[];
  selectedLanguages: string[];
  selectedDomains: string[];
  selectedThemes: string[];
  selectedApplications: string[];
  selectedSocialNetworks: string[];
  shopCreationDate: string;
  sortBy: string;
  sortOrder: 'desc' | 'asc';
  minPrice?: number;
  maxPrice?: number;
  minActiveAds?: number;
  maxActiveAds?: number;
  minTraffic?: number;
  maxTraffic?: number;
  minOrders?: number;
  maxOrders?: number;
}

// Filter state interface for ads
export interface AdsFilterState {
  selectedCountries: string[];
  selectedNiches: string[];
  selectedLanguages: string[];
  selectedMediaTypes: string[];
  selectedPlatforms: string[];
  selectedCTAs: string[];
  adStatus: string;
  sortBy: string;
  sortOrder: 'desc' | 'asc';
  minActiveAds?: number;
  maxActiveAds?: number;
  dateRange?: string;
}

// Default values for shops filters
export const defaultShopsFilters: ShopsFilterState = {
  selectedCountries: [],
  selectedNiches: [],
  selectedCurrencies: [],
  selectedPixels: [],
  selectedOrigins: [],
  selectedLanguages: [],
  selectedDomains: [],
  selectedThemes: [],
  selectedApplications: [],
  selectedSocialNetworks: [],
  shopCreationDate: "",
  sortBy: "top_score",
  sortOrder: "desc",
};

// Default values for products filters
export const defaultProductsFilters: ProductsFilterState = {
  selectedCountries: [],
  selectedNiches: [],
  selectedCurrencies: [],
  selectedPixels: [],
  selectedOrigins: [],
  selectedLanguages: [],
  selectedDomains: [],
  selectedThemes: [],
  selectedApplications: [],
  selectedSocialNetworks: [],
  shopCreationDate: "",
  sortBy: "top_score",
  sortOrder: "desc",
};

// Default values for ads filters
export const defaultAdsFilters: AdsFilterState = {
  selectedCountries: [],
  selectedNiches: [],
  selectedLanguages: [],
  selectedMediaTypes: [],
  selectedPlatforms: [],
  selectedCTAs: [],
  adStatus: "",
  sortBy: "first_seen",
  sortOrder: "desc",
};

type FilterState = ShopsFilterState | ProductsFilterState | AdsFilterState;

/**
 * Hook to persist filter state in localStorage
 * @param pageKey - Unique key for the page (e.g., "shops", "products", "ads")
 * @param defaultFilters - Default filter values
 */
export function usePersistedFilters<T extends FilterState>(
  pageKey: string,
  defaultFilters: T
): {
  filters: T;
  setFilters: (filters: Partial<T>) => void;
  resetFilters: () => void;
  isLoaded: boolean;
} {
  const storageKey = `${FILTER_STORAGE_KEY_PREFIX}${pageKey}`;
  const [filters, setFiltersState] = useState<T>(defaultFilters);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load filters from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure new filter keys are included
        setFiltersState({ ...defaultFilters, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load filters from localStorage:", error);
    }
    setIsLoaded(true);
  }, [storageKey, defaultFilters]);

  // Save filters to localStorage
  const setFilters = useCallback((newFilters: Partial<T>) => {
    setFiltersState((prev) => {
      const updated = { ...prev, ...newFilters };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save filters to localStorage:", error);
      }
      return updated;
    });
  }, [storageKey]);

  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Failed to remove filters from localStorage:", error);
    }
  }, [storageKey, defaultFilters]);

  return { filters, setFilters, resetFilters, isLoaded };
}

/**
 * Utility to save a single filter value
 */
export function saveFilterValue(pageKey: string, filterKey: string, value: unknown): void {
  const storageKey = `${FILTER_STORAGE_KEY_PREFIX}${pageKey}`;
  try {
    const stored = localStorage.getItem(storageKey);
    const current = stored ? JSON.parse(stored) : {};
    current[filterKey] = value;
    localStorage.setItem(storageKey, JSON.stringify(current));
  } catch (error) {
    console.error("Failed to save filter value:", error);
  }
}

/**
 * Utility to load filter state for a page
 */
export function loadFilters<T extends FilterState>(pageKey: string, defaults: T): T {
  const storageKey = `${FILTER_STORAGE_KEY_PREFIX}${pageKey}`;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return { ...defaults, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load filters:", error);
  }
  return defaults;
}

/**
 * Utility to clear filters for a page
 */
export function clearFilters(pageKey: string): void {
  const storageKey = `${FILTER_STORAGE_KEY_PREFIX}${pageKey}`;
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to clear filters:", error);
  }
}
