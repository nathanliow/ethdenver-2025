"use client";

import { useSession, signIn } from "next-auth/react";
import Button from "../ui/Button";
 
export function GoogleLoginButton({ className }: { className?: string }) {
    const { data: session } = useSession(); // Get session data
 
    const handleLogin = () => {
        signIn("google");   // Trigger Google sign-in
    };
 
    return (
        <Button
            className={`border border-transparent rounded px-4 py-2 transition-colors ${className} ${
                session
                ? "bg-blue-500 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-700 text-white"
            }`}
            onClick={handleLogin}
        >
            Login with Google
        </Button>
    );
}