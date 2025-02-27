'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { CampaignType } from '@/types/campaign';

export default function CreateCampaignPage() {
  const searchParams = useSearchParams();
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null);
  
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam !== null) {
      setCampaignType(Number(typeParam) as CampaignType);
    }
  }, [searchParams]);

  const getCampaignTypeTitle = () => {
    switch (campaignType) {
      case CampaignType.AnythingHelps:
        return "Anything Helps Campaign";
      case CampaignType.Goal:
        return "Goal-Based Campaign";
      case CampaignType.PerPerson:
        return "Per Person Campaign";
      default:
        return "Create Campaign";
    }
  };

  return (
    <main>
      <Navbar />
      <div className="container mx-auto pt-32 pb-16 px-4">
        <h1 className="text-3xl font-bold mb-8">{getCampaignTypeTitle()}</h1>
        
        {campaignType !== null ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {/* Campaign creation form will go here */}
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campaign Name
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                  placeholder="Enter campaign name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                  rows={4}
                  placeholder="Describe your campaign"
                />
              </div>
              
              {/* Add more fields based on campaign type */}
              {campaignType === CampaignType.Goal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Goal Amount (ETH)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                    placeholder="Enter goal amount"
                  />
                </div>
              )}
              
              {campaignType === CampaignType.PerPerson && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Maximum Number of Donors
                  </label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                    placeholder="Enter maximum number of donors"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Deadline
                </label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                />
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => {}}>Create Campaign</Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300">
              Please select a campaign type to continue.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
} 