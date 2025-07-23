import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';

/**
 * 受保护的路由组件
 * 如果用户已登录，则渲染子组件
 * 如果用户未登录，则重定向到登录页面
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authApi.isAuthenticated();
  
  if (!isAuthenticated) {
    // 重定向到登录页面，并记录用户想要访问的页面
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

export default ProtectedRoute;