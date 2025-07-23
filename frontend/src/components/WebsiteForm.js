import React, { useState, useEffect } from 'react';
import { categoryApi } from '../services/api';
import './WebsiteForm.css';

const WebsiteForm = ({ website, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    icon: '',
    category: '',
    category_id: null,
    position: 0,
    is_active: true,
  });
  
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState(null);

  // 获取所有分类
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      setCategoryError(null);
      const data = await categoryApi.getAll();
      // 只获取启用状态的分类
      const activeCategories = data.filter(cat => cat.is_active);
      setCategories(activeCategories);
    } catch (err) {
      console.error('获取分类列表失败:', err);
      setCategoryError('获取分类列表失败，请稍后再试');
    } finally {
      setLoadingCategories(false);
    }
  };

  // 组件加载时获取分类列表
  useEffect(() => {
    fetchCategories();
  }, []);

  // 如果传入了网站数据，则填充表单
  useEffect(() => {
    if (website) {
      setFormData({
        name: website.name || '',
        url: website.url || '',
        description: website.description || '',
        icon: website.icon || '',
        category: website.category || '',
        category_id: website.category_id || null,
        position: website.position || 0,
        is_active: website.is_active !== undefined ? website.is_active : true,
      });
    }
  }, [website]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="website-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">网站名称 *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="url">网站地址 *</label>
        <input
          type="url"
          id="url"
          name="url"
          value={formData.url}
          onChange={handleChange}
          placeholder="https://example.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">网站描述</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
        />
      </div>

      <div className="form-group">
        <label htmlFor="icon">图标URL</label>
        <input
          type="text"
          id="icon"
          name="icon"
          value={formData.icon}
          onChange={handleChange}
          placeholder="https://example.com/favicon.ico"
        />
      </div>

      <div className="form-group">
        <label htmlFor="category_id">分类</label>
        {loadingCategories ? (
          <div className="loading-text">加载分类中...</div>
        ) : categoryError ? (
          <div className="error-text">{categoryError}</div>
        ) : (
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id || ''}
            onChange={handleChange}
          >
            <option value="">-- 请选择分类 --</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="position">显示位置</label>
        <input
          type="number"
          id="position"
          name="position"
          value={formData.position}
          onChange={handleChange}
          min="0"
        />
      </div>

      <div className="form-group checkbox">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
        />
        <label htmlFor="is_active">启用</label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-submit">
          {website ? '更新' : '添加'}
        </button>
      </div>
    </form>
  );
};

export default WebsiteForm;