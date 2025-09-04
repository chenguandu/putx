import axios from 'axios';
import { websiteCache, showToast } from './cache.js';

// 创建axios实例
console.log('API Base URL:', process.env.REACT_APP_API_URL);

const api = axios.create({
  // 根据环境使用不同的API URL
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
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
  (response) => {
    console.log('API响应成功:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API请求失败:', error.config?.url, error.message);
    console.error('错误详情:', error.response?.data || error);
    
    // 如果是401错误，清除本地存储的令牌并重定向到登录页面
    if (error.response && error.response.status === 401) {
      // 检查是否是获取网站列表的请求，如果是则不重定向
      const isWebsiteListRequest = error.config && error.config.url && error.config.url.includes('/websites/');
      
      if (!isWebsiteListRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('user');
        
        // 清除网站缓存
        websiteCache.clear();
        
        // 显示提示
        showToast('登录已过期，请重新登录', 'error');
        
        // 如果不是登录页面，则重定向到登录页面
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
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
  // 获取所有网站（带缓存）
  getAll: async (useCache = true) => {
    try {
      // 如果启用缓存且缓存有效，先返回缓存数据
      if (useCache && websiteCache.isWebsitesCacheValid()) {
        const cachedData = websiteCache.getWebsites();
        if (cachedData) {
          // 后台更新数据
          websiteApi.getAll(false).then(freshData => {
            websiteCache.setWebsites(freshData);
          }).catch(error => {
            console.error('后台更新网站列表失败:', error);
          });
          return cachedData;
        }
      }

      // 获取新数据
      const response = await api.get('/websites/');
      const data = response.data;
      
      // 缓存数据
      if (useCache) {
        websiteCache.setWebsites(data);
      }
      
      return data;
    } catch (error) {
      console.error('获取网站列表失败:', error);
      
      // 如果请求失败且有缓存，返回缓存数据并显示提示
      if (useCache && websiteCache.isWebsitesCacheValid()) {
        const cachedData = websiteCache.getWebsites();
        if (cachedData) {
          showToast('网络连接失败，显示缓存数据', 'warning');
          return cachedData;
        }
      }
      
      throw error;
    }
  },

  // 获取当前用户的网站（带缓存）
  getMyWebsites: async (useCache = true) => {
    try {
      // 如果启用缓存且缓存有效，先返回缓存数据
      if (useCache && websiteCache.isMyWebsitesCacheValid()) {
        const cachedData = websiteCache.getMyWebsites();
        if (cachedData) {
          // 后台更新数据
          websiteApi.getMyWebsites(false).then(freshData => {
            websiteCache.setMyWebsites(freshData);
          }).catch(error => {
            console.error('后台更新我的网站列表失败:', error);
          });
          return cachedData;
        }
      }

      // 获取新数据
      const response = await api.get('/websites/?my_websites_only=true');
      const data = response.data;
      
      // 缓存数据
      if (useCache) {
        websiteCache.setMyWebsites(data);
      }
      
      return data;
    } catch (error) {
      console.error('获取我的网站列表失败:', error);
      
      // 如果请求失败且有缓存，返回缓存数据并显示提示
      if (useCache && websiteCache.isMyWebsitesCacheValid()) {
        const cachedData = websiteCache.getMyWebsites();
        if (cachedData) {
          showToast('网络连接失败，显示缓存数据', 'warning');
          return cachedData;
        }
      }
      
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
      // 清除相关缓存
      websiteCache.clearWebsiteCache();
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
      // 清除相关缓存
      websiteCache.clearWebsiteCache();
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
      // 清除相关缓存
      websiteCache.clearWebsiteCache();
      return true;
    } catch (error) {
      console.error(`删除网站ID:${id}失败:`, error);
      throw error;
    }
  },
  
  // 获取用户特定的网站排序（带缓存）
  getUserWebsiteOrders: async (useCache = true) => {
    try {
      // 如果启用缓存且缓存有效，先返回缓存数据
      if (useCache) {
        const cachedData = websiteCache.getUserWebsiteOrders();
        if (cachedData) {
          // 后台更新数据
          websiteApi.getUserWebsiteOrders(false).then(freshData => {
            websiteCache.setUserWebsiteOrders(freshData);
          }).catch(error => {
            console.error('后台更新用户网站排序失败:', error);
          });
          return cachedData;
        }
      }

      // 获取新数据
      const response = await api.get('/user-website-orders/');
      const data = response.data;
      
      // 缓存数据
      if (useCache) {
        websiteCache.setUserWebsiteOrders(data);
      }
      
      return data;
    } catch (error) {
      console.error('获取用户网站排序失败:', error);
      
      // 如果请求失败且有缓存，返回缓存数据并显示提示
      if (useCache) {
        const cachedData = websiteCache.getUserWebsiteOrders();
        if (cachedData) {
          showToast('网络连接失败，显示缓存数据', 'warning');
          return cachedData;
        }
      }
      
      throw error;
    }
  },
  
  // 批量更新用户网站排序（用于拖拽排序后保存）
  updateUserWebsiteOrdersBatch: async (ordersData) => {
    try {
      const response = await api.put('/user-website-orders/batch', ordersData);
      // 清除相关缓存
      websiteCache.clearWebsiteCache();
      return response.data;
    } catch (error) {
      console.error('批量更新用户网站排序失败:', error);
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
      
      // 保存持久化token到localStorage
      const data = response.data;
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('token_type', data.token_type || 'bearer');
        localStorage.setItem('expires_at', data.expires_at);
        localStorage.setItem('device_info', data.device_info || '');
      }
      
      return data;
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
  
  // 获取用户的所有登录会话
  getMySessions: async () => {
    try {
      const response = await api.get('/auth/my-sessions');
      return response.data;
    } catch (error) {
      console.error('获取用户会话失败:', error);
      throw error;
    }
  },
  
  // 管理员获取所有在线用户
  getOnlineUsers: async () => {
    try {
      const response = await api.get('/auth/online-users');
      return response.data;
    } catch (error) {
      console.error('获取在线用户失败:', error);
      throw error;
    }
  },
  
  // 用户撤销自己的指定token
  revokeMyToken: async (tokenId) => {
    try {
      const response = await api.post(`/auth/revoke-token/${tokenId}`);
      return response.data;
    } catch (error) {
      console.error('撤销token失败:', error);
      throw error;
    }
  },
  
  // 管理员撤销任意用户的指定token
  adminRevokeToken: async (tokenId) => {
    try {
      const response = await api.post(`/auth/admin/revoke-token/${tokenId}`);
      return response.data;
    } catch (error) {
      console.error('管理员撤销token失败:', error);
      throw error;
    }
  },
  
  // 管理员撤销指定用户的所有token
  adminRevokeUserTokens: async (userId) => {
    try {
      const response = await api.post(`/auth/admin/revoke-user-tokens/${userId}`);
      return response.data;
    } catch (error) {
      console.error('管理员撤销用户所有token失败:', error);
      throw error;
    }
  },
  
  // 用户退出当前登录
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('退出登录失败:', error);
    } finally {
      // 无论API调用是否成功，都清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('user');
      localStorage.removeItem('expires_at');
      localStorage.removeItem('device_info');
      window.location.href = '/login';
    }
  },
  
  // 用户退出所有设备的登录
  logoutAll: async () => {
    try {
      const response = await api.post('/auth/logout-all');
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('user');
      localStorage.removeItem('expires_at');
      localStorage.removeItem('device_info');
      return response.data;
    } catch (error) {
      console.error('退出所有设备登录失败:', error);
      throw error;
    }
  },
  
  // 检查是否已登录
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('expires_at');
    
    if (!token) {
      return false;
    }
    
    // 检查token是否过期
    if (expiresAt) {
      const expireTime = new Date(expiresAt);
      const now = new Date();
      if (now >= expireTime) {
        // token已过期，清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('user');
        localStorage.removeItem('expires_at');
        localStorage.removeItem('device_info');
        return false;
      }
    }
    
    return true;
  },
  
  // 获取当前用户ID
  getCurrentUserId: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id;
      } catch (error) {
        console.error('解析用户信息失败:', error);
        return null;
      }
    }
    return null;
  },
  
  // 检查token有效性（用于自动下线检测）
  checkTokenValidity: async () => {
    try {
      await api.get('/auth/me');
      return true;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // token无效，清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('user');
        localStorage.removeItem('expires_at');
        localStorage.removeItem('device_info');
        return false;
      }
      throw error;
    }
  },
};

export default api;