import { getOrdersHistory, OktoClient } from "@okto_web3/react-sdk";

export async function getRawTransactionOrder(oktoClient: OktoClient, jobId: string) {
    try {
        // Get order history with filter for specific jobId
        const orders = await getOrdersHistory(oktoClient, {
            intentId: jobId,                    // Filter by specific order/transaction
            intentType: "RAW_TRANSACTION",      // Filter for raw transaction orders
            // status: "FAILED"                // Filter by status: "SUCCESSFUL" | "FAILED" | "PENDING" | "REJECTED"
        });
        return orders?.[0] || null;
    } catch (error) {
        console.error('Error fetching transaction order:', error);
        throw error;
    }
  }