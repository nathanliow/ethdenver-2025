'use client';

import { Hash, Hex, OktoProvider } from '@okto_web3/react-sdk';

export function OktoClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <OktoProvider
            config={{
                environment: "sandbox",
                clientPrivateKey: process.env.NEXT_PUBLIC_CLIENT_PRIVATE_KEY as Hash,
                clientSWA: process.env.NEXT_PUBLIC_CLIENT_SWA as Hex,
            }}
        >
            {children}
        </OktoProvider>
  );
} 