export interface ChatMessage {
  id: string
  conversation_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  summary?: string
  created_at: string
  updated_at: string
  messages?: ChatMessage[]
}

export interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: ChatMessage[]
  loading: boolean
  error: string | null
}