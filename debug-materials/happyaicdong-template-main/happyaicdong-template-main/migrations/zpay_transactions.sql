-- Create zpay_transactions table
CREATE TABLE IF NOT EXISTS "public"."zpay_transactions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "user_id" uuid NOT NULL REFERENCES auth.users(id),
  "product_id" text NOT NULL,
  "amount" decimal(10,2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'CNY',
  "status" text NOT NULL DEFAULT 'pending',
  "out_trade_no" text NOT NULL UNIQUE,
  "trade_no" text,
  "payment_method" text NOT NULL,
  "notify_count" integer NOT NULL DEFAULT 0,
  "expires_at" timestamp with time zone,
  "subscription_start" timestamp with time zone,
  "subscription_end" timestamp with time zone,
  "is_subscription" boolean NOT NULL DEFAULT false,
  "metadata" jsonb,
  PRIMARY KEY ("id")
);

-- Add comment to table
COMMENT ON TABLE "public"."zpay_transactions" IS 'Stores all payment transactions information';

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_zpay_transactions_user_id ON public.zpay_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_zpay_transactions_out_trade_no ON public.zpay_transactions (out_trade_no);
CREATE INDEX IF NOT EXISTS idx_zpay_transactions_status ON public.zpay_transactions (status);

-- Enable Row Level Security
ALTER TABLE "public"."zpay_transactions" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own transactions" 
  ON "public"."zpay_transactions" 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_zpay_transactions_updated_at
BEFORE UPDATE ON public.zpay_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); 