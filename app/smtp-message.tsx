import Link from "next/link";

export function SmtpMessage() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">
            邮件服务配置提醒
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              当前使用的是 Supabase 默认邮件服务，可能存在发送限制。
              如需稳定的邮件服务，请在 Supabase 后台配置自定义 SMTP 服务。
            </p>
            <div className="mt-2">
              <Link 
                href="https://supabase.com/dashboard/project/_/settings/auth"
                target="_blank"
                className="font-medium text-amber-800 hover:text-amber-900 underline"
              >
                前往 Supabase 配置 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}