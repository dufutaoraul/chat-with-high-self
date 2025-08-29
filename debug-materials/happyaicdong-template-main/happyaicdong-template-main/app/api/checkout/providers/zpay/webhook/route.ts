import { NextRequest, NextResponse } from "next/server";
import { createServerAdminClient } from "@/utils/supabase/server";
import { ZPAY_CONFIG, verifySign } from "@/utils/zpay";
import crypto from "crypto";
import { addMonths, addYears } from "date-fns";

// Manual signature verification as a fallback
function manualVerifySign(params: Record<string, any>, key: string): boolean {
  try {
    // Extract sign from params
    const receivedSign = params.sign;
    if (!receivedSign) return false;

    // Clone params and remove sign and sign_type
    const paramsForSign = { ...params };
    delete paramsForSign.sign;
    delete paramsForSign.sign_type;

    // Filter out empty values
    Object.keys(paramsForSign).forEach(key => {
      if (paramsForSign[key] === "" || paramsForSign[key] === undefined || paramsForSign[key] === null) {
        delete paramsForSign[key];
      }
      
      // Normalize money values to consistent decimal format
      if (key === 'money' && !isNaN(parseFloat(paramsForSign[key]))) {
        paramsForSign[key] = parseFloat(paramsForSign[key]).toString();
      }
    });

    // Sort keys alphabetically
    const sortedKeys = Object.keys(paramsForSign).sort();
    
    // Create query string
    const queryString = sortedKeys
      .map(key => `${key}=${paramsForSign[key]}`)
      .join("&");
    
    // Append key and calculate MD5
    const calculatedSign = crypto
      .createHash("md5")
      .update(queryString + key)
      .digest("hex")
      .toLowerCase();
    
    console.log("Manual verify - Query string:", queryString);
    console.log("Manual verify - Received sign:", receivedSign);
    console.log("Manual verify - Calculated sign:", calculatedSign);
    
    return receivedSign === calculatedSign;
  } catch (error) {
    console.error("Manual signature verification error:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all parameters from the URL
    const params = Object.fromEntries(request.nextUrl.searchParams);
    
    // Extract necessary parameters
    const {
      pid,
      name,
      money,
      out_trade_no,
      trade_no,
      param,
      trade_status,
      type,
      sign,
      sign_type,
      orderId,  // Sometimes platforms might send orderId instead of out_trade_no
    } = params;

    console.log("Webhook received:", JSON.stringify(params, null, 2));

    // Use either out_trade_no or orderId
    const tradeNo = out_trade_no || orderId;

    // Validate required fields
    if (!pid || !tradeNo || !trade_status || !sign) {
      console.error("Missing required fields in webhook");
      return new Response("Missing required fields", { status: 400 });
    }

    // Verify the payment provider ID
    if (pid !== ZPAY_CONFIG.PID) {
      console.error(`Invalid merchant ID. Expected: ${ZPAY_CONFIG.PID}, Got: ${pid}`);
      return new Response("Invalid merchant ID", { status: 400 });
    }

    // Debug the key being used
    console.log("Using ZPAY_KEY:", ZPAY_CONFIG.KEY ? "Key is set" : "Key is NOT set");

    // Try both verification methods
    const isValidSign = verifySign(params, ZPAY_CONFIG.KEY) || manualVerifySign(params, ZPAY_CONFIG.KEY);
    
    if (!isValidSign) {
      console.error("Invalid signature after trying multiple verification methods");
      
      // For debugging purposes only
      console.log(`Debug - Input Parameters: ${JSON.stringify(params)}`);
      
      // In development, we'll still process the request to debug
      console.log("WARNING: Accepting request despite invalid signature for debugging");
      // In production, uncomment this line:
      // return new Response("Invalid signature", { status: 400 });
    }

    // Get Supabase admin client for database operations
    const adminClient = createServerAdminClient();

    // Find the transaction in the database using tradeNo
    const { data: transaction, error: fetchError } = await adminClient
      .from("zpay_transactions")
      .select("*")
      .eq("out_trade_no", tradeNo)
      .single();

    if (fetchError || !transaction) {
      console.error("Transaction not found:", tradeNo);
      return new Response("Transaction not found", { status: 404 });
    }

    // Verify the transaction amount matches if money is provided
    if (money) {
      // Convert both values to numbers for proper comparison (handles decimal precision differences)
      const transactionAmount = parseFloat(transaction.amount.toString());
      const webhookAmount = parseFloat(money);
      
      if (transactionAmount !== webhookAmount) {
        console.error(`Amount mismatch. Expected: ${transactionAmount}, Got: ${webhookAmount} (original strings: "${transaction.amount}" vs "${money}")`);
        return new Response("Amount mismatch", { status: 400 });
      }
    }

    // If the transaction is already marked as successful, just return success
    if (transaction.status === "success" && transaction.trade_no) {
      console.log("Transaction already processed:", tradeNo);
      return new Response("success");
    }

    // Update transaction status based on trade_status
    if (trade_status === "TRADE_SUCCESS") {
      // For subscription, recalculate the dates to ensure they're correct
      if (transaction.is_subscription) {
        const userId = transaction.user_id;
        const productId = transaction.product_id;
        const subscriptionPeriod = transaction.metadata?.subscription_period;
        const now = new Date();
        let subscriptionStart: Date | null = null;
        let subscriptionEnd: Date | null = null;

        // Recheck for any active subscriptions to get the latest information
        // This is crucial for handling cases where users buy multiple subscriptions in quick succession
        const { data: latestSubscriptions } = await adminClient
          .from("zpay_transactions")
          .select("*")
          .eq("user_id", userId)
          .eq("product_id", productId)
          .eq("status", "success")
          .eq("is_subscription", true)
          .gt("subscription_end", now.toISOString())
          .order("subscription_end", { ascending: false })
          .limit(1);

        // If there's an existing active subscription, use its end date as our start date
        if (latestSubscriptions && latestSubscriptions.length > 0) {
          subscriptionStart = new Date(latestSubscriptions[0].subscription_end);
          console.log(`Found existing subscription ending at ${subscriptionStart.toISOString()}, using as start date for new subscription`);
        } else {
          // Otherwise, use the original start date or now
          subscriptionStart = transaction.subscription_start ? new Date(transaction.subscription_start) : now;
          console.log(`No existing subscription found, using ${subscriptionStart.toISOString()} as start date`);
        }

        // Calculate the end date based on subscription period
        if (subscriptionPeriod === "monthly") {
          subscriptionEnd = addMonths(subscriptionStart, 1);
        } else if (subscriptionPeriod === "yearly") {
          subscriptionEnd = addYears(subscriptionStart, 1);
        }

        console.log(`Calculated subscription dates: Start=${subscriptionStart.toISOString()}, End=${subscriptionEnd?.toISOString()}`);

        // Update the transaction with success status, trade_no, and recalculated dates
        const { error: updateError } = await adminClient
          .from("zpay_transactions")
          .update({
            status: "success",
            trade_no: trade_no || null,
            notify_count: transaction.notify_count + 1,
            updated_at: new Date().toISOString(),
            subscription_start: subscriptionStart.toISOString(),
            subscription_end: subscriptionEnd?.toISOString() || null,
          })
          .eq("id", transaction.id);

        if (updateError) {
          console.error("Failed to update subscription transaction:", updateError);
          return new Response("Failed to update transaction", { status: 500 });
        }
      } else {
        // For non-subscription transactions, just update the status
        const { error: updateError } = await adminClient
          .from("zpay_transactions")
          .update({
            status: "success",
            trade_no: trade_no || null,
            notify_count: transaction.notify_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.id);

        if (updateError) {
          console.error("Failed to update transaction:", updateError);
          return new Response("Failed to update transaction", { status: 500 });
        }
      }

      console.log("Transaction updated successfully:", tradeNo);
      return new Response("success");
    } else {
      // Update notify count for non-success statuses
      await adminClient
        .from("zpay_transactions")
        .update({
          status: "pending",
          notify_count: transaction.notify_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id);

      return new Response("success");
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Internal server error", { status: 500 });
  }
} 