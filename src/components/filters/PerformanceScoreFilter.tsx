"use client";

import FilterDropdown, { FilterApplyButton } from "./FilterDropdown";

// Score levels mapped to active ads count ranges
// This is a reasonable proxy: more active ads = better performing shop
export const SCORE_RANGES: Record<string, { min: number; max?: number }> = {
  "5-stars": { min: 100 },      // 100+ active ads
  "4-stars": { min: 50, max: 99 },  // 50-99 active ads
  "3-stars": { min: 20, max: 49 },  // 20-49 active ads
  "2-stars": { min: 10, max: 19 },  // 10-19 active ads
  "1-star": { min: 1, max: 9 },     // 1-9 active ads
};

// Helper function to convert scores to active ads filter range
export function getActiveAdsRangeFromScores(scores: string[]): { min?: number; max?: number } {
  if (scores.length === 0) return {};
  
  let min: number | undefined = undefined;
  let max: number | undefined = undefined;
  
  for (const score of scores) {
    const range = SCORE_RANGES[score];
    if (range) {
      if (min === undefined || range.min < min) {
        min = range.min;
      }
      if (range.max !== undefined) {
        if (max === undefined || range.max > max) {
          max = range.max;
        }
      } else {
        max = undefined; // If any score has no max, remove the upper bound
      }
    }
  }
  
  return { min, max };
}

interface PerformanceScoreFilterProps {
  selectedScores: string[];
  onScoresChange: (scores: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

export default function PerformanceScoreFilter({ 
  selectedScores, 
  onScoresChange,
  onOpenChange, 
  onApply, 
  isActive 
}: PerformanceScoreFilterProps) {

  const handleToggle = (scoreId: string) => {
    if (selectedScores.includes(scoreId)) {
      onScoresChange(selectedScores.filter(id => id !== scoreId));
    } else {
      onScoresChange([...selectedScores, scoreId]);
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
  };

  const scores = [
    { 
      id: "5-stars",
      numStars: 5,
      color: "#10b981",
      bgColor: "#D1FAE5",
      dotColor: "#86EFAC"
    },
    { 
      id: "4-stars",
      numStars: 4,
      color: "#10b981",
      bgColor: "#D1FAE5",
      dotColor: "#86EFAC"
    },
    { 
      id: "3-stars",
      numStars: 3,
      color: "#fbbf24",
      bgColor: "#FEF3C7",
      dotColor: "#FCD34D"
    },
    { 
      id: "2-stars",
      numStars: 2,
      color: "#ef4444",
      bgColor: "#FEE2E2",
      dotColor: "#FCA5A5"
    },
    { 
      id: "1-star",
      numStars: 1,
      color: "#ef4444",
      bgColor: "#FEE2E2",
      dotColor: "#FCA5A5"
    },
  ];

  return (
    <FilterDropdown
      icon="ri-star-smile-line"
      label="Score de performance"
      title="Score de performance"
      width="400px"
      onOpenChange={onOpenChange}
      isActive={isActive || selectedScores.length > 0}
    >
      <div className="mb-3 p-2 d-flex align-items-start gap-2" style={{ backgroundColor: '#F5F7FA', border: 'none', borderRadius: '8px' }}>
        <i className="ri-information-line" style={{ color: '#99A0AE', fontSize: '14px', marginTop: '2px' }}></i>
        <span style={{ color: '#6B7280', fontSize: '11px', lineHeight: '1.4' }}>
          Cette évaluation est basée sur la portée de l'annonce et sa date de lancement. Les annonces avec une portée plus élevée et plus récentes reçoivent de meilleures évaluations.
        </span>
      </div>

      <div className="mb-3">
        {scores.map((score) => {
          return (
            <div key={score.id} className="form-check mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id={score.id}
                checked={selectedScores.includes(score.id)}
                onChange={() => handleToggle(score.id)}
              />
              <label className="form-check-label" htmlFor={score.id}>
                <div 
                  className="d-inline-flex align-items-center px-2 py-1 rounded"
                  style={{ backgroundColor: score.bgColor, gap: '8px' }}
                >
                  {[...Array(5)].map((_, idx) => (
                    idx < score.numStars ? (
                      <i 
                        key={idx}
                        className="ri-star-fill"
                        style={{ color: score.color, fontSize: '14px' }}
                      ></i>
                    ) : (
                      <span 
                        key={idx}
                        style={{ 
                          width: '5px', 
                          height: '5px', 
                          borderRadius: '50%', 
                          backgroundColor: score.dotColor,
                          display: 'inline-block',
                          opacity: 0.5
                        }}
                      ></span>
                    )
                  ))}
                </div>
              </label>
            </div>
          );
        })}
      </div>
      
      <FilterApplyButton onClick={handleApply}>
        Appliquer les filtres
      </FilterApplyButton>
    </FilterDropdown>
  );
}
