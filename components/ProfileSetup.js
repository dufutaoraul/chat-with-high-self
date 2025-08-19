import { useState } from 'react'
import styles from '../styles/ProfileSetup.module.css'

export default function ProfileSetup({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // 基本信息
    name: '',
    age: '',
    occupation: '',
    location: '',
    
    // 人生目标
    lifeGoals: '',
    careerAspiration: '',
    personalValues: '',
    
    // 当前状况
    currentChallenges: '',
    strengths: '',
    areasForGrowth: '',
    
    // 兴趣爱好
    interests: '',
    learningStyle: '',
    communicationPreference: ''
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/profile/blueprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ blueprint: formData })
      })

      if (response.ok) {
        onComplete()
        onClose()
      } else {
        alert('保存失败，请重试')
      }
    } catch (error) {
      console.error('保存人生蓝图失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name && formData.age && formData.occupation
      case 2:
        return formData.lifeGoals && formData.personalValues
      case 3:
        return formData.currentChallenges && formData.strengths
      case 4:
        return formData.interests && formData.communicationPreference
      default:
        return false
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>创建你的人生蓝图</h2>
          <p>让高我更好地了解你，提供个性化的智慧指导</p>
          <div className={styles.progress}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.content}>
          {step === 1 && (
            <div className={styles.step}>
              <h3>基本信息</h3>
              <div className={styles.formGroup}>
                <label>姓名或昵称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="你希望高我如何称呼你？"
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
                  <label>所在城市</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="北京"
                  />
                </div>
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

          {step === 2 && (
            <div className={styles.step}>
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

          {step === 3 && (
            <div className={styles.step}>
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

          {step === 4 && (
            <div className={styles.step}>
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
        </div>

        <div className={styles.footer}>
          <div className={styles.stepInfo}>
            第 {step} 步，共 4 步
          </div>
          <div className={styles.buttons}>
            {step > 1 && (
              <button 
                className={styles.prevButton}
                onClick={handlePrev}
                disabled={loading}
              >
                上一步
              </button>
            )}
            <button 
              className={styles.nextButton}
              onClick={handleNext}
              disabled={!isStepValid() || loading}
            >
              {loading ? '保存中...' : step === 4 ? '完成设置' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}