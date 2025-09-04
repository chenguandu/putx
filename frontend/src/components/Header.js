import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';
import { authApi } from '../services/api';
import { showToast } from '../services/cache';

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const location = useLocation();
  
  useEffect(() => {
    // 检查用户是否已登录
    const checkAuth = async () => {
      const auth = authApi.isAuthenticated();
      setIsAuthenticated(auth);
      
      if (auth) {
        try {
          // 获取用户信息
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            setUsername(user.username);
          } else {
            // 如果本地没有用户信息，则从API获取
            const userData = await authApi.getCurrentUser();
            setUsername(userData.username);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (error) {
          console.error('获取用户信息失败', error);
          showToast('获取用户信息失败', 'error');
        }
      } else {
        // 如果未认证，清除用户名
        setUsername('');
      }
    };
    
    checkAuth();
  }, [location]); // 添加location作为依赖，当路由变化时重新检查认证状态
  
  const handleLogout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setUsername('');
    showToast('已成功登出', 'success');
  };
  
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">PutX</Link>
        </div>
        <nav className="nav">
          <ul>
            {location.pathname.startsWith('/admin') && (
              <li>
                <Link to="/">首页</Link>
              </li>
            )}
            {isAuthenticated && !location.pathname.startsWith('/admin') && (
              <li>
                <Link to="/admin">管理</Link>
              </li>
            )}
            {isAuthenticated ? (
              <>
                <li>
                  <span className="welcome-text">欢迎：{username}</span>
                </li>
                <li>
                  <button onClick={handleLogout} className="logout-btn">登出</button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/login">登录</Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;