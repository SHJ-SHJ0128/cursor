document.addEventListener('DOMContentLoaded', function() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminLogin = document.getElementById('adminLogin');
    const adminDashboard = document.getElementById('adminDashboard');
    const logoutAdmin = document.getElementById('logoutAdmin');
    const adminName = document.getElementById('adminName');
    
    // 选项卡功能
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 模态框元素
    const userModal = document.getElementById('userModal');
    const feedbackModal = document.getElementById('feedbackModal');
    const closeButtons = document.querySelectorAll('.close');
    
    // 统计数据元素
    const totalUsersElement = document.getElementById('totalUsers');
    const totalFeedbacksElement = document.getElementById('totalFeedbacks');
    const newUsersElement = document.getElementById('newUsers');
    
    // 检查管理员登录状态
    checkAdminLoginStatus();
    
    // 管理员登录表单提交处理
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            
            try {
                const response = await fetch('http://localhost:3000/api/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // 保存管理员信息和令牌到localStorage
                    localStorage.setItem('adminToken', data.token);
                    localStorage.setItem('adminInfo', JSON.stringify({
                        username: data.admin.username,
                        id: data.admin.id
                    }));
                    
                    // 显示管理控制台
                    showDashboard(data.admin.username);
                    
                    // 加载数据
                    loadDashboardData();
                } else {
                    showNotification(data.message || '登录失败，请检查用户名和密码', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('登录失败，请稍后重试', 'error');
            }
        });
    }
    
    // 退出登录
    if (logoutAdmin) {
        logoutAdmin.addEventListener('click', function(e) {
            e.preventDefault();
            
            logout();
        });
    }
    
    // 选项卡切换
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有活跃状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加活跃状态到当前选中的选项卡
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab') + 'Tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // 关闭模态框
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            userModal.style.display = 'none';
            feedbackModal.style.display = 'none';
        });
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === userModal) {
            userModal.style.display = 'none';
        }
        if (e.target === feedbackModal) {
            feedbackModal.style.display = 'none';
        }
    });
    
    // 搜索功能
    document.getElementById('userSearch').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#userTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
    
    document.getElementById('feedbackSearch').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#feedbackTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
    
    // 辅助函数 
    function checkAdminLoginStatus() {
        const adminToken = localStorage.getItem('adminToken');
        const adminInfo = localStorage.getItem('adminInfo');
        
        if (adminToken && adminInfo) {
            try {
                const admin = JSON.parse(adminInfo);
                showDashboard(admin.username);
                loadDashboardData();
            } catch (error) {
                console.error('解析管理员信息失败:', error);
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
            }
        }
    }
    
    function showDashboard(username) {
        adminLogin.style.display = 'none';
        adminDashboard.style.display = 'block';
        logoutAdmin.style.display = 'inline-block';
        adminName.textContent = username;
    }
    
    async function loadDashboardData() {
        try {
            // 获取管理员令牌
            const adminToken = localStorage.getItem('adminToken');
            if (!adminToken) {
                throw new Error('未找到管理员令牌');
            }
            
            // 加载仪表盘统计数据
            await loadStatistics();
            
            // 加载用户数据
            await loadUsers();
            
            // 加载反馈数据
            await loadFeedbacks();
        } catch (error) {
            console.error('加载数据失败:', error);
            showNotification('加载数据失败，请稍后重试', 'error');
        }
    }
    
    async function loadStatistics() {
        try {
            const response = await fetch('http://localhost:3000/api/admin/statistics', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('获取统计数据失败');
            }
            
            const data = await response.json();
            
            // 更新统计数据
            totalUsersElement.textContent = data.totalUsers || 0;
            totalFeedbacksElement.textContent = data.totalFeedbacks || 0;
            newUsersElement.textContent = data.newUsers || 0;
        } catch (error) {
            console.error('Error:', error);
            showNotification('获取统计数据失败', 'error');
        }
    }
    
    async function loadUsers() {
        try {
            const response = await fetch('http://localhost:3000/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('获取用户数据失败');
            }
            
            const data = await response.json();
            const userTableBody = document.getElementById('userTableBody');
            
            // 清空表格
            userTableBody.innerHTML = '';
            
            // 填充用户数据
            data.users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${formatDate(user.created_at)}</td>
                    <td class="actions">
                        <button class="btn-action btn-view" data-id="${user.id}" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-delete" data-id="${user.id}" title="删除用户">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                userTableBody.appendChild(row);
            });
            
            // 添加事件监听器
            addUserEventListeners();
        } catch (error) {
            console.error('Error:', error);
            showNotification('获取用户数据失败', 'error');
        }
    }
    
    async function loadFeedbacks() {
        try {
            const response = await fetch('http://localhost:3000/api/admin/feedbacks', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('获取反馈数据失败');
            }
            
            const data = await response.json();
            const feedbackTableBody = document.getElementById('feedbackTableBody');
            
            // 清空表格
            feedbackTableBody.innerHTML = '';
            
            // 填充反馈数据
            data.feedbacks.forEach(feedback => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${feedback.id}</td>
                    <td>${feedback.username}</td>
                    <td>${truncateText(feedback.title, 30)}</td>
                    <td>${truncateText(feedback.content, 40)}</td>
                    <td>${formatDate(feedback.created_at)}</td>
                    <td class="actions">
                        <button class="btn-action btn-view-feedback" data-id="${feedback.id}" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-delete-feedback" data-id="${feedback.id}" title="删除反馈">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                feedbackTableBody.appendChild(row);
            });
            
            // 添加事件监听器
            addFeedbackEventListeners();
        } catch (error) {
            console.error('Error:', error);
            showNotification('获取反馈数据失败', 'error');
        }
    }
    
    function addUserEventListeners() {
        // 查看用户详情
        const viewButtons = document.querySelectorAll('.btn-view');
        viewButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const userId = this.getAttribute('data-id');
                try {
                    const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('获取用户详情失败');
                    }
                    
                    const data = await response.json();
                    const userDetails = document.getElementById('userDetails');
                    
                    userDetails.innerHTML = `
                        <div class="detail-item">
                            <span class="label">ID:</span>
                            <span class="value">${data.user.id}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">用户名:</span>
                            <span class="value">${data.user.username}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">邮箱:</span>
                            <span class="value">${data.user.email}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">注册时间:</span>
                            <span class="value">${formatDate(data.user.created_at)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">反馈数量:</span>
                            <span class="value">${data.feedbackCount || 0}</span>
                        </div>
                    `;
                    
                    // 显示模态框
                    userModal.style.display = 'block';
                } catch (error) {
                    console.error('Error:', error);
                    showNotification('获取用户详情失败', 'error');
                }
            });
        });
        
        // 删除用户
        const deleteButtons = document.querySelectorAll('.btn-delete');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const userId = this.getAttribute('data-id');
                
                if (confirm('确定要删除此用户吗？此操作不可撤销，用户的所有反馈也将被删除。')) {
                    try {
                        const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error('删除用户失败');
                        }
                        
                        showNotification('用户已成功删除', 'success');
                        
                        // 重新加载数据
                        loadDashboardData();
                    } catch (error) {
                        console.error('Error:', error);
                        showNotification('删除用户失败', 'error');
                    }
                }
            });
        });
    }
    
    function addFeedbackEventListeners() {
        // 查看反馈详情
        const viewButtons = document.querySelectorAll('.btn-view-feedback');
        viewButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const feedbackId = this.getAttribute('data-id');
                try {
                    const response = await fetch(`http://localhost:3000/api/admin/feedbacks/${feedbackId}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('获取反馈详情失败');
                    }
                    
                    const data = await response.json();
                    const feedbackDetails = document.getElementById('feedbackDetails');
                    
                    feedbackDetails.innerHTML = `
                        <div class="detail-item">
                            <span class="label">ID:</span>
                            <span class="value">${data.feedback.id}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">用户:</span>
                            <span class="value">${data.feedback.username}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">用户ID:</span>
                            <span class="value">${data.feedback.user_id}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">主题:</span>
                            <span class="value">${data.feedback.title}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">内容:</span>
                            <div class="feedback-content">${data.feedback.content}</div>
                        </div>
                        <div class="detail-item">
                            <span class="label">提交时间:</span>
                            <span class="value">${formatDate(data.feedback.created_at)}</span>
                        </div>
                    `;
                    
                    // 显示模态框
                    feedbackModal.style.display = 'block';
                } catch (error) {
                    console.error('Error:', error);
                    showNotification('获取反馈详情失败', 'error');
                }
            });
        });
        
        // 删除反馈
        const deleteButtons = document.querySelectorAll('.btn-delete-feedback');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const feedbackId = this.getAttribute('data-id');
                
                if (confirm('确定要删除此反馈吗？此操作不可撤销。')) {
                    try {
                        const response = await fetch(`http://localhost:3000/api/admin/feedbacks/${feedbackId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error('删除反馈失败');
                        }
                        
                        showNotification('反馈已成功删除', 'success');
                        
                        // 重新加载数据
                        loadDashboardData();
                    } catch (error) {
                        console.error('Error:', error);
                        showNotification('删除反馈失败', 'error');
                    }
                }
            });
        });
    }
    
    // 工具函数
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + '...';
    }
    
    function showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 添加关闭按钮事件
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.add('notification-hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // 自动消失
        setTimeout(() => {
            notification.classList.add('notification-hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.add('notification-show');
        }, 10);
    }
    
    // 退出登录
    function logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
        
        // 隐藏仪表盘，显示登录表单
        document.getElementById('adminLogin').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
        
        // 确保登录表单居中显示
        document.querySelector('.admin-container').style.display = 'flex';
        document.querySelector('.admin-container').style.justifyContent = 'center';
        document.querySelector('.admin-container').style.alignItems = 'center';
        document.querySelector('.admin-container').style.height = '80vh';
        
        // 显示通知
        showNotification('已成功退出登录', 'success');
    }
}); 