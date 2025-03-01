"use client";

import { SessionProvider, SessionProviderProps } from "next-auth/react";
import React from "react";
 
function AppProvider({ children, session }: { children: React.ReactNode, session: SessionProviderProps['session'] }) {
    return (
        <SessionProvider session={session}>
            {children}
        </SessionProvider>
    );
}

export default AppProvider;