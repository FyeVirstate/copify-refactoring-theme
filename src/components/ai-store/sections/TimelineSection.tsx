"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import { ImageSelector } from "./ImageSelector";
import type { SectionProps } from "./types";

interface TimelinePoint {
  timeframe: string;
  description: string;
}

interface TimelineSectionProps extends SectionProps {
  timeline?: TimelinePoint[];
}

/**
 * Timeline Section - matches Laravel _timeline-section.blade.php
 * Maps to timeline-points section in theme
 */
export const TimelineSection: React.FC<TimelineSectionProps> = ({
  content,
  updateField,
  regenerateField,
  regeneratingField,
  images = [],
  onEditImage,
  onGenerateImage,
}) => {
  const defaultTimeline: TimelinePoint[] = [
    { timeframe: 'High Quality Materials', description: 'Made with premium materials built to last' },
    { timeframe: 'Easy to Use Design', description: 'Intuitive design makes this product simple to use' },
    { timeframe: 'Long-Term Value', description: 'A smart investment that pays for itself over time' },
    { timeframe: 'What Makes Us Different', description: 'Thick cushioned sole + breathable design = all-day comfort' },
    { timeframe: 'Lasting Results', description: 'Experience the difference that keeps on giving' },
  ];

  const timeline = ((content as any).timeline as TimelinePoint[]) || defaultTimeline;

  const updateTimelinePoint = (index: number, field: 'timeframe' | 'description', value: string) => {
    const newTimeline = [...timeline];
    if (!newTimeline[index]) newTimeline[index] = { timeframe: '', description: '' };
    newTimeline[index][field] = value;
    updateField('timeline', newTimeline);
  };

  return (
    <div>
      {/* Section Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="mb-0 fs-lg fw-600">Section Timeline</p>
        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Section Heading */}
      <AIInputField
        label="Titre de la Section"
        icon="ri-text"
        value={(content as any).timelineHeading || ''}
        onChange={(val) => updateField('timelineHeading', val)}
        onRegenerate={() => regenerateField('timelineHeading', (content as any).timelineHeading || '')}
        isRegenerating={regeneratingField === 'timelineHeading'}
        placeholder="Step Into Superior Comfort and Performance"
      />

      {/* Divider */}
      <div className="horizontal-solid-divider border-top my-3"></div>

      {/* Timeline Points */}
      <p className="mb-2 fs-small fw-500 text-muted">Points de la Timeline (max 5)</p>
      {timeline.slice(0, 5).map((point, index) => (
        <div key={index} className="card mb-3 p-3">
          {/* Title */}
          <div className="mb-2">
            <label className="form-label text-dark fw-500 mb-1 fs-xs">
              <i className="ri-bookmark-line me-1 text-light-gray"></i>
              Titre {index + 1}
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={point.timeframe || ''}
              onChange={(e) => updateTimelinePoint(index, 'timeframe', e.target.value)}
              placeholder="Point title"
              maxLength={50}
            />
          </div>
          {/* Description */}
          <div>
            <label className="form-label text-dark fw-500 mb-1 fs-xs">
              <i className="ri-file-text-line me-1 text-light-gray"></i>
              Description
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={point.description || ''}
              onChange={(e) => updateTimelinePoint(index, 'description', e.target.value)}
              placeholder="Point description"
              maxLength={100}
            />
          </div>
        </div>
      ))}

      {/* Image Selection */}
      <div className="horizontal-solid-divider border-top my-3"></div>
      <ImageSelector
        images={images}
        selectedImages={(content.timelineImage ? [content.timelineImage as string] : [])}
        sectionLabel="Image de Notre Produit"
        inputType="radio"
        onSelect={(selected) => updateField('timelineImage', selected[0])}
        onEditImage={onEditImage}
        onGenerateAI={onGenerateImage}
      />
    </div>
  );
};

export default TimelineSection;
