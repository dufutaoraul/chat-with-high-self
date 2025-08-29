import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { createServerAdminClient } from "@/utils/supabase/server";
import crypto from "crypto";

// 标记此路由为动态路由，防止静态生成
export const dynamic = 'force-dynamic';

// 产品数据定义
interface ProductFeature {
  id: string;
  text: string;
}

interface Product {
  id: string;
  name: string;
  title: string;
  description: string;
  price: string;
  priceLabel: string;
  isSubscription: boolean;
  subscriptionPeriod?: string;
  features: ProductFeature[];
}

// 产品数据
const products: Record<string, Product> = {
  "basic-onetime": {
    id: "basic-onetime",
    name: "基础版AI编程教程",
    title: "基础版",
    description: "探索入门教程，学习AI编程基础知识，参与社区讨论。",
    price: "0.1",
    priceLabel: "/一次性",
    isSubscription: false,
    features: [
      { id: "basic-1", text: "基础入门视频教程" },
      { id: "basic-2", text: "社区讨论区交流" },
      { id: "basic-3", text: "AI开发工具介绍" },
      { id: "basic-4", text: "编程环境搭建指南" },
    ],
  },
  "pro-monthly": {
    id: "pro-monthly",
    name: "专业版AI编程教程 (月付)",
    title: "专业版",
    description: "获得完整课程内容和项目源码，一年内享受专业答疑服务。",
    price: "0.1",
    priceLabel: "/月",
    isSubscription: true,
    subscriptionPeriod: "monthly",
    features: [
      { id: "pro-1", text: "进阶课程和视频教程" },
      { id: "pro-2", text: "20+实战项目源码" },
      { id: "pro-3", text: "一年专属群内答疑服务" },
      { id: "pro-4", text: "项目实战指导" },
      { id: "pro-5", text: "产品创意分享与推广机会" },
    ],
  },
  "pro-yearly": {
    id: "pro-yearly",
    name: "专业版AI编程教程 (年付)",
    title: "专业版",
    description: "获得完整课程内容和项目源码，一年内享受专业答疑服务。",
    price: "1",
    priceLabel: "/年",
    isSubscription: true,
    subscriptionPeriod: "yearly",
    features: [
      { id: "pro-1", text: "进阶课程和视频教程" },
      { id: "pro-2", text: "20+实战项目源码" },
      { id: "pro-3", text: "一年专属群内答疑服务" },
      { id: "pro-4", text: "项目实战指导" },
      { id: "pro-5", text: "产品创意分享与推广机会" },
    ],
  },
};

// 内联日期格式化函数，避免导入依赖
function formatDate(date: Date, format: string): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

// 签名算法
function getVerifyParams(params: Record<string, string>) {
  const sPara = Object.entries(params)
    .filter(([key, value]) => value && key !== "sign" && key !== "sign_type")
    .sort(([a], [b]) => a.localeCompare(b));

  return sPara
    .map(([key, value], index) => {
      const separator = index === sPara.length - 1 ? "" : "&";
      return `${key}=${value}${separator}`;
    })
    .join("");
}

export async function POST(request: NextRequest) {
  try {
    // 检查用户是否已登录
    const supabase = createServerSupabaseClient();
    const admin = createServerAdminClient(); // 创建一次 admin 客户端，避免多次创建
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const body = await request.json();
    const { productId } = body;
    
    if (!productId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    // 直接从导入的产品数据中获取产品信息
    const product = products[productId];
    
    if (!product) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }
    
    const productName = product.name;
    const productAmount = product.price;
    const isSubscription = product.isSubscription;
    const subscriptionPeriod = product.subscriptionPeriod;
    
    // 生成唯一订单号 - 格式：年月日时分秒+随机数
    const timestamp = formatDate(new Date(), "YYYYMMDDHHmmss");
    const randomNum = Math.floor(Math.random() * 900) + 100; // 生成100-999的随机数
    const outTradeNo = `${timestamp}${randomNum}`;
    
    // 准备支付参数
    const pid = process.env.ZPAY_PID;
    const key = process.env.ZPAY_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    if (!pid || !key || !baseUrl) {
      return NextResponse.json(
        { error: "Missing configuration" },
        { status: 500 }
      );
    }
    
    const notifyUrl = `${baseUrl}/api/checkout/providers/zpay/webhook`;
    const returnUrl = `${baseUrl}/payment/success?order=${outTradeNo}`;
    
    const params = {
      pid,
      money: productAmount,
      name: productName,
      notify_url: notifyUrl,
      out_trade_no: outTradeNo,
      return_url: returnUrl,
      type: "alipay", // 默认使用支付宝
    };
    
    // 生成签名
    const paramStr = getVerifyParams(params);
    const sign = crypto.createHash("md5").update(paramStr + key).digest("hex");
    
    // 将交易记录保存到数据库 - 不添加订阅日期，订阅日期将在支付成功后通过webhook添加
    const { data: insertResult, error: insertError } = await admin
      .from("zpay_transactions")
      .insert({
        user_id: userId,
        product_id: productId,
        amount: productAmount,
        out_trade_no: outTradeNo,
        payment_type: "alipay",
        // 不添加订阅日期字段，将在支付成功后计算并更新
      })
      .select();
    
    if (insertError) {
      console.error("保存交易记录失败:", insertError);
      return NextResponse.json(
        { error: "Failed to create transaction record" },
        { status: 500 }
      );
    }
    
    console.log("已创建交易记录:", insertResult);
    
    // 构建支付URL
    const paymentUrl = `https://zpayz.cn/submit.php?${paramStr}&sign=${sign}&sign_type=MD5`;
    
    return NextResponse.json({ url: paymentUrl });
  } catch (error) {
    console.error("Payment URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate payment URL" },
      { status: 500 }
    );
  }
} 