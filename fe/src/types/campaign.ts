export enum CampaignType {
  AnythingHelps = 0,   // Anyone can donate any amount, ends at a deadline
  Goal = 1,            // Reach a goal amount by a deadline, refund if not reached
  PerPerson = 2,       // Each person pays x amount by deadline
  SplitFixedCost = 3   // Must reach 'goal'; each paying >= goal/maxDonors
}

export interface Campaign {
  id: number;
  campaignType: CampaignType;
  isActive: boolean;
  token: string;
  name: string;
  image: string;
  description: string;
  balance: number;
  deadline: number;
  numDonors: number;
  donors: string[];
  goal: number;
  maxDonors: number;
  recipient: string;
  numDonations: number;
  creator: string;
} 