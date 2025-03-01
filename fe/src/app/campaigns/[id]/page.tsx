'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import { Campaign, CampaignType } from '@/types/campaign';
import { getAccount, useOkto } from '@okto_web3/react-sdk';
import { HandleDonation } from './HandleDonation';

export default function CampaignsPage() {
  const router = useRouter();
  const params = useParams();
  const oktoClient = useOkto();
  const { id } = params;
  
  const [account, setAccount] = useState<any>(null);
  const [accountAddress, setAccountAddress] = useState<string>('');

  // Move the account fetching to a useEffect
  useEffect(() => {
    async function fetchAccount() {
      if (oktoClient) {
        const acc = await getAccount(oktoClient);
        setAccount(acc);
        setAccountAddress(acc[0].address);
      }
    }
    fetchAccount();
  }, [oktoClient]);

  // Early return if no id exists
  if (!id) {
    return <div>Campaign not found</div>;
  }

  // TODO: Replace with actual data fetching
  const campaign: Campaign = {
    id: parseInt(id as string),
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

  const [donationStatus, setDonationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'RLUSD'>('USDC');
  const [selectedNetwork, setSelectedNetwork] = useState<'BASE_SEPOLIA'>('BASE_SEPOLIA');

  // Update when network changes to ensure valid token selection
  useEffect(() => {
    if (selectedNetwork === 'BASE_SEPOLIA' && selectedToken === 'RLUSD') {
      setSelectedToken('USDC');
    }
  }, [selectedNetwork]);

  const validateAmount = (amount: string): boolean => {
    const parsedAmount = parseFloat(amount);
    const decimals = selectedToken === 'USDC' ? 6 : 18;

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0');
      return false;
    }
    
    // For PerPerson or SplitFixedCost campaigns, check minimum required amount
    if (campaign.campaignType === CampaignType.PerPerson) {
      const minRequired = campaign.goal / campaign.maxDonors / decimals; // Using 6 decimals for stablecoins
      if (parsedAmount < minRequired) {
        setErrorMessage(`Minimum required amount is ${minRequired} ${selectedToken}`);
        return false;
      }
    }
    
    // Todo: fix SplitFixedCost

    return true;
  };

  async function onDonateClick() {
    if (!validateAmount(donationAmount)) {
      setDonationStatus('error');
      setTimeout(() => setDonationStatus('idle'), 3000);
      return;
    }

    if (!oktoClient) {
      setErrorMessage('Please connect your wallet');
      setDonationStatus('error');
      setTimeout(() => setDonationStatus('idle'), 3000);
      return;
    }
    
    setDonationStatus('loading');
    try {
      await HandleDonation(
        oktoClient,
        campaign,
        donationAmount,
        selectedNetwork,
        selectedToken,
        accountAddress,
      );

      setDonationStatus('success');
      setDonationAmount(''); // Clear input after success
      
      setTimeout(() => {
        setDonationStatus('idle');
      }, 3000);
    } catch (error: any) {
      console.error('Error in donation:', error);
      setErrorMessage(error.message || 'Failed to process donation');
      setDonationStatus('error');
      
      setTimeout(() => {
        setDonationStatus('idle');
      }, 3000);
    }
  }

  const getDonateButtonContent = () => {
    switch (donationStatus) {
      case 'loading':
        return (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        );
      case 'success':
        return 'Donation Successful!';
      case 'error':
        return 'Donation Failed';
      default:
        return 'Donate Now';
    }
  };

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
              
              <div className="flex flex-col space-y-2">
                <label htmlFor="donationAmount" className="text-sm text-gray-600 dark:text-gray-400">
                  Donation Amount
                </label>
                <div className="flex gap-2">
                  <input
                    id="donationAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={donationAmount}
                    onChange={(e) => {
                      setDonationAmount(e.target.value);
                      setErrorMessage('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter amount..."
                    disabled={donationStatus === 'loading'}
                  />
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value as 'USDC' | 'RLUSD')}
                    className="px-4 py-2 w-[100px] border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    disabled={donationStatus === 'loading'}
                  >
                    <option value="USDC">USDC</option>
                    <option value="RLUSD">RLUSD</option>
                  </select>
                  <select
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value as 'BASE_SEPOLIA')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    disabled={donationStatus === 'loading'}
                  >
                    <option value="BASE_SEPOLIA">Base</option>
                  </select>
                </div>
                {errorMessage && (
                  <p className="text-sm text-red-500">{errorMessage}</p>
                )}
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
              <Button 
                className={`flex-1 py-4 ${
                  donationStatus === 'success' ? 'bg-green-600 hover:bg-green-700' :
                  donationStatus === 'error' ? 'bg-red-600 hover:bg-red-700' : ''
                }`}
                onClick={onDonateClick}
                isDisabled={donationStatus === 'loading'}
              >
                {getDonateButtonContent()}
              </Button>
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