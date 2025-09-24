-- ChatWithHighSelf 数据库设置脚本
-- 在 Supabase payment-system 项目中执行

-- 1. 用户详细档案表
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 基本信息
    age INTEGER,
    occupation TEXT,
    education_level TEXT,
    family_status TEXT,
    location TEXT,
    
    -- 性格特征
    personality_type TEXT,
    values TEXT[],
    interests TEXT[],
    strengths TEXT[],
    weaknesses TEXT[],
    
    -- 目标设定
    short_term_goals TEXT[],
    long_term_goals TEXT[],
    life_vision TEXT,
    
    -- 挑战识别
    current_challenges TEXT[],
    areas_for_improvement TEXT[],
    stress_factors TEXT[],
    
    -- 其他信息
    communication_style TEXT,
    preferred_feedback_style TEXT,
    motivation_factors TEXT[],
    
    -- 完成状态
    profile_completed BOOLEAN DEFAULT FALSE,
    setup_step INTEGER DEFAULT 1,
    
    UNIQUE(user_id)
);

-- 2. 对话会话表
CREATE TABLE IF NOT EXISTS user_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    session_type TEXT DEFAULT 'general', -- general, goal_setting, challenge_solving
    total_messages INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE
);

-- 3. 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES user_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- AI相关字段
    ai_model TEXT DEFAULT 'gemini-2.5-flash',
    tokens_used INTEGER,
    response_time_ms INTEGER,
    
    -- 消息元数据
    message_type TEXT DEFAULT 'text', -- text, system, reflection
    sentiment_score DECIMAL(3,2) -- -1.0 to 1.0
);

-- 4. 支付交易记录表
CREATE TABLE IF NOT EXISTS zpay_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE NOT NULL,
    
    -- 订单信息
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'CNY',
    description TEXT,
    
    -- 支付信息
    payment_method TEXT, -- alipay, wechat
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    
    -- Z-Pay相关
    zpay_order_id TEXT,
    zpay_trade_no TEXT,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- 回调信息
    notify_data JSONB
);

-- 5. 用户会话令牌表（用于付费会话管理）
CREATE TABLE IF NOT EXISTS user_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_type TEXT DEFAULT 'chat' CHECK (token_type IN ('chat', 'premium', 'analysis')),
    tokens_remaining INTEGER DEFAULT 0,
    tokens_purchased INTEGER DEFAULT 0,
    purchase_transaction_id UUID REFERENCES zpay_transactions(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 为需要的表添加更新时间触发器
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_conversations_updated_at 
    BEFORE UPDATE ON user_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 创建RLS安全策略
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE zpay_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own conversations" ON user_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON user_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON user_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON zpay_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON zpay_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tokens" ON user_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON user_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- 9. 创建自动更新对话统计的触发器
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_conversations 
        SET 
            total_messages = total_messages + 1,
            last_message_at = NEW.created_at,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_stats_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_stats();

-- 10. 插入一些示例数据（可选）
-- 这部分在生产环境中可以删除

-- 10. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created 
    ON chat_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created 
    ON chat_messages(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_zpay_transactions_user_created 
    ON zpay_transactions(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_zpay_transactions_transaction_id 
    ON zpay_transactions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_zpay_transactions_status 
    ON zpay_transactions(status);

CREATE INDEX IF NOT EXISTS idx_user_tokens_user_type 
    ON user_tokens(user_id, token_type);

-- 完成数据库设置
-- 执行完成后，请验证所有表都已创建成功