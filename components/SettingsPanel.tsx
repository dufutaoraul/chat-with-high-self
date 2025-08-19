'use client'

import { useState, useEffect } from 'react'

interface SettingsPanelProps {
  currentUser: {
    email: string
    tokenBalance?: number
  }
}

export default function SettingsPanel({ currentUser }: SettingsPanelProps) {
  const [settings, setSettings] = useState({
    theme: 'auto',
    language: 'zh-CN',
    notifications: true,
    autoSave: true,
    aiPersonality: 'wise',
    privacyMode: false
  })

  const [showExportModal, setShowExportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('userSettings', JSON.stringify(newSettings))
  }

  const exportData = () => {
    const userData = {
      profile: JSON.parse(localStorage.getItem('blueprint') || '{}'),
      reflections: JSON.parse(localStorage.getItem('reflections') || '[]'),
      insights: JSON.parse(localStorage.getItem('insights') || '[]'),
      settings: settings,
      exportDate: new Date().toISOString()
    }

    const dataStr = JSON.stringify(userData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `与高我对话_数据导出_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    setShowExportModal(false)
  }

  const deleteAllData = () => {
    localStorage.removeItem('blueprint')
    localStorage.removeItem('reflections')
    localStorage.removeItem('insights')
    localStorage.removeItem('userSettings')
    localStorage.removeItem('currentUser')
    
    alert('所有数据已删除')
    setShowDeleteModal(false)
    window.location.href = '/auth'
  }

  return (
    <section className="content-section active">
      <div className="settings-container">
        <div className="section-header">
          <h2>设置</h2>
          <p>个性化你的对话体验</p>
        </div>

        <div className="settings-sections">
          <div className="settings-section">
            <h3>账户信息</h3>
            <div className="account-info">
              <div className="info-item">
                <label>邮箱</label>
                <span>{currentUser.email}</span>
              </div>
              <div className="info-item">
                <label>Token余额</label>
                <span>{currentUser.tokenBalance?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>数据管理</h3>
            <div className="data-actions">
              <button 
                className="export-btn"
                onClick={() => setShowExportModal(true)}
              >
                📤 导出数据
              </button>
              <button 
                className="delete-btn"
                onClick={() => setShowDeleteModal(true)}
              >
                🗑️ 删除所有数据
              </button>
            </div>
          </div>
        </div>

        {/* 导出确认模态框 */}
        {showExportModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>导出数据</h3>
              <p>将导出你的所有个人资料、反思记录和洞察收藏</p>
              <div className="modal-actions">
                <button onClick={() => setShowExportModal(false)}>取消</button>
                <button onClick={exportData} className="primary">确认导出</button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>删除所有数据</h3>
              <p>⚠️ 此操作不可恢复，将删除所有本地数据</p>
              <div className="modal-actions">
                <button onClick={() => setShowDeleteModal(false)}>取消</button>
                <button onClick={deleteAllData} className="danger">确认删除</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}