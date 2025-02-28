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
        className={`bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90 transition-all duration-300 shadow-lg rounded-2xl ${className}`}
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