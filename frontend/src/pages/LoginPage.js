import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';
import './LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // 获取用户想要访问的页面，如果没有则默认为管理页面
  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // 调用登录API
      const data = await authApi.login(username, password);
      
      // 保存令牌到本地存储
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('token_type', data.token_type);
      
      // 获取用户信息
      const userInfo = await authApi.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      // 跳转到之前想要访问的页面
      navigate(from, { replace: true });
    } catch (err) {
      console.error('登录失败:', err);
      
      // 获取详细错误信息
      const errorDetail = err.response?.data?.detail;
      
      // 根据错误信息设置不同的错误提示
      if (errorDetail) {
        // 直接显示后端返回的详细错误信息
        setError(errorDetail);
        
        // 如果是账户锁定错误，禁用登录按钮
        if (errorDetail.includes('账户已被锁定')) {
          setLoading(true); // 使用loading状态来禁用按钮
          // 设置一个定时器，在一段时间后重新启用按钮
          setTimeout(() => {
            setLoading(false);
            setError(''); // 清除错误信息
          }, 10000); // 10秒后允许再次尝试
        }
      } else {
        setError('登录失败，请检查用户名和密码');
      }
    } finally {
      // 只有当错误不是账户锁定时才重置loading状态
      // 账户锁定的情况下，loading状态由定时器控制
      if (!error || !error.includes('账户已被锁定')) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>管理员登录</h1>
        <p className="login-description">请登录以访问网站管理后台</p>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;