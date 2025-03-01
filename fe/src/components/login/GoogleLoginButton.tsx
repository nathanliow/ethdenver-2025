"use client";

import { useSession, signIn } from "next-auth/react";
import { useOkto } from '@okto_web3/react-sdk';
import Button from "../ui/Button";
import { useState } from "react";
 
export function GoogleLoginButton({ className }: { className?: string }) {
    const { data: session } = useSession();
    const oktoClient = useOkto();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const authenticate = async (idToken: string) => {
        try {
            const user = await oktoClient.loginUsingOAuth({
                idToken,
                provider: "google",
            });
            return user;
        } catch (error) {
            console.error("Okto Authentication failed:", error);
            throw error;
        }
    };

    const handleLogin = async () => {
        try {
            setIsAuthenticating(true);
            // First authenticate with Google
            const result = await signIn("google", { redirect: false });
            
            if (result?.error) {
                throw new Error(result.error);
            }

            // If we have a session with id_token, authenticate with Okto
            if (session?.id_token) {
                await authenticate(session.id_token);
            }
        } catch (error) {
            console.error("Login process failed:", error);
        } finally {
            setIsAuthenticating(false);
        }
    };
 
    return (
        <Button
            className={`${className}`}
            variant="secondary"
            onClick={handleLogin}
            isDisabled={isAuthenticating}
        >
            {isAuthenticating ? 'Connecting...' : 'Login with Google'}
        </Button>
    );
}