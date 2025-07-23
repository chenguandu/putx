import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(() => {
    // 根据当前路径设置初始活动菜单
    if (location.pathname.includes('/admin/users')) {
      return 'users';
    } else if (location.pathname.includes('/admin/categories')) {
      return 'categories';
    }
    return 'websites';
  });

  const menuItems = [
    { id: 'websites', label: '网站管理', path: '/admin' },
    { id: 'categories', label: '分类管理', path: '/admin/categories' },
    { id: 'users', label: '用户管理', path: '/admin/users' },
  ];

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h3>管理控制台</h3>
        </div>
        <nav className="sidebar-menu">
          <ul>
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={activeMenu === item.id ? 'active' : ''}
                  onClick={() => setActiveMenu(item.id)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;