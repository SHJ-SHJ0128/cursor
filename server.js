const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

// JWT密钥配置
const JWT_SECRET = 'your_jwt_secret_key_here'; // 实际使用中应存储在环境变量中

const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// 创建用户数据库连接
const userConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456', // MySQL密码
    database: 'user_db'
});

// 创建反馈数据库连接
const feedbackConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456', // MySQL密码
    database: 'feedback_db'
});

// 连接用户数据库
userConnection.connect(err => {
    if (err) {
        console.error('用户数据库连接失败:', err);
        return;
    }
    console.log('成功连接到用户数据库');
    
    // 创建用户表（如果不存在）
    const createUserTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    userConnection.query(createUserTableQuery, (err) => {
        if (err) {
            console.error('创建用户表失败:', err);
        } else {
            console.log('用户表已创建或已存在');
        }
    });
});

// 连接反馈数据库
feedbackConnection.connect(err => {
    if (err) {
        console.error('反馈数据库连接失败:', err);
        return;
    }
    console.log('成功连接到反馈数据库');
    
    // 创建反馈表（如果不存在）
    const createFeedbackTableQuery = `
        CREATE TABLE IF NOT EXISTS feedbacks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            username VARCHAR(50) NOT NULL,
            title VARCHAR(100) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    feedbackConnection.query(createFeedbackTableQuery, (err) => {
        if (err) {
            console.error('创建反馈表失败:', err);
        } else {
            console.log('反馈表已创建或已存在');
        }
    });
});

// 注册路由
app.post('/api/register', (req, res) => {
    console.log('收到注册请求:', req.body); // 添加请求日志
    
    const { username, password, email } = req.body;
    
    if (!username || !password || !email) {
        console.log('缺少必要字段');
        return res.status(400).json({ message: '请填写所有必要字段' });
    }
    
    // 检查用户是否已存在
    const checkUserQuery = 'SELECT * FROM users WHERE username = ?';
    userConnection.query(checkUserQuery, [username], (err, results) => {
        if (err) {
            console.error('查询用户失败:', err);
            return res.status(500).json({ message: '服务器错误' });
        }
        
        if (results.length > 0) {
            console.log('用户名已存在:', username);
            return res.status(400).json({ message: '用户名已存在' });
        }
        
        // 创建新用户
        const insertUserQuery = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
        userConnection.query(insertUserQuery, [username, password, email], (err, result) => {
            if (err) {
                console.error('插入用户失败:', err);
                return res.status(500).json({ message: '服务器错误' });
            }
            
            console.log('用户注册成功:', username);
            res.status(201).json({ message: '注册成功' });
        });
    });
});

// 提交反馈路由
app.post('/api/feedback', (req, res) => {
    console.log('收到反馈请求:', req.body); // 添加请求日志
    
    const { userId, username, title, content } = req.body;
    
    // 验证必要字段
    if (!username || !title || !content) {
        console.log('缺少必要字段:', { username, title, content });
        return res.status(400).json({ message: '请填写所有必要字段' });
    }
    
    // 创建新反馈
    const insertFeedbackQuery = 'INSERT INTO feedbacks (user_id, username, title, content) VALUES (?, ?, ?, ?)';
    feedbackConnection.query(insertFeedbackQuery, [userId, username, title, content], (err, result) => {
        if (err) {
            console.error('插入反馈失败:', err);
            return res.status(500).json({ message: '服务器错误: ' + err.message });
        }
        
        console.log('反馈提交成功:', { userId, username, title });
        res.status(201).json({ message: '反馈提交成功' });
    });
});

// 获取用户反馈列表路由
app.get('/api/user-feedbacks/:userId', (req, res) => {
    const userId = req.params.userId;
    
    if (!userId) {
        return res.status(400).json({ message: '缺少用户ID' });
    }
    
    // 查询用户信息
    userConnection.query('SELECT id, username, email FROM users WHERE id = ?', [userId], (err, userResults) => {
        if (err) {
            console.error('查询用户失败:', err);
            return res.status(500).json({ message: '服务器错误' });
        }
        
        if (userResults.length === 0) {
            return res.status(404).json({ message: '用户不存在' });
        }
        
        const user = userResults[0];
        
        // 查询用户的反馈
        feedbackConnection.query('SELECT * FROM feedbacks WHERE user_id = ?', [userId], (err, feedbackResults) => {
            if (err) {
                console.error('查询反馈失败:', err);
                return res.status(500).json({ message: '服务器错误' });
            }
            
            // 返回用户信息和反馈列表
            res.status(200).json({
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                },
                feedbacks: feedbackResults
            });
        });
    });
});

// 获取所有反馈路由（管理员使用）
app.get('/api/feedbacks', (req, res) => {
    // 使用JOIN查询获取反馈及对应的用户信息
    const query = `
        SELECT f.id, f.title, f.content, f.created_at, f.user_id, u.username, u.email
        FROM feedback_db.feedbacks AS f
        LEFT JOIN user_db.users AS u ON f.user_id = u.id
        ORDER BY f.created_at DESC
    `;
    
    feedbackConnection.query(query, (err, results) => {
        if (err) {
            console.error('查询反馈失败:', err);
            return res.status(500).json({ message: '服务器错误' });
        }
        
        res.status(200).json({ feedbacks: results });
    });
});

// 登录路由
app.post('/api/login', (req, res) => {
    console.log('收到登录请求:', req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
        console.log('缺少必要字段');
        return res.status(400).json({ message: '请填写所有必要字段' });
    }
    
    // 查询用户
    const loginQuery = 'SELECT id, username, email FROM users WHERE username = ? AND password = ?';
    userConnection.query(loginQuery, [username, password], (err, results) => {
        if (err) {
            console.error('查询用户失败:', err);
            return res.status(500).json({ message: '服务器错误' });
        }
        
        if (results.length === 0) {
            console.log('登录失败：用户名或密码错误');
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        
        const user = results[0];
        console.log('用户登录成功:', username);
        
        // 返回用户信息（不包含密码）
        res.status(200).json({ 
            message: '登录成功',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    });
});

// 管理员API
// 验证管理员中间件
function verifyAdmin(req, res, next) {
    // 获取请求头中的授权令牌
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: '未提供授权令牌' });
    }
    
    try {
        // 验证令牌
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 确保是管理员令牌
        if (!decoded.isAdmin) {
            return res.status(403).json({ message: '权限不足，需要管理员权限' });
        }
        
        // 将管理员信息附加到请求对象
        req.admin = decoded;
        next();
    } catch (error) {
        console.error('Token验证失败:', error);
        return res.status(401).json({ message: '无效的令牌' });
    }
}

// 管理员登录
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    // 验证管理员凭据（这里简化处理，实际应该从数据库查询）
    const adminUsername = 'admin';
    const adminPassword = 'admin123'; // 实际应该使用哈希密码
    
    if (username === adminUsername && password === adminPassword) {
        // 生成JWT令牌
        const token = jwt.sign(
            { id: 1, username: adminUsername, isAdmin: true },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(200).json({
            message: '登录成功',
            token,
            admin: {
                id: 1,
                username: adminUsername
            }
        });
    } else {
        res.status(401).json({ message: '用户名或密码错误' });
    }
});

// 管理员统计信息
app.get('/api/admin/statistics', verifyAdmin, (req, res) => {
    // 获取用户总数
    userConnection.query('SELECT COUNT(*) as totalUsers FROM users', (err, userResults) => {
        if (err) {
            console.error('查询用户总数失败:', err);
            return res.status(500).json({ message: '服务器错误' });
        }
        
        // 获取反馈总数
        feedbackConnection.query('SELECT COUNT(*) as totalFeedbacks FROM feedbacks', (err, feedbackResults) => {
            if (err) {
                console.error('查询反馈总数失败:', err);
                return res.status(500).json({ message: '服务器错误' });
            }
            
            // 获取今日新增用户
            const today = new Date().toISOString().split('T')[0];
            userConnection.query(
                'SELECT COUNT(*) as newUsers FROM users WHERE DATE(created_at) = ?',
                [today],
                (err, newUserResults) => {
                    if (err) {
                        console.error('查询新增用户失败:', err);
                        return res.status(500).json({ message: '服务器错误' });
                    }
                    
                    res.status(200).json({
                        totalUsers: userResults[0].totalUsers,
                        totalFeedbacks: feedbackResults[0].totalFeedbacks,
                        newUsers: newUserResults[0].newUsers
                    });
                }
            );
        });
    });
});

// 获取所有用户
app.get('/api/admin/users', verifyAdmin, (req, res) => {
    userConnection.query(
        'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC',
        (err, results) => {
            if (err) {
                console.error('查询用户失败:', err);
                return res.status(500).json({ message: '服务器错误' });
            }
            
            res.status(200).json({ users: results });
        }
    );
});

// 获取用户详情
app.get('/api/admin/users/:userId', verifyAdmin, (req, res) => {
    const userId = req.params.userId;
    
    // 获取用户信息
    userConnection.query(
        'SELECT id, username, email, created_at FROM users WHERE id = ?',
        [userId],
        (err, userResults) => {
            if (err) {
                console.error('查询用户失败:', err);
                return res.status(500).json({ message: '服务器错误' });
            }
            
            if (userResults.length === 0) {
                return res.status(404).json({ message: '用户不存在' });
            }
            
            // 获取用户反馈数量
            feedbackConnection.query(
                'SELECT COUNT(*) as feedbackCount FROM feedbacks WHERE user_id = ?',
                [userId],
                (err, countResults) => {
                    if (err) {
                        console.error('查询反馈数量失败:', err);
                        return res.status(500).json({ message: '服务器错误' });
                    }
                    
                    res.status(200).json({
                        user: userResults[0],
                        feedbackCount: countResults[0].feedbackCount
                    });
                }
            );
        }
    );
});

// 删除用户
app.delete('/api/admin/users/:userId', verifyAdmin, (req, res) => {
    const userId = req.params.userId;
    
    // 删除用户的反馈
    feedbackConnection.query(
        'DELETE FROM feedbacks WHERE user_id = ?',
        [userId],
        (err) => {
            if (err) {
                console.error('删除用户反馈失败:', err);
                return res.status(500).json({ message: '服务器错误' });
            }
            
            // 删除用户
            userConnection.query(
                'DELETE FROM users WHERE id = ?',
                [userId],
                (err, result) => {
                    if (err) {
                        console.error('删除用户失败:', err);
                        return res.status(500).json({ message: '服务器错误' });
                    }
                    
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: '用户不存在' });
                    }
                    
                    res.status(200).json({ message: '用户已成功删除' });
                }
            );
        }
    );
});

// 获取所有反馈
app.get('/api/admin/feedbacks', verifyAdmin, (req, res) => {
    const query = `
        SELECT f.id, f.user_id, f.username, f.title, f.content, f.created_at
        FROM feedbacks f
        ORDER BY f.created_at DESC
    `;
    
    feedbackConnection.query(query, (err, results) => {
        if (err) {
            console.error('查询反馈失败:', err);
            return res.status(500).json({ message: '服务器错误' });
        }
        
        res.status(200).json({ feedbacks: results });
    });
});

// 获取反馈详情
app.get('/api/admin/feedbacks/:feedbackId', verifyAdmin, (req, res) => {
    const feedbackId = req.params.feedbackId;
    
    feedbackConnection.query(
        'SELECT * FROM feedbacks WHERE id = ?',
        [feedbackId],
        (err, results) => {
            if (err) {
                console.error('查询反馈失败:', err);
                return res.status(500).json({ message: '服务器错误' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ message: '反馈不存在' });
            }
            
            res.status(200).json({ feedback: results[0] });
        }
    );
});

// 删除反馈
app.delete('/api/admin/feedbacks/:feedbackId', verifyAdmin, (req, res) => {
    const feedbackId = req.params.feedbackId;
    
    feedbackConnection.query(
        'DELETE FROM feedbacks WHERE id = ?',
        [feedbackId],
        (err, result) => {
            if (err) {
                console.error('删除反馈失败:', err);
                return res.status(500).json({ message: '服务器错误' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: '反馈不存在' });
            }
            
            res.status(200).json({ message: '反馈已成功删除' });
        }
    );
});

// 添加明确的路由处理程序
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/admin.html', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 