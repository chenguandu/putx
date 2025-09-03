import React, { useState, useEffect } from 'react';
import WebsiteCard from './WebsiteCard';
import { authApi, websiteApi } from '../services/api';
import './WebsiteGrid.css';

const WebsiteGrid = ({ websites: initialWebsites }) => {
  const [websites, setWebsites] = useState(initialWebsites || []);
  const [userOrders, setUserOrders] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // 初始化时检查用户是否已登录
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = authApi.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        try {
          // 获取用户特定的网站排序
          const orders = await websiteApi.getUserWebsiteOrders();
          const orderMap = {};
          orders.forEach(order => {
            orderMap[order.website_id] = order.position;
          });
          setUserOrders(orderMap);
          
          // 应用用户特定的排序
          applyUserOrders(initialWebsites, orderMap);
        } catch (error) {
          console.error('获取用户网站排序失败:', error);
        }
      }
    };
    
    checkAuth();
  }, [initialWebsites]);
  
  // 当初始网站列表更新时，应用用户特定的排序
  useEffect(() => {
    if (initialWebsites) {
      applyUserOrders(initialWebsites, userOrders);
    }
  }, [initialWebsites]);
  
  // 应用用户特定的排序
  const applyUserOrders = (sites, orders) => {
    if (!sites || sites.length === 0) return;
    
    const sortedSites = [...sites];
    
    // 如果有用户特定的排序，则应用它
    if (Object.keys(orders).length > 0) {
      sortedSites.sort((a, b) => {
        const posA = orders[a.id] !== undefined ? orders[a.id] : a.position;
        const posB = orders[b.id] !== undefined ? orders[b.id] : b.position;
        return posA - posB;
      });
    } else {
      // 否则使用默认排序
      sortedSites.sort((a, b) => a.position - b.position);
    }
    
    setWebsites(sortedSites);
  };
  
  // 保存用户特定的排序
  const saveUserOrders = async () => {
    if (!isAuthenticated) return;
    
    try {
      const user = await authApi.getCurrentUser();
      const ordersData = websites.map((website, index) => ({
        user_id: user.id,
        website_id: website.id,
        position: index
      }));
      
      await websiteApi.updateUserWebsiteOrdersBatch(ordersData);
      console.log('网站排序已保存');
    } catch (error) {
      console.error('保存网站排序失败:', error);
    }
  };
  
  // 处理拖拽开始
  const handleDragStart = (e, index) => {
    if (!isAuthenticated) return;
    
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.parentNode);
    e.target.style.opacity = '0.5';
    setIsDragging(true);
  };
  
  // 处理拖拽结束
  const handleDragEnd = (e) => {
    if (!isAuthenticated) return;
    
    e.target.style.opacity = '1';
    setIsDragging(false);
    saveUserOrders();
  };
  
  // 处理拖拽悬停
  const handleDragOver = (e, index) => {
    if (!isAuthenticated) return;
    
    e.preventDefault();
    if (draggedItem === null) return;
    
    // 如果拖拽到自己上面，不做任何操作
    if (draggedItem === index) return;
    
    // 重新排序
    const newWebsites = [...websites];
    const draggedItemContent = newWebsites[draggedItem];
    newWebsites.splice(draggedItem, 1);
    newWebsites.splice(index, 0, draggedItemContent);
    
    setDraggedItem(index);
    setWebsites(newWebsites);
  };

  if (!websites || websites.length === 0) {
    return (
      <div className="empty-state">
        <p>暂无网站数据，请在管理页面添加。</p>
      </div>
    );
  }

  return (
    <div className={`website-grid ${isDragging ? 'dragging' : ''}`}>
      {websites.map((website, index) => (
        <div
          key={website.id}
          className="website-card-container"
          draggable={isAuthenticated}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, index)}
        >
          <WebsiteCard website={website} />
        </div>
      ))}
    </div>
  );
};

export default WebsiteGrid;