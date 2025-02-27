import Link from 'next/link';
import Button from '../ui/Button';
import CreateCampaignButton from '../campaign/CreateCampaignButton';
import LoginButton from '../login/LoginButton';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent py-6 px-8">
      <div className="container mx-auto flex justify-between items-center">
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