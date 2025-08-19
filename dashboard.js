// Dashboard管理类
class DashboardApp {
    constructor() {
        // 检查用户登录状态
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!this.currentUser) {
            window.location.href = 'auth.html';
            return;
        }

        this.users = JSON.parse(localStorage.getItem('users') || '{}');
        this.conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        this.insights = JSON.parse(localStorage.getItem('insights') || '[]');
        this.blueprint = JSON.parse(localStorage.getItem('blueprint') || '{}');
        this.purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');

        this.initializeDashboard();
    }

    // 初始化Dashboard
    initializeDashboard() {
        this.loadUserProfile();
        this.loadAccountStatus();
        this.loadUsageStats();
        this.loadPurchaseHistory();
        this.loadBlueprintOverview();
    }

    // 加载用户资料
    loadUserProfile() {
        const avatarText = document.getElementById('avatarText');
        const userEmail = document.getElementById('userEmail');
        const userSince = document.getElementById('userSince');

        if (avatarText) {
            avatarText.textContent = this.currentUser.email.charAt(0).toUpperCase();
        }
        if (userEmail) {
            userEmail.textContent = this.currentUser.email;
        }
        if (userSince) {
            const createdDate = new Date(this.currentUser.createdAt);
            userSince.textContent = createdDate.toLocaleDateString('zh-CN');
        }
    }

    // 加载账户状态
    loadAccountStatus() {
        const tokenBalance = document.getElementById('tokenBalance');
        const totalConversations = document.getElementById('totalConversations');
        const totalInsights = document.getElementById('totalInsights');
        const blueprintProgress = document.getElementById('blueprintProgress');

        if (tokenBalance) {
            tokenBalance.textContent = this.currentUser.tokenBalance.toLocaleString();
        }
        if (totalConversations) {
            totalConversations.textContent = this.conversations.length;
        }
        if (totalInsights) {
            totalInsights.textContent = this.insights.length;
        }
        if (blueprintProgress) {
            const progress = this.calculateBlueprintProgress();
            blueprintProgress.textContent = `${progress}%`;
        }
    }

    // 加载使用统计
    loadUsageStats() {
        const monthlyChats = document.getElementById('monthlyChats');
        const avgChatLength = document.getElementById('avgChatLength');
        const streakDays = document.getElementById('streakDays');
        const monthlyTokens = document.getElementById('monthlyTokens');

        // 计算本月对话次数
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthlyConversations = this.conversations.filter(conv => {
            const convDate = new Date(conv.date);
            return convDate.getMonth() === thisMonth && convDate.getFullYear() === thisYear;
        });

        if (monthlyChats) {
            monthlyChats.textContent = monthlyConversations.length;
        }

        // 计算平均对话长度
        if (avgChatLength) {
            const totalMessages = this.conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
            const avgLength = this.conversations.length > 0 ? Math.round(totalMessages / this.conversations.length) : 0;
            avgChatLength.textContent = avgLength;
        }

        // 计算连续使用天数
        if (streakDays) {
            const streak = this.calculateStreakDays();
            streakDays.textContent = streak;
        }

        // 计算本月消耗Token（模拟数据）
        if (monthlyTokens) {
            const estimatedTokens = monthlyConversations.length * 500; // 假设每次对话平均500 tokens
            monthlyTokens.textContent = estimatedTokens.toLocaleString();
        }
    }

    // 加载购买历史
    loadPurchaseHistory() {
        const historyContainer = document.getElementById('purchaseHistory');
        if (!historyContainer) return;

        if (this.purchaseHistory.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🛒</div>
                    <h4>暂无购买记录</h4>
                    <p>您还没有进行过充值</p>
                </div>
            `;
            return;
        }

        const historyHTML = this.purchaseHistory
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(purchase => `
                <div class="purchase-item">
                    <div class="purchase-info">
                        <div class="purchase-title">${purchase.tokens.toLocaleString()} Tokens</div>
                        <div class="purchase-date">${this.formatDate(purchase.date)}</div>
                    </div>
                    <div class="purchase-amount">¥${purchase.amount}</div>
                    <div class="purchase-status ${purchase.status}">${this.getStatusText(purchase.status)}</div>
                </div>
            `).join('');

        historyContainer.innerHTML = historyHTML;
    }

    // 加载蓝图概览
    loadBlueprintOverview() {
        const progress = this.calculateBlueprintProgress();
        const progressPercentage = document.getElementById('progressPercentage');
        const progressCircle = document.getElementById('progressCircle');

        if (progressPercentage) {
            progressPercentage.textContent = `${progress}%`;
        }

        if (progressCircle) {
            const circumference = 2 * Math.PI * 52;
            const offset = circumference - (progress / 100) * circumference;
            progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
            progressCircle.style.strokeDashoffset = offset;
        }

        // 更新各模块进度
        this.updateModuleProgress();
    }

    // 更新模块进度
    updateModuleProgress() {
        const modules = {
            journey: ['childhood', 'education', 'turning_points'],
            career: ['work_philosophy', 'achievements', 'failures', 'skills'],
            relationships: ['family', 'intimate', 'social', 'embarrassing'],
            health: ['physical', 'mental', 'energy'],
            values: ['core_values', 'life_goals', 'mindset']
        };

        Object.keys(modules).forEach(moduleKey => {
            const fields = modules[moduleKey];
            const filledCount = fields.filter(field => 
                this.blueprint[field] && this.blueprint[field].trim().length > 0
            ).length;
            
            const progressElement = document.getElementById(`${moduleKey}Progress`);
            if (progressElement) {
                progressElement.textContent = `${filledCount}/${fields.length}`;
            }

            // 更新模块状态样式
            const moduleElement = document.querySelector(`[data-module="${moduleKey}"]`);
            if (moduleElement) {
                if (filledCount === fields.length) {
                    moduleElement.classList.add('completed');
                } else if (filledCount > 0) {
                    moduleElement.classList.add('partial');
                }
            }
        });
    }

    // 计算蓝图完成度
    calculateBlueprintProgress() {
        const allFields = [
            'childhood', 'education', 'turning_points', 'work_philosophy', 
            'achievements', 'failures', 'skills', 'family', 'intimate', 
            'social', 'embarrassing', 'physical', 'mental', 'energy', 
            'core_values', 'life_goals', 'mindset'
        ];
        
        const filledCount = allFields.filter(field => 
            this.blueprint[field] && this.blueprint[field].trim().length > 0
        ).length;
        
        return Math.round((filledCount / allFields.length) * 100);
    }

    // 计算连续使用天数
    calculateStreakDays() {
        if (this.conversations.length === 0) return 0;

        const today = new Date();
        const dates = this.conversations
            .map(conv => new Date(conv.date).toDateString())
            .filter((date, index, arr) => arr.indexOf(date) === index)
            .sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        let currentDate = today;

        for (const dateStr of dates) {
            const date = new Date(dateStr);
            const diffDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
            
            if (diffDays === streak) {
                streak++;
                currentDate = date;
            } else {
                break;
            }
        }

        return streak;
    }

    // 显示充值模态框
    showPricingModal() {
        // 重用主应用的充值模态框逻辑
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'pricingModal';
        modal.innerHTML = `
            <div class="modal-content pricing-modal">
                <div class="modal-header">
                    <h3>选择充值套餐</h3>
                    <button class="modal-close" onclick="window.dashboardApp.closePricingModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="pricing-plans">
                        <div class="pricing-plan" data-tokens="50000" data-price="29">
                            <div class="plan-header">
                                <h4>基础套餐</h4>
                                <div class="plan-price">¥29</div>
                            </div>
                            <div class="plan-features">
                                <div class="plan-tokens">50,000 Tokens</div>
                                <div class="plan-desc">约100次深度对话</div>
                            </div>
                        </div>
                        <div class="pricing-plan popular" data-tokens="150000" data-price="79">
                            <div class="plan-badge">推荐</div>
                            <div class="plan-header">
                                <h4>进阶套餐</h4>
                                <div class="plan-price">¥79</div>
                            </div>
                            <div class="plan-features">
                                <div class="plan-tokens">150,000 Tokens</div>
                                <div class="plan-desc">约300次深度对话</div>
                                <div class="plan-bonus">赠送10,000 Tokens</div>
                            </div>
                        </div>
                        <div class="pricing-plan" data-tokens="300000" data-price="149">
                            <div class="plan-header">
                                <h4>专业套餐</h4>
                                <div class="plan-price">¥149</div>
                            </div>
                            <div class="plan-features">
                                <div class="plan-tokens">300,000 Tokens</div>
                                <div class="plan-desc">约600次深度对话</div>
                                <div class="plan-bonus">赠送30,000 Tokens</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <p class="pricing-note">💡 Token消耗根据对话长度和复杂度而定</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定套餐选择事件
        modal.querySelectorAll('.pricing-plan').forEach(plan => {
            plan.addEventListener('click', () => {
                const tokens = parseInt(plan.dataset.tokens);
                const price = parseInt(plan.dataset.price);
                this.processPurchase(tokens, price);
            });
        });
    }

    // 关闭充值模态框
    closePricingModal() {
        const modal = document.getElementById('pricingModal');
        if (modal) {
            modal.remove();
        }
    }

    // 处理购买
    async processPurchase(tokens, price) {
        this.closePricingModal();
        
        // 显示支付处理中
        const loadingModal = document.createElement('div');
        loadingModal.className = 'modal active';
        loadingModal.innerHTML = `
            <div class="modal-content payment-processing">
                <div class="processing-content">
                    <div class="loading-spinner"></div>
                    <h3>正在处理支付...</h3>
                    <p>请稍候，正在为您充值 ${tokens.toLocaleString()} Tokens</p>
                </div>
            </div>
        `;
        document.body.appendChild(loadingModal);
        
        // 模拟支付延迟
        await this.delay(3000);
        
        // 支付成功，更新余额
        this.currentUser.tokenBalance += tokens;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        // 更新用户数据库
        if (this.users[this.currentUser.email]) {
            this.users[this.currentUser.email].tokenBalance = this.currentUser.tokenBalance;
            localStorage.setItem('users', JSON.stringify(this.users));
        }
        
        // 添加购买记录
        const purchase = {
            id: Date.now(),
            tokens: tokens,
            amount: price,
            date: new Date().toISOString(),
            status: 'completed'
        };
        this.purchaseHistory.push(purchase);
        localStorage.setItem('purchaseHistory', JSON.stringify(this.purchaseHistory));
        
        loadingModal.remove();
        
        // 显示成功消息
        this.showPaymentSuccess(tokens);
        
        // 刷新界面
        this.loadAccountStatus();
        this.loadPurchaseHistory();
    }

    // 显示支付成功
    showPaymentSuccess(tokens) {
        const successModal = document.createElement('div');
        successModal.className = 'modal active';
        successModal.innerHTML = `
            <div class="modal-content payment-success">
                <div class="success-content">
                    <div class="success-icon">✅</div>
                    <h3>充值成功！</h3>
                    <p>已为您充值 ${tokens.toLocaleString()} Tokens</p>
                    <p>当前余额: ${this.currentUser.tokenBalance.toLocaleString()} Tokens</p>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="success-btn">确定</button>
                </div>
            </div>
        `;
        document.body.appendChild(successModal);
        
        // 3秒后自动关闭
        setTimeout(() => {
            if (successModal.parentNode) {
                successModal.remove();
            }
        }, 3000);
    }

    // 导出数据
    exportData() {
        const data = {
            user: this.currentUser,
            conversations: this.conversations,
            insights: this.insights,
            blueprint: this.blueprint,
            purchaseHistory: this.purchaseHistory,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dialogue-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 清除数据
    clearData() {
        if (confirm('确定要清除所有数据吗？此操作不可恢复，您将需要重新登录。')) {
            localStorage.removeItem('conversations');
            localStorage.removeItem('insights');
            localStorage.removeItem('blueprint');
            localStorage.removeItem('purchaseHistory');
            localStorage.removeItem('currentUser');
            
            alert('数据已清除，即将跳转到登录页面');
            window.location.href = 'auth.html';
        }
    }

    // 登出
    logout() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'auth.html';
        }
    }

    // 工具方法
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getStatusText(status) {
        const statusMap = {
            'completed': '已完成',
            'pending': '处理中',
            'failed': '失败'
        };
        return statusMap[status] || status;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 初始化Dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardApp = new DashboardApp();
});