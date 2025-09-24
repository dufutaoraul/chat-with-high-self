import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateConversationTitle(message: string): string {
  // 从消息中提取关键词生成标题
  const words = message.split(' ').slice(0, 6) // 取前6个词
  let title = words.join(' ')
  
  // 如果太长，截断并添加省略号
  if (title.length > 30) {
    title = title.substring(0, 27) + '...'
  }
  
  // 如果太短，使用默认标题
  if (title.length < 5) {
    title = '新的对话'
  }
  
  return title
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    return '刚刚'
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}小时前`
  } else if (diffInHours < 48) {
    return '昨天'
  } else {
    return d.toLocaleDateString('zh-CN')
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength - 3) + '...'
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}