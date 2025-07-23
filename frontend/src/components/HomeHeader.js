import React from 'react';
import './HomeHeader.css';

const HomeHeader = () => {
  return (
    <div className="home-header">
      <div className="header-left">
        <h1>PutX指南网</h1>
      </div>
      <div className="header-right">
        <p>收集和整理您喜爱的网站，随时访问您的网络世界</p>
      </div>
    </div>
  );
};

export default HomeHeader;