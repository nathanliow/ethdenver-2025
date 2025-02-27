'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import CampaignCard from '@/components/campaign/CampaignCard';
import { Campaign } from '@/types/campaign';

export default function CampaignsPage() {
  // TODO: Replace with actual campaign data fetching
  const campaigns: Campaign[] = [
    // Temporary mock data
    {
      id: '1',
      name: 'Example Campaign 1',
      description: 'This is an example campaign description.',
      targetAmount: 5,
      currentAmount: 2,
      deadline: new Date('2024-12-31'),
      creator: '0x123...',
      imageUrl: '/placeholder.jpg',
    },
    // Add more mock campaigns as needed
  ];

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

          {/* Campaigns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>

          {/* Empty State */}
          {campaigns.length === 0 && (
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