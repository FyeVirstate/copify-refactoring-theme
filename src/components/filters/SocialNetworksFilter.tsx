"use client";

import { useState } from "react";
import FilterDropdown, { FilterApplyButton } from "./FilterDropdown";
import FilterCheckboxList from "./FilterCheckboxList";
import Image from "next/image";

interface SocialNetworksFilterProps {
  selectedSocialNetworks: string[];
  onSocialNetworksChange: (networks: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

const socialNetworks = [
  { id: "Facebook", label: "Facebook", logo: "/img/socials/facebook.svg" },
  { id: "Instagram", label: "Instagram", logo: "/img/socials/instagram.svg" },
  { id: "TikTok", label: "TikTok", logo: "/img/socials/tiktok.svg" },
  { id: "YouTube", label: "YouTube", logo: "/img/socials/google.svg" },
  { id: "Pinterest", label: "Pinterest", logo: "/img/socials/pinterest.svg" },
  { id: "Twitter", label: "Twitter / X", logo: "/img/socials/twitter-x-line.svg" },
  { id: "Snapchat", label: "Snapchat", logo: "/img/socials/snapchat.svg" },
  { id: "Reddit", label: "Reddit", logo: "/img/socials/reddit.svg" },
];

export default function SocialNetworksFilter({ 
  selectedSocialNetworks, 
  onSocialNetworksChange,
  onOpenChange,
  onApply,
  isActive = false
}: SocialNetworksFilterProps) {

  const networksWithIcons = socialNetworks.map(network => ({
    ...network,
    icon: (
      <Image 
        src={network.logo} 
        alt={network.label} 
        width={20} 
        height={20}
        className="rounded"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    )
  }));

  return (
    <FilterDropdown
      label="Réseaux sociaux"
      icon="ri-share-line"
      onOpenChange={onOpenChange}
      isActive={isActive || selectedSocialNetworks.length > 0}
      badge={selectedSocialNetworks.length > 0 ? selectedSocialNetworks.length : undefined}
      forceAlignEnd={true}
    >
      <p className="fw-500 mb-2">Réseaux sociaux</p>

      <FilterCheckboxList
        items={networksWithIcons}
        selectedItems={selectedSocialNetworks}
        onItemsChange={onSocialNetworksChange}
        searchPlaceholder="Rechercher des réseaux..."
        showIncludeExclude={true}
        groupName="socialNetworksCheckboxes"
      />

      <FilterApplyButton onClick={() => onApply?.()}>
        Appliquer
      </FilterApplyButton>
    </FilterDropdown>
  );
}
