"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface Transaction {
  id: string;
  created_at: string;
  product_id: string;
  amount: string;
  status: string;
  out_trade_no: string;
  trade_no: string | null;
  metadata: {
    product_name: string;
    subscription_period?: string;
  };
  is_subscription: boolean;
  subscription_start: string | null;
  subscription_end: string | null;
}

export default function PurchaseHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // 加载购买历史
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from("zpay_transactions")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        setTransactions(data || []);
      } catch (err: any) {
        console.error("获取交易记录失败:", err);
        setError(err.message || "获取交易记录失败");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [supabase]);

  // 处理待支付订单
  const handlePendingPayment = (transaction: Transaction) => {
    // 构建支付请求数据
    const paymentData: {
      productId: string;
      productName: string;
      amount: string;
      isSubscription: boolean;
      paymentMethod: string;
      out_trade_no: string;
      subscriptionPeriod?: "monthly" | "yearly";
    } = {
      productId: transaction.product_id,
      productName: transaction.metadata?.product_name || "未知产品",
      amount: transaction.amount,
      isSubscription: transaction.is_subscription,
      paymentMethod: "alipay",
      out_trade_no: transaction.out_trade_no,
    };

    // 如果是订阅，添加订阅周期
    if (
      transaction.is_subscription &&
      transaction.metadata?.subscription_period
    ) {
      paymentData.subscriptionPeriod = transaction.metadata
        .subscription_period as "monthly" | "yearly";
    }

    // 发送请求获取支付链接
    fetch("/api/checkout/providers/zpay/url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("获取支付链接失败");
        }
        return response.json();
      })
      .then((data) => {
        // 跳转到支付页面
        window.location.href = data.url;
      })
      .catch((error) => {
        console.error("支付处理失败:", error);
        alert(
          `支付处理失败: ${error instanceof Error ? error.message : "未知错误"}`
        );
      });
  };

  // 显示成功支付的订单详情
  const showTransactionDetails = (transaction: Transaction) => {
    const subscriptionInfo = transaction.is_subscription
      ? `\n订阅类型: ${
          transaction.metadata?.subscription_period === "yearly"
            ? "年付"
            : "月付"
        }\n有效期: ${new Date(
          transaction.subscription_start || ""
        ).toLocaleDateString()} - ${new Date(
          transaction.subscription_end || ""
        ).toLocaleDateString()}`
      : "";

    alert(
      `订单详情:\n\n产品: ${
        transaction.metadata?.product_name || "未知产品"
      }\n金额: ¥${parseFloat(transaction.amount).toFixed(2)}\n订单号: ${
        transaction.out_trade_no
      }\n状态: ${
        transaction.status === "success" ? "支付成功" : "处理中"
      }\n日期: ${new Date(
        transaction.created_at
      ).toLocaleDateString()}${subscriptionInfo}`
    );
  };

  // 格式化支付状态显示
  const formatStatus = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            支付成功
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            待支付
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return <div className="text-center py-8">加载购买历史中...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">加载失败: {error}</div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">暂无购买记录</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          购买历史
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">您的所有交易记录</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                产品
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                日期
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                金额
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                状态
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {transaction.metadata?.product_name || "未知产品"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {transaction.is_subscription
                      ? `订阅 (${
                          transaction.metadata?.subscription_period === "yearly"
                            ? "年付"
                            : "月付"
                        })`
                      : "一次性购买"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ¥{parseFloat(transaction.amount).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatStatus(transaction.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {transaction.status === "pending" ? (
                    <button
                      onClick={() => handlePendingPayment(transaction)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      去支付
                    </button>
                  ) : (
                    <button
                      onClick={() => showTransactionDetails(transaction)}
                      className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                      查看详情
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
