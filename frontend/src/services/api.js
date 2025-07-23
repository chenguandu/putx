import axios from 'axios';

// 创建axios实例
const api = axios.create({
  // 根据环境使用不同的API URL
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器，添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const tokenType = localStorage.getItem('token_type');
    
    if (token && tokenType) {
      config.headers['Authorization'] = `${tokenType} ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器，处理认证错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 如果是401错误，清除本地存储的令牌并重定向到登录页面
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('user');
      
      // 如果不是登录页面，则重定向到登录页面
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// 用户相关API
export const userApi = {
  // 获取所有用户
  getAll: async () => {
    try {
      const response = await api.get('/users/');
      return response.data;
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    }
  },

  // 获取单个用户
  getById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取用户ID:${id}失败:`, error);
      throw error;
    }
  },

  // 创建用户
  create: async (userData) => {
    try {
      const response = await api.post('/users/', userData);
      return response.data;
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  },

  // 更新用户
  update: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`更新用户ID:${id}失败:`, error);
      throw error;
    }
  },

  // 删除用户
  delete: async (id) => {
    try {
      await api.delete(`/users/${id}`);
      return true;
    } catch (error) {
      console.error(`删除用户ID:${id}失败:`, error);
      throw error;
    }
  },

  // 获取用户角色
  getRoles: async () => {
    try {
      const response = await api.get('/users/roles');
      return response.data;
    } catch (error) {
      console.error('获取用户角色失败:', error);
      throw error;
    }
  },
};

// 分类相关API
export const categoryApi = {
  // 获取所有分类
  getAll: async () => {
    try {
      const response = await api.get('/categories/');
      return response.data;
    } catch (error) {
      console.error('获取分类列表失败:', error);
      throw error;
    }
  },

  // 获取单个分类
  getById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取分类ID:${id}失败:`, error);
      throw error;
    }
  },

  // 创建分类
  create: async (categoryData) => {
    try {
      const response = await api.post('/categories/', categoryData);
      return response.data;
    } catch (error) {
      console.error('创建分类失败:', error);
      throw error;
    }
  },

  // 更新分类
  update: async (id, categoryData) => {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      console.error(`更新分类ID:${id}失败:`, error);
      throw error;
    }
  },

  // 删除分类
  delete: async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      return true;
    } catch (error) {
      console.error(`删除分类ID:${id}失败:`, error);
      throw error;
    }
  },
};

// 网站相关API
export const websiteApi = {
  // 获取所有网站
  getAll: async () => {
    try {
      const response = await api.get('/websites/');
      return response.data;
    } catch (error) {
      console.error('获取网站列表失败:', error);
      throw error;
    }
  },

  // 获取单个网站
  getById: async (id) => {
    try {
      const response = await api.get(`/websites/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取网站ID:${id}失败:`, error);
      throw error;
    }
  },

  // 创建网站
  create: async (websiteData) => {
    try {
      const response = await api.post('/websites/', websiteData);
      return response.data;
    } catch (error) {
      console.error('创建网站失败:', error);
      throw error;
    }
  },

  // 更新网站
  update: async (id, websiteData) => {
    try {
      const response = await api.put(`/websites/${id}`, websiteData);
      return response.data;
    } catch (error) {
      console.error(`更新网站ID:${id}失败:`, error);
      throw error;
    }
  },

  // 删除网站
  delete: async (id) => {
    try {
      await api.delete(`/websites/${id}`);
      return true;
    } catch (error) {
      console.error(`删除网站ID:${id}失败:`, error);
      throw error;
    }
  },
};

// 认证相关API
export const authApi = {
  // 用户登录
  login: async (username, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },
  
  // 注册用户
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  },
  
  // 获取当前用户信息
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  },
  
  // 检查是否已登录
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  // 登出
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
};

export default api;