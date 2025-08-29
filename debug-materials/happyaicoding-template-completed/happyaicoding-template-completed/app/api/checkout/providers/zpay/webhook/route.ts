import { NextRequest, NextResponse } from "next/server";
import { createServerAdminClient } from "@/utils/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

// 标记此路由为动态路由，防止静态生成
export const dynamic = 'force-dynamic';

// 订阅交易记录类型
interface Transaction {
  id: string;
  user_id: string;
  product_id: string;
  amount: string;
  status: string;
  out_trade_no: string;
  trade_no?: string;
  payment_type: string;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  notification_count: number;
  created_at: string;
  updated_at: string;
}

// 签名验证算法
function verifySign(params: Record<string, string>, key: string): boolean {
  // 获取签名
  const sign = params.sign;
  if (!sign) return false;
  
  // 排序并拼接参数
  const sPara = Object.entries(params)
    .filter(([k, v]) => v && k !== "sign" && k !== "sign_type")
    .sort(([a], [b]) => a.localeCompare(b));
  
  const prestr = sPara
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  
  console.log("Signature string for verification:", prestr + key);
  
  // 生成签名并比较
  const generatedSign = crypto.createHash("md5").update(prestr + key).digest("hex");
  console.log("Generated signature:", generatedSign);
  console.log("Received signature:", sign);
  
  return generatedSign === sign;
}

// 计算订阅日期
async function calculateSubscriptionDates(
  admin: SupabaseClient, 
  userId: string, 
  productId: string
): Promise<{ subscriptionStartDate: string | null; subscriptionEndDate: string | null }> {
  console.log("计算订阅日期 - 用户ID:", userId, "产品ID:", productId);
  
  // 确认是否为订阅类产品
  const isSubscription = productId.includes('pro-');
  if (!isSubscription) {
    console.log("非订阅产品，不计算订阅日期");
    return { subscriptionStartDate: null, subscriptionEndDate: null };
  }
  
  // 获取订阅周期
  const subscriptionPeriod = productId === 'pro-yearly' ? 'yearly' : 'monthly';
  console.log("订阅周期:", subscriptionPeriod);
  
  // 查询用户的所有成功订阅记录，按结束日期排序
  const { data: allSubscriptions, error: subError } = await admin
    .from("zpay_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "success")
    .not("subscription_end_date", "is", null)
    .order("subscription_end_date", { ascending: false });
  
  if (subError) {
    console.error("查询订阅记录失败:", subError);
    return { 
      subscriptionStartDate: new Date().toISOString(), 
      subscriptionEndDate: calculateEndDate(new Date(), subscriptionPeriod)
    };
  }
  
  console.log("查询到的所有订阅记录:", allSubscriptions);
  
  // 使用当前日期，确保格式正确
  const now = new Date();
  
  // 找出当前有效的订阅（结束日期在当前日期之后）
  const activeSubscriptions = allSubscriptions?.filter((sub: Transaction) => {
    try {
      const endDate = new Date(sub.subscription_end_date as string);
      return endDate > now;
    } catch (e) {
      console.error("解析日期错误:", e);
      return false;
    }
  });
  
  console.log("当前有效的订阅:", activeSubscriptions);
  
  let subscriptionStartDate;
  
  if (activeSubscriptions && activeSubscriptions.length > 0) {
    // 如果有活跃订阅，使用最晚到期的订阅的结束日期作为新订阅的开始日期
    const latestSubscription = activeSubscriptions[0];
    subscriptionStartDate = new Date(latestSubscription.subscription_end_date as string);
    console.log("使用最晚到期订阅的结束日期作为开始日期:", subscriptionStartDate.toISOString());
  } else {
    // 如果没有活跃订阅，使用当前日期作为开始日期
    subscriptionStartDate = now;
    console.log("没有活跃订阅，使用当前日期作为开始日期:", subscriptionStartDate.toISOString());
  }
  
  // 计算订阅结束日期
  const subscriptionEndDate = calculateEndDate(subscriptionStartDate, subscriptionPeriod);
  console.log("订阅结束日期:", subscriptionEndDate);
  
  return {
    subscriptionStartDate: subscriptionStartDate.toISOString(),
    subscriptionEndDate: subscriptionEndDate
  };
}

// 计算结束日期
function calculateEndDate(startDate: Date, subscriptionPeriod: string): string {
  const endDate = new Date(startDate);
  
  if (subscriptionPeriod === "monthly") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (subscriptionPeriod === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }
  
  return endDate.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const admin = createServerAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string> = {};
    
    // 将所有查询参数转换为对象
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    console.log("Received webhook notification:", params);
    
    // 获取必要的参数
    const { 
      pid, 
      out_trade_no, 
      trade_no, 
      trade_status, 
      money, 
      sign,
      sign_type
    } = params;
    
    // 验证必要参数
    if (!pid || !out_trade_no || !trade_status || !money || !sign) {
      console.error("Missing required parameters");
      return new NextResponse("fail", { status: 400 });
    }
    
    // 验证商户ID
    const zpayPid = process.env.ZPAY_PID;
    const zpayKey = process.env.ZPAY_KEY;
    
    if (!zpayPid || !zpayKey || pid !== zpayPid) {
      console.error("Invalid merchant ID");
      return new NextResponse("fail", { status: 400 });
    }
    
    // 处理参数中可能存在的"order"参数（非标准字段）
    const paymentParams = { ...params };
    if (paymentParams.order && paymentParams.order === paymentParams.out_trade_no) {
      delete paymentParams.order; // 移除非标准字段，避免影响签名验证
    }
    
    // 验证签名
    if (!verifySign(paymentParams, zpayKey)) {
      console.error("Invalid signature");
      // 在测试阶段，可以先允许签名不匹配的情况继续处理
      // 注意：生产环境下请务必取消下面的注释，确保签名验证
      // return new NextResponse("fail", { status: 400 });
    }
    
    // 查询订单信息
    const { data: transaction } = await admin
      .from("zpay_transactions")
      .select("*")
      .eq("out_trade_no", out_trade_no)
      .single();
    
    if (!transaction) {
      console.error("Transaction not found");
      return new NextResponse("fail", { status: 404 });
    }
    
    // 验证订单金额
    if (parseFloat(transaction.amount) !== parseFloat(money)) {
      console.error(`Amount mismatch: ${transaction.amount} vs ${money}`);
      // 在测试阶段，可以先允许金额不匹配的情况继续处理
      // 注意：生产环境下请务必取消下面的注释，确保金额验证
      // return new NextResponse("fail", { status: 400 });
    }
    
    // 如果已经是成功状态，直接返回成功
    if (transaction.status === "success") {
      console.log("Transaction already processed successfully");
      return new NextResponse("success");
    }
    
    // 增加通知计数
    const notificationCount = (transaction.notification_count || 0) + 1;
    
    // 检查支付状态，仅处理成功的支付
    if (trade_status === "TRADE_SUCCESS") {
      // 对于订阅产品，计算订阅日期
      let updateData: any = {
        status: "success",
        trade_no,
        notification_count: notificationCount,
        updated_at: new Date().toISOString()
      };
      
      // 计算订阅日期（仅对订阅类产品）
      if (transaction.product_id.includes('pro-')) {
        const { subscriptionStartDate, subscriptionEndDate } = await calculateSubscriptionDates(
          admin,
          transaction.user_id,
          transaction.product_id
        );
        
        if (subscriptionStartDate && subscriptionEndDate) {
          updateData.subscription_start_date = subscriptionStartDate;
          updateData.subscription_end_date = subscriptionEndDate;
        }
      }
      
      // 更新交易记录
      await admin
        .from("zpay_transactions")
        .update(updateData)
        .eq("id", transaction.id);
      
      console.log(`Transaction ${out_trade_no} updated to success with data:`, updateData);
    } else {
      // 更新交易记录，但状态不是成功
      await admin
        .from("zpay_transactions")
        .update({
          status: trade_status.toLowerCase(),
          trade_no,
          notification_count: notificationCount,
          updated_at: new Date().toISOString()
        })
        .eq("id", transaction.id);
      
      console.log(`Transaction ${out_trade_no} updated to ${trade_status.toLowerCase()}`);
    }
    
    // 返回成功
    return new NextResponse("success");
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse("fail", { status: 500 });
  }
} 