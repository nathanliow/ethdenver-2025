"use client";

import React, { useState } from 'react';
import Button from '../ui/Button';
import CampaignTypeModal from './CampaignTypeModal';
import { CampaignType } from '@/types/campaign';
import { useRouter } from 'next/navigation';
import { useCampaignContext } from '@/context/CampaignContext';

type CreateCampaignButtonProps = {
  className?: string;
};

export default function CreateCampaignButton({ className }: CreateCampaignButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { setSelectedType } = useCampaignContext();

  const handleCampaignTypeSelect = (type: CampaignType) => {
    setSelectedType(type);
    setIsModalOpen(false);
    router.push('/create-campaign');
  };

  return (
    <>
      <Button 
        className={className} 
        onClick={() => setIsModalOpen(true)}
      >
        Create Campaign
      </Button>
      
      <CampaignTypeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleCampaignTypeSelect}
      />
    </>
  );
} 