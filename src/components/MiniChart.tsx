"use client";

interface MiniChartProps {
  data: number[];
  trend?: "up" | "down" | "neutral";
  color?: string;
  width?: number;
  height?: number;
}

export default function MiniChart({ 
  data, 
  trend = "neutral", 
  color,
  width = 100,
  height = 40 
}: MiniChartProps) {
  const trendColor = trend === "up" 
    ? "#10b981" // green
    : trend === "down" 
    ? "#ef4444" // red
    : "#6b7280"; // gray
  
  const strokeColor = color || trendColor;
  
  // Normalize data to fit in the SVG viewport
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;
  
  // Create path for the line chart
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  
  const pathData = `M ${points}`;

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

