import React from 'react';
import './WebsiteCard.css';

const WebsiteCard = ({ website }) => {
  const handleClick = () => {
    window.open(website.url, '_self', 'noopener,noreferrer');
  };

  // 默认图标
  const defaultIcon = '🌐';

  return (
    <div className="website-card" onClick={handleClick}>
      <div className="website-content">
        <div className="website-icon">
          {website.icon ? (
            <img src={website.icon} alt={website.name} />
          ) : (
            <span>{defaultIcon}</span>
          )}
        </div>
        <div className="website-info">
          <h3 className="website-name">{website.name}</h3>
          {website.description && (
            <p className="website-description">{website.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebsiteCard;