"use client";

import React, { useState } from 'react';
import Button from '../ui/Button';
import CampaignTypeModal from './CampaignTypeModal';
import { CampaignType } from '@/types/campaign';
import { useRouter } from 'next/navigation';
import { useCampaignContext } from '@/context/CampaignContext';
import { useSession } from 'next-auth/react';

type CreateCampaignButtonProps = {
  className?: string;
};

export default function CreateCampaignButton({ className }: CreateCampaignButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();
  const { setSelectedType } = useCampaignContext();
  const { data: session } = useSession();

  const verifyCredential = async () => {
    try {
      setIsVerifying(true);
      
      // Get the stored credential
      const storedCredential = localStorage.getItem('humanityCredential');
      if (!storedCredential) {
        throw new Error('No credential found');
      }
  
      const credential = JSON.parse(storedCredential);
  
      const response = await fetch('/api/credentials/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential })
      });

      if (!response.ok) {
        throw new Error('Credential verification failed');
      }

      return true;
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!session) {
      // Handle not logged in state
      alert('Please log in to create a campaign');
      return;
    }

    const isVerified = await verifyCredential();
    
    if (isVerified) {
      setIsModalOpen(true);
    } else {
      alert('You need a valid credential to create a campaign. Please verify your identity first.');
    }
  };

  const handleCampaignTypeSelect = (type: CampaignType) => {
    setSelectedType(type);
    setIsModalOpen(false);
    router.push('/create-campaign');
  };

  return (
    <>
      <Button 
        className={`bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90 transition-all duration-300 shadow-lg rounded-2xl ${className}`}
        onClick={handleCreateCampaign}
        isDisabled={isVerifying}
      >
        {isVerifying ? 'Verifying...' : 'Create Campaign'}
      </Button>
      
      <CampaignTypeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleCampaignTypeSelect}
      />
    </>
  );
} 