import React from 'react';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();

  return (
    <div className="relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-44 pb-24 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Glassmorphic card */}
            <div className="backdrop-blur-lg bg-gray-900/40 rounded-2xl p-8 shadow-2xl border border-white/10">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                Empowering Change Through{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Web3
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
                Join the future of fundraising. Create or support campaigns with the
                transparency and security of blockchain technology.
              </p>
              
              {/* CTA Buttons with glassmorphic effect */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
                  onClick={() => router.push('/campaigns')}
                >
                  Explore Campaigns
                </button>
              </div>

              {/* Stats with glassmorphic effect */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                {[
                  { label: 'Total Campaigns', value: '1,234' },
                  { label: 'Funds Raised', value: '$2.5M' },
                  { label: 'Supporters', value: '50K+' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="backdrop-blur-lg bg-gray-900/30 rounded-lg p-4 border border-white/10"
                  >
                    <div className="text-2xl font-bold text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 