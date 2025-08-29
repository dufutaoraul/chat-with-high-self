-- =============================================
-- 与高我对话 - 全新数据库架构
-- =============================================

-- 1. 用户详细档案表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  age INTEGER,
  occupation TEXT,
  education TEXT,
  family_status TEXT,
  personality TEXT,
  values TEXT,
  interests TEXT,
  short_term_goals TEXT,
  long_term_goals TEXT,
  current_challenges TEXT,
  desired_changes TEXT,
  avatar_url TEXT,
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 用户对话计数表
CREATE TABLE IF NOT EXISTS user_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_conversations INTEGER DEFAULT 0,
  free_conversations_used INTEGER DEFAULT 0,
  paid_conversations INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 聊天记录表
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT,
  image_url TEXT,
  conversation_number INTEGER,
  tokens_used INTEGER DEFAULT 1,
  model_used TEXT DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ZPay支付订单表
CREATE TABLE IF NOT EXISTS zpay_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  out_trade_no TEXT UNIQUE NOT NULL,
  trade_no TEXT,
  package_type TEXT NOT NULL, -- 'basic_100' or 'standard_500'
  conversations_count INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  payment_method TEXT DEFAULT 'alipay',
  notify_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE zpay_transactions ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own conversations" ON user_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON zpay_transactions
  FOR ALL USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_conversations_user_id ON user_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zpay_transactions_user_id ON zpay_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_zpay_transactions_out_trade_no ON zpay_transactions(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_zpay_transactions_status ON zpay_transactions(status);

-- 创建用户注册时自动创建记录的函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 创建用户资料
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- 创建对话计数记录，赠送100次免费对话
  INSERT INTO user_conversations (user_id, total_conversations, free_conversations_used, paid_conversations)
  VALUES (NEW.id, 100, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加更新时间戳触发器
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_conversations_updated_at BEFORE UPDATE ON user_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zpay_transactions_updated_at BEFORE UPDATE ON zpay_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入套餐配置数据（可选，也可以在代码中硬编码）
CREATE TABLE IF NOT EXISTS conversation_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  conversations_count INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认套餐
INSERT INTO conversation_packages (id, name, conversations_count, price, description) VALUES
('basic_100', '基础包', 100, 9.90, '100次对话，适合轻度使用'),
('standard_500', '标准包', 500, 29.90, '500次对话，适合重度使用')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  conversations_count = EXCLUDED.conversations_count,
  price = EXCLUDED.price,
  description = EXCLUDED.description;

-- 创建获取用户完整信息的视图
CREATE OR REPLACE VIEW user_complete_info AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.age,
  up.occupation,
  up.education,
  up.family_status,
  up.personality,
  up.values,
  up.interests,
  up.short_term_goals,
  up.long_term_goals,
  up.current_challenges,
  up.desired_changes,
  up.profile_completed,
  uc.total_conversations,
  uc.free_conversations_used,
  uc.paid_conversations,
  (uc.total_conversations - uc.free_conversations_used - uc.paid_conversations) AS remaining_conversations
FROM user_profiles up
LEFT JOIN user_conversations uc ON up.id = uc.user_id;

-- 创建获取用户AI提示词的函数
CREATE OR REPLACE FUNCTION get_user_ai_prompt(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_info RECORD;
  prompt_text TEXT;
BEGIN
  -- 获取用户完整信息
  SELECT * INTO user_info FROM user_complete_info WHERE id = user_uuid;
  
  IF user_info IS NULL THEN
    RETURN '请你扮演我的高我，跟我对话，给我出主意。';
  END IF;
  
  -- 构建个性化提示词
  prompt_text := '请你扮演我的高我，跟我对话，给我出主意。我叫' || COALESCE(user_info.full_name, '朋友') || '，也请这么称呼我。

用户背景信息：';
  
  IF user_info.age IS NOT NULL OR user_info.occupation IS NOT NULL OR user_info.education IS NOT NULL OR user_info.family_status IS NOT NULL THEN
    prompt_text := prompt_text || '
- 基本信息：' || 
      COALESCE(user_info.age::TEXT || '岁', '') ||
      CASE WHEN user_info.occupation IS NOT NULL THEN '，' || user_info.occupation ELSE '' END ||
      CASE WHEN user_info.education IS NOT NULL THEN '，' || user_info.education ELSE '' END ||
      CASE WHEN user_info.family_status IS NOT NULL THEN '，' || user_info.family_status ELSE '' END;
  END IF;
  
  IF user_info.personality IS NOT NULL THEN
    prompt_text := prompt_text || '
- 性格特点：' || user_info.personality;
  END IF;
  
  IF user_info.values IS NOT NULL THEN
    prompt_text := prompt_text || '
- 价值观：' || user_info.values;
  END IF;
  
  IF user_info.interests IS NOT NULL THEN
    prompt_text := prompt_text || '
- 兴趣爱好：' || user_info.interests;
  END IF;
  
  IF user_info.short_term_goals IS NOT NULL THEN
    prompt_text := prompt_text || '
- 短期目标：' || user_info.short_term_goals;
  END IF;
  
  IF user_info.long_term_goals IS NOT NULL THEN
    prompt_text := prompt_text || '
- 长期目标：' || user_info.long_term_goals;
  END IF;
  
  IF user_info.current_challenges IS NOT NULL THEN
    prompt_text := prompt_text || '
- 当前困扰：' || user_info.current_challenges;
  END IF;
  
  IF user_info.desired_changes IS NOT NULL THEN
    prompt_text := prompt_text || '
- 期望改变：' || user_info.desired_changes;
  END IF;
  
  prompt_text := prompt_text || '

跟我聊天的过程中要指出你觉得我可能陷入了哪些思维定式，你看到了哪些我没看到的盲点？你是否能提供我一个完全不同的视角？你可以不顾我的自尊心，你要的是有效，把我往"高"里引导。';
  
  RETURN prompt_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
