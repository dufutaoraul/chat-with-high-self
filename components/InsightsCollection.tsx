'use client'

import { useState, useEffect } from 'react'

interface Insight {
  id: string
  content: string
  source: string
  date: string
  category: string
  isFavorite: boolean
}

interface InsightsCollectionProps {
  currentUser: {
    email: string
  }
}

export default function InsightsCollection({ currentUser }: InsightsCollectionProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = [
    { id: 'all', name: '全部', icon: '📚' },
    { id: 'self-awareness', name: '自我认知', icon: '🪞' },
    { id: 'relationships', name: '人际关系', icon: '👥' },
    { id: 'career', name: '职业发展', icon: '💼' },
    { id: 'life-philosophy', name: '人生哲学', icon: '🌟' },
    { id: 'growth', name: '个人成长', icon: '🌱' }
  ]

  useEffect(() => {
    // 加载保存的洞察收藏
    const savedInsights = localStorage.getItem('insights')
    if (savedInsights) {
      setInsights(JSON.parse(savedInsights))
    } else {
      // 添加一些示例洞察
      const sampleInsights: Insight[] = [
        {
          id: '1',
          content: '真正的自信不是觉得自己完美，而是接受自己的不完美，并相信自己有能力成长和改变。',
          source: '与高我对话',
          date: new Date().toISOString(),
          category: 'self-awareness',
          isFavorite: true
        },
        {
          id: '2',
          content: '每一次选择都是在塑造未来的自己。问问自己：这个选择会让我成为更好的人吗？',
          source: '反思记录',
          date: new Date(Date.now() - 86400000).toISOString(),
          category: 'life-philosophy',
          isFavorite: false
        }
      ]
      setInsights(sampleInsights)
      localStorage.setItem('insights', JSON.stringify(sampleInsights))
    }
  }, [])

  const filteredInsights = insights.filter(insight => {
    const matchesFilter = filter === 'all' || insight.category === filter
    const matchesSearch = insight.content.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const toggleFavorite = (insightId: string) => {
    const updatedInsights = insights.map(insight =>
      insight.id === insightId
        ? { ...insight, isFavorite: !insight.isFavorite }
        : insight
    )
    setInsights(updatedInsights)
    localStorage.setItem('insights', JSON.stringify(updatedInsights))
  }

  const deleteInsight = (insightId: string) => {
    if (confirm('确定要删除这条洞察吗？')) {
      const updatedInsights = insights.filter(insight => insight.id !== insightId)
      setInsights(updatedInsights)
      localStorage.setItem('insights', JSON.stringify(updatedInsights))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0]
  }

  return (
    <section className="content-section active">
      <div className="insights-container">
        <div className="section-header">
          <h2>洞察收藏</h2>
          <p>珍藏那些触动心灵的智慧时刻</p>
        </div>

        <div className="insights-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="搜索洞察内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category.id}
                className={`filter-btn ${filter === category.id ? 'active' : ''}`}
                onClick={() => setFilter(category.id)}
              >
                <span className="filter-icon">{category.icon}</span>
                <span className="filter-name">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="insights-grid">
          {filteredInsights.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💡</div>
              <h3>
                {searchTerm ? '没有找到相关洞察' : '还没有收藏洞察'}
              </h3>
              <p>
                {searchTerm 
                  ? '尝试使用其他关键词搜索' 
                  : '在对话中点击"收藏洞察"来保存有价值的内容'
                }
              </p>
            </div>
          ) : (
            filteredInsights.map(insight => {
              const categoryInfo = getCategoryInfo(insight.category)
              return (
                <div key={insight.id} className="insight-card">
                  <div className="insight-header">
                    <div className="insight-category">
                      <span className="category-icon">{categoryInfo.icon}</span>
                      <span className="category-name">{categoryInfo.name}</span>
                    </div>
                    <div className="insight-actions">
                      <button
                        className={`favorite-btn ${insight.isFavorite ? 'active' : ''}`}
                        onClick={() => toggleFavorite(insight.id)}
                      >
                        {insight.isFavorite ? '❤️' : '🤍'}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteInsight(insight.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="insight-content">
                    <p>{insight.content}</p>
                  </div>

                  <div className="insight-footer">
                    <div className="insight-source">
                      <span className="source-icon">📝</span>
                      <span className="source-text">{insight.source}</span>
                    </div>
                    <div className="insight-date">
                      {formatDate(insight.date)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {filteredInsights.length > 0 && (
          <div className="insights-stats">
            <div className="stat-item">
              <span className="stat-number">{insights.length}</span>
              <span className="stat-label">总洞察</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{insights.filter(i => i.isFavorite).length}</span>
              <span className="stat-label">收藏</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{new Set(insights.map(i => i.category)).size}</span>
              <span className="stat-label">分类</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}