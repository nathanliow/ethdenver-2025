import React from 'react';
import Button from '../ui/Button';
import CreateCampaignButton from '../campaign/CreateCampaignButton';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent py-6 px-8">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white font-bold text-2xl">Inflection</div>
        <div className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-white hover:text-gray-300">Home</a>
          <a href="#" className="text-white hover:text-gray-300">Campaigns</a>
          <a href="#" className="text-white hover:text-gray-300">About</a>
          <CreateCampaignButton className="mr-2" />
          <Button variant="secondary" size="sm">Connect Wallet</Button>
        </div>
        <div className="md:hidden">
          <Button variant="secondary" size="sm">Menu</Button>
        </div>
      </div>
    </nav>
  );
} 