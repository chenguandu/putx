import React, { useState, useEffect } from 'react';
import WebsiteForm from '../components/WebsiteForm';
import { websiteApi } from '../services/api';
import './AdminPage.css';

const AdminPage = () => {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentWebsite, setCurrentWebsite] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 获取所有网站
  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const data = await websiteApi.getAll();
      // 按位置排序
      data.sort((a, b) => a.position - b.position);
      setWebsites(data);
      setError(null);
    } catch (err) {
      console.error('获取网站数据失败:', err);
      setError('获取网站数据失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  // 添加网站
  const handleAddWebsite = async (websiteData) => {
    try {
      await websiteApi.create(websiteData);
      fetchWebsites();
      setShowForm(false);
      setCurrentWebsite(null);
    } catch (err) {
      console.error('添加网站失败:', err);
      alert('添加网站失败，请稍后再试。');
    }
  };

  // 更新网站
  const handleUpdateWebsite = async (websiteData) => {
    try {
      await websiteApi.update(currentWebsite.id, websiteData);
      fetchWebsites();
      setShowForm(false);
      setCurrentWebsite(null);
    } catch (err) {
      console.error('更新网站失败:', err);
      alert('更新网站失败，请稍后再试。');
    }
  };

  // 删除网站
  const handleDeleteWebsite = async (id) => {
    if (window.confirm('确定要删除这个网站吗？')) {
      try {
        await websiteApi.delete(id);
        fetchWebsites();
      } catch (err) {
        console.error('删除网站失败:', err);
        alert('删除网站失败，请稍后再试。');
      }
    }
  };

  // 编辑网站
  const handleEditWebsite = (website) => {
    setCurrentWebsite(website);
    setShowForm(true);
  };

  // 取消表单
  const handleCancelForm = () => {
    setShowForm(false);
    setCurrentWebsite(null);
  };

  // 处理表单提交
  const handleFormSubmit = (formData) => {
    if (currentWebsite) {
      handleUpdateWebsite(formData);
    } else {
      handleAddWebsite(formData);
    }
  };

  // 过滤网站
  const filteredWebsites = websites.filter((website) =>
    website.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    website.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (website.description && website.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (website.category_rel && website.category_rel.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (website.category && website.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-page">
      {showForm ? (
        <div className="form-container">
          <h2>{currentWebsite ? '编辑网站' : '添加网站'}</h2>
          <WebsiteForm
            website={currentWebsite}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
          />
        </div>
      ) : (
        <div className="admin-controls">
          <div className="search-add">
            <input
              type="text"
              placeholder="搜索网站..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="add-button" onClick={() => setShowForm(true)}>
              添加网站
            </button>
          </div>

          {loading ? (
            <div className="loading-state">加载中...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : filteredWebsites.length === 0 ? (
            <div className="empty-state">
              {searchTerm ? '没有找到匹配的网站' : '暂无网站数据，请添加'}
            </div>
          ) : (
            <div className="website-table-container">
              <table className="website-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>名称</th>
                    <th>URL</th>
                    <th>描述</th>
                    <th>分类</th>
                    <th>位置</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWebsites.map((website) => (
                    <tr key={website.id} className={!website.is_active ? 'inactive' : ''}>
                      <td>{website.id}</td>
                      <td>
                        <div className="website-name-with-icon">
                          <div className="admin-website-icon">
                            {website.icon ? (
                              <img src={website.icon} alt={website.name} />
                            ) : (
                              <span>🌐</span>
                            )}
                          </div>
                          <span>{website.name}</span>
                        </div>
                      </td>
                      <td>
                        <a href={website.url} target="_blank" rel="noopener noreferrer">
                          {website.url.length > 30
                            ? `${website.url.substring(0, 30)}...`
                            : website.url}
                        </a>
                      </td>
                      <td>
                        {website.description
                          ? website.description.length > 30
                            ? `${website.description.substring(0, 30)}...`
                            : website.description
                          : '-'}
                      </td>
                      <td>
                        {website.category_rel ? website.category_rel.name : (website.category || '-')}
                      </td>
                      <td>{website.position}</td>
                      <td>
                        <span className={`status ${website.is_active ? 'active' : 'inactive'}`}>
                          {website.is_active ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-button"
                            onClick={() => handleEditWebsite(website)}
                          >
                            编辑
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteWebsite(website.id)}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;