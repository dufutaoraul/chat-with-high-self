export interface PaymentTransaction {
  id: string
  user_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  payment_method?: string
  transaction_id: string
  description?: string
  created_at: string
  updated_at: string
}

export interface PaymentOrder {
  orderId: string
  amount: number
  description: string
  userId: string
}

export interface PaymentState {
  transactions: PaymentTransaction[]
  loading: boolean
  error: string | null
}