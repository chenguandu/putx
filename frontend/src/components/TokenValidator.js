import { useEffect } from 'react';
import { authApi } from '../services/api';
import { showToast } from '../services/cache';

/**
 * Token有效性检测组件
 * 定期检查token是否有效，如果无效则自动退出登录
 */
const TokenValidator = () => {
  useEffect(() => {
    let intervalId;
    
    const checkTokenValidity = async () => {
      // 只有在已登录状态下才检查token有效性
      if (!authApi.isAuthenticated()) {
        return;
      }
      
      try {
        const isValid = await authApi.checkTokenValidity();
        if (!isValid) {
          // Token无效，显示提示并重定向到登录页面
          showToast('登录已过期，请重新登录', 'error');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } catch (error) {
        console.error('检查token有效性失败:', error);
        // 网络错误等情况下不做处理，避免误判
      }
    };
    
    // 立即检查一次
    checkTokenValidity();
    
    // 每5分钟检查一次token有效性
    intervalId = setInterval(checkTokenValidity, 5 * 60 * 1000);
    
    // 清理定时器
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);
  
  // 监听页面可见性变化，当页面重新可见时检查token
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && authApi.isAuthenticated()) {
        try {
          const isValid = await authApi.checkTokenValidity();
          if (!isValid) {
            showToast('登录已过期，请重新登录', 'error');
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          }
        } catch (error) {
          console.error('检查token有效性失败:', error);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // 监听窗口焦点变化，当窗口重新获得焦点时检查token
  useEffect(() => {
    const handleFocus = async () => {
      if (authApi.isAuthenticated()) {
        try {
          const isValid = await authApi.checkTokenValidity();
          if (!isValid) {
            showToast('登录已过期，请重新登录', 'error');
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          }
        } catch (error) {
          console.error('检查token有效性失败:', error);
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  return null; // 这个组件不渲染任何内容
};

export default TokenValidator;