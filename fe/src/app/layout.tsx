import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import AppProvider from "../components/providers";
import { CampaignProvider } from '@/context/CampaignContext';
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { Toaster } from 'react-hot-toast';
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import OnchainKitClient from "./OnchainKitClient";
import { OktoClientProvider } from "@/components/providers/OktoProvider";
import { ThirdwebProvider } from "thirdweb/react";
 
const dmSans = DM_Sans({ subsets: ["latin"] });
 
export const metadata: Metadata = {
  title: "Inflection",
  description: "Inflection is a platform for running group funding campaigns with four different campaign types",
};
 
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <Toaster />
        <OktoClientProvider>
          <ThirdwebProvider>
              <ReactQueryProvider>
                <OnchainKitClient>
                  <AppProvider session={session}>
                  <CampaignProvider>
                    {children}
                  </CampaignProvider>
                </AppProvider>
              </OnchainKitClient>
            </ReactQueryProvider>
          </ThirdwebProvider>
        </OktoClientProvider>
      </body>
    </html>
  );
}