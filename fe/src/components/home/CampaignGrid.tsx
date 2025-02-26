import React from 'react';
import CampaignCard from '../campaign/CampaignCard';
import { Campaign } from '../../types/campaign';

type CampaignGridProps = {
  campaigns: Campaign[];
};

export default function CampaignGrid({ campaigns }: CampaignGridProps) {
  return (
    <section className="py-20 px-8 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Featured Campaigns
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </div>
    </section>
  );
} 