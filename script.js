// 应用状态管理
// 应用状态管理
class DialogueApp {
    constructor() {
        // 检查用户登录状态
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!this.currentUser) {
            window.location.href = 'auth.html';
            return;
        }

        this.conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        this.insights = JSON.parse(localStorage.getItem('insights') || '[]');
        this.settings = JSON.parse(localStorage.getItem('settings') || '{}');
        this.blueprint = JSON.parse(localStorage.getItem('blueprint') || '{}');
        this.currentConversation = [];
        
        this.initializeApp();
        this.bindEvents();
        this.loadSettings();
        this.loadBlueprint();
        this.initializeUserInterface();
    }

    // 初始化应用
    // 初始化应用
    initializeApp() {
        this.updateStats();
        this.renderReflectionTimeline();
        this.renderInsights();
    }

    // 初始化用户界面
    initializeUserInterface() {
        // 添加用户信息到导航栏
        this.addUserInfoToNav();
        
        // 添加Token余额显示
        this.addTokenDisplay();
        
        // 检查Token余额
        this.checkTokenBalance();
    }

    // 添加用户信息到导航栏
    addUserInfoToNav() {
        const navContent = document.querySelector('.nav-content');
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
            <div class="user-avatar" onclick="window.dialogueApp.toggleUserMenu()">
                <span>${this.currentUser.email.charAt(0).toUpperCase()}</span>
            </div>
            <div class="user-menu hidden" id="userMenu">
                <div class="user-menu-header">
                    <div class="user-email">${this.currentUser.email}</div>
                    <div class="user-tokens">余额: ${this.currentUser.tokenBalance.toLocaleString()} Tokens</div>
                </div>
                <div class="user-menu-actions">
                    <button onclick="window.dialogueApp.showPricingModal()">充值</button>
                    <button onclick="window.dialogueApp.logout()">退出登录</button>
                </div>
            </div>
        `;
        navContent.appendChild(userInfo);
    }

    // 添加Token余额显示
    addTokenDisplay() {
        const chatHeader = document.querySelector('.chat-header');
        const tokenDisplay = document.createElement('div');
        tokenDisplay.className = 'token-display';
        tokenDisplay.id = 'tokenDisplay';
        tokenDisplay.innerHTML = `
            <div class="token-info">
                <span class="token-icon">💎</span>
                <span class="token-count">${this.currentUser.tokenBalance.toLocaleString()}</span>
                <span class="token-label">Tokens</span>
            </div>
        `;
        chatHeader.appendChild(tokenDisplay);
    }

    // 检查Token余额
    checkTokenBalance() {
        const balance = this.currentUser.tokenBalance;
        const warningThreshold = 2000; // 低于2000时警告
        const blockThreshold = 100; // 低于100时禁用

        if (balance <= blockThreshold) {
            this.blockChatInput('Token余额不足，请充值后继续对话');
        } else if (balance <= warningThreshold) {
            this.showTokenWarning();
        }
    }

    // 显示Token警告
    showTokenWarning() {
        const warning = document.createElement('div');
        warning.className = 'token-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <span class="warning-icon">⚠️</span>
                <span>Token余额较低，建议及时充值</span>
                <button onclick="window.dialogueApp.showPricingModal()" class="warning-btn">立即充值</button>
            </div>
        `;
        
        const chatContainer = document.querySelector('.chat-container');
        chatContainer.insertBefore(warning, chatContainer.firstChild);
    }

    // 阻止聊天输入
    blockChatInput(message) {
        const inputContainer = document.querySelector('.chat-input-container');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        
        messageInput.disabled = true;
        messageInput.placeholder = message;
        sendButton.disabled = true;
        
        // 添加充值提示
        const blockMessage = document.createElement('div');
        blockMessage.className = 'chat-blocked';
        blockMessage.innerHTML = `
            <div class="blocked-content">
                <span class="blocked-icon">🚫</span>
                <p>${message}</p>
                <button onclick="window.dialogueApp.showPricingModal()" class="recharge-btn">立即充值</button>
            </div>
        `;
        inputContainer.appendChild(blockMessage);
    }

    // 切换用户菜单
    toggleUserMenu() {
        const userMenu = document.getElementById('userMenu');
        userMenu.classList.toggle('hidden');
        
        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-info')) {
                userMenu.classList.add('hidden');
            }
        }, { once: true });
    }

    // 显示充值模态框
    showPricingModal() {
        // 创建充值模态框
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'pricingModal';
        modal.innerHTML = `
            <div class="modal-content pricing-modal">
                <div class="modal-header">
                    <h3>选择充值套餐</h3>
                    <button class="modal-close" onclick="window.dialogueApp.closePricingModal()">&times;</button>
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

    // 处理购买（模拟支付）
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
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (users[this.currentUser.email]) {
            users[this.currentUser.email].tokenBalance = this.currentUser.tokenBalance;
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        loadingModal.remove();
        
        // 显示成功消息
        this.showPaymentSuccess(tokens);
        
        // 更新界面
        this.updateTokenDisplay();
        this.enableChatIfBlocked();
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
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="success-btn">继续对话</button>
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

    // 更新Token显示
    updateTokenDisplay() {
        const tokenCount = document.querySelector('.token-count');
        const userTokens = document.querySelector('.user-tokens');
        
        if (tokenCount) {
            tokenCount.textContent = this.currentUser.tokenBalance.toLocaleString();
        }
        if (userTokens) {
            userTokens.textContent = `余额: ${this.currentUser.tokenBalance.toLocaleString()} Tokens`;
        }
        
        // 移除警告
        const warning = document.querySelector('.token-warning');
        if (warning) {
            warning.remove();
        }
    }

    // 启用聊天（如果之前被阻止）
    enableChatIfBlocked() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const blockedContent = document.querySelector('.chat-blocked');
        
        if (messageInput.disabled) {
            messageInput.disabled = false;
            messageInput.placeholder = '分享你的想法、困扰或疑问...';
            sendButton.disabled = false;
        }
        
        if (blockedContent) {
            blockedContent.remove();
        }
    }

    // 消耗Token
    consumeTokens(amount) {
        this.currentUser.tokenBalance = Math.max(0, this.currentUser.tokenBalance - amount);
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        // 更新用户数据库
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (users[this.currentUser.email]) {
            users[this.currentUser.email].tokenBalance = this.currentUser.tokenBalance;
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        this.updateTokenDisplay();
        this.checkTokenBalance();
    }

    // 登出
    logout() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'auth.html';
        }
    }

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 绑定事件监听器
    bindEvents() {
        // 导航切换
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // 发送消息
        document.getElementById('sendButton').addEventListener('click', () => {
            this.sendMessage();
        });

        // 输入框回车发送
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 建议词点击
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.getElementById('messageInput').value = e.target.textContent;
                this.sendMessage();
            });
        });

        // 模态框事件
        this.bindModalEvents();

        // 设置事件
        this.bindSettingsEvents();
        
        // 蓝图事件
        this.bindBlueprintEvents();
    }

    // 绑定蓝图事件
    bindBlueprintEvents() {
        // 延迟绑定，确保DOM已加载
        setTimeout(() => {
            // 标签页切换
            const tabButtons = document.querySelectorAll('.tab-button');
            if (tabButtons.length > 0) {
                tabButtons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        this.switchBlueprintTab(e.target.dataset.tab);
                    });
                });
            }

            // 自动保存所有文本域
            const textareas = document.querySelectorAll('.blueprint-section textarea');
            if (textareas.length > 0) {
                textareas.forEach(textarea => {
                    textarea.addEventListener('input', Utils.debounce(() => {
                        this.saveBlueprintField(textarea.id, textarea.value);
                    }, 1000));
                });
            }
        }, 100);
    }

    // 切换蓝图标签页
    switchBlueprintTab(tabName) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // 显示对应内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }

    // 保存蓝图字段
    saveBlueprintField(fieldId, value) {
        this.blueprint[fieldId] = value;
        localStorage.setItem('blueprint', JSON.stringify(this.blueprint));
        
        // 更新保存状态
        this.updateSaveStatus();
        
        // 更新完成度
        this.updateBlueprintProgress();
    }

    // 加载蓝图数据
    loadBlueprint() {
        // 延迟执行，确保DOM已加载
        setTimeout(() => {
            const textareas = document.querySelectorAll('.blueprint-section textarea');
            textareas.forEach(textarea => {
                if (this.blueprint[textarea.id]) {
                    textarea.value = this.blueprint[textarea.id];
                }
            });
            this.updateBlueprintProgress();
        }, 100);
    }

    // 更新保存状态
    updateSaveStatus() {
        const statusElement = document.getElementById('saveStatus');
        if (statusElement) {
            const statusText = statusElement.querySelector('.status-text');
            const statusIcon = statusElement.querySelector('.status-icon');
            
            if (statusIcon && statusText) {
                statusIcon.textContent = '✅';
                statusText.textContent = '已保存';
                
                setTimeout(() => {
                    statusIcon.textContent = '💾';
                    statusText.textContent = '自动保存中...';
                }, 2000);
            }
        }
    }

    // 更新蓝图完成度
    updateBlueprintProgress() {
        const textareas = document.querySelectorAll('.blueprint-section textarea');
        let filledCount = 0;
        
        textareas.forEach(textarea => {
            if (textarea.value.trim().length > 0) {
                filledCount++;
            }
        });
        
        const progress = textareas.length > 0 ? Math.round((filledCount / textareas.length) * 100) : 0;
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        if (progressText) {
            progressText.textContent = `完成度: ${progress}%`;
        }
    }

    // 绑定模态框事件
    bindModalEvents() {
        const modal = document.getElementById('insightModal');
        const closeBtn = document.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelInsight');
        const saveBtn = document.getElementById('saveInsight');

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveInsight());

        // 点击模态框外部关闭
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    // 绑定设置事件
    bindSettingsEvents() {
        const exportBtn = document.getElementById('exportData');
        const clearBtn = document.getElementById('clearData');
        const responseStyle = document.getElementById('responseStyle');
        const conversationDepth = document.getElementById('conversationDepth');
        const saveConversations = document.getElementById('saveConversations');
        const enableAnalytics = document.getElementById('enableAnalytics');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearData();
            });
        }

        // 设置变更监听
        if (responseStyle) {
            responseStyle.addEventListener('change', (e) => {
                this.updateSetting('responseStyle', e.target.value);
            });
        }

        if (conversationDepth) {
            conversationDepth.addEventListener('change', (e) => {
                this.updateSetting('conversationDepth', e.target.value);
            });
        }

        if (saveConversations) {
            saveConversations.addEventListener('change', (e) => {
                this.updateSetting('saveConversations', e.target.checked);
            });
        }

        if (enableAnalytics) {
            enableAnalytics.addEventListener('change', (e) => {
                this.updateSetting('enableAnalytics', e.target.checked);
            });
        }
    }

    // 切换页面部分
    switchSection(sectionName) {
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // 显示对应内容
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        const activeSection = document.getElementById(`${sectionName}-section`);
        if (activeSection) {
            activeSection.classList.add('active');
        }
    }

    // 发送消息
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;

        // 清空输入框
        input.value = '';

        // 添加用户消息到界面
        this.addMessageToChat('user', message);

        // 添加到当前对话
        this.currentConversation.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });

        // 显示打字指示器
        this.showTypingIndicator();

        // 模拟高我回应
        setTimeout(() => {
            const response = this.generateHigherSelfResponse(message);
            this.hideTypingIndicator();
            this.addMessageToChat('higher-self', response);
            
            this.currentConversation.push({
                role: 'higher-self',
                content: response,
                timestamp: new Date().toISOString()
            });

            // 保存对话
            this.saveConversation();
        }, 1500 + Math.random() * 2000);
    }

    // 添加消息到聊天界面
    addMessageToChat(sender, content) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = `message-avatar ${sender}`;
        avatar.textContent = sender === 'user' ? '👤' : '🌟';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = this.formatMessage(content);

        // 添加消息操作按钮
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        
        if (sender === 'higher-self') {
            const collectBtn = document.createElement('button');
            collectBtn.className = 'action-btn';
            collectBtn.textContent = '收藏洞察';
            collectBtn.addEventListener('click', () => {
                this.openInsightModal(content);
            });
            actions.appendChild(collectBtn);
        }

        messageContent.appendChild(actions);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);

        // 滚动到底部
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // 格式化消息内容
    formatMessage(content) {
        // 简单的文本格式化，可以扩展支持更多格式
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    // 显示打字指示器
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message higher-self typing-indicator';
        typingDiv.id = 'typingIndicator';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar higher-self';
        avatar.textContent = '🌟';

        const typingContent = document.createElement('div');
        typingContent.className = 'typing-dots';
        typingContent.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

        typingDiv.appendChild(avatar);
        typingDiv.appendChild(typingContent);
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // 隐藏打字指示器
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // 生成高我回应（基于用户蓝图的个性化回应）
    generateHigherSelfResponse(userMessage) {
        // 首先尝试生成个性化回应
        const personalizedResponse = this.generatePersonalizedResponse(userMessage);
        if (personalizedResponse) {
            return personalizedResponse;
        }

        // 通用回应模板
        const responses = {
            // 情感支持类回应
            emotional: [
                "我感受到了你内心的波动。让我们一起探索这些感受背后的智慧。你觉得这种感受想要告诉你什么？",
                "每一种情绪都是内在智慧的信使。当你感到困扰时，不妨问问自己：这个感受想要保护我什么？",
                "你的感受是真实而珍贵的。在这个安全的空间里，让我们一起倾听内心深处的声音。"
            ],
            
            // 决策指导类回应
            decision: [
                "真正的答案往往已经在你心中。静下心来，感受一下每个选择带给你的身体感觉，哪一个让你感到更加轻松和开阔？",
                "当面临选择时，不妨问问自己：五年后的我会如何看待今天的决定？什么选择更符合我内心真正的价值观？",
                "决策的智慧不在于找到完美的答案，而在于与自己的内心保持一致。你觉得哪个选择更能让你成为想要成为的人？"
            ],
            
            // 自我探索类回应
            exploration: [
                "你提到的这个话题让我想到，每个人内心都有无限的智慧等待被发现。你觉得什么阻止了你更深入地了解自己？",
                "自我探索是一场美妙的旅程。在这个过程中，你最想了解自己的哪个方面？",
                "真正的成长来自于诚实地面对自己。你准备好探索内心那些未知的角落了吗？"
            ],
            
            // 通用智慧类回应
            general: [
                "生命中的每个挑战都是成长的邀请。你觉得当前的情况想要教会你什么？",
                "有时候，我们需要的不是答案，而是更好的问题。让我们一起探索什么问题能帮助你获得更深的洞察。",
                "内在的智慧总是知道前进的方向。让我们静下心来，倾听那个最深层的声音。"
            ]
        };

        // 简单的关键词匹配来选择回应类型
        const message = userMessage.toLowerCase();
        let responseType = 'general';
        
        if (message.includes('感到') || message.includes('情绪') || message.includes('难过') || message.includes('开心') || message.includes('焦虑')) {
            responseType = 'emotional';
        } else if (message.includes('选择') || message.includes('决定') || message.includes('怎么办') || message.includes('应该')) {
            responseType = 'decision';
        } else if (message.includes('自己') || message.includes('了解') || message.includes('探索') || message.includes('成长')) {
            responseType = 'exploration';
        }

        const responseArray = responses[responseType];
        return responseArray[Math.floor(Math.random() * responseArray.length)];
    }

    // 基于蓝图生成个性化回应
    generatePersonalizedResponse(userMessage) {
        const message = userMessage.toLowerCase();
        const blueprint = this.blueprint;
        
        // 如果用户提到工作相关问题，且填写了工作理念
        if ((message.includes('工作') || message.includes('职业') || message.includes('事业')) && blueprint.work_philosophy) {
            const excerpt = blueprint.work_philosophy.length > 100 ? 
                blueprint.work_philosophy.substring(0, 100) + '...' : 
                blueprint.work_philosophy;
            return `根据你之前分享的工作理念："${excerpt}"，我感受到你对工作有着深刻的思考。现在遇到的这个问题，是否与你的核心理念产生了某种冲突？让我们探索一下如何在保持初心的同时找到解决方案。`;
        }
        
        // 如果用户提到家庭问题，且填写了家庭关系
        if ((message.includes('家庭') || message.includes('父母') || message.includes('家人')) && blueprint.family) {
            return `从你描述的家庭背景来看，这些关系对你的影响很深。有时候，我们成年后的困扰往往与早期的家庭模式有关。你觉得当前的情况是否唤起了某些熟悉的感受？`;
        }
        
        // 如果用户提到目标相关，且填写了人生目标
        if ((message.includes('目标') || message.includes('方向') || message.includes('未来')) && blueprint.life_goals) {
            return `回想你设定的人生目标，你希望成为的那个人会如何看待当前的挑战？有时候，困难正是通往目标路上的必经之路。让我们一起思考，这个经历如何帮助你更接近真正想要的生活。`;
        }
        
        // 如果用户提到价值观冲突，且填写了核心价值观
        if ((message.includes('价值观') || message.includes('原则') || message.includes('底线')) && blueprint.core_values) {
            return `你的核心价值观是你内在的指南针。当面临选择时，哪个选项更符合你真正珍视的价值？有时候坚持价值观需要勇气，但这正是保持内在一致性的关键。`;
        }
        
        // 如果用户提到过去的成功经验，且填写了高光时刻
        if ((message.includes('成功') || message.includes('成就') || message.includes('自豪')) && blueprint.achievements) {
            return `想起你曾经的高光时刻，那时的你是如何克服困难的？那些让你感到自豪的经历中，有哪些品质和能力是可以运用到当前情况的？`;
        }
        
        // 如果用户提到失败或挫折，且填写了至暗时刻
        if ((message.includes('失败') || message.includes('挫折') || message.includes('困难')) && blueprint.failures) {
            return `每个人都有至暗时刻，但正是这些经历塑造了我们的韧性。回顾你之前度过的困难时期，你是如何重新站起来的？那些经验对现在的你有什么启发？`;
        }
        
        // 如果蓝图完成度较高，给出更深层的洞察
        const completionRate = this.calculateBlueprintCompletion();
        if (completionRate > 60) {
            return `从你分享的人生经历来看，你是一个有着丰富内在世界的人。当前的困扰可能正是你内在智慧想要突破某个局限的信号。让我们深入探索，这个挑战想要教会你什么？`;
        }
        
        // 如果蓝图完成度较低，鼓励用户完善
        if (completionRate < 20 && Math.random() < 0.3) {
            return `我很想更深入地了解你，这样我们的对话会更有针对性。你愿意在"我的人生蓝图"中分享更多关于自己的故事吗？这将帮助我提供更贴合你内心的洞察。`;
        }
        
        return null; // 返回null表示使用通用回应
    }
    
    // 计算蓝图完成度
    calculateBlueprintCompletion() {
        const fields = [
            'childhood', 'education', 'turning_points', 'work_philosophy', 
            'achievements', 'failures', 'skills', 'family', 'intimate', 
            'social', 'embarrassing', 'physical', 'mental', 'energy', 
            'core_values', 'life_goals', 'mindset'
        ];
        
        let filledCount = 0;
        fields.forEach(field => {
            if (this.blueprint[field] && this.blueprint[field].trim().length > 0) {
                filledCount++;
            }
        });
        
        return Math.round((filledCount / fields.length) * 100);
    }

    // 保存对话
    saveConversation() {
        if (this.settings.saveConversations !== false && this.currentConversation.length > 0) {
            const conversation = {
                id: Date.now(),
                messages: [...this.currentConversation],
                date: new Date().toISOString(),
                summary: this.generateConversationSummary()
            };
            
            this.conversations.push(conversation);
            localStorage.setItem('conversations', JSON.stringify(this.conversations));
            
            // 重置当前对话
            this.currentConversation = [];
            
            // 更新统计和时间线
            this.updateStats();
            this.renderReflectionTimeline();
        }
    }

    // 生成对话摘要
    generateConversationSummary() {
        const userMessages = this.currentConversation
            .filter(msg => msg.role === 'user')
            .map(msg => msg.content);
        
        if (userMessages.length === 0) return '简短对话';
        
        const firstMessage = userMessages[0];
        return firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;
    }

    // 打开洞察收藏模态框
    openInsightModal(content) {
        const insightText = document.getElementById('insightText');
        const insightTags = document.getElementById('insightTags');
        const modal = document.getElementById('insightModal');
        
        if (insightText) insightText.value = content;
        if (insightTags) insightTags.value = '';
        if (modal) modal.classList.add('active');
    }

    // 关闭模态框
    closeModal() {
        const modal = document.getElementById('insightModal');
        if (modal) modal.classList.remove('active');
    }

    // 保存洞察
    saveInsight() {
        const insightText = document.getElementById('insightText');
        const insightTags = document.getElementById('insightTags');
        
        if (!insightText || !insightTags) return;
        
        const content = insightText.value.trim();
        const tags = insightTags.value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        if (!content) return;

        const insight = {
            id: Date.now(),
            content: content,
            tags: tags,
            date: new Date().toISOString()
        };

        this.insights.push(insight);
        localStorage.setItem('insights', JSON.stringify(this.insights));
        
        this.closeModal();
        this.renderInsights();
        this.updateStats();
    }

    // 更新统计数据
    updateStats() {
        const totalReflections = document.getElementById('totalReflections');
        const insightCount = document.getElementById('insightCount');
        const streakDays = document.getElementById('streakDays');
        
        if (totalReflections) totalReflections.textContent = this.conversations.length;
        if (insightCount) insightCount.textContent = this.insights.length;
        
        // 计算连续天数
        const streak = this.calculateStreakDays();
        if (streakDays) streakDays.textContent = streak;
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

    // 渲染反思时间线
    renderReflectionTimeline() {
        const timeline = document.getElementById('reflectionTimeline');
        if (!timeline) return;
        
        if (this.conversations.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>还没有对话记录</h3>
                    <p>开始你的第一次内在对话吧</p>
                </div>
            `;
            return;
        }

        const sortedConversations = [...this.conversations]
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        timeline.innerHTML = sortedConversations
            .map(conv => `
                <div class="timeline-item">
                    <div class="timeline-date">${this.formatDate(conv.date)}</div>
                    <div class="timeline-content">${conv.summary}</div>
                    <div class="timeline-insight">${conv.messages.length} 条消息</div>
                </div>
            `).join('');
    }

    // 渲染洞察收藏
    renderInsights() {
        const grid = document.getElementById('insightsGrid');
        if (!grid) return;
        
        if (this.insights.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💡</div>
                    <h3>还没有收藏的洞察</h3>
                    <p>在对话中收藏有价值的洞察吧</p>
                </div>
            `;
            return;
        }

        const sortedInsights = [...this.insights]
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        grid.innerHTML = sortedInsights
            .map(insight => `
                <div class="insight-card">
                    <div class="insight-content">${insight.content}</div>
                    <div class="insight-meta">
                        <div class="insight-tags">
                            ${insight.tags.map(tag => `<span class="insight-tag">${tag}</span>`).join('')}
                        </div>
                        <div class="insight-date">${this.formatDate(insight.date)}</div>
                    </div>
                </div>
            `).join('');
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return '今天';
        if (diffDays === 1) return '昨天';
        if (diffDays < 7) return `${diffDays}天前`;
        
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // 加载设置
    loadSettings() {
        const defaultSettings = {
            responseStyle: 'gentle',
            conversationDepth: 'medium',
            saveConversations: true,
            enableAnalytics: false
        };

        this.settings = { ...defaultSettings, ...this.settings };
        
        // 应用设置到界面
        const responseStyle = document.getElementById('responseStyle');
        const conversationDepth = document.getElementById('conversationDepth');
        const saveConversations = document.getElementById('saveConversations');
        const enableAnalytics = document.getElementById('enableAnalytics');
        
        if (responseStyle) responseStyle.value = this.settings.responseStyle;
        if (conversationDepth) conversationDepth.value = this.settings.conversationDepth;
        if (saveConversations) saveConversations.checked = this.settings.saveConversations;
        if (enableAnalytics) enableAnalytics.checked = this.settings.enableAnalytics;
    }

    // 更新设置
    updateSetting(key, value) {
        this.settings[key] = value;
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    // 导出数据
    // 导出数据
    exportData() {
        const data = {
            conversations: this.conversations,
            insights: this.insights,
            settings: this.settings,
            blueprint: this.blueprint,
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
        if (confirm('确定要清除所有数据吗？此操作不可恢复。')) {
            localStorage.removeItem('conversations');
            localStorage.removeItem('insights');
            localStorage.removeItem('settings');
            localStorage.removeItem('blueprint');
            
            this.conversations = [];
            this.insights = [];
            this.settings = {};
            this.blueprint = {};
            this.currentConversation = [];
            
            this.initializeApp();
            this.loadSettings();
            
            alert('数据已清除');
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new DialogueApp();
});

// 添加一些实用的工具函数
class Utils {
    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 生成唯一ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 深拷贝对象
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }
}

// 导出工具类供其他模块使用
window.Utils = Utils;
