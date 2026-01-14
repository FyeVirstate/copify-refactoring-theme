"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import { RegenerateButton } from "./RegenerateButton";
import { ImageSelector } from "./ImageSelector";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  successField,
  errorField,
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

  // Helper to get field class names with success/error states
  const getFieldClassName = (fieldName: string, hasButton = true) => {
    let className = 'form-control form-control-sm';
    if (hasButton) className += ' form-control-w-side-button';
    if (regeneratingField === fieldName) className += ' field-regenerating';
    if (successField === fieldName) className += ' field-success';
    if (errorField === fieldName) className += ' field-error';
    return className;
  };

  return (
    <TooltipProvider>
      <div>
        {/* Section Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="mb-0 fs-lg fw-600">Comment Faire</p>
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
          isSuccess={successField === 'timelineHeading'}
          isError={errorField === 'timelineHeading'}
          disabled={!!regeneratingField}
          placeholder="Step Into Superior Comfort and Performance"
        />

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Timeline Points */}
        <p className="mb-2 fs-small fw-500 text-muted">Points de la Timeline (max 5)</p>
        {timeline.slice(0, 5).map((point, index) => {
          const timeframeField = `timeline[${index}][timeframe]`;
          const descriptionField = `timeline[${index}][description]`;
          
          return (
            <div key={index} className="card mb-3 p-3">
              {/* Title */}
              <div className="mb-2">
                <label className="form-label text-dark fw-500 mb-1 fs-xs">
                  <i className="ri-bookmark-line me-1 text-light-gray"></i>
                  Titre {index + 1}
                </label>
                <div className="position-relative input-with-regenerate">
                  <input
                    type="text"
                    className={getFieldClassName(timeframeField, true)}
                    value={point.timeframe || ''}
                    onChange={(e) => updateTimelinePoint(index, 'timeframe', e.target.value)}
                    placeholder="Point title"
                    maxLength={50}
                    disabled={regeneratingField === timeframeField}
                  />
                  <RegenerateButton
                    onClick={() => regenerateField(timeframeField, point.timeframe || '')}
                    disabled={!!regeneratingField}
                    isRegenerating={regeneratingField === timeframeField}
                    isError={errorField === timeframeField}
                    position="middle"
                  />
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="form-label text-dark fw-500 mb-1 fs-xs">
                  <i className="ri-file-text-line me-1 text-light-gray"></i>
                  Description
                </label>
                <div className="position-relative input-with-regenerate">
                  <input
                    type="text"
                    className={getFieldClassName(descriptionField, true)}
                    value={point.description || ''}
                    onChange={(e) => updateTimelinePoint(index, 'description', e.target.value)}
                    placeholder="Point description"
                    maxLength={100}
                    disabled={regeneratingField === descriptionField}
                  />
                  <RegenerateButton
                    onClick={() => regenerateField(descriptionField, point.description || '')}
                    disabled={!!regeneratingField}
                    isRegenerating={regeneratingField === descriptionField}
                    isError={errorField === descriptionField}
                    position="middle"
                  />
                </div>
              </div>
            </div>
          );
        })}

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
    </TooltipProvider>
  );
};

export default TimelineSection;
