import React, { useState, useEffect } from 'react';
import { userApi } from '../services/api';
import { showToast } from '../services/cache';
import './UserManagePage.css';

const UserManagePage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    is_active: true,
    is_admin: false,
  });

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.getAll();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('获取用户数据失败:', err);
      showToast('获取用户数据失败，请稍后再试', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 防止将admin账号设置为非活跃状态
    if (editingUser && 
        editingUser.username === 'admin' && 
        editingUser.is_active && 
        !formData.is_active) {
      showToast('不允许将管理员账号(admin)设置为禁用状态', 'warning');
      return;
    }
    
    try {
      setLoading(true);
      if (editingUser) {
        // 更新用户
        await userApi.update(editingUser.id, formData);
      } else {
        // 创建用户
        await userApi.create(formData);
      }
      // 重置表单和状态
      setFormData({
        username: '',
        email: '',
        password: '',
        is_active: true,
        is_admin: false,
      });
      setShowForm(false);
      setEditingUser(null);
      // 重新获取用户列表
      await fetchUsers();
      showToast(editingUser ? '用户更新成功' : '用户创建成功', 'success');
    } catch (err) {
      console.error('保存用户失败:', err);
      showToast(err.response?.data?.detail || '保存用户失败，请检查输入并稍后再试', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 处理编辑用户
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // 不回填密码
      is_active: user.is_active,
      is_admin: user.is_admin,
    });
    setShowForm(true);
  };

  // 处理删除用户
  const handleDelete = async (id) => {
    // 查找要删除的用户
    const userToDelete = users.find(user => user.id === id);
    
    // 防止删除admin账号
    if (userToDelete && userToDelete.username === 'admin') {
      showToast('不允许删除管理员账号(admin)', 'warning');
      return;
    }
    
    if (window.confirm('确定要删除此用户吗？此操作不可撤销。')) {
      try {
        setLoading(true);
        await userApi.delete(id);
        // 重新获取用户列表
        await fetchUsers();
        showToast('用户删除成功', 'success');
      } catch (err) {
        console.error('删除用户失败:', err);
        showToast(err.response?.data?.detail || '删除用户失败，请稍后再试', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // 处理切换用户状态
  const handleToggleStatus = async (user) => {
    // 防止将admin账号设置为非活跃状态
    if (user.username === 'admin' && user.is_active) {
      showToast('不允许将管理员账号(admin)设置为禁用状态', 'warning');
      return;
    }
    
    try {
      setLoading(true);
      await userApi.update(user.id, { is_active: !user.is_active });
      // 重新获取用户列表
      await fetchUsers();
      showToast(`用户状态${user.is_active ? '禁用' : '启用'}成功`, 'success');
    } catch (err) {
      console.error('更新用户状态失败:', err);
      showToast(err.response?.data?.detail || '更新用户状态失败，请稍后再试', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 过滤用户列表
  const filteredUsers = users.filter((user) => {
    return (
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="user-manage-page">
      {/* 搜索和添加用户控件 */}
      <div className="admin-controls">
        <div className="search-add">
          <input
            type="text"
            className="search-input"
            placeholder="搜索用户..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="add-button"
            onClick={() => {
              setEditingUser(null);
              setFormData({
                username: '',
                email: '',
                password: '',
                is_active: true,
                is_admin: false,
              });
              setShowForm(true);
            }}
          >
            添加用户
          </button>
        </div>
      </div>

      {/* 添加/编辑用户表单 */}
      {showForm && (
        <div className="form-container">
          <h3>{editingUser ? '编辑用户' : '添加用户'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">邮箱</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">
                {editingUser ? '密码 (留空则不修改)' : '密码'}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editingUser}
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  disabled={editingUser && editingUser.username === 'admin'}
                />
                启用账户
                {editingUser && editingUser.username === 'admin' && 
                  <span className="admin-note"> (管理员账号必须保持启用状态)</span>
                }
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="is_admin"
                  checked={formData.is_admin}
                  onChange={handleInputChange}
                />
                管理员权限
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="save-button">
                保存
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                }}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 加载状态 */}
      {loading && !showForm && (
        <div className="loading-state">加载中...</div>
      )}

      {/* 错误状态 */}
      {error && <div className="error-state">{error}</div>}

      {/* 用户表格 */}
      {!loading && !error && filteredUsers.length === 0 && (
        <div className="empty-state">
          <p>暂无用户数据{searchTerm ? '匹配搜索条件' : ''}。</p>
        </div>
      )}

      {!loading && !error && filteredUsers.length > 0 && (
        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={!user.is_active ? 'inactive' : ''}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.is_admin ? '管理员' : '普通用户'}</td>
                  <td>
                    <span
                      className={`status-label ${user.is_active ? 'active' : 'inactive'}`}
                    >
                      {user.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(user)}
                        title="编辑"
                      >
                        编辑
                      </button>
                      <button
                        className="toggle-button"
                        onClick={() => handleToggleStatus(user)}
                        title={user.is_active ? '禁用' : '启用'}
                      >
                        {user.is_active ? '禁用' : '启用'}
                      </button>
                      <button
                        className={`delete-button ${user.username === 'admin' ? 'disabled' : ''}`}
                        onClick={() => handleDelete(user.id)}
                        title={user.username === 'admin' ? '不允许删除管理员账号' : '删除'}
                        disabled={user.username === 'admin'}
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
  );
};

export default UserManagePage;