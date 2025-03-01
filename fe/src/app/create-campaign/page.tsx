'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import { useCampaignContext } from '@/context/CampaignContext';
import { CampaignType } from '@/types/campaign';
import ImageUpload from '@/components/ui/ImageUpload';
import { HandleCreateCampaign } from './HandleCreateCampaign';
import { getAccount, useOkto } from '@okto_web3/react-sdk';
import { TOKEN_ADDRESSES } from '@/Consts';
import { getRawTransactionOrder } from './GetRawTransactionOrder';

export default function CreateCampaignPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { selectedType, setSelectedType } = useCampaignContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [deadline, setDeadline] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [perPersonAmount, setPerPersonAmount] = useState('');
  const [maxDonors, setMaxDonors] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<'BASE_SEPOLIA' | 'POLYGON_AMOY'>('BASE_SEPOLIA');
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'RLUSD'>('USDC');
  const oktoClient = useOkto();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [creatorAddress, setCreatorAddress] = useState('');

  useEffect(() => {
    // Redirect if user is not authenticated
    if (status === 'unauthenticated') {
      console.log('unauthenticated');
      toast.error('Please sign in to create a campaign', {
        duration: 3000,
        position: 'bottom-center',
      });
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    const getOktoAddress = async () => {
      if (oktoClient) {
        try {
          const account = await getAccount(oktoClient);
          setCreatorAddress(account[0].address);
        } catch (error) {
          console.error('Error getting Okto address:', error);
          toast.error('Failed to get wallet address');
        }
      }
    };
    getOktoAddress();
  }, [oktoClient]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  // Don't render the page content if not authenticated
  if (!session) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oktoClient || !creatorAddress || !recipientAddress) {
      toast.error('Please connect your wallet and provide recipient address');
      return;
    }

    try {
      const deadlineTimestamp = new Date(deadline).getTime() / 1000;
      const selectedTokenAddress = selectedToken === 'USDC' ? TOKEN_ADDRESSES[selectedNetwork].USDC : TOKEN_ADDRESSES[selectedNetwork].RLUSD;
      
      const jobId = await HandleCreateCampaign({
        oktoClient,
        selectedTokenAddress: selectedTokenAddress,
        selectedNetwork: selectedNetwork,
        campaignType: selectedType,
        creatorAddress: creatorAddress as `0x${string}`,
        name,
        image,
        description,
        recipient: recipientAddress as `0x${string}`,
        deadline: deadlineTimestamp,      
        goal: selectedType === CampaignType.Goal ? BigInt(parseFloat(goalAmount) * 1e18) : BigInt(0),
        maxDonors: selectedType === CampaignType.PerPerson ? parseInt(maxDonors) : 0,
      });
      
      const order = await getRawTransactionOrder(oktoClient, jobId);
      console.log('Order Status:', order);

      toast.success('Campaign created successfully!');
      router.push('/campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  const campaignTypes = [
    { type: CampaignType.AnythingHelps, label: "Anything Helps", description: "Accept any amount of donations" },
    { type: CampaignType.Goal, label: "Goal Based", description: "Set a specific fundraising target" },
    { type: CampaignType.PerPerson, label: "Per Person", description: "Fixed amount per contributor" }
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto pt-16">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Create a Campaign</h1>
            <p className="text-gray-600 dark:text-gray-400">Set up your fundraising campaign in minutes</p>
          </div>

          {/* Campaign Type Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Campaign Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {campaignTypes.map((campaign) => (
                <button
                  key={campaign.type}
                  onClick={() => setSelectedType(campaign.type)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedType === campaign.type
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <h3 className="font-semibold mb-1">{campaign.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{campaign.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Basic Information */}
              <div className="p-8 space-y-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Basic Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campaign Name
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Give your campaign a memorable name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={4}
                    placeholder="Tell your story and explain your campaign's purpose"
                  />
                </div>

                <div>
                  <ImageUpload onImageUploaded={(url) => setImage(url)}/>
                </div>
              </div>

              {/* Campaign Details */}
              <div className="p-8 space-y-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Campaign Details</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recipient Address
                  </label>
                  <input 
                    type="text" 
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter the recipient's wallet address"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Accepted Token
                  </label>
                  <div className="flex gap-4">
                  
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value as 'USDC' | 'RLUSD')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="USDC">USDC</option>
                    <option value="RLUSD">RLUSD</option>
                  </select>

                  <select
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value as 'BASE_SEPOLIA' | 'POLYGON_AMOY')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="BASE_SEPOLIA">Base Sepolia</option>
                    <option value="POLYGON_AMOY">Polygon Amoy</option>
                  </select>
                  </div>
                </div>
                

                {selectedType === CampaignType.Goal && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Goal Amount (USD)
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={goalAmount}
                        onChange={(e) => setGoalAmount(e.target.value)}
                        min="0"
                        step="1"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter your fundraising goal"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">USD</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedType === CampaignType.PerPerson && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Amount per Person (USD)
                      </label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={perPersonAmount}
                          onChange={(e) => setPerPersonAmount(e.target.value)}
                          min="0"
                          step="1"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Enter amount per person"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">USD</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maximum Number of Donors
                      </label>
                      <input 
                        type="number"
                        value={maxDonors}
                        onChange={(e) => setMaxDonors(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Set the maximum number of contributors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campaign Deadline
                  </label>
                  <input 
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submit Section */}
              <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                <div className="flex items-center justify-end space-x-4">
                  <Button 
                    variant="secondary" 
                    onClick={() => router.push('/campaigns')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                  >
                    Create Campaign
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
} 