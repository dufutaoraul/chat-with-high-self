"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

// 类型定义
interface Transaction {
  id: string;
  product_id: string;
  amount: string;
  status: string;
  created_at: string;
  out_trade_no: string;
  trade_no?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
}

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

interface PurchaseHistoryProps {
  transactions: Transaction[];
  products: Record<string, Product>;
}

export default function PurchaseHistory({ transactions, products }: PurchaseHistoryProps) {
  // 处理点击操作按钮
  const handleActionClick = async (transaction: Transaction) => {
    if (transaction.status === "pending") {
      // 对于待支付状态，重新获取支付链接
      try {
        const response = await fetch("/api/checkout/providers/zpay/url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: transaction.product_id }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.url) {
          // 跳转到支付页面
          window.location.href = data.url;
        } else {
          throw new Error(data.error || "获取支付链接失败");
        }
      } catch (error) {
        console.error("支付处理失败:", error);
        alert("支付处理失败，请稍后再试");
      }
    } else if (transaction.status === "success") {
      // 对于已支付状态，显示订单详情
      let message = `订单号: ${transaction.out_trade_no}\n`;
      message += `产品: ${products[transaction.product_id]?.name || "未知产品"}\n`;
      message += `金额: ¥${transaction.amount}\n`;
      message += `购买时间: ${new Date(transaction.created_at).toLocaleString()}\n`;
      
      if (transaction.subscription_start_date && transaction.subscription_end_date) {
        message += `订阅开始时间: ${new Date(transaction.subscription_start_date).toLocaleDateString()}\n`;
        message += `订阅结束时间: ${new Date(transaction.subscription_end_date).toLocaleDateString()}\n`;
      }
      
      message += `交易号: ${transaction.trade_no || "无"}\n`;
      
      alert(message);
    }
  };

  // 获取状态标签样式
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case "success":
        return "支付成功";
      case "pending":
        return "待支付";
      case "failed":
        return "支付失败";
      default:
        return status;
    }
  };

  // 获取操作按钮文本
  const getActionText = (status: string) => {
    switch (status) {
      case "success":
        return "查看详情";
      case "pending":
        return "去支付";
      case "failed":
        return "重新支付";
      default:
        return "查看详情";
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-gray-500 mb-4">您还没有任何购买记录</div>
        <a
          href="/pricing"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          查看套餐方案
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
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
              购买日期
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              价格
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              状态
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {products[transaction.product_id]?.name || "未知产品"}
                </div>
                {transaction.subscription_end_date && (
                  <div className="text-xs text-gray-500">
                    {products[transaction.product_id]?.isSubscription
                      ? `有效期至 ${new Date(transaction.subscription_end_date).toLocaleDateString()}`
                      : "一次性购买"}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(transaction.created_at), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">¥{transaction.amount}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                    transaction.status
                  )}`}
                >
                  {getStatusText(transaction.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleActionClick(transaction)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  {getActionText(transaction.status)}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 