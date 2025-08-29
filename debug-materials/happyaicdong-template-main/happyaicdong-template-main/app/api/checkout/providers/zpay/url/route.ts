import { NextRequest, NextResponse } from "next/server";
import { createServerAdminClient, createServerSupabaseClient } from "@/utils/supabase/server";
import {
  ZPAY_CONFIG,
  generateOrderNumber,
  generatePaymentUrl,
} from "@/utils/zpay";
import { addMonths, addYears, format } from "date-fns";

// Request body type
interface CheckoutUrlRequest {
  productId: string;
  productName: string;
  amount: string;
  paymentMethod: "alipay" | "wxpay" | "qqpay" | "tenpay";
  isSubscription: boolean;
  subscriptionPeriod?: "monthly" | "yearly";
}

export async function POST(request: NextRequest) {
  try {
    // Get the Supabase client for auth
    const supabase = createServerSupabaseClient();

    // Get the user session from cookies
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Check if the user is authenticated
    if (!session || !session.user) {
      console.log("User not authenticated");
      return NextResponse.json(
        { error: "Unauthorized. Please login to proceed." },
        { status: 401 }
      );
    }

    // Get the user ID
    const userId = session.user.id;
    console.log("Authenticated user ID:", userId);

    // Get the admin client for database operations
    const adminClient = createServerAdminClient();

    // Parse the request body
    const {
      productId,
      productName,
      amount,
      paymentMethod = "alipay",
      isSubscription = false,
      subscriptionPeriod,
    } = (await request.json()) as CheckoutUrlRequest;

    // Validate the request
    if (!productId || !productName || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // For subscriptions, validate subscription period
    if (
      isSubscription &&
      (!subscriptionPeriod ||
        !["monthly", "yearly"].includes(subscriptionPeriod))
    ) {
      return NextResponse.json(
        { error: "Invalid subscription period" },
        { status: 400 }
      );
    }

    // Generate a unique order number
    const out_trade_no = generateOrderNumber();

    // Create a new transaction record
    const now = new Date();
    let subscriptionStart: Date | null = null;
    let subscriptionEnd: Date | null = null;

    // For subscriptions, check if user already has an active subscription
    if (isSubscription) {
      // Check if there's an active subscription
      const { data: activeSubscription } = await adminClient
        .from("zpay_transactions")
        .select("subscription_end")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .eq("status", "success")
        .eq("is_subscription", true)
        .lt("subscription_start", now)
        .gt("subscription_end", now)
        .order("subscription_end", { ascending: false })
        .limit(1)
        .single();

      // 查询未来到期的订阅（用户可能已经订阅了多次）
      const { data: futureSubscriptions } = await adminClient
        .from("zpay_transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .eq("status", "success")
        .eq("is_subscription", true)
        .gt("subscription_end", now.toISOString())
        .order("subscription_end", { ascending: false })
        .limit(1);

      // 如果有未来到期的订阅，使用它的结束日期作为新订阅的开始日期
      if (futureSubscriptions && futureSubscriptions.length > 0) {
        subscriptionStart = new Date(futureSubscriptions[0].subscription_end);
        console.log(`Using future subscription end date as start: ${subscriptionStart.toISOString()}`);
      }
      // 如果有当前活跃的订阅，使用它的结束日期作为新订阅的开始日期
      else if (activeSubscription && activeSubscription.subscription_end) {
        subscriptionStart = new Date(activeSubscription.subscription_end);
        console.log(`Using active subscription end date as start: ${subscriptionStart.toISOString()}`);
      } else {
        // 否则，从现在开始
        subscriptionStart = now;
        console.log(`No existing subscription found, starting now: ${subscriptionStart.toISOString()}`);
      }

      // Calculate subscription end date based on period
      if (subscriptionPeriod === "monthly") {
        subscriptionEnd = addMonths(subscriptionStart, 1);
      } else if (subscriptionPeriod === "yearly") {
        subscriptionEnd = addYears(subscriptionStart, 1);
      }
      
      console.log(`Calculated subscription period: ${subscriptionPeriod}`);
      console.log(`Subscription dates: Start=${subscriptionStart.toISOString()}, End=${subscriptionEnd?.toISOString()}`);
    }

    // Create the transaction record using admin client for database operations
    const { data: transaction, error } = await adminClient
      .from("zpay_transactions")
      .insert({
        user_id: userId,
        product_id: productId,
        amount,
        payment_method: paymentMethod,
        out_trade_no,
        status: "pending",
        is_subscription: isSubscription,
        subscription_start: subscriptionStart ? subscriptionStart.toISOString() : null,
        subscription_end: subscriptionEnd ? subscriptionEnd.toISOString() : null,
        metadata: {
          product_name: productName,
          subscription_period: subscriptionPeriod,
        },
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create transaction:", error);
      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }

    // Generate the payment URL
    const baseUrl = ZPAY_CONFIG.BASE_URL;
    const paymentParams = {
      pid: ZPAY_CONFIG.PID,
      money: amount,
      name: productName,
      out_trade_no,
      notify_url: `${baseUrl}/api/checkout/providers/zpay/webhook`,
      return_url: `${baseUrl}/payment/success?orderId=${out_trade_no}`,
      type: paymentMethod,
      param: isSubscription ? `subscription_${subscriptionPeriod}` : "onetime",
    };

    const paymentUrl = generatePaymentUrl(paymentParams, ZPAY_CONFIG.KEY);

    return NextResponse.json({ url: paymentUrl, orderId: out_trade_no });
  } catch (error) {
    console.error("Payment URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate payment URL" },
      { status: 500 }
    );
  }
} 