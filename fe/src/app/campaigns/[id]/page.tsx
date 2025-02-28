'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import { Campaign, CampaignType } from '@/types/campaign';
import { useOkto } from '@okto_web3/react-sdk';
import { tokenTransfer } from '@okto_web3/react-sdk';
import {
  getContract,
  prepareContractCall,
  toUnits,
} from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { createThirdwebClient } from "@thirdweb";

export default function CampaignPage() {
  const router = useRouter();
  const params = useParams();
  const oktoClient = useOkto();
  const { id } = params;
  
  // Set up your ThirdWeb client (add this to your imports or define globally)
  const THIRDWEB_CLIENT = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
    chain: sepolia,
  });

  // Get contract reference
  const inflectionContract = getContract({
    address: "0xYOUR_ACTUAL_CONTRACT_ADDRESS_HERE", // Replace with actual contract address
    chain: sepolia, // Use the appropriate chain
    client: THIRDWEB_CLIENT,
  });

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

  const TOKEN_ADDRESSES = {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    RLUSD: "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD"
  };

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

  async function handleDonation() {
    if (!validateAmount(donationAmount)) {
      setDonationStatus('error');
      setTimeout(() => setDonationStatus('idle'), 3000);
      return;
    }

    setDonationStatus('loading');
    try {
      // Convert amount to smallest units (6 decimals for USDC, 18 for RLUSD)
      const decimals = selectedToken === 'USDC' ? 6 : 18;
      const amountInSmallestUnits = parseFloat(donationAmount) * Math.pow(10, decimals);
      
      // Get the correct token address based on selection
      const tokenAddress = TOKEN_ADDRESSES[selectedToken];
      
      // First: Execute the token transfer through Okto
      const transferParams = {
        amount: BigInt(Math.floor(amountInSmallestUnits)),
        recipient: campaign.recipient as `0x${string}`,
        token: tokenAddress as `0x${string}`,
        caip2Id: "eip155:1" // Adjust based on your network
      };
      
      const jobId = await tokenTransfer(oktoClient, transferParams);
      console.log('Donation transfer jobId:', jobId);

      // Step 2: Update campaign state in smart contract using ThirdWeb's new API
      const transaction = prepareContractCall({
        contract: inflectionContract,
        method: "function updateCampaign(uint256 _campaignId, uint256 _amount, address _donor)",
        params: [
          campaign.id,                       // _campaignId
          BigInt(Math.floor(amountInSmallestUnits)), // _amount
          oktoClient.address                 // _donor
        ],
      });

      // Execute the transaction
      const result = await transaction.execute();
      console.log("Campaign updated:", result);

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
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    disabled={donationStatus === 'loading'}
                  >
                    <option value="USDC">USDC</option>
                    <option value="RLUSD">RLUSD</option>
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
                onClick={handleDonation}
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
