import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/home/Hero';
import CampaignGrid from '@/components/home/CampaignGrid';
import Footer from '@/components/layout/Footer';
import { Campaign, CampaignType } from '@/types/campaign';

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
  return (
    <main>
      <Navbar />
      <Hero />
      <CampaignGrid campaigns={sampleCampaigns} />
      <Footer />
    </main>
  );
} 