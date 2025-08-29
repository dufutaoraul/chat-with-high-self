import React from "react";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { createServerAdminClient } from "@/utils/supabase/server";
import Link from "next/link";
import PurchaseHistory from "./components/PurchaseHistory";

export default async function Dashboard() {
  // 获取用户信息
  const supabase = createServerSupabaseClient();
  const admin = createServerAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>请先登录</div>;
  }

  // 获取用户的购买历史
  const { data: transactions } = await admin
    .from("zpay_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 获取产品信息
  const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products`);
  const { products } = await productsResponse.json();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-cabinet-grotesk font-bold mb-8">欢迎回来，{user.email?.split("@")[0]}</h1>
      
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-cabinet-grotesk font-bold">我的订阅</h2>
          <Link
            href="/pricing"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            查看套餐
          </Link>
        </div>
        
        {/* 订阅状态信息 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {(global as any).__userSubscription ? (
            <div>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {products[(global as any).__userSubscription.product_id]?.name || "专业版订阅"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    订阅到期日期: {new Date((global as any).__userSubscription.subscription_end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                您正在享受专业版的所有特权，包括高级课程内容和专属支持服务。
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">免费用户</h3>
                  <p className="text-sm text-gray-500">
                    您当前没有活跃的订阅
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                升级到专业版以解锁所有高级特性和专业内容。
              </div>
              <Link
                href="/pricing"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                立即升级
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* 购买历史 */}
      <div>
        <h2 className="text-2xl font-cabinet-grotesk font-bold mb-6">购买历史</h2>
        <PurchaseHistory transactions={transactions || []} products={products} />
      </div>
    </div>
  );
}
