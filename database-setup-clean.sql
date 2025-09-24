-- ChatWithHighSelf 数据库设置脚本 (清理版)
-- 先执行 database-cleanup.sql，然后执行此脚本

-- 1. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. 用户详细档案表
CREATE TABLE user_profiles (
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

-- 3. 对话会话表
CREATE TABLE user_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    session_type TEXT DEFAULT 'general',
    total_messages INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE
);

-- 4. 聊天消息表
CREATE TABLE chat_messages (
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
    message_type TEXT DEFAULT 'text',
    sentiment_score DECIMAL(3,2)
);

-- 5. 支付交易记录表
CREATE TABLE zpay_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE NOT NULL,
    
    -- 订单信息
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'CNY',
    description TEXT,
    
    -- 支付信息
    payment_method TEXT,
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

-- 6. 用户会话令牌表
CREATE TABLE user_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_type TEXT DEFAULT 'chat' CHECK (token_type IN ('chat', 'premium', 'analysis')),
    tokens_remaining INTEGER DEFAULT 0,
    tokens_purchased INTEGER DEFAULT 0,
    purchase_transaction_id UUID REFERENCES zpay_transactions(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 创建触发器
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_conversations_updated_at 
    BEFORE UPDATE ON user_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 创建对话统计更新函数和触发器
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

-- 9. 启用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE zpay_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- 10. 创建RLS策略
CREATE POLICY "Users can manage own profile" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own conversations" ON user_conversations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages" ON chat_messages
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transactions" ON zpay_transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tokens" ON user_tokens
    FOR ALL USING (auth.uid() = user_id);

-- 11. 创建索引
CREATE INDEX idx_chat_messages_conversation_created 
    ON chat_messages(conversation_id, created_at);

CREATE INDEX idx_chat_messages_user_created 
    ON chat_messages(user_id, created_at);

CREATE INDEX idx_zpay_transactions_user_created 
    ON zpay_transactions(user_id, created_at);

CREATE INDEX idx_zpay_transactions_transaction_id 
    ON zpay_transactions(transaction_id);

CREATE INDEX idx_zpay_transactions_status 
    ON zpay_transactions(status);

CREATE INDEX idx_user_tokens_user_type 
    ON user_tokens(user_id, token_type);

-- 完成！
SELECT 'Database setup completed successfully!' as status;