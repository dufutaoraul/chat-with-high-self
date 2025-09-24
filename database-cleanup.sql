-- 清理现有的数据库结构
-- 在重新创建之前执行

-- 删除触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_user_conversations_updated_at ON user_conversations;
DROP TRIGGER IF EXISTS update_conversation_stats_trigger ON chat_messages;

-- 删除策略
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own conversations" ON user_conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON user_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON user_conversations;
DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can create own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view own transactions" ON zpay_transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON zpay_transactions;
DROP POLICY IF EXISTS "Users can view own tokens" ON user_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON user_tokens;

-- 删除表（按依赖关系顺序）
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS user_tokens CASCADE;
DROP TABLE IF EXISTS user_conversations CASCADE;
DROP TABLE IF EXISTS zpay_transactions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 删除函数
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_stats() CASCADE;