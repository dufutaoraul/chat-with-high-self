import { useState, useEffect, useCallback } from 'react'
import styles from '../styles/ProfileManager.module.css'

export default function ProfileManager({ isOpen, onClose, onComplete }) {
  const [activeTab, setActiveTab] = useState('basic')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [formData, setFormData] = useState({
    // 基本信息
    nickname: '',
    age: '',
    gender: '',
    occupation: '',
    location: '',
    
    // 身份信息（敏感）
    realName: '',
    birthDate: '',
    birthPlace: '',
    
    // 人生目标
    lifeGoals: '',
    careerAspiration: '',
    personalValues: '',
    
    // 当前状况
    currentChallenges: '',
    strengths: '',
    areasForGrowth: '',
    
    // 兴趣偏好
    interests: '',
    learningStyle: '',
    communicationPreference: ''
  })

  // 加载现有数据
  useEffect(() => {
    if (isOpen) {
      loadExistingData()
    }
  }, [isOpen])

  // 自动保存功能 - 3秒延迟
  useEffect(() => {
    if (isOpen && !loading) {
      const timer = setTimeout(() => {
        autoSave()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [formData, isOpen, loading, autoSave])

  const loadExistingData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('演示模式：没有登录token，使用本地存储')
        // 演示模式：从本地存储加载数据
        const savedData = localStorage.getItem('demo_profile_data')
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          setFormData(prev => ({ ...prev, ...parsedData }))
          console.log('从本地存储加载的演示数据:', parsedData)
        }
        setLoading(false)
        return
      }

      console.log('正在加载用户档案数据...')
      const response = await fetch('/api/profile/blueprint', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('从数据库加载的档案数据:', data)
        if (data.blueprint) {
          setFormData(prev => ({ ...prev, ...data.blueprint }))
          console.log('档案数据已加载到表单')
        } else {
          console.log('数据库中没有找到档案数据')
        }
      } else {
        console.error('加载档案失败:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('加载用户资料失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const autoSave = useCallback(async () => {
    if (saving) return
    
    // 检查是否有数据需要保存
    const hasData = Object.values(formData).some(value => value && value.toString().trim())
    if (!hasData) return

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('演示模式：保存到本地存储')
        // 演示模式：保存到本地存储
        localStorage.setItem('demo_profile_data', JSON.stringify(formData))
        console.log('演示数据已保存到本地存储:', formData)
        setLastSaved(new Date())
        setSaving(false)
        return
      }

      console.log('自动保存档案数据:', formData)
      const response = await fetch('/api/profile/blueprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ blueprint: formData })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('档案保存成功:', result)
        setLastSaved(new Date())
      } else {
        const error = await response.text()
        console.error('自动保存失败:', response.status, error)
      }
    } catch (error) {
      console.error('自动保存失败:', error)
    } finally {
      setSaving(false)
    }
  }, [formData, saving])

  const handleInputChange = (field, value) => {
    console.log(`更新字段 ${field}:`, value)
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleManualSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('演示模式：手动保存到本地存储')
        localStorage.setItem('demo_profile_data', JSON.stringify(formData))
        console.log('演示数据已手动保存:', formData)
        setLastSaved(new Date())
        alert('演示模式：数据已保存到本地存储！\n登录后数据将同步到云端数据库。')
        setSaving(false)
        return
      }

      console.log('手动保存档案数据:', formData)
      const response = await fetch('/api/profile/blueprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ blueprint: formData })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('手动保存成功:', result)
        setLastSaved(new Date())
        alert('保存成功！')
      } else {
        const error = await response.text()
        console.error('手动保存失败:', response.status, error)
        alert('保存失败，请重试')
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const clearSensitiveData = () => {
    if (confirm('确定要清除身份信息（真实姓名、生日、出生地）吗？清除后这些信息将从数据库中删除，此操作不可撤销。')) {
      console.log('清除敏感信息')
      setFormData(prev => ({
        ...prev,
        realName: '',
        birthDate: '',
        birthPlace: ''
      }))
      // 立即保存
      setTimeout(() => autoSave(), 100)
    }
  }

  const handleComplete = () => {
    onComplete()
    onClose()
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'basic', name: '基本信息', icon: '👤' },
    { id: 'identity', name: '身份信息', icon: '🆔' },
    { id: 'goals', name: '人生目标', icon: '🎯' },
    { id: 'current', name: '当前状况', icon: '📊' },
    { id: 'interests', name: '兴趣偏好', icon: '❤️' }
  ]

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* 演示模式提示 */}
        {!localStorage.getItem('token') && (
          <div className={styles.demoNotice}>
            <div className={styles.demoIcon}>🔒</div>
            <div className={styles.demoText}>
              <strong>演示模式</strong> - 未登录，数据保存在本地
            </div>
            <button 
              className={styles.loginBtn}
              onClick={() => window.location.href = '/login'}
            >
              立即登录
            </button>
          </div>
        )}

        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h2>个人档案管理</h2>
            <div className={styles.saveStatus}>
              {saving && <span className={styles.saving}>💾 保存中...</span>}
              {lastSaved && !saving && (
                <span className={styles.saved}>
                  ✅ 已保存 {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.tabBar}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabName}>{tab.name}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>🔄 加载中...</div>
          ) : (
            <>
              {activeTab === 'basic' && (
                <div className={styles.tabContent}>
                  <h3>基本信息</h3>
                  <div className={styles.formGroup}>
                    <label>昵称</label>
                    <input
                      type="text"
                      value={formData.nickname}
                      onChange={(e) => handleInputChange('nickname', e.target.value)}
                      placeholder="你希望我怎么称呼你？"
                    />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>年龄</label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        placeholder="25"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>性别</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                      >
                        <option value="">请选择</option>
                        <option value="male">男</option>
                        <option value="female">女</option>
                        <option value="other">其他</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>所在城市</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="北京"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>职业或身份</label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => handleInputChange('occupation', e.target.value)}
                      placeholder="产品经理、学生、创业者..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'identity' && (
                <div className={styles.tabContent}>
                  <div className={styles.sensitiveNotice}>
                    <div className={styles.noticeIcon}>🔒</div>
                    <div className={styles.noticeContent}>
                      <h4>隐私保护承诺</h4>
                      <p>以下信息仅用于生命数字和人类图分析，我们承诺严格保密。您可以随时添加、修改、删除这些信息。</p>
                    </div>
                  </div>
                  
                  <h3>身份信息 <span className={styles.optional}>(可选)</span></h3>
                  <div className={styles.formGroup}>
                    <label>身份证姓名</label>
                    <input
                      type="text"
                      value={formData.realName}
                      onChange={(e) => handleInputChange('realName', e.target.value)}
                      placeholder="用于生命数字分析的真实姓名"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>阳历生日</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    />
                    <small>用于人类图和生命数字的精确计算</small>
                  </div>
                  <div className={styles.formGroup}>
                    <label>出生地点</label>
                    <input
                      type="text"
                      value={formData.birthPlace}
                      onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                      placeholder="省市区，如：北京市朝阳区"
                    />
                    <small>用于人类图的地理位置计算</small>
                  </div>
                  
                  <div className={styles.sensitiveActions}>
                    <button 
                      className={styles.clearButton}
                      onClick={clearSensitiveData}
                    >
                      🗑️ 清除身份信息
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'goals' && (
                <div className={styles.tabContent}>
                  <h3>人生目标与价值观</h3>
                  <div className={styles.formGroup}>
                    <label>你的人生目标是什么？</label>
                    <textarea
                      value={formData.lifeGoals}
                      onChange={(e) => handleInputChange('lifeGoals', e.target.value)}
                      placeholder="描述你希望实现的人生目标和梦想..."
                      rows={4}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>职业理想</label>
                    <textarea
                      value={formData.careerAspiration}
                      onChange={(e) => handleInputChange('careerAspiration', e.target.value)}
                      placeholder="你希望在职业上达到什么成就？"
                      rows={3}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>核心价值观</label>
                    <textarea
                      value={formData.personalValues}
                      onChange={(e) => handleInputChange('personalValues', e.target.value)}
                      placeholder="什么对你来说最重要？诚信、创新、家庭、自由..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'current' && (
                <div className={styles.tabContent}>
                  <h3>当前状况</h3>
                  <div className={styles.formGroup}>
                    <label>目前面临的主要挑战</label>
                    <textarea
                      value={formData.currentChallenges}
                      onChange={(e) => handleInputChange('currentChallenges', e.target.value)}
                      placeholder="工作压力、人际关系、决策困难、时间管理..."
                      rows={4}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>你的优势和长处</label>
                    <textarea
                      value={formData.strengths}
                      onChange={(e) => handleInputChange('strengths', e.target.value)}
                      placeholder="逻辑思维、沟通能力、创造力、执行力..."
                      rows={3}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>希望改进的方面</label>
                    <textarea
                      value={formData.areasForGrowth}
                      onChange={(e) => handleInputChange('areasForGrowth', e.target.value)}
                      placeholder="情绪管理、专业技能、人际交往..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'interests' && (
                <div className={styles.tabContent}>
                  <h3>兴趣与偏好</h3>
                  <div className={styles.formGroup}>
                    <label>兴趣爱好</label>
                    <textarea
                      value={formData.interests}
                      onChange={(e) => handleInputChange('interests', e.target.value)}
                      placeholder="阅读、运动、音乐、旅行、科技..."
                      rows={3}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>学习方式偏好</label>
                    <select
                      value={formData.learningStyle}
                      onChange={(e) => handleInputChange('learningStyle', e.target.value)}
                    >
                      <option value="">选择你的学习方式</option>
                      <option value="visual">视觉型（图表、图像）</option>
                      <option value="auditory">听觉型（讨论、音频）</option>
                      <option value="kinesthetic">动手型（实践、体验）</option>
                      <option value="reading">阅读型（文字、书籍）</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>沟通偏好</label>
                    <select
                      value={formData.communicationPreference}
                      onChange={(e) => handleInputChange('communicationPreference', e.target.value)}
                    >
                      <option value="">选择沟通方式</option>
                      <option value="direct">直接明了</option>
                      <option value="gentle">温和引导</option>
                      <option value="analytical">逻辑分析</option>
                      <option value="creative">创意启发</option>
                      <option value="supportive">支持鼓励</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <span className={styles.autoSaveNote}>
              ⚡ 3秒自动保存已开启
            </span>
          </div>
          <div className={styles.footerRight}>
            <button 
              className={styles.saveButton}
              onClick={handleManualSave}
              disabled={saving}
            >
              {saving ? '保存中...' : '💾 手动保存'}
            </button>
            <button 
              className={styles.completeButton}
              onClick={handleComplete}
            >
              ✅ 完成设置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}