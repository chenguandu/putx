import React, { useState, useEffect } from 'react';
import WebsiteGrid from '../components/WebsiteGrid';
import HomeHeader from '../components/HomeHeader';
import { websiteApi, authApi } from '../services/api';
import { showToast, websiteCache } from '../services/cache';
import './HomePage.css';

const HomePage = () => {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 先尝试加载缓存数据
        const cachedWebsites = websiteCache.getWebsites();
        if (cachedWebsites && cachedWebsites.length > 0) {
          // 显示缓存数据
          const activeWebsites = cachedWebsites.filter(site => site.is_active && (site.public || site.user_id === null || site.user_id === undefined || site.user_id === authApi.getCurrentUserId()));
          activeWebsites.sort((a, b) => a.position - b.position);
          setWebsites(activeWebsites);
          setLoading(false);
        }
        
        // 后台获取新数据
        try {
          const websitesData = await websiteApi.getAll();
          // 缓存新数据
          websiteCache.setWebsites(websitesData);
          
          // 只显示激活的网站，并且是公开的或者是当前用户的网站
          const activeWebsites = websitesData.filter(site => site.is_active && (site.public || site.user_id === null || site.user_id === undefined || site.user_id === authApi.getCurrentUserId()));
          // 按位置排序
          activeWebsites.sort((a, b) => a.position - b.position);
          setWebsites(activeWebsites);
          
          setError(null);
        } catch (networkErr) {
          console.error('获取数据失败:', networkErr);
          
          // 如果有缓存数据，则不显示错误状态，只显示toast
          if (cachedWebsites && cachedWebsites.length > 0) {
            showToast('网络连接失败，显示缓存数据', 'warning');
          } else {
            // 没有缓存数据时才显示错误状态
            setError('获取数据失败，请稍后再试');
            showToast('获取数据失败，请稍后再试', 'error');
          }
        }
      } catch (err) {
        console.error('加载数据失败:', err);
        setError('加载数据失败，请稍后再试');
        showToast('加载数据失败，请稍后再试', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="home-page">
      {loading ? (
        <div className="loading-state">加载中...</div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : (
        <WebsiteGrid websites={websites} />
      )}
    </div>
  );
};

export default HomePage;