"use client";

import React, { useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import CampaignGrid from '@/components/home/CampaignGrid';
import { Campaign, CampaignType } from '@/types/campaign';
import { signOut, useSession } from 'next-auth/react';
import { useOkto } from '@okto_web3/react-sdk';

// Sample campaign data (to be replaced with actual data from the contract)
const sampleCampaigns: Campaign[] = [
  {
    id: 1,
    campaignType: CampaignType.Goal,
    isActive: true,
    name: "Clean Ocean Initiative",
    image: "/images/ocean-cleanup.jpg",
    description: "Help us clean the oceans and protect marine life. Our goal is to remove 10,000 kg of plastic from the ocean this year.",
    balance: 3.2 * 1e18,
    goal: 5 * 1e18,
    deadline: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
    numDonors: 28,
    donors: [],
    maxDonors: 0,
    recipient: "0x1234567890123456789012345678901234567890",
    numDonations: 32
  },
  {
    id: 2,
    campaignType: CampaignType.AnythingHelps,
    isActive: true,
    name: "Tech Education for Kids",
    image: "/images/tech-education.jpg",
    description: "Providing resources and workshops to teach coding and digital literacy to underprivileged children.",
    balance: 1.8 * 1e18,
    goal: 3 * 1e18,
    deadline: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60, // 60 days from now
    numDonors: 15,
    donors: [],
    maxDonors: 0,
    recipient: "0x1234567890123456789012345678901234567890",
    numDonations: 17
  },
  {
    id: 3,
    campaignType: CampaignType.PerPerson,
    isActive: true,
    name: "Community Art Festival",
    image: "/images/art-festival.jpg",
    description: "Support a local art festival featuring works from emerging artists. Each supporter contributes equally to make this event possible.",
    balance: 4.5 * 1e18,
    goal: 6 * 1e18,
    deadline: Math.floor(Date.now() / 1000) + 45 * 24 * 60 * 60, // 45 days from now
    numDonors: 45,
    donors: [],
    maxDonors: 60,
    recipient: "0x1234567890123456789012345678901234567890",
    numDonations: 45
  },
  {
    id: 4,
    campaignType: CampaignType.Goal,
    isActive: true,
    name: "Renewable Energy Research",
    image: "/images/renewable-energy.jpg",
    description: "Funding cutting-edge research in renewable energy solutions to combat climate change.",
    balance: 8.2 * 1e18,
    goal: 10 * 1e18,
    deadline: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90 days from now
    numDonors: 112,
    donors: [],
    maxDonors: 0,
    recipient: "0x1234567890123456789012345678901234567890",
    numDonations: 130
  },
  {
    id: 5,
    campaignType: CampaignType.AnythingHelps,
    isActive: true,
    name: "Animal Shelter Support",
    image: "/images/animal-shelter.jpg",
    description: "Help us provide food, medical care, and shelter for abandoned and rescued animals.",
    balance: 2.5 * 1e18,
    goal: 4 * 1e18,
    deadline: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
    numDonors: 62,
    donors: [],
    maxDonors: 0,
    recipient: "0x1234567890123456789012345678901234567890",
    numDonations: 75
  },
  {
    id: 6,
    campaignType: CampaignType.PerPerson,
    isActive: true,
    name: "Community Garden Project",
    image: "/images/community-garden.jpg",
    description: "Creating a shared garden space in our neighborhood where residents can grow fresh produce and build community.",
    balance: 1.2 * 1e18,
    goal: 3 * 1e18,
    deadline: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60, // 60 days from now
    numDonors: 12,
    donors: [],
    maxDonors: 30,
    recipient: "0x1234567890123456789012345678901234567890",
    numDonations: 12
  }
];

export default function Home() {
  const { data: session, status } = useSession();
  const oktoClient = useOkto();

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black">
      <div className="relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
          <div className="absolute top-0 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-40 left-20 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-4000"></div>
        </div>

        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-4">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto text-center">
              {/* Glassmorphic card */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 shadow-2xl border border-white/20">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                  Empowering Change Through{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    Web3
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
                  Join the future of fundraising. Create or support campaigns with the
                  transparency and security of blockchain technology.
                </p>
                
                {/* CTA Buttons with glassmorphic effect */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold backdrop-blur-lg hover:bg-white/20 transition-all duration-300 shadow-lg">
                    Start a Campaign
                  </button>
                  <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-all duration-300 shadow-lg">
                    Explore Campaigns
                  </button>
                </div>

                {/* Stats with glassmorphic effect */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  {[
                    { label: 'Total Campaigns', value: '1,234' },
                    { label: 'Funds Raised', value: '$2.5M' },
                    { label: 'Supporters', value: '50K+' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="backdrop-blur-lg bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="text-2xl font-bold text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-gray-400 text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Campaign Grid Section */}
      <CampaignGrid campaigns={sampleCampaigns} />
    </main>
  );
} 