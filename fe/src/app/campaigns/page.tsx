'use client';

import React, { useEffect, useState } from 'react';
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
  const [loadedCampaigns, setLoadedCampaigns] = useState<any[]>([]);

  // Read all campaigns from the contract
  const contract = getContract({
    client: ThirdwebClient, 
    chain: baseSepolia,
    address: NETWORK_CONFIG[selectedNetwork].contractAddress,
  });

  console.log("contract", contract);

  const { data: campaignsData, isLoading } = useReadContract({
    contract,
    method: "function getAllCampaigns() external view returns (Campaign[])",
    params: [],
  });

  // Update loadedCampaigns when campaignsData changes and is not undefined
  useEffect(() => {
    if (!isLoading && campaignsData) {
      console.log("campaignsData2, isLoading", campaignsData, isLoading);
    }
  }, [isLoading]);

  // Transform contract data to our Campaign type
  const campaigns = React.useMemo(() => {
    // Example campaigns for development/testing
    const exampleCampaigns: Campaign[] = [
      {
        id: 1,
        campaignType: 0, // Standard campaign
        isActive: true,
        token: "0x0000000000000000000000000000000000000000",
        name: "Local Garden Donation",
        image: "https://aggregator.walrus-testnet.walrus.space/v1/blobs/zbKWfD_dVGzL4ekJMn1iISezkIfvm4dH_g1tPj9jeZ8",
        description: "Help us keep our local garden open by contributing any amount you can.",
        balance: 20,
        deadline: 1740962600, // 30 days from now
        numDonors: 25,
        donors: [],
        goal: 5.0,
        maxDonors: 100,
        recipient: "0x1234567890123456789012345678901234567890",
        numDonations: 30,
        creator: "0x9876543210987654321098765432109876543210",
      },
      { 
        id: 2,
        campaignType: 1, // First-come-first-served
        isActive: true,
        token: "0x0000000000000000000000000000000000000000",
        name: "New City Library",
        image: "https://aggregator.walrus-testnet.walrus.space/v1/blobs/OIux3OMn-8lajczhb6CX6RoaHrEJwv6hxc87PprsBI4",
        description: "Help us build a library in the heart of the city.",
        balance: 30,
        deadline: 1742964632,
        numDonors: 15,
        donors: [],
        goal: 3.0,
        maxDonors: 50,
        recipient: "0x2345678901234567890123456789012345678901",
        numDonations: 18,
        creator: "0x8765432109876543210987654321098765432109",
      },
      {
        id: 3,
        campaignType: 2,
        isActive: false, // Completed campaign
        token: "0x0000000000000000000000000000000000000000",
        name: "Church Retreat Trip",
        image: "https://aggregator.walrus-testnet.walrus.space/v1/blobs/lFAMx4f0vtNqboa20df0KQRHertjqLMbOC0Ylv_W-0U",
        description: "Support our local animal shelter in providing emergency care and housing for rescued pets.",
        balance: 10,
        deadline: 1747964632, 
        numDonors: 150,
        donors: [],
        goal: 10.0,
        maxDonors: 200,
        recipient: "0x3456789012345678901234567890123456789012",
        numDonations: 180,
        creator: "0x7654321098765432109876543210987654321098",
      },
      {
        id: 4,
        campaignType: 3,
        isActive: true,
        token: "0x0000000000000000000000000000000000000000",
        name: "Frat House Retreat at Cancun",
        image: "https://aggregator.walrus-testnet.walrus.space/v1/blobs/H86J5Gix-4oOqVfj6vs6C5f5HCjEUT531NR7XCgAqEs",
        description: "Join our frat house retreat at Cancun!",
        balance: 20,
        deadline: 1740964632, // 45 days from now
        numDonors: 5,
        donors: [],
        goal: 8.0,
        maxDonors: 75,
        recipient: "0x4567890123456789012345678901234567890123",
        numDonations: 7,
        creator: "0x6543210987654321098765432109876543210987",
      },
    ];

    if (loadedCampaigns.length === 0) return exampleCampaigns;
    
    return loadedCampaigns.map((campaign: any) => ({
      id: campaign.id.toString(),
      campaignType: campaign.campaignType,
      isActive: new Date() < new Date(Number(campaign.deadline) * 1000),
      token: campaign.token,
      name: campaign.name,
      image: campaign.image || '/placeholder.jpg',
      description: campaign.description,
      balance: Number(campaign.balance),
      deadline: new Date(Number(campaign.deadline)), // Convert from Unix timestamp
      numDonors: Number(campaign.numDonors),
      donors: campaign.donors,
      goal: Number(campaign.goal),
      maxDonors: Number(campaign.maxDonors),
      recipient: campaign.recipient,
      numDonations: Number(campaign.numDonations),
      creator: campaign.creator,
    }));
  }, [loadedCampaigns]);

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