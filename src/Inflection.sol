// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

enum CampaignType {
    AnythingHelps,  // Anyone can donate any amount, ends at a deadline
    Goal,           // Reach a goal amount by a deadline, refund if not reached
    PerPerson,      // Each person pays x amount by deadline
    Split           // Split a set cost among x people by deadline
}

struct Campaign {
    uint256 id;                           // unique identifier for the campaign, starts at 0 and increments by 1 for each new campaign
    CampaignType campaignType;
    bool isActive;                        // true if the campaign is active, false otherwise
    string name;
    string image;
    string description;
    uint256 balance;                      // total amount raised
    uint256 deadline;                     // unix timestamp of deadline
    uint256 numDonors;                    // number of donors
    address[] donors;                     // list of donors
    uint256 goal;                         // goal amount (for Goal campaigns)
    uint256 splitCost;                    // cost to split (for Goal and Split campaigns)
    uint256 maxDonors;                    // maximum number of donors (for PerPerson)
    address recipient;                    // recipient of the funds
    uint256 numDonations;                 // number of donations
}

contract Inflection {
    uint256 private campaignCount = 0;
    Campaign[] private campaigns;
    // mapping of campaign ID to mapping of donor address to amount donated
    mapping(uint256 => mapping(address => uint256)) private campaignDonations; 

    /**
     * Creates a new campaign
     * @param _campaignType Type of campaign
     * @param _name Name of the campaign
     * @param _image Image link for the campaign
     * @param _description Short description of the campaign
     * @param _goal Goal amount of the campaign (in ETH amount)
     * @param _deadline The deadline of the campaign (in unix timestamp)
     */
    function createCampaign(
        CampaignType _campaignType,
        string memory _name,
        string memory _image,
        string memory _description,
        address _recipient,
        uint256 _goal,
        uint256 _splitCost,
        uint256 _deadline,
        uint256 _maxDonors) public {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_goal > 0, "Goal must be greater than 0");
        require(_recipient != address(0), "Recipient cannot be zero address");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        Campaign memory newCampaign = Campaign({
            id: campaignCount,
            campaignType: _campaignType,
            isActive: true,
            name: _name,
            image: _image, 
            description: _description,
            balance: 0,
            goal: _goal,
            splitCost: _splitCost,
            deadline: _deadline,
            numDonors: 0,
            donors: new address[](0),
            maxDonors: _maxDonors,
            recipient: _recipient,
            numDonations: 0
        });

        campaigns.push(newCampaign);
        campaignCount++;
    }

    /**
     * Deletes a campaign
     * @param _campaignId ID of the campaign to delete
     */
    function deleteCampaign(uint256 _campaignId) public {
        delete campaigns[_campaignId];
    }   

    /**
     * Called by users to donate to a campaign
     * @param _campaignId ID of the campaign to donate to
     * @param _amount Amount to donate (in ETH amount)
     */
    function donate(uint256 _campaignId, uint256 _amount) public payable {
        require(_amount > 0, "Amount must be greater than 0");

        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign is not active");
        require(campaign.deadline > block.timestamp, "Campaign has expired");
        require(campaign.balance + _amount <= campaign.goal, "Campaign goal has been reached");

        // campaign.balance += _amount;
        // campaign.numDonors++;
        // campaign.donors.push(msg.sender);
        // campaignDonations[_campaignId][msg.sender] += _amount;
        // campaign.numDonations++;

        if (campaign.campaignType == CampaignType.AnythingHelps || campaign.campaignType == CampaignType.Goal) {
            // TODO: check if campaign passed goal amount
        } else if (campaign.campaignType == CampaignType.PerPerson) {
            // TODO: check if all people have donated
        } else if (campaign.campaignType == CampaignType.Split) {
            // TODO: check if total goal amount has been reached
            // user donate splitCost amount
            // update splitCost, next user donates updated splitCost
            // update splitCost to decrease as more people donate
            // don't actually send money to contract, just update splitCost
        }
    }

    /**
     * Gets a campaign by ID
     * @param _campaignId ID of the campaign to get
     * @return campaign Campaign details
     */
    function getCampaign(uint256 _campaignId) public view returns (
        Campaign memory campaign
    ) {
        require(_campaignId < campaignCount, "Campaign does not exist");
        return campaigns[_campaignId];
    }

    /**
     * Gets all campaigns
     * @return allCampaigns All campaigns
     */
    function getCampaigns() public view returns (
        Campaign[] memory allCampaigns
    ) {
        return campaigns;
    }

    function refundDonors(uint256 _campaignId) public {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign is not active");
        require(campaign.deadline > block.timestamp, "Campaign has expired");
        require(campaign.balance < campaign.goal, "Campaign goal has been reached");
        
        mapping(address => uint256) storage donations = campaignDonations[_campaignId];
        for (uint256 i = 0; i < campaign.donors.length; i++) {
            address donor = campaign.donors[i];
            uint256 donationAmount = donations[donor];
            if (donationAmount > 0) {
                payable(donor).transfer(donationAmount);
                donations[donor] = 0;
            }
        }
    }

    /**
     * Handles the end of a campaign, based on the campaign type
     * To be triggered at time of deadline
     * @param _campaignId ID of the campaign to handle
     */
    function handleCampaignEnd(uint256 _campaignId) public {
        require(_campaignId < campaignCount, "Campaign does not exist");

        Campaign storage campaign = campaigns[_campaignId];

        if (campaign.campaignType == CampaignType.AnythingHelps) {
            payable(campaign.recipient).transfer(campaign.balance);
        } else if (campaign.campaignType == CampaignType.Goal) {
            if (campaign.balance >= campaign.goal) {
                // Goal reached, funds can be withdrawn by owner
                payable(campaign.recipient).transfer(campaign.balance);
            } else {
                // Goal not reached by deadline, refund donors
                refundDonors(_campaignId);
            }
        } else if (campaign.campaignType == CampaignType.PerPerson) {
            if (campaign.numDonors == campaign.maxDonors) {
                // All people have donated, funds can be withdrawn by owner
                payable(campaign.recipient).transfer(campaign.balance);
            } else {
                // Not all people have donated, refund donors
                refundDonors(_campaignId);
            }
        } else if (campaign.campaignType == CampaignType.Split) {
            if (campaign.balance >= campaign.goal) {
                // Goal reached, funds can be withdrawn by owner
                payable(campaign.recipient).transfer(campaign.balance);
            } else {
                // Goal not reached by deadline, refund donors
                refundDonors(_campaignId);
            }
        }
        
        campaign.balance = 0;
        campaign.isActive = false;
    }
}
