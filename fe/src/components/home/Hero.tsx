import React from 'react';
import Button from '../ui/Button';

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center text-center">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 z-0"></div>
      
      {/* Overlay with slight pattern */}
      <div className="absolute inset-0 opacity-20 bg-[url('/grid-pattern.svg')] z-10"></div>
      
      <div className="container mx-auto px-8 relative z-20">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Fund Your Vision
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Create campaigns, donate to causes, and make an impact with blockchain technology.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg">Create Campaign</Button>
          <Button variant="secondary" size="lg">Learn More</Button>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          <path 
            d="M12 5V19M12 19L5 12M12 19L19 12" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
} 