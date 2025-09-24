'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AuthCodeError() {
  const [errorDetails, setErrorDetails] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    // 从URL参数中获取错误详情
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')

    if (error || errorDescription) {
      setErrorDetails(errorDescription || error || '未知错误')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              ChatWithHighSelf
            </h1>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">认证失败</h2>
          <p className="text-gray-600 mt-2">邮件链接验证遇到问题</p>
        </div>

        {/* Error Details */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
          <div className="flex items-center mb-4">
            <div className="text-4xl mr-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-900">可能的原因：</h3>
          </div>

          <ul className="space-y-2 text-gray-700 mb-6">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              邮件链接已过期（链接有效期为1小时）
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              邮件链接已被使用过
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              邮件链接格式不正确
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              网络连接问题
            </li>
          </ul>

          {errorDetails && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <strong className="text-red-800">错误详情：</strong>
              <span className="text-red-700 ml-2">{errorDetails}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">解决方案：</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/reset-password"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 text-center"
            >
              重新申请密码重置
            </Link>
            <Link
              href="/signup"
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 text-center"
            >
              重新发送验证邮件
            </Link>
            <Link
              href="/signin"
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 text-center"
            >
              返回登录页面
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">仍然有问题？</h4>
          <p className="text-blue-800 mb-3">请确保：</p>
          <ul className="space-y-2 text-blue-700">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              使用最新收到的邮件中的链接
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              在收到邮件后1小时内点击链接
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              检查邮件是否在垃圾邮件文件夹中
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              尝试在不同的浏览器中打开链接
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
