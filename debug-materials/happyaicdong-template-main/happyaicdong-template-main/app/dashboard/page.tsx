import { User } from "@supabase/supabase-js";
import { DashboardClient } from "./index";

// 页面从全局对象中获取数据
export default function Dashboard() {
  // 从服务器端获取数据
  const user = (global as any).__dashboardUser as User;
  const subscriptionInfo = (global as any).__subscriptionInfo;

  // 传递给客户端组件
  return <DashboardClient user={user} subscriptionInfo={subscriptionInfo} />;
}
