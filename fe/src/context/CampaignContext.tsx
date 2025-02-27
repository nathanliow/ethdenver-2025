'use client';

import React, { createContext, useContext, useState } from 'react';
import { CampaignType } from '@/types/campaign';

type CampaignContextType = {
  selectedType: CampaignType;
  setSelectedType: (type: CampaignType) => void;
};

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [selectedType, setSelectedType] = useState<CampaignType>(CampaignType.AnythingHelps);

  return (
    <CampaignContext.Provider value={{ selectedType, setSelectedType }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaignContext() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaignContext must be used within a CampaignProvider');
  }
  return context;
} 