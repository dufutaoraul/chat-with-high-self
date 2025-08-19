import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '与高我对话 - ChatWithHighSelf',
  description: '通过AI技术与你的高我进行深度对话，探索内在智慧，获得人生指导',
  keywords: '高我对话,AI对话,人生指导,内在智慧,自我探索',
  authors: [{ name: 'DuFuTao' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}