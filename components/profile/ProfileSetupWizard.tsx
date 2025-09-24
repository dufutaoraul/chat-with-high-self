'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface ProfileData {
  // 基本信息
  age: number | null
  occupation: string
  education_level: string
  family_status: string
  location: string
  
  // 性格特征
  personality_type: string
  values: string[]
  interests: string[]
  strengths: string[]
  weaknesses: string[]
  
  // 目标设定
  short_term_goals: string[]
  long_term_goals: string[]
  life_vision: string
  
  // 挑战识别
  current_challenges: string[]
  areas_for_improvement: string[]
  stress_factors: string[]
  
  // 其他信息
  communication_style: string
  preferred_feedback_style: string
  motivation_factors: string[]
}

const initialProfileData: ProfileData = {
  age: null,
  occupation: '',
  education_level: '',
  family_status: '',
  location: '',
  personality_type: '',
  values: [],
  interests: [],
  strengths: [],
  weaknesses: [],
  short_term_goals: [],
  long_term_goals: [],
  life_vision: '',
  current_challenges: [],
  areas_for_improvement: [],
  stress_factors: [],
  communication_style: '',
  preferred_feedback_style: '',
  motivation_factors: []
}

const steps = [
  { id: 1, title: '基本信息', description: '告诉我们一些关于你的基本情况' },
  { id: 2, title: '性格特征', description: '了解你的性格和特质' },
  { id: 3, title: '目标设定', description: '分享你的目标和愿景' },
  { id: 4, title: '挑战识别', description: '识别你面临的挑战' },
  { id: 5, title: '偏好设置', description: '设置你的沟通偏好' }
]

export default function ProfileSetupWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [profileData, setProfileData] = useState<ProfileData>(initialProfileData)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // 加载现有的资料数据
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (profile) {
          setProfileData({
            age: profile.age,
            occupation: profile.occupation || '',
            education_level: profile.education_level || '',
            family_status: profile.family_status || '',
            location: profile.location || '',
            personality_type: profile.personality_type || '',
            values: profile.values || [],
            interests: profile.interests || [],
            strengths: profile.strengths || [],
            weaknesses: profile.weaknesses || [],
            short_term_goals: profile.short_term_goals || [],
            long_term_goals: profile.long_term_goals || [],
            life_vision: profile.life_vision || '',
            current_challenges: profile.current_challenges || [],
            areas_for_improvement: profile.areas_for_improvement || [],
            stress_factors: profile.stress_factors || [],
            communication_style: profile.communication_style || '',
            preferred_feedback_style: profile.preferred_feedback_style || '',
            motivation_factors: profile.motivation_factors || []
          })
          setCurrentStep(profile.setup_step || 1)
        }
      }
    }
    
    getUser()
  }, [supabase])

  const updateProfileData = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addToArray = (field: keyof ProfileData, value: string) => {
    if (value.trim()) {
      setProfileData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }))
    }
  }

  const removeFromArray = (field: keyof ProfileData, index: number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }))
  }

  const saveProgress = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ...profileData,
          setup_step: currentStep,
          profile_completed: currentStep === 5
        })

      if (error) throw error
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const nextStep = async () => {
    await saveProgress()
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep 
          data={profileData} 
          updateData={updateProfileData} 
        />
      case 2:
        return <PersonalityStep 
          data={profileData} 
          updateData={updateProfileData}
          addToArray={addToArray}
          removeFromArray={removeFromArray}
        />
      case 3:
        return <GoalsStep 
          data={profileData} 
          updateData={updateProfileData}
          addToArray={addToArray}
          removeFromArray={removeFromArray}
        />
      case 4:
        return <ChallengesStep 
          data={profileData} 
          updateData={updateProfileData}
          addToArray={addToArray}
          removeFromArray={removeFromArray}
        />
      case 5:
        return <PreferencesStep 
          data={profileData} 
          updateData={updateProfileData}
          addToArray={addToArray}
          removeFromArray={removeFromArray}
        />
      default:
        return null
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 进度指示器 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= step.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-16 h-1 mx-2
                  ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {steps[currentStep - 1].title}
          </h2>
          <p className="text-gray-600">
            {steps[currentStep - 1].description}
          </p>
        </div>
      </div>

      {/* 步骤内容 */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        {renderStep()}
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`
            px-6 py-3 rounded-lg font-medium
            ${currentStep === 1 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
            }
          `}
        >
          上一步
        </button>

        <button
          onClick={nextStep}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : currentStep === 5 ? '完成设置' : '下一步'}
        </button>
      </div>
    </div>
  )
}

// 基本信息步骤组件
function BasicInfoStep({ data, updateData }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            年龄
          </label>
          <input
            type="number"
            value={data.age || ''}
            onChange={(e) => updateData('age', parseInt(e.target.value) || null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="请输入您的年龄"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            职业
          </label>
          <input
            type="text"
            value={data.occupation}
            onChange={(e) => updateData('occupation', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="请输入您的职业"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            教育背景
          </label>
          <select
            value={data.education_level}
            onChange={(e) => updateData('education_level', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">请选择教育背景</option>
            <option value="高中及以下">高中及以下</option>
            <option value="大专">大专</option>
            <option value="本科">本科</option>
            <option value="硕士">硕士</option>
            <option value="博士">博士</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            家庭状况
          </label>
          <select
            value={data.family_status}
            onChange={(e) => updateData('family_status', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">请选择家庭状况</option>
            <option value="单身">单身</option>
            <option value="恋爱中">恋爱中</option>
            <option value="已婚无子女">已婚无子女</option>
            <option value="已婚有子女">已婚有子女</option>
            <option value="离异">离异</option>
            <option value="其他">其他</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          所在地区
        </label>
        <input
          type="text"
          value={data.location}
          onChange={(e) => updateData('location', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="请输入您所在的城市或地区"
        />
      </div>
    </div>
  )
}

// 性格特征步骤组件
function PersonalityStep({ data, updateData, addToArray, removeFromArray }: any) {
  const [newValue, setNewValue] = useState('')
  const [newInterest, setNewInterest] = useState('')
  const [newStrength, setNewStrength] = useState('')
  const [newWeakness, setNewWeakness] = useState('')

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          性格类型
        </label>
        <select
          value={data.personality_type}
          onChange={(e) => updateData('personality_type', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">请选择您的性格类型</option>
          <option value="内向型">内向型</option>
          <option value="外向型">外向型</option>
          <option value="混合型">混合型</option>
        </select>
      </div>

      {/* 价值观 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          核心价值观
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入一个价值观，如：诚实、创新、家庭..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('values', newValue)
                setNewValue('')
              }
            }}
          />
          <button
            onClick={() => {
              addToArray('values', newValue)
              setNewValue('')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            添加
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.values.map((value: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {value}
              <button
                onClick={() => removeFromArray('values', index)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 兴趣爱好 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          兴趣爱好
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入兴趣爱好，如：阅读、运动、音乐..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('interests', newInterest)
                setNewInterest('')
              }
            }}
          />
          <button
            onClick={() => {
              addToArray('interests', newInterest)
              setNewInterest('')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            添加
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.interests.map((interest: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
            >
              {interest}
              <button
                onClick={() => removeFromArray('interests', index)}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 优势 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          个人优势
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newStrength}
            onChange={(e) => setNewStrength(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入个人优势，如：沟通能力强、逻辑思维..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('strengths', newStrength)
                setNewStrength('')
              }
            }}
          />
          <button
            onClick={() => {
              addToArray('strengths', newStrength)
              setNewStrength('')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            添加
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.strengths.map((strength: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
            >
              {strength}
              <button
                onClick={() => removeFromArray('strengths', index)}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 待改进领域 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          待改进领域
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newWeakness}
            onChange={(e) => setNewWeakness(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入需要改进的方面，如：时间管理、公众演讲..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('weaknesses', newWeakness)
                setNewWeakness('')
              }
            }}
          />
          <button
            onClick={() => {
              addToArray('weaknesses', newWeakness)
              setNewWeakness('')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            添加
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.weaknesses.map((weakness: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
            >
              {weakness}
              <button
                onClick={() => removeFromArray('weaknesses', index)}
                className="ml-2 text-orange-600 hover:text-orange-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// 目标设定步骤组件
function GoalsStep({ data, updateData, addToArray, removeFromArray }: any) {
  const [newShortGoal, setNewShortGoal] = useState('')
  const [newLongGoal, setNewLongGoal] = useState('')

  return (
    <div className="space-y-6">
      {/* 短期目标 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          短期目标（1年内）
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newShortGoal}
            onChange={(e) => setNewShortGoal(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入短期目标，如：学习新技能、改善健康..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('short_term_goals', newShortGoal)
                setNewShortGoal('')
              }
            }}
          />
          <button
            onClick={() => {
              addToArray('short_term_goals', newShortGoal)
              setNewShortGoal('')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            添加
          </button>
        </div>
        <div className="space-y-2">
          {data.short_term_goals.map((goal: string, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
            >
              <span className="text-blue-800">{goal}</span>
              <button
                onClick={() => removeFromArray('short_term_goals', index)}
                className="text-blue-600 hover:text-blue-800"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 长期目标 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          长期目标（3-5年）
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newLongGoal}
            onChange={(e) => setNewLongGoal(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入长期目标，如：职业发展、人生规划..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('long_term_goals', newLongGoal)
                setNewLongGoal('')
              }
            }}
          />
          <button
            onClick={() => {
              addToArray('long_term_goals', newLongGoal)
              setNewLongGoal('')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            添加
          </button>
        </div>
        <div className="space-y-2">
          {data.long_term_goals.map((goal: string, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
            >
              <span className="text-green-800">{goal}</span>
              <button
                onClick={() => removeFromArray('long_term_goals', index)}
                className="text-green-600 hover:text-green-800"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 人生愿景 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          人生愿景
        </label>
        <textarea
          value={data.life_vision}
          onChange={(e) => updateData('life_vision', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="描述您理想中的人生状态和最终想要达成的愿景..."
        />
      </div>
    </div>
  )
}

// 挑战识别步骤组件
function ChallengesStep({ data, updateData, addToArray, removeFromArray }: any) {
  const [newChallenge, setNewChallenge] = useState('')
  const [newImprovement, setNewImprovement] = useState('')
  const [newStressor, setNewStressor] = useState('')

  return (
    <div className="space-y-6">
      {/* 当前挑战 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          当前面临的挑战
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newChallenge}
            onChange={(e) => setNewChallenge(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入当前挑战，如：工作压力、人际关系..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('current_challenges', newChallenge)
                setNewChallenge('')
              }
            }}
          />
          <button
            onClick={() => {
              addToArray('current_challenges', newChallenge)
              setNewChallenge('')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            添加
          </button>
        </div>
        <div className="space-y-2">
          {data.current_challenges.map((challenge: string, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
            >
              <span className="text-red-800">{challenge}</span>
              <button
                onClick={() => removeFromArray('current_challenges', index)}
                className="text-red-600 hover:text-red-800"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 改进领域 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          希望改进的方面
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newImprovement}
            onChange={(e) => setNewImprovement(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入希望改进的方面，如：自信心、沟通技巧..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('areas_for_improvement', newImprovement)
                setNewImprovement('')
              }
            }}
          />
          <button
            onClick={() => {
              addToArray('areas_for_improvement', newImprovement)
              setNewImprovement('')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            添加
          </button>
        </div>
        <div className="space-y-2">
          {data.areas_for_improvement.map((area: string, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
            >
              <span className="text-yellow-800">{area}</span>
              <button
                onClick={() => removeFromArray('areas_for_improvement', index)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 压力因素 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          主要压力来源
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newStressor}
            onChange={(e) => setNewStressor(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入压力来源，如：工作截止日期、经济压力..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('stress_factors', newStressor)
                setNewStressor('')
              }
            }}
          />
          <button
            onClick={() => {
              addToArray('stress_factors', newStressor)
              setNewStressor('')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            添加
          </button>
        </div>
        <div className="space-y-2">
          {data.stress_factors.map((factor: string, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-gray-800">{factor}</span>
              <button
                onClick={() => removeFromArray('stress_factors', index)}
                className="text-gray-600 hover:text-gray-800"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 偏好设置步骤组件
function PreferencesStep({ data, updateData, addToArray, removeFromArray }: any) {
  const [newMotivation, setNewMotivation] = useState('')

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          沟通风格偏好
        </label>
        <select
          value={data.communication_style}
          onChange={(e) => updateData('communication_style', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">请选择沟通风格</option>
          <option value="直接坦率">直接坦率</option>
          <option value="温和委婉">温和委婉</option>
          <option value="逻辑分析">逻辑分析</option>
          <option value="情感共鸣">情感共鸣</option>
          <option value="幽默轻松">幽默轻松</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          反馈接受方式
        </label>
        <select
          value={data.preferred_feedback_style}
          onChange={(e) => updateData('preferred_feedback_style', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">请选择反馈方式</option>
          <option value="建设性建议">建设性建议</option>
          <option value="鼓励支持">鼓励支持</option>
          <option value="挑战思考">挑战思考</option>
          <option value="实用指导">实用指导</option>
          <option value="深度分析">深度分析</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          激励因素
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newMotivation}
            onChange={(e) => setNewMotivation(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入激励因素，如：成就感、认可、成长..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('motivation_factors', newMotivation)
                setNewMotivation('')
              }
            }}
          />
          <button
            onClick={() => {
              addToArray('motivation_factors', newMotivation)
              setNewMotivation('')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            添加
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.motivation_factors.map((factor: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
            >
              {factor}
              <button
                onClick={() => removeFromArray('motivation_factors', index)}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          🎉 恭喜！您即将完成个人资料设置
        </h3>
        <p className="text-blue-700">
          完成后，AI将根据您的个人信息为您提供更加个性化和有针对性的对话体验。
          您可以随时回到这里更新您的信息。
        </p>
      </div>
    </div>
  )
}