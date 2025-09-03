import React, { useState, useEffect } from 'react';
import WebsiteGrid from '../components/WebsiteGrid';
import HomeHeader from '../components/HomeHeader';
import { websiteApi, authApi } from '../services/api';
import './HomePage.css';

const HomePage = () => {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 获取网站数据
        const websitesData = await websiteApi.getAll();
        // 只显示激活的网站
        const activeWebsites = websitesData.filter(site => site.is_active);
        // 按位置排序
        activeWebsites.sort((a, b) => a.position - b.position);
        setWebsites(activeWebsites);
        
        setError(null);
      } catch (err) {
        console.error('获取数据失败:', err);
        setError('获取数据失败，请稍后再试。');
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