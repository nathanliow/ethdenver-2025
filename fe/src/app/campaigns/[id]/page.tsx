'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import { Campaign, CampaignType } from '@/types/campaign';

export default function CampaignPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  // Early return if no id exists
  if (!id) {
    return <div>Campaign not found</div>;
  }

  // TODO: Replace with actual data fetching
  const campaign: Campaign = {
    id: parseInt(id),
    campaignType: CampaignType.Goal,
    isActive: true,
    name: "Clean Ocean Initiative",
    image: "/images/ocean-cleanup.jpg",
    description: "Help us clean the oceans and protect marine life. Our goal is to remove 10,000 kg of plastic from the ocean this year.",
    balance: 3.2 * 1e18,
    goal: 5 * 1e18,
    deadline: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    numDonors: 28,
    donors: [],
    maxDonors: 0,
    recipient: "0x1234567890123456789012345678901234567890",
    numDonations: 32
  };

  const progressPercentage = (campaign.balance / campaign.goal) * 100;
  const deadlineDate = new Date(campaign.deadline * 1000);
  const formattedDeadline = deadlineDate.toLocaleDateString();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Campaign Header */}
          <div className="relative w-full h-[400px] rounded-2xl overflow-hidden mb-8">
            <Image
              src={campaign.image}
              alt={campaign.name}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>

          {/* Campaign Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <h1 className="text-3xl font-bold mb-4">{campaign.name}</h1>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <span>Created by {campaign.recipient.slice(0, 6)}...{campaign.recipient.slice(-4)}</span>
              <span>•</span>
              <span>Ends {formattedDeadline}</span>
            </div>

            <div className="prose dark:prose-invert max-w-none mb-8">
              <p>{campaign.description}</p>
            </div>

            {/* Progress Section */}
            <div className="space-y-4 mb-8">
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between">
                <div>
                  <p className="text-2xl font-bold">{(campaign.balance / 1e18).toFixed(2)} ETH</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    raised of {(campaign.goal / 1e18).toFixed(2)} ETH goal
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{campaign.numDonors}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">donors</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button className="flex-1 py-4">Donate Now</Button>
              <Button 
                variant="secondary" 
                className="px-4"
                onClick={() => router.push('/campaigns')}
              >
                Back to Campaigns
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
