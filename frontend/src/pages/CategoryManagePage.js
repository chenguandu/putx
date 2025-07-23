import React, { useState, useEffect } from 'react';
import { categoryApi } from '../services/api';
import './CategoryManagePage.css';

const CategoryManagePage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [searchTerm, setSearchTerm] = useState('');

  // 获取所有分类
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getAll();
      // 按名称排序
      data.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error('获取分类数据失败:', err);
      setError('获取分类数据失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 添加分类
  const handleAddCategory = async () => {
    try {
      await categoryApi.create(formData);
      fetchCategories();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error('添加分类失败:', err);
      setError(err.response?.data?.detail || '添加分类失败，请稍后再试。');
    }
  };

  // 更新分类
  const handleUpdateCategory = async () => {
    try {
      await categoryApi.update(currentCategory.id, formData);
      fetchCategories();
      setShowForm(false);
      setCurrentCategory(null);
      resetForm();
    } catch (err) {
      console.error('更新分类失败:', err);
      setError(err.response?.data?.detail || '更新分类失败，请稍后再试。');
    }
  };

  // 删除分类
  const handleDeleteCategory = async (id) => {
    if (window.confirm('确定要删除这个分类吗？删除后无法恢复，且不能删除已被网站使用的分类。')) {
      try {
        await categoryApi.delete(id);
        fetchCategories();
        setError(null);
      } catch (err) {
        console.error('删除分类失败:', err);
        setError(err.response?.data?.detail || '删除分类失败，请稍后再试。');
      }
    }
  };

  // 编辑分类
  const handleEditCategory = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active,
    });
    setShowForm(true);
  };

  // 处理表单变化
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // 处理表单提交
  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentCategory) {
      handleUpdateCategory();
    } else {
      handleAddCategory();
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
    });
  };

  // 取消表单
  const handleCancelForm = () => {
    setShowForm(false);
    setCurrentCategory(null);
    resetForm();
  };

  // 过滤分类
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="category-manage-page">
      <h2>分类管理</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {showForm ? (
        <div className="form-container">
          <h3>{currentCategory ? '编辑分类' : '添加分类'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">分类名称 *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">描述</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows="3"
              />
            </div>
            
            <div className="form-group checkbox-group">
              <label htmlFor="is_active">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleFormChange}
                />
                启用
              </label>
            </div>
            
            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={handleCancelForm}>
                取消
              </button>
              <button type="submit" className="save-button">
                {currentCategory ? '更新' : '添加'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="category-controls">
          <div className="search-add">
            <input
              type="text"
              placeholder="搜索分类..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="add-button" onClick={() => setShowForm(true)}>
              添加分类
            </button>
          </div>

          {loading ? (
            <div className="loading-state">加载中...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="empty-state">
              {searchTerm ? '没有找到匹配的分类' : '暂无分类数据，请添加'}
            </div>
          ) : (
            <div className="category-table-container">
              <table className="category-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>名称</th>
                    <th>描述</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className={!category.is_active ? 'inactive' : ''}>
                      <td>{category.id}</td>
                      <td>{category.name}</td>
                      <td>{category.description || '-'}</td>
                      <td>
                        <span
                          className={`status-label ${category.is_active ? 'active' : 'inactive'}`}
                        >
                          {category.is_active ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td>{new Date(category.created_at).toLocaleString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-button"
                            onClick={() => handleEditCategory(category)}
                            title="编辑"
                          >
                            编辑
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteCategory(category.id)}
                            title="删除"
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

export default CategoryManagePage;