CREATE TABLE IF NOT EXISTS zpay_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'pending',
  out_trade_no TEXT NOT NULL UNIQUE,
  trade_no TEXT,
  payment_type TEXT NOT NULL,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS zpay_transactions_user_id_idx ON zpay_transactions(user_id);
CREATE INDEX IF NOT EXISTS zpay_transactions_out_trade_no_idx ON zpay_transactions(out_trade_no); 