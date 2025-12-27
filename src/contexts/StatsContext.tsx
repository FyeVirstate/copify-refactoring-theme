"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface UserStats {
  plan: {
    identifier: string;
    title: string;
    isOnTrial: boolean;
    isExpired: boolean;
    trialDaysRemaining: number;
    isPro: boolean;
    isBasic: boolean;
    isUnlimited: boolean;
  };
  trackedShops: {
    used: number;
    limit: number;
    isUnlimited: boolean;
  };
  productExports: {
    used: number;
    limit: number;
    remaining: number;
    isUnlimited: boolean;
  };
  storeGeneration: {
    used: number;
    limit: number;
    remaining: number;
    isUnlimited: boolean;
  };
}

interface StatsContextType {
  stats: UserStats | null;
  loading: boolean;
  refreshStats: () => Promise<void>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return (
    <StatsContext.Provider value={{ stats, loading, refreshStats }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}

