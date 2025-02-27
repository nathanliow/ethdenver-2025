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
