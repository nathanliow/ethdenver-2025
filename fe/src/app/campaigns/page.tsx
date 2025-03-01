'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import CampaignCard from '@/components/campaign/CampaignCard';
import { Campaign } from '@/types/campaign';
import { getContract } from "thirdweb";
import { useReadContract } from "thirdweb/react";
import { NETWORK_CONFIG } from '@/Consts';
import { baseSepolia } from "thirdweb/chains";
import { ThirdwebClient } from '../ThirdWebClient';

// Contract configuration
export default function CampaignsPage() {
  const [selectedNetwork, setSelectedNetwork] = useState<'BASE_SEPOLIA'>('BASE_SEPOLIA');

  // Read all campaigns from the contract
  const contract = getContract({
    client: ThirdwebClient, 
    chain: baseSepolia,
    address: NETWORK_CONFIG[selectedNetwork].contractAddress,
  });

  console.log("contract", contract);

  const { data: campaignsData, isLoading } = useReadContract({
    contract: contract,
    method: "function getAllCampaigns() external view returns (Campaign[])",
    params: [],
  });
  console.log("campaignsData", campaignsData);
  // Transform contract data to our Campaign type
  const campaigns = React.useMemo(() => {
    if (!campaignsData) return [] as Campaign[];
    
    return campaignsData.map((campaign: any) => ({
      id: campaign.id.toString(),
      campaignType: campaign.campaignType,
      isActive: new Date() < new Date(Number(campaign.deadline) * 1000),
      token: campaign.token,
      name: campaign.name,
      image: campaign.image || '/placeholder.jpg',
      description: campaign.description,
      balance: Number(campaign.balance),
      deadline: new Date(Number(campaign.deadline) * 1000), // Convert from Unix timestamp
      numDonors: Number(campaign.numDonors),
      donors: campaign.donors,
      goal: Number(campaign.goal),
      maxDonors: Number(campaign.maxDonors),
      recipient: campaign.recipient,
      numDonations: Number(campaign.numDonations),
      creator: campaign.creator,
    }));
  }, [campaignsData]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="pt-16">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              All Campaigns
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Discover and support campaigns that matter
            </p>
          </div>

          {/* Filters Section (can be expanded later) */}
          <div className="mb-8">
            <div className="flex gap-4">
              <select className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="all">All Categories</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              
              <select className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mostFunded">Most Funded</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <p className="text-gray-600 dark:text-gray-400">
                Loading campaigns...
              </p>
            </div>
          )}

          {/* Campaigns Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {campaigns.map((campaign) => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={{
                    ...campaign,
                    deadline: Number(new Date(campaign.deadline).getTime())
                  }} 
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && campaigns.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No campaigns found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are currently no active campaigns.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 