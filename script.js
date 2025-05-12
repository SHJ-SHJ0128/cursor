// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 设置初始状态 - 确保登录表单初始状态正确
    const initialLoginFormContainer = document.getElementById('loginFormContainer');
    if (initialLoginFormContainer) {
        // 等待DOM渲染完成后应用初始样式
        setTimeout(() => {
            initialLoginFormContainer.style.transition = 'none'; // 暂时禁用过渡效果
            void initialLoginFormContainer.offsetWidth; // 强制重排
            initialLoginFormContainer.style.transition = ''; // 重新启用过渡效果
        }, 10);
    }
    
    // 特别处理联系管理员按钮
    const contactLink = document.querySelector('.nav-links a[href="#contact"]');
    const contactModal = document.getElementById('contactModal');
    const closeContactBtn = document.querySelector('.close-contact');
    
    if (contactLink && contactModal) {
        contactLink.addEventListener('click', function(e) {
            e.preventDefault(); // 阻止默认的锚点跳转行为
            
            // 显示联系模态框
            contactModal.style.display = 'block';
            
            // 初始化表单输入框
            setTimeout(() => {
                const contactInputs = contactModal.querySelectorAll('.form-group input, .form-group textarea');
                contactInputs.forEach(input => {
                    input.focus();
                    input.blur();
                });
            }, 100);
        });
        
        // 关闭模态框
        if (closeContactBtn) {
            closeContactBtn.addEventListener('click', function() {
                contactModal.style.display = 'none';
            });
        }
        
        // 点击模态框外部关闭
        window.addEventListener('click', function(e) {
            if (e.target === contactModal) {
                contactModal.style.display = 'none';
            }
        });
        
        // 处理联系表单提交
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // 获取表单数据
                const name = document.getElementById('contactName').value;
                const email = document.getElementById('contactEmail').value;
                const message = document.getElementById('contactMessage').value;
                
                console.log('发送联系信息:', { name, email, message });
                
                // 显示成功提示
                showNotification('留言已发送，我们将尽快回复您', 'success');
                
                // 清空表单并关闭模态框
                this.reset();
                contactModal.style.display = 'none';
            });
        }
    }
    
    // 导航栏平滑滚动
    document.querySelectorAll('a[href^="#"]:not([href="#contact"])').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        });
    });

    // 导航栏滚动效果
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // 添加渐变背景
        if (scrollTop > 50) {
            navbar.style.background = 'rgba(26, 26, 46, 0.95)';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(26, 26, 46, 0.8)';
            navbar.style.boxShadow = 'none';
        }

        // 导航栏隐藏/显示效果
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });

    // 轮播图功能
    const carousel = document.querySelector('.carousel-container');
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    let currentSlide = 0;
    let isTransitioning = false;

    // 初始化第一张图片
    slides[currentSlide].classList.add('active');

    function updateCarousel(direction) {
        if (isTransitioning) return;
        isTransitioning = true;

        // 获取当前活动的幻灯片
        const currentSlideElement = slides[currentSlide];
        
        // 计算下一张图片的索引
        let nextSlideIndex;
        if (direction === 'next') {
            nextSlideIndex = (currentSlide + 1) % slides.length;
        } else {
            nextSlideIndex = (currentSlide - 1 + slides.length) % slides.length;
        }

        // 准备下一张幻灯片
        const nextSlideElement = slides[nextSlideIndex];

        // 设置初始位置
        nextSlideElement.style.transform = direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)';
        nextSlideElement.style.opacity = '0';
        
        // 强制重排以确保过渡效果正常工作
        void nextSlideElement.offsetWidth;
        
        // 移除之前的过渡类
        currentSlideElement.classList.remove('active');
        currentSlideElement.classList.add('prev');
        
        // 重置下一张幻灯片的样式并添加active类
        nextSlideElement.style.transform = '';
        nextSlideElement.style.opacity = '';
        nextSlideElement.classList.add('active');
        nextSlideElement.classList.remove('prev');
        
        // 更新当前索引
        currentSlide = nextSlideIndex;

        // 过渡结束后重置状态
        setTimeout(() => {
            currentSlideElement.classList.remove('prev');
            currentSlideElement.style.transform = '';
            currentSlideElement.style.opacity = '';
            isTransitioning = false;
        }, 500);
    }

    function nextSlide() {
        updateCarousel('next');
    }

    function prevSlide() {
        updateCarousel('prev');
    }

    // 自动轮播
    let slideInterval = setInterval(nextSlide, 5000);

    // 鼠标悬停时暂停轮播
    carousel.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });

    carousel.addEventListener('mouseleave', () => {
        slideInterval = setInterval(nextSlide, 5000);
    });

    prevBtn.addEventListener('click', () => {
        clearInterval(slideInterval);
        prevSlide();
        slideInterval = setInterval(nextSlide, 5000);
    });

    nextBtn.addEventListener('click', () => {
        clearInterval(slideInterval);
        nextSlide();
        slideInterval = setInterval(nextSlide, 5000);
    });

    // 触摸滑动支持
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        clearInterval(slideInterval);
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
        if (isTransitioning) return;
        touchEndX = e.touches[0].clientX;
        const diff = touchStartX - touchEndX;
        const threshold = 50; // 滑动阈值

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
            touchStartX = touchEndX;
        }
    }, { passive: true });

    carousel.addEventListener('touchend', () => {
        slideInterval = setInterval(nextSlide, 5000);
    });

    // 注册表单提交
    document.querySelector('.register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 获取表单元素
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const emailInput = document.getElementById('email');
        
        // 检查元素是否存在
        if (!usernameInput || !passwordInput || !emailInput) {
            console.error('找不到表单元素:', {
                usernameInput: !!usernameInput,
                passwordInput: !!passwordInput,
                emailInput: !!emailInput
            });
            alert('表单元素加载错误，请刷新页面重试');
            return;
        }
        
        const username = usernameInput.value;
        const password = passwordInput.value;
        const email = emailInput.value;

        console.log('提交注册数据:', { username, password, email });

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, email })
            });

            console.log('服务器响应:', response.status);

            const data = await response.json();
            console.log('响应数据:', data);
            
            if (response.ok) {
                alert('注册成功！');
                // 清空表单
                e.target.reset();
            } else {
                alert(data.message || '注册失败，请重试');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('注册失败，请重试');
        }
    });

    // 提交反馈表单
    document.querySelector('.feedback-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 检查用户是否已登录
        const userInfo = localStorage.getItem('currentUser');
        if (!userInfo) {
            showNotification('请登录后再提交反馈', 'error');
            return;
        }
        
        // 用户已登录，获取用户信息
        const user = JSON.parse(userInfo);
        const username = user.username;
        const userId = user.id; // 获取用户ID
        
        // 获取表单元素
        const titleInput = document.getElementById('subject');
        const contentInput = document.getElementById('content');
        
        // 检查元素是否存在
        if (!titleInput || !contentInput) {
            console.error('找不到表单元素:', {
                titleInput: !!titleInput,
                contentInput: !!contentInput
            });
            showNotification('表单元素加载错误，请刷新页面重试', 'error');
            return;
        }
        
        const title = titleInput.value;
        const content = contentInput.value;
        
        // 检查必要字段
        if (!title || !content) {
            showNotification('请填写所有必要字段', 'error');
            return;
        }
        
        console.log('准备提交反馈:', { userId, username, title, content });
        
        try {
            const response = await fetch('http://localhost:3000/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, username, title, content })
            });

            const data = await response.json();
            console.log('服务器响应:', data);
            
            if (response.ok) {
                showNotification('反馈提交成功！', 'success');
                // 清空表单
                e.target.reset();
            } else {
                showNotification(data.message || '反馈提交失败，请重试', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('反馈提交失败，请重试', 'error');
        }
    });

    // 处理"查看我的反馈"按钮点击事件
    const viewMyFeedbacksBtn = document.getElementById('viewMyFeedbacks');
    const feedbackModal = document.getElementById('feedbackModal');
    const closeFeedbackBtn = document.querySelector('.close-feedback');
    
    if (viewMyFeedbacksBtn && feedbackModal) {
        viewMyFeedbacksBtn.addEventListener('click', function() {
            // 检查用户是否已登录
            const userInfo = localStorage.getItem('currentUser');
            if (!userInfo) {
                showNotification('请登录后再查看反馈', 'error');
                return;
            }
            
            // 显示模态框
            feedbackModal.style.display = 'block';
            
            // 加载用户反馈数据
            const user = JSON.parse(userInfo);
            loadUserFeedbacks(user.id);
        });
        
        // 关闭模态框
        closeFeedbackBtn.addEventListener('click', function() {
            feedbackModal.style.display = 'none';
        });
        
        // 点击模态框外部关闭
        window.addEventListener('click', function(e) {
            if (e.target === feedbackModal) {
                feedbackModal.style.display = 'none';
            }
        });
    }

    // 移除不再需要的旧代码
    const userFeedbacksList = document.getElementById('userFeedbacksList');
    if (userFeedbacksList) {
        userFeedbacksList.style.display = 'none'; // 隐藏旧的反馈列表容器
    }

    // 模态框功能
    const modal = document.getElementById('modal');
    const moreInfoBtn = document.getElementById('moreInfoBtn');
    const closeBtn = document.querySelector('.close');

    moreInfoBtn.addEventListener('click', () => {
        // 点击效果
        moreInfoBtn.style.animation = 'none';
        moreInfoBtn.style.transform = 'scale(0.95)';
        
        // 创建波纹效果
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.top = '0';
        ripple.style.left = '0';
        ripple.style.width = '100%';
        ripple.style.height = '100%';
        ripple.style.background = 'rgba(255, 255, 255, 0.3)';
        ripple.style.borderRadius = '30px';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.zIndex = '-1';
        
        // 添加波纹动画关键帧
        if (!document.querySelector('#rippleAnimation')) {
            const style = document.createElement('style');
            style.id = 'rippleAnimation';
            style.innerHTML = `
                @keyframes ripple {
                    to { transform: scale(2); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 确保按钮有相对定位
        if (getComputedStyle(moreInfoBtn).position === 'static') {
            moreInfoBtn.style.position = 'relative';
        }
        
        moreInfoBtn.appendChild(ripple);
        
        // 动画结束后恢复状态
        setTimeout(() => {
            moreInfoBtn.style.transform = '';
            ripple.remove();
            
            // 显示模态框
            modal.style.display = 'block';
            
            // 延迟后恢复脉冲动画
            setTimeout(() => {
                moreInfoBtn.style.animation = 'pulse-btn 2s infinite';
            }, 1000);
        }, 300);
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 初始化输入框
    initializeInputFields();

    // 页面加载动画
    document.body.classList.add('loading');
    
    // 添加页面元素渐入动画
    const animateElements = () => {
        const elements = document.querySelectorAll('.card, .section-title, .hero-title, .hero-subtitle');
        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    };

    // 页面加载完成后执行动画
    window.addEventListener('load', () => {
        document.body.classList.remove('loading');
        animateElements();
    });

    // 添加按钮点击波纹效果
    document.querySelectorAll('.btn-upload, .btn-submit, .hero-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // 添加滚动显示动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card, .section-title, .about-content, .project-card').forEach(element => {
        observer.observe(element);
    });

    // 登录表单提交
    document.querySelector('.login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 获取表单元素
        const usernameInput = document.getElementById('loginUsername');
        const passwordInput = document.getElementById('loginPassword');
        
        // 检查元素是否存在
        if (!usernameInput || !passwordInput) {
            console.error('找不到表单元素:', {
                usernameInput: !!usernameInput,
                passwordInput: !!passwordInput
            });
            showNotification('表单元素加载错误，请刷新页面重试', 'error');
            return;
        }
        
        const username = usernameInput.value;
        const password = passwordInput.value;

        console.log('提交登录数据:', { username, password });

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            console.log('服务器响应:', response.status);

            const data = await response.json();
            console.log('响应数据:', data);
            
            if (response.ok) {
                // 显示登录成功提示
                showNotification('登录成功！', 'success');
                
                // 保存用户信息到 localStorage
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                
                // 显示已登录状态
                setTimeout(() => {
                    showLoggedInState(data.user.username);
                }, 1000);
                
                // 清空表单
                e.target.reset();
            } else {
                showNotification(data.message || '登录失败，请重试', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('登录失败，请重试', 'error');
        }
    });

    // 切换表单显示 - 优化动画效果
    const showLoginFormLink = document.getElementById('showLoginForm');
    const showRegisterFormLink = document.getElementById('showRegisterForm');
    const registerFormContainer = document.querySelector('.auth-form-container');
    const loginFormContainer = document.getElementById('loginFormContainer');
    
    if (showLoginFormLink && showRegisterFormLink) {
        showLoginFormLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 平滑过渡到登录表单
            registerFormContainer.classList.add('inactive');
            loginFormContainer.classList.add('active');
            
            // 重置表单内容和焦点
            setTimeout(() => {
                document.getElementById('loginUsername').focus();
                document.getElementById('registerForm').reset();
                
                // 移除所有输入框的focused类
                registerFormContainer.querySelectorAll('.form-group').forEach(group => {
                    group.classList.remove('focused');
                });
            }, 200);
        });
        
        showRegisterFormLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 平滑过渡到注册表单
            loginFormContainer.classList.remove('active');
            registerFormContainer.classList.remove('inactive');
            
            // 重置表单内容和焦点
            setTimeout(() => {
                document.getElementById('username').focus();
                document.getElementById('loginForm').reset();
                
                // 移除所有输入框的focused类
                loginFormContainer.querySelectorAll('.form-group').forEach(group => {
                    group.classList.remove('focused');
                });
            }, 200);
        });
    }
    
    // 检查用户是否已登录
    checkLoggedInState();
});

// 显示已登录状态
function showLoggedInState(username) {
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
        // 获取当前用户信息
        const userInfo = localStorage.getItem('currentUser');
        const user = JSON.parse(userInfo);
        
        // 创建已登录状态界面
        authContainer.innerHTML = `
            <div class="logged-in-container">
                <h2 class="section-title">欢迎回来</h2>
                <p class="welcome-message">你好，${username}！</p>
                <button id="logoutBtn" class="btn-logout">退出登录</button>
            </div>
        `;
        
        // 添加退出登录按钮事件
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                // 清除用户信息
                localStorage.removeItem('currentUser');
                // 刷新页面
                window.location.reload();
            });
        }
    }
}

// 加载用户反馈
async function loadUserFeedbacks(userId) {
    const feedbacksList = document.getElementById('myFeedbacksList');
    
    if (!feedbacksList) {
        console.error('找不到反馈列表元素');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/user-feedbacks/${userId}`);
        
        if (!response.ok) {
            feedbacksList.innerHTML = '<p class="error-message">加载反馈失败</p>';
            return;
        }
        
        const data = await response.json();
        
        if (data.feedbacks.length === 0) {
            feedbacksList.innerHTML = '<p>你还没有提交过反馈</p>';
            return;
        }
        
        // 显示反馈列表
        const feedbacksHtml = data.feedbacks.map(feedback => `
            <div class="feedback-item">
                <h4>${feedback.title}</h4>
                <p>${feedback.content}</p>
                <span class="feedback-date">提交时间：${new Date(feedback.created_at).toLocaleString()}</span>
            </div>
        `).join('');
        
        feedbacksList.innerHTML = feedbacksHtml;
        
    } catch (error) {
        console.error('Error:', error);
        feedbacksList.innerHTML = '<p class="error-message">加载反馈失败</p>';
    }
}

// 检查用户是否已登录
function checkLoggedInState() {
    const userInfo = localStorage.getItem('currentUser');
    if (userInfo) {
        const user = JSON.parse(userInfo);
        showLoggedInState(user.username);
    }
}

// 显示页面通知
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

// 初始化所有输入框
function initializeInputFields() {
    const inputs = document.querySelectorAll('.form-group input, .form-group textarea');
    
    inputs.forEach(input => {
        // 确保所有输入框都有placeholder属性
        if (!input.hasAttribute('placeholder')) {
            const label = input.parentElement.querySelector('label');
            if (label) {
                input.setAttribute('placeholder', label.textContent);
            }
        }
        
        // 检查输入框是否已有值，如果有则添加not-empty类
        if (input.value.trim() !== '') {
            input.classList.add('not-empty');
            input.parentElement.classList.add('focused');
        }
        
        // 优化焦点事件 - 添加延迟避免闪烁
        let focusTimeout;
        input.addEventListener('focus', function() {
            clearTimeout(focusTimeout);
            this.parentElement.classList.add('focused');
        });
        
        // 优化失焦事件
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                // 延迟移除类，确保过渡平滑
                focusTimeout = setTimeout(() => {
                    this.parentElement.classList.remove('focused');
                    this.classList.remove('not-empty');
                }, 100);
            } else {
                this.classList.add('not-empty');
            }
        });
        
        // 添加输入事件 - 无延迟处理
        input.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.classList.add('not-empty');
            } else {
                this.classList.remove('not-empty');
            }
        });
    });
    
    // 预加载登录和注册表单容器过渡效果
    const loginContainer = document.getElementById('loginFormContainer');
    const registerContainer = document.querySelector('.auth-form-container');
    
    if(loginContainer && registerContainer) {
        // 强制重新计算样式，避免首次动画问题
        void loginContainer.offsetWidth;
        void registerContainer.offsetWidth;
    }
} 