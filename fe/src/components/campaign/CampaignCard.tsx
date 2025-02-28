import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Campaign, CampaignType } from '../../types/campaign';

type CampaignCardProps = {
  campaign: Campaign;
};

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const router = useRouter();

  // Helper to format campaign type
  const getCampaignTypeLabel = (type: CampaignType) => {
    switch (type) {
      case CampaignType.AnythingHelps:
        return 'Anything Helps';
      case CampaignType.Goal:
        return 'Goal Based';
      case CampaignType.PerPerson:
        return 'Per Person';
      default:
        return 'Campaign';
    }
  };

  // Calculate progress percentage
  const progressPercentage = (campaign.balance / campaign.goal) * 100;
  
  // Format deadline
  const deadlineDate = new Date(campaign.deadline * 1000);
  const formattedDeadline = deadlineDate.toLocaleDateString();
  
  return (
    <div 
      className="cursor-pointer transition-transform hover:scale-[1.02]"
      onClick={() => router.push(`/campaigns/${campaign.id}`)}
    >
      <Card className="h-full flex flex-col">
        <div className="relative w-full h-48">
          <Image
            src={campaign.image || '/placeholder-campaign.jpg'}
            alt={campaign.name}
            fill
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded">
            {getCampaignTypeLabel(campaign.campaignType)}
          </div>
        </div>
        
        <div className="p-6 flex-grow flex flex-col" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-2">{campaign.name}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{campaign.description}</p>
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2">
            <div 
              className="h-full bg-indigo-600 rounded-full" 
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm mb-4">
            <span className="font-medium">{(campaign.balance / 1e18).toFixed(2)} ETH raised</span>
            <span className="text-gray-600 dark:text-gray-300">of {(campaign.goal / 1e18).toFixed(2)} ETH</span>
          </div>
          
          <div className="flex justify-between text-sm mb-6">
            <span>
              <span className="font-medium">{campaign.numDonors}</span> Donors
            </span>
            <span>
              Ends: <span className="font-medium">{formattedDeadline}</span>
            </span>
          </div>
          
          <Button 
            className="w-full mt-auto"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/campaigns/${campaign.id}`);
            }}
          >
            Donate Now
          </Button>
        </div>
      </Card>
    </div>
  );
} 