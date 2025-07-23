import React from 'react';
import WebsiteCard from './WebsiteCard';
import './WebsiteGrid.css';

const WebsiteGrid = ({ websites }) => {
  if (!websites || websites.length === 0) {
    return (
      <div className="empty-state">
        <p>暂无网站数据，请在管理页面添加。</p>
      </div>
    );
  }

  return (
    <div className="website-grid">
      {websites.map((website) => (
        <WebsiteCard key={website.id} website={website} />
      ))}
    </div>
  );
};

export default WebsiteGrid;