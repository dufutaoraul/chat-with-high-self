'use client'

import { useState, useEffect } from 'react'

interface BlueprintManagerProps {
  currentUser: {
    email: string
  }
}

export default function BlueprintManager({ currentUser }: BlueprintManagerProps) {
  const [activeTab, setActiveTab] = useState('journey')
  const [blueprint, setBlueprint] = useState<Record<string, string>>({})
  const [saveStatus, setSaveStatus] = useState('saved')

  const tabs = [
    { id: 'journey', name: '人生轨迹', icon: '🛤️' },
    { id: 'career', name: '职业与成就', icon: '💼' },
    { id: 'relationships', name: '人际与情感', icon: '❤️' },
    { id: 'health', name: '身心健康', icon: '🌱' },
    { id: 'values', name: '价值观与信念', icon: '⭐' }
  ]

  const fields = {
    journey: [
      { id: 'childhood', label: '童年成长', placeholder: '分享你的童年经历、家庭环境、重要的成长记忆...' },
      { id: 'education', label: '求学之路', placeholder: '你的教育经历、学习体验、印象深刻的老师或同学...' },
      { id: 'turning_points', label: '重大转折点', placeholder: '人生中的重要决定、转折时刻、改变你人生轨迹的事件...' }
    ],
    career: [
      { id: 'work_philosophy', label: '工作理念', placeholder: '你对工作的看法、职业价值观、理想的工作状态...' },
      { id: 'achievements', label: '高光时刻', placeholder: '最自豪的成就、获得认可的时刻、成功的项目经历...' },
      { id: 'failures', label: '至暗时刻', placeholder: '最挫败的经历、失败的教训、低谷期的感受...' },
      { id: 'skills', label: '技能才华', placeholder: '你的专业技能、天赋才华、独特优势...' }
    ],
    relationships: [
      { id: 'family', label: '家庭关系', placeholder: '与父母、兄弟姐妹的关系、家庭氛围、家庭对你的影响...' },
      { id: 'intimate', label: '亲密关系', placeholder: '恋爱经历、婚姻状况、对亲密关系的理解...' },
      { id: 'social', label: '社交圈', placeholder: '朋友圈子、社交习惯、人际交往的模式...' },
      { id: 'embarrassing', label: '最丢人的事', placeholder: '让你感到羞愧或尴尬的经历，从中学到了什么...' }
    ],
    health: [
      { id: 'physical', label: '身体状况', placeholder: '健康状况、运动习惯、身体的优势和挑战...' },
      { id: 'mental', label: '精神状态', placeholder: '心理健康状况、压力管理方式、情绪调节能力...' },
      { id: 'energy', label: '能量来源', placeholder: '什么让你充满活力？什么消耗你的能量？如何恢复状态...' }
    ],
    values: [
      { id: 'core_values', label: '核心价值观', placeholder: '对你最重要的价值观、人生原则、不可妥协的底线...' },
      { id: 'life_goals', label: '人生目标', placeholder: '短期和长期目标、人生愿景、想要成为什么样的人...' },
      { id: 'mindset', label: '思维定式', placeholder: '你意识到的自己的思维模式、习惯性反应、需要突破的局限...' }
    ]
  }

  useEffect(() => {
    // 加载保存的蓝图数据
    const savedBlueprint = localStorage.getItem('blueprint')
    if (savedBlueprint) {
      setBlueprint(JSON.parse(savedBlueprint))
    }
  }, [])

  const handleFieldChange = (fieldId: string, value: string) => {
    const newBlueprint = { ...blueprint, [fieldId]: value }
    setBlueprint(newBlueprint)
    setSaveStatus('saving')
    
    // 自动保存
    setTimeout(() => {
      localStorage.setItem('blueprint', JSON.stringify(newBlueprint))
      setSaveStatus('saved')
    }, 1000)
  }

  const calculateProgress = () => {
    const allFields = Object.values(fields).flat()
    const filledFields = allFields.filter(field => blueprint[field.id]?.trim())
    return Math.round((filledFields.length / allFields.length) * 100)
  }

  return (
    <section className="content-section active">
      <div className="blueprint-container">
        <div className="section-header">
          <h2>我的人生蓝图</h2>
          <p>让AI越了解你，对话越惊喜</p>
        </div>
        
        <div className="blueprint-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>
        
        <div className="blueprint-content">
          <div className="tab-content active">
            {fields[activeTab as keyof typeof fields]?.map(field => (
              <div key={field.id} className="blueprint-section">
                <h3>{field.label}</h3>
                <textarea
                  value={blueprint[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="blueprint-footer">
          <div className="save-status">
            <span className="status-icon">
              {saveStatus === 'saving' ? '💾' : '✅'}
            </span>
            <span className="status-text">
              {saveStatus === 'saving' ? '自动保存中...' : '已保存'}
            </span>
          </div>
          <div className="blueprint-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <span className="progress-text">完成度: {calculateProgress()}%</span>
          </div>
        </div>
      </div>
    </section>
  )
}