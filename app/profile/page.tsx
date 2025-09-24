import ProfileSetupWizard from '@/components/profile/ProfileSetupWizard'

// 强制动态渲染
export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ProfileSetupWizard />
    </div>
  )
}