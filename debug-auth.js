// 调试认证问题的脚本
// 运行: node debug-auth.js

const { createClient } = require('@supabase/supabase-js');

// 支付数据库（现在的主数据库）
const paymentSupabase = createClient(
  'https://tarluhsejlzqmwfiwxkb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcmx1aHNlamx6cW13Zml3eGtiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQzNjkzMiwiZXhwIjoyMDcxMDEyOTMyfQ.lpDVbDqit6P8tYiBn6cmQ1_EgppZJ6QMLV7YHTtEWDU'
);

// 原主数据库
const mainSupabase = createClient(
  'https://cpcmbkikqftxaxjgedlm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwY21ia2lrcWZ0eGF4amdlZGxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQzMjk1NiwiZXhwIjoyMDcxMDA4OTU2fQ.am-FIJobFiGgtjkvpIYb6h7piWs5zH6-VG6khFSncKY'
);

async function debugAuth() {
  console.log('=== 认证调试开始 ===\n');

  try {
    // 1. 检查支付数据库中的用户
    console.log('1. 检查支付数据库中的用户...');
    const { data: paymentUsers, error: paymentError } = await paymentSupabase.auth.admin.listUsers();
    
    if (paymentError) {
      console.error('支付数据库用户查询失败:', paymentError);
    } else {
      console.log(`支付数据库用户数量: ${paymentUsers.users.length}`);
      paymentUsers.users.forEach(user => {
        console.log(`- ${user.email} (${user.email_confirmed_at ? '已验证' : '未验证'})`);
      });
    }

    console.log('\n2. 检查原主数据库中的用户...');
    const { data: mainUsers, error: mainError } = await mainSupabase.auth.admin.listUsers();
    
    if (mainError) {
      console.error('原主数据库用户查询失败:', mainError);
    } else {
      console.log(`原主数据库用户数量: ${mainUsers.users.length}`);
      mainUsers.users.forEach(user => {
        console.log(`- ${user.email} (${user.email_confirmed_at ? '已验证' : '未验证'})`);
      });
    }

    // 3. 检查支付数据库中的表
    console.log('\n3. 检查支付数据库中的表结构...');
    const { data: tables, error: tablesError } = await paymentSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('表查询失败:', tablesError);
    } else {
      console.log('支付数据库中的表:');
      tables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }

    // 4. 检查是否需要迁移用户
    if (mainUsers && mainUsers.users.length > 0 && paymentUsers && paymentUsers.users.length === 0) {
      console.log('\n⚠️  发现需要迁移用户数据！');
      console.log('原主数据库有用户，但支付数据库没有用户。');
      console.log('建议：手动在支付数据库中重新注册，或联系技术支持进行数据迁移。');
    }

  } catch (error) {
    console.error('调试过程中出错:', error);
  }

  console.log('\n=== 认证调试结束 ===');
}

// 运行调试
debugAuth();
