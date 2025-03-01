'use client';

import React, { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import { useSession, signOut } from 'next-auth/react';
import { GoogleLoginButton } from './GoogleLoginButton';
import { getAccount, useOkto, Wallet } from '@okto_web3/react-sdk';
import { Session } from 'next-auth';


interface ExtendedSession extends Session {
  id_token?: string;
}

type LoginButtonProps = {
  className?: string;
};

export default function LoginButton({ className }: LoginButtonProps) {
  const oktoClient = useOkto();
  const [isOpen, setIsOpen] = useState(false);
  const [accountInfo, setAccountInfo] = useState<Wallet[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIssuingCredential, setIsIssuingCredential] = useState(false);
  const [credentialResult, setCredentialResult] = useState<any>(null);
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAccountInfo = async () => {
      // Only fetch account if we have an authenticated session
      if (session?.id_token) {
        setIsLoading(true);
        try {
          // First ensure we're authenticated with Okto
          await oktoClient.loginUsingOAuth({
            idToken: session.id_token,
            provider: 'google',
          });

          // Then get the account info
          const account = await getAccount(oktoClient);
          setAccountInfo(account);
          
          // Automatically issue credential after successful login
          if (account && account[0]?.address) {
            await issueCredentialForAddress(account[0].address);
          }
        } catch (error) {
          console.error('Error fetching account:', error);
          // If authentication fails, clear the account info
          setAccountInfo(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAccountInfo();
  }, [oktoClient, session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setAccountInfo(null);
    setIsOpen(false);
  };

  // Separate function for credential issuance
  const issueCredentialForAddress = async (address: string) => {
    setIsIssuingCredential(true);
    try {
      console.log('Attempting to issue credential for address:', '0xfc96246e43bd58e053a3a669d8b5364c129df681');
      
      const response = await fetch('/api/credentials/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject_address: '0xfc96246e43bd58e053a3a669d8b5364c129df681',
          claims: {
            kyc: "passed",
            age: 22,
            custom_claim: "value"
          }
        })
      });
      
      const data = await response.json();
      console.log('Credential API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to issue credential');
      }
      
      setCredentialResult(data);
      console.log("Credential issued successfully:", data);

      // Add this after successful credential issuance
      if (data.credential) {
        // Store the credential in localStorage or your preferred storage
        localStorage.setItem('humanityCredential', JSON.stringify(data.credential));
      }

      return data;
    } catch (error) {
      console.error("Error issuing credential:", error);
      setCredentialResult({ error: "Failed to issue credential" });
      throw error;
    } finally {
      setIsIssuingCredential(false);
    }
  };

  const issueVerifiableCredential = async () => {
    if (!accountInfo || !accountInfo[0].address) {
      console.error("No wallet address available");
      return;
    }
    await issueCredentialForAddress(accountInfo[0].address);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="secondary"
        size="sm"
        className={className}
        onClick={() => setIsOpen(!isOpen)}
      >
        {session ? 'Account' : 'Login'}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50">
          {session ? (
            <div className="p-4 space-y-4">
              <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="text-gray-600 dark:text-gray-300">Logged in as</p>
                <p className="font-medium">{session.user?.email}</p>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
              ) : accountInfo ? (
                <div className="space-y-2 border-b border-gray-200 dark:border-gray-700 pb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Wallet Address
                  </p>
                  <p className="font-mono text-sm break-all">
                    {accountInfo[0].address}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Available Networks
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {accountInfo.map((network: Wallet) => (
                      <span
                        key={network.caipId}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium"
                      >
                        {network.networkSymbol}
                      </span>
                    )
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-600 dark:text-gray-300">
                  Failed to load account info
                </div>
              )}

              {accountInfo && (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={issueVerifiableCredential}
                    isDisabled={isIssuingCredential}
                  >
                    {isIssuingCredential ? 'Issuing Credential...' : 'Issue Verifiable Credential'}
                  </Button>
                  
                  {credentialResult && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                      {credentialResult.message ? (
                        <p className="text-green-600 dark:text-green-400">{credentialResult.message}</p>
                      ) : credentialResult.error ? (
                        <p className="text-red-600 dark:text-red-400">{credentialResult.error}</p>
                      ) : (
                        <p>Credential issued</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="secondary"
                className="w-full border border-gray-300 dark:border-gray-600"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <p className="text-gray-600 dark:text-gray-300 text-center text-sm">
                Choose how you would like to connect:
              </p>
              <GoogleLoginButton className="w-full" />
              <Button
                variant="secondary"
                className="w-full border border-gray-300 dark:border-gray-600"
              >
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
