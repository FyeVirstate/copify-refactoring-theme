"use client";

import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

interface MiniChartProps {
  data: number[];
  dates?: string[];
  trend?: "up" | "down" | "neutral";
  color?: string;
  width?: number;
  height?: number;
  showTooltip?: boolean;
  label?: string; // "visites", "ads actives", etc.
}

let chartIdCounter = 0;

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString('fr-FR');
};

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const parts = dateStr.split(/[-/]/);
      if (parts.length >= 2) {
        const year = parseInt(parts[0]) > 1900 ? parts[0] : parts[2];
        const month = parseInt(parts[0]) > 1900 ? parts[1] : parts[0];
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      }
      return dateStr;
    }
    return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const generateDates = (count: number): string[] => {
  const dates: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    dates.push(d.toISOString());
  }
  return dates;
};

// Custom Tooltip component
const CustomChartTooltip = ({ active, payload, valueLabel, trendColor }: { active?: boolean; payload?: readonly any[]; valueLabel?: string; trendColor?: string }) => {
  if (!active || !payload || !payload.length) return null;
  
  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;
  
  const value = dataPoint.value || 0;
  const dateStr = dataPoint.date ? formatDate(dataPoint.date) : null;
  
  return (
    <div 
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        padding: '6px 10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        border: '1px solid #E5E7EB',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      {dateStr && (
        <div style={{ fontSize: 10, color: '#111827', fontWeight: 500, marginBottom: 2 }}>
          {dateStr}
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 600, color: trendColor || '#22C55E' }}>
        {formatNumber(value)} {valueLabel || ''}
      </div>
    </div>
  );
};

export default function MiniChart({ 
  data, 
  dates,
  trend = "neutral", 
  color,
  width = 100,
  height = 40,
  showTooltip = true,
  label = "",
}: MiniChartProps) {
  const gradientId = useMemo(() => `mini-chart-gradient-${chartIdCounter++}`, []);
  
  const trendColor = trend === "up" 
    ? "#10b981"
    : trend === "down" 
    ? "#ef4444"
    : "#6b7280";
  
  const strokeColor = color || trendColor;
  
  // Only show last 3 months of data
  const recentData = data.slice(-3);
  
  // Use REAL dates from database if provided, otherwise generate
  let recentDates: string[];
  if (dates && dates.length > 0) {
    recentDates = dates.slice(-3); // Real dates from DB
  } else {
    recentDates = generateDates(recentData.length); // Fallback only
  }
  
  const chartData = recentData.map((value, index) => ({
    index,
    value: value || 0,
    date: recentDates[index] || null,
  }));

  if (!chartData.length || chartData.every(d => d.value === 0)) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>-</span>
      </div>
    );
  }

  return (
    <div style={{ width, height, position: 'relative', overflow: 'visible' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={chartData} 
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showTooltip && (
            <Tooltip 
              content={({ active, payload }) => (
                <CustomChartTooltip active={active} payload={payload} valueLabel={label} trendColor={strokeColor} />
              )}
              cursor={{ stroke: '#D1D5DB', strokeWidth: 1 }}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ 
                zIndex: 99999, 
                visibility: 'visible',
                pointerEvents: 'none',
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, fill: strokeColor, stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
