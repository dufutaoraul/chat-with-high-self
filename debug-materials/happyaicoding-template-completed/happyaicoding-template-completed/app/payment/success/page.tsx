"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// 标记该页面为动态渲染，避免静态生成出错
export const dynamic = 'force-dynamic';

// Wrapper component that uses search params
function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get("order") || "";
  const [countdown, setCountdown] = useState(5);

  // 倒计时自动跳转到首页
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="max-w-lg mx-auto text-center bg-white rounded-lg shadow-md p-8">
      <div className="mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="h-16 w-16 text-green-500 mx-auto"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">支付成功</h1>
      <p className="text-gray-600 mb-6">
        感谢您的购买！{orderNumber ? `您的订单 ${orderNumber} 已经处理完成。` : '您的订单已经处理完成。'}
      </p>
      <p className="text-gray-500 mb-8">
        我们将在 {countdown} 秒后自动跳转到首页，或者您可以点击下方按钮立即前往。
      </p>
      <div className="flex space-x-4 justify-center">
        <Link
          href="/"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          返回首页
        </Link>
        <Link
          href="/dashboard"
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          进入控制台
        </Link>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingState() {
  return (
    <div className="max-w-lg mx-auto text-center bg-white rounded-lg shadow-md p-8">
      <div className="animate-pulse flex flex-col items-center">
        <div className="rounded-full bg-gray-200 h-16 w-16 mb-6"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
        <div className="flex space-x-4 justify-center w-full">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function PaymentSuccess() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Suspense fallback={<LoadingState />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
} 