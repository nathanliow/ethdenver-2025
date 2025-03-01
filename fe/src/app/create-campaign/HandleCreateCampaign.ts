import { Hash, OktoClient, evmRawTransaction } from '@okto_web3/react-sdk';
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
  maxDonors?: bigint; // For PerPerson type
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
  goal = 0n,
  deadline,
  maxDonors = 0n,
}: CreateCampaignParams) => {
  // Get network specific configuration
  const networkConfig = NETWORK_CONFIG[selectedNetwork];

  console.log("CreateCampaign Params:", {
    selectedTokenAddress,
    selectedNetwork,
    campaignType: BigInt(campaignType).toString(),
    creatorAddress,
    name,
    image,
    description,
    recipient,
    goal: BigInt(goal).toString(),
    deadline,
    maxDonors: BigInt(maxDonors).toString()
  });

  const createCampaignABI = {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_campaignType",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_image",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "_recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_goal",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_deadline",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_maxDonors",
        "type": "uint256"
      }
    ],
    "name": "createCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  };

  // Encode function data using viem
  const data = encodeFunctionData({
    abi: [createCampaignABI],
    functionName: 'createCampaign',
    args: [
      selectedTokenAddress,
      BigInt(campaignType),
      name,
      image,
      description,
      recipient,
      goal ? BigInt(goal) : 0n,
      deadline ? BigInt(deadline) : 0n,
      maxDonors ? BigInt(maxDonors) : 0n
    ]
  });

  console.log("data", data);

  // Create raw transaction parameters
  const rawTxParams = {
    caip2Id: networkConfig.caip2Id,
    transaction: {
      from: creatorAddress as `0x${string}`,
      to: networkConfig.contractAddress as `0x${string}`,
      data: data as Hash,
      value: `0x${`0`}` as Hash,
    }
  };

  console.log("rawTxParams", rawTxParams);

  try {
    // Send the transaction using Okto
    const jobId = await evmRawTransaction(
      oktoClient,
      {
        caip2Id: networkConfig.caip2Id,
        transaction: {
          from: creatorAddress as `0x${string}`,
          to: networkConfig.contractAddress as `0x${string}`,
          data: data as Hash,
          value: 0n
        }
      }
    );
    console.log("Campaign creation jobId:", jobId);
    return jobId;
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw error;
  }
};
