'use client';

import React from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { mainnet } from 'viem/chains';

export default function OnchainKitClient({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read your API key from .env
  const apiKey = process.env.NEXT_PUBLIC_COINBASE_ONRAMP_API_KEY || '';

  return (
    <OnchainKitProvider 
      apiKey={apiKey}
      chain={mainnet}
      config={{
        appearance: {
          name: 'Inflection',
          mode: 'auto',
          theme: 'default',
        },
        wallet: {
          supportedPaymentMethods: ['apple_pay', 'card', 'bank'],
        }
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}
 