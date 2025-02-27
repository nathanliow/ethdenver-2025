"use client";

import React, { useState } from 'react';
import Button from '../ui/Button';
import CampaignTypeModal from './CampaignTypeModal';
import { CampaignType } from '@/types/campaign';
import { useRouter } from 'next/navigation';

type CreateCampaignButtonProps = {
  className?: string;
};

export default function CreateCampaignButton({ className }: CreateCampaignButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleCampaignTypeSelect = (type: CampaignType) => {
    // Navigate to the campaign creation page with the selected type
    router.push(`/create-campaign?type=${type}`);
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