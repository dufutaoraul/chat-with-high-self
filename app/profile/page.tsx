'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'

interface ProfileData {
  full_name: string
  age: string
  occupation: string
  education: string
  family_status: string
  personality: string
  values: string
  interests: string
  short_term_goals: string
  long_term_goals: string
  current_challenges: string
  desired_changes: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    age: '',
    occupation: '',
    education: '',
    family_status: '',
    personality: '',
    values: '',
    interests: '',
    short_term_goals: '',
    long_term_goals: '',
    current_challenges: '',
    desired_changes: ''
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/signin')
        return
      }

      setUser(user)
      
      // 加载现有档案数据
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setProfileData({
          full_name: profile.full_name || '',
          age: profile.age?.toString() || '',
          occupation: profile.occupation || '',
          education: profile.education || '',
          family_status: profile.family_status || '',
          personality: profile.personality || '',
          values: profile.values || '',
          interests: profile.interests || '',
          short_term_goals: profile.short_term_goals || '',
          long_term_goals: profile.long_term_goals || '',
          current_challenges: profile.current_challenges || '',
          desired_changes: profile.desired_changes || ''
        })
      }
    } catch (error) {
      console.error('认证检查失败:', error)
      router.push('/signin')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...profileData,
          age: profileData.age ? parseInt(profileData.age) : null,
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('保存失败:', error)
        alert('保存失败，请重试')
      } else {
        alert('档案保存成功！')
        router.push('/chat')
      }
    } catch (error) {
      console.error('保存错误:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        加载中...
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
              📝 基本信息
            </h2>
            <input
              type="text"
              placeholder="您的姓名"
              value={profileData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              style={inputStyle}
            />
            <input
              type="number"
              placeholder="年龄"
              value={profileData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="职业"
              value={profileData.occupation}
              onChange={(e) => handleInputChange('occupation', e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="教育背景"
              value={profileData.education}
              onChange={(e) => handleInputChange('education', e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="家庭状况"
              value={profileData.family_status}
              onChange={(e) => handleInputChange('family_status', e.target.value)}
              style={inputStyle}
            />
          </div>
        )
      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
              🎭 性格特质
            </h2>
            <textarea
              placeholder="请描述您的性格特点..."
              value={profileData.personality}
              onChange={(e) => handleInputChange('personality', e.target.value)}
              style={textareaStyle}
              rows={4}
            />
            <textarea
              placeholder="您的核心价值观是什么？"
              value={profileData.values}
              onChange={(e) => handleInputChange('values', e.target.value)}
              style={textareaStyle}
              rows={4}
            />
            <textarea
              placeholder="您的兴趣爱好有哪些？"
              value={profileData.interests}
              onChange={(e) => handleInputChange('interests', e.target.value)}
              style={textareaStyle}
              rows={4}
            />
          </div>
        )
      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
              🎯 人生目标
            </h2>
            <textarea
              placeholder="您的短期目标（1年内）"
              value={profileData.short_term_goals}
              onChange={(e) => handleInputChange('short_term_goals', e.target.value)}
              style={textareaStyle}
              rows={4}
            />
            <textarea
              placeholder="您的长期目标（5-10年）"
              value={profileData.long_term_goals}
              onChange={(e) => handleInputChange('long_term_goals', e.target.value)}
              style={textareaStyle}
              rows={4}
            />
          </div>
        )
      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
              🔄 当前状况
            </h2>
            <textarea
              placeholder="您当前面临的主要困扰或挑战"
              value={profileData.current_challenges}
              onChange={(e) => handleInputChange('current_challenges', e.target.value)}
              style={textareaStyle}
              rows={4}
            />
            <textarea
              placeholder="您希望改变的方面"
              value={profileData.desired_changes}
              onChange={(e) => handleInputChange('desired_changes', e.target.value)}
              style={textareaStyle}
              rows={4}
            />
          </div>
        )
      default:
        return null
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box' as const
  }

  const textareaStyle = {
    ...inputStyle,
    resize: 'vertical' as const,
    minHeight: '100px'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '600px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '28px', 
            marginBottom: '10px',
            fontWeight: '300'
          }}>
            🌟 完善您的个人档案
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '16px',
            margin: 0
          }}>
            这些信息将帮助AI更好地了解您，提供个性化的对话体验
          </p>
          <div style={{ 
            marginTop: '20px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '14px'
          }}>
            第 {currentStep} 步，共 4 步
          </div>
        </div>

        {renderStep()}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '30px',
          gap: '10px'
        }}>
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              background: currentStep === 1 ? '#666' : 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '16px',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              flex: 1
            }}
          >
            上一步
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                flex: 1
              }}
            >
              下一步
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                background: saving ? '#666' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '16px',
                cursor: saving ? 'not-allowed' : 'pointer',
                flex: 1
              }}
            >
              {saving ? '保存中...' : '完成设置'}
            </button>
          )}
        </div>

        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          您的信息将被安全保护，仅用于提供个性化AI对话服务
        </div>
      </div>
    </div>
  )
}
