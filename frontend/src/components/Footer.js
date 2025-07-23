import React from 'react';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>Copyright © {year} 指南网.保留所有权利 <a href="https://beian.miit.gov.cn/"
    class="hover:underline" target="_blank">粤ICP备17019608号-2</a></p>
      </div>
    </footer>
  );
};

export default Footer;