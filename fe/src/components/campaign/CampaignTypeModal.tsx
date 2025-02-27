import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { CampaignType } from '@/types/campaign';

type CampaignTypeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: CampaignType) => void;
};

export default function CampaignTypeModal({ isOpen, onClose, onSelect }: CampaignTypeModalProps) {
  const campaignTypes = [
    {
      type: CampaignType.AnythingHelps,
      title: "Anything Helps",
      description: "Anyone can donate any amount, ends at a deadline",
      icon: "🤝",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      type: CampaignType.Goal,
      title: "Goal-Based",
      description: "Reach a goal amount by a deadline, refund if not reached",
      icon: "🎯",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      type: CampaignType.PerPerson,
      title: "Per Person",
      description: "Each person pays a set amount by deadline",
      icon: "👥",
      gradient: "from-green-500 to-teal-600"
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Campaign Type">
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Choose the type of campaign you want to create:
        </p>
        
        <div className="space-y-4">
          {campaignTypes.map((campaign) => (
            <div 
              key={campaign.type}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all hover:shadow-md transform hover:-translate-y-1"
              onClick={() => {
                onSelect(campaign.type);
                onClose();
              }}
            >
              <div className="flex items-start">
                <div className={`text-4xl mr-5 bg-gradient-to-br ${campaign.gradient} p-3 rounded-full text-white shadow-md`}>
                  {campaign.icon}
                </div>
                <div className="pt-2">
                  <h4 className="font-semibold text-lg">{campaign.title}</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{campaign.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end mt-6">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
} 