import { OktoClient } from '@okto_web3/react-sdk';
import { tokenTransfer, evmRawTransaction } from '@okto_web3/react-sdk';
import { encodeFunctionData } from 'viem';
import { Campaign } from '@/types/campaign';
import { NETWORK_CONFIG, TOKEN_ADDRESSES } from '@/Consts';

export const HandleDonation = async (
  oktoClient: OktoClient,
  campaign: Campaign,
  donationAmount: string,
  selectedNetwork: 'BASE_SEPOLIA',
  selectedToken: 'USDC' | 'RLUSD',
  accountAddress: string
) => {
  // Convert amount to smallest units (6 decimals for USDC, 18 for RLUSD)
  const decimals = selectedToken === 'USDC' ? 6 : 18;
  const amountInSmallestUnits = parseFloat(donationAmount) * Math.pow(10, decimals);
  
  // Get the correct token address based on selection
  const tokenAddress = TOKEN_ADDRESSES[selectedNetwork][selectedToken];
  
  // Execute the token transfer through Okto
  const transferParams = {
    amount: BigInt(Math.floor(amountInSmallestUnits)),
    recipient: campaign.recipient as `0x${string}`,
    token: tokenAddress as `0x${string}`,
    caip2Id: "eip155:1" // Adjust based on your network
  };

  console.log('Transfer params:', transferParams);
  
  const transferJobId = await tokenTransfer(oktoClient, transferParams);
  console.log('Donation transfer jobId:', transferJobId);

  // Define the ABI for updateCampaign function
  const abi = [{
    "inputs": [
      {"name": "_campaignId", "type": "uint256"},
      {"name": "_amount", "type": "uint256"}
    ],
    "name": "updateCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }];
  
  // Encode function data using viem
  const data = encodeFunctionData({
    abi,
    functionName: 'updateCampaign',
    args: [
      BigInt(campaign.id),
      BigInt(Math.floor(amountInSmallestUnits))
    ]
  });
  
  // Create raw transaction parameters
  const rawTxParams = {
    caip2Id: "eip155:1", // Adjust based on your network
    transaction: {
      from: accountAddress as `0x${string}`,
      to: NETWORK_CONFIG[selectedNetwork].contractAddress as `0x${string}`,
      data,
    }
  };
  
  // Send the transaction using Okto
  const contractJobId = await evmRawTransaction(oktoClient, rawTxParams);
  console.log("Campaign update jobId:", contractJobId);

  return { transferJobId, contractJobId };
};