import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ChatWithHighSelf - AI智能对话平台',
  description: '与更高维度的自己对话，获得人生指导和智慧启发',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
          {children}
        </div>
      </body>
    </html>
  )
}