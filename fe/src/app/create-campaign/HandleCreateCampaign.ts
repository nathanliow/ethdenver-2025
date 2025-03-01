import { OktoClient, evmRawTransaction } from '@okto_web3/react-sdk';
import { encodeFunctionData } from 'viem';
import { CampaignType } from '@/types/campaign';
import { NETWORK_CONFIG } from '@/Consts';

interface CreateCampaignParams {
  oktoClient: OktoClient;
  selectedTokenAddress: string;
  selectedNetwork: 'BASE_SEPOLIA' | 'POLYGON_AMOY';
  campaignType: CampaignType;
  creatorAddress: string;
  name: string;
  image: string;
  description: string;
  recipient: string;
  goal?: bigint; // For Goal type
  deadline: number; // Unix timestamp
  maxDonors?: number; // For PerPerson type
}

export const HandleCreateCampaign = async ({
  oktoClient,
  selectedTokenAddress,
  selectedNetwork,
  campaignType,
  creatorAddress,
  name,
  image,
  description,
  recipient,
  goal = BigInt(0),
  deadline,
  maxDonors = 0,
}: CreateCampaignParams) => {
  // Get network specific configuration
  const networkConfig = NETWORK_CONFIG[selectedNetwork];

  console.log("CreateCampaign Params:", {
    selectedTokenAddress,
    selectedNetwork,
    campaignType,
    creatorAddress,
    name,
    image,
    description,
    recipient,
    goal: goal.toString(),
    deadline,
    maxDonors
  });

  const abi = [{
    "inputs": [
      {"name": "_token", "type": "address"},
      {"name": "_campaignType", "type": "uint256"},
      {"name": "_name", "type": "string"},
      {"name": "_image", "type": "string"},
      {"name": "_description", "type": "string"},
      {"name": "_recipient", "type": "address"},
      {"name": "_goal", "type": "uint256"},
      {"name": "_deadline", "type": "uint256"},
      {"name": "_maxDonors", "type": "uint256"}
    ],
    "name": "createCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }];

  // Encode function data using viem
  const data = encodeFunctionData({
    abi,
    functionName: 'createCampaign',
    args: [
      selectedTokenAddress,
      campaignType,
      name,
      image,
      description,
      recipient,
      goal,
      BigInt(deadline),
      BigInt(maxDonors)
    ]
  });

  console.log("data", data);

  // Create raw transaction parameters
  const rawTxParams = {
    caip2Id: networkConfig.caip2Id,
    transaction: {
      from: creatorAddress as `0x${string}`,
      to: networkConfig.contractAddress as `0x${string}`,
      data,
    }
  };

  console.log("rawTxParams", rawTxParams);

  try {
    // Send the transaction using Okto
    const jobId = await evmRawTransaction(
      oktoClient, 
      rawTxParams
    );
    console.log("Campaign creation jobId:", jobId);
    return jobId;
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw error;
  }
};
