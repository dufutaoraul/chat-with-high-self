'use client'

import { useState, useEffect } from 'react'

interface Reflection {
  id: string
  date: string
  title: string
  content: string
  mood: string
  tags: string[]
}

interface ReflectionTimelineProps {
  currentUser: {
    email: string
  }
}

export default function ReflectionTimeline({ currentUser }: ReflectionTimelineProps) {
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newReflection, setNewReflection] = useState({
    title: '',
    content: '',
    mood: 'neutral',
    tags: ''
  })

  const moods = [
    { id: 'happy', name: '开心', emoji: '😊', color: '#ffd93d' },
    { id: 'calm', name: '平静', emoji: '😌', color: '#6bcf7f' },
    { id: 'neutral', name: '一般', emoji: '😐', color: '#95a5a6' },
    { id: 'confused', name: '困惑', emoji: '😕', color: '#f39c12' },
    { id: 'sad', name: '难过', emoji: '😢', color: '#e74c3c' }
  ]

  useEffect(() => {
    // 加载保存的反思记录
    const savedReflections = localStorage.getItem('reflections')
    if (savedReflections) {
      setReflections(JSON.parse(savedReflections))
    }
  }, [])

  const handleAddReflection = () => {
    if (!newReflection.title.trim() || !newReflection.content.trim()) return

    const reflection: Reflection = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      title: newReflection.title,
      content: newReflection.content,
      mood: newReflection.mood,
      tags: newReflection.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }

    const updatedReflections = [reflection, ...reflections]
    setReflections(updatedReflections)
    localStorage.setItem('reflections', JSON.stringify(updatedReflections))

    // 重置表单
    setNewReflection({
      title: '',
      content: '',
      mood: 'neutral',
      tags: ''
    })
    setShowAddForm(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  const getMoodInfo = (moodId: string) => {
    return moods.find(mood => mood.id === moodId) || moods[2]
  }

  return (
    <section className="content-section active">
      <div className="reflection-container">
        <div className="section-header">
          <h2>反思记录</h2>
          <p>记录你的思考轨迹，见证内在成长</p>
          <button 
            className="add-reflection-btn"
            onClick={() => setShowAddForm(true)}
          >
            <span>✍️</span>
            <span>写下反思</span>
          </button>
        </div>

        {showAddForm && (
          <div className="add-reflection-form">
            <div className="form-header">
              <h3>新的反思</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="form-content">
              <input
                type="text"
                placeholder="给这次反思起个标题..."
                value={newReflection.title}
                onChange={(e) => setNewReflection(prev => ({ ...prev, title: e.target.value }))}
                className="reflection-title-input"
              />
              
              <textarea
                placeholder="写下你的思考、感受、洞察..."
                value={newReflection.content}
                onChange={(e) => setNewReflection(prev => ({ ...prev, content: e.target.value }))}
                className="reflection-content-input"
                rows={6}
              />
              
              <div className="mood-selector">
                <label>当前心情：</label>
                <div className="mood-options">
                  {moods.map(mood => (
                    <button
                      key={mood.id}
                      className={`mood-option ${newReflection.mood === mood.id ? 'selected' : ''}`}
                      onClick={() => setNewReflection(prev => ({ ...prev, mood: mood.id }))}
                      style={{ borderColor: mood.color }}
                    >
                      <span className="mood-emoji">{mood.emoji}</span>
                      <span className="mood-name">{mood.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <input
                type="text"
                placeholder="标签 (用逗号分隔，如：工作,人际关系,成长)"
                value={newReflection.tags}
                onChange={(e) => setNewReflection(prev => ({ ...prev, tags: e.target.value }))}
                className="reflection-tags-input"
              />
              
              <div className="form-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  取消
                </button>
                <button 
                  className="save-btn"
                  onClick={handleAddReflection}
                  disabled={!newReflection.title.trim() || !newReflection.content.trim()}
                >
                  保存反思
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="reflections-timeline">
          {reflections.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>还没有反思记录</h3>
              <p>开始记录你的思考和感受，见证内在成长的轨迹</p>
            </div>
          ) : (
            reflections.map((reflection, index) => {
              const moodInfo = getMoodInfo(reflection.mood)
              return (
                <div key={reflection.id} className="reflection-item">
                  <div className="reflection-timeline-marker">
                    <div 
                      className="timeline-dot"
                      style={{ backgroundColor: moodInfo.color }}
                    >
                      {moodInfo.emoji}
                    </div>
                    {index < reflections.length - 1 && <div className="timeline-line" />}
                  </div>
                  
                  <div className="reflection-content">
                    <div className="reflection-header">
                      <h3 className="reflection-title">{reflection.title}</h3>
                      <div className="reflection-meta">
                        <span className="reflection-date">{formatDate(reflection.date)}</span>
                        <span className="reflection-mood">
                          {moodInfo.emoji} {moodInfo.name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="reflection-text">
                      {reflection.content}
                    </div>
                    
                    {reflection.tags.length > 0 && (
                      <div className="reflection-tags">
                        {reflection.tags.map(tag => (
                          <span key={tag} className="tag">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}