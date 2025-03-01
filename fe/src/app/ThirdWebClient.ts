import { createThirdwebClient } from "thirdweb";

export const ThirdwebClient = createThirdwebClient({ 
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "...", 
    secretKey: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_SECRET || "..."
});