import Link from 'next/link';
import Button from '../ui/Button';
import CreateCampaignButton from '../campaign/CreateCampaignButton';
import LoginButton from '../login/LoginButton';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

export default function Navbar() {
  const { data: session } = useSession();

  const handleCreateCampaign = () => {
    if (!session) {
      toast.error('Please sign in to create a campaign', {
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40">
      {/* Glassmorphic background */}
      <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-b from-black/60 to-black/40 border-b border-white/10" 
        style={{ transform: 'translate3d(0, 0, 0)' }} // Creates new stacking context
      />
      
      <div className="relative container mx-auto flex justify-between items-center py-6 px-8">
        <Link href="/" className="text-white font-bold text-2xl">
          Inflection
        </Link>
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-white hover:text-gray-300">
            Home
          </Link>
          <Link href="/campaigns" className="text-white hover:text-gray-300">
            Campaigns
          </Link>
          
          <CreateCampaignButton className="mr-2" />
         
          <LoginButton />
        </div>
        <div className="md:hidden">
           <Button variant="secondary" size="sm">Menu</Button>
        </div>
      </div>
    </nav>
  );
} 