import React, { useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { showToast } from '../services/cache';
import './OnlineStatusPage.css';

const OnlineStatusPage = () => {
  const [userTokens, setUserTokens] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('my-devices');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (activeTab === 'my-devices') {
        fetchUserTokens();
      } else if (activeTab === 'all-users' && isAdmin) {
        fetchOnlineUsers();
      }
    }
  }, [currentUser, activeTab]);

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('当前token:', token ? '存在' : '不存在');
      
      if (!token) {
        showToast('请先登录', 'error');
        return;
      }
      
      const user = await authApi.getCurrentUser();
      console.log('当前用户:', user);
      setCurrentUser(user);
      setIsAdmin(user.username === 'admin');
    } catch (err) {
      console.error('获取用户信息失败:', err);
      console.error('错误详情:', err.response?.data || err.message);
      showToast('获取用户信息失败，请重新登录', 'error');
    }
  };

  // 获取当前用户的登录设备
  const fetchUserTokens = async () => {
    try {
      setLoading(true);
      const response = await authApi.getMySessions();
      setUserTokens(response);
    } catch (error) {
      console.error('获取用户token失败:', error);
      showToast('获取登录设备信息失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 获取所有用户的登录状态（管理员功能）
  const fetchOnlineUsers = async () => {
    try {
      setLoading(true);
      const response = await authApi.getOnlineUsers();
      setOnlineUsers(response);
    } catch (error) {
      console.error('获取在线用户失败:', error);
      showToast('获取在线用户失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 踢出设备
  const handleKickDevice = async (tokenId) => {
    const confirmMessage = activeTab === 'my-devices' 
      ? '确定要下线这个设备吗？'
      : '确定要强制下线这个设备吗？';
    
    if (window.confirm(confirmMessage)) {
      try {
        if (activeTab === 'my-devices') {
          await authApi.revokeMyToken(tokenId);
          showToast('设备已下线', 'success');
          fetchUserTokens();
        } else {
          await authApi.adminRevokeToken(tokenId);
          showToast('设备已强制下线', 'success');
          fetchOnlineUsers();
        }
      } catch (error) {
        console.error('踢出设备失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.detail || error.message || '操作失败，请稍后再试';
        showToast(errorMessage, 'error');
      }
    }
  };

  // 格式化设备信息
  const formatDeviceInfo = (token) => {
    if (token.device_info) {
      try {
        const deviceInfo = JSON.parse(token.device_info);
        return `${deviceInfo.browser || '未知浏览器'} - ${deviceInfo.os || '未知系统'}`;
      } catch (e) {
        return token.device_info;
      }
    }
    return token.user_agent || '未知设备';
  };

  // 格式化时间
  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleString('zh-CN');
  };

  // 检查是否为当前设备
  const isCurrentDevice = (token) => {
    const currentToken = localStorage.getItem('token');
    return token.token === currentToken;
  };

  // 检查token状态
  const token = localStorage.getItem('token');
  
  // 如果没有token或用户未登录，显示登录提示
  if (!token || !currentUser) {
    return (
      <div className="online-status-page">
        <div className="page-header">
          <h1>在线状态管理</h1>
          <p>请先登录后再使用此功能</p>
          <p>Token状态: {token ? '存在' : '不存在'}</p>
          <p>用户状态: {currentUser ? '已获取' : '未获取'}</p>
          <button onClick={() => window.location.href = '/login'}>前往登录</button>
        </div>
      </div>
    );
  }

  return (
    <div className="online-status-page">
      <div className="page-header">
        <h1>在线状态管理</h1>
        <p>当前用户: {currentUser.username}</p>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'my-devices' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-devices')}
        >
          我的设备
        </button>
        {isAdmin && (
          <button 
            className={`tab ${activeTab === 'all-users' ? 'active' : ''}`}
            onClick={() => setActiveTab('all-users')}
          >
            所有用户
          </button>
        )}
      </div>

      <div className="tab-content">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            {activeTab === 'my-devices' && (
              <div className="my-devices">
                <h2>我的登录设备</h2>
                {userTokens.length === 0 ? (
                  <div className="empty-state">
                    <p>暂无登录设备</p>
                  </div>
                ) : (
                  <div className="devices-list">
                    {userTokens.map((token) => (
                      <div key={token.id} className={`device-card ${isCurrentDevice(token) ? 'current' : ''}`}>
                        <div className="device-info">
                          <div className="device-name">
                            {formatDeviceInfo(token)}
                            {isCurrentDevice(token) && <span className="current-badge">当前设备</span>}
                          </div>
                          <div className="device-details">
                            <span>IP: {token.ip_address || '未知'}</span>
                            <span>最后活跃: {formatTime(token.last_used_at)}</span>
                            <span>登录时间: {formatTime(token.created_at)}</span>
                          </div>
                        </div>
                        <button 
                          className="kick-btn"
                          onClick={() => handleKickDevice(token.id)}
                          disabled={isCurrentDevice(token)}
                        >
                          {isCurrentDevice(token) ? '当前设备' : '下线'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'all-users' && isAdmin && (
              <div className="all-users">
                <h2>所有用户在线状态</h2>
                {onlineUsers.length === 0 ? (
                  <div className="empty-state">
                    <p>暂无在线用户</p>
                  </div>
                ) : (
                  <div className="devices-list">
                    {onlineUsers.map(user => 
                      user.tokens.map(token => (
                        <div key={`${user.user_id}-${token.id}`} className="device-card">
                          <div className="device-info">
                            <div className="user-info-line">
                              <strong>{user.username}</strong>
                              <span className="user-role">({user.username === 'admin' ? '管理员' : '普通用户'})</span>
                            </div>
                            <div className="device-type-line">
                              {formatDeviceInfo(token)}
                            </div>
                            <div className="device-details">
                              <span>IP: {token.ip_address || '未知'}</span>
                              <span>最后活跃: {formatTime(token.last_used_at)}</span>
                              <span>登录时间: {formatTime(token.created_at)}</span>
                            </div>
                          </div>
                          <button 
                            className="kick-btn"
                            onClick={() => handleKickDevice(token.id)}
                          >
                            踢出
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OnlineStatusPage;