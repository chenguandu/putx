// 缓存管理模块
class CacheManager {
  constructor() {
    this.cachePrefix = 'putx_cache_';
    this.cacheExpireTime = 5 * 60 * 1000; // 5分钟缓存过期时间
  }

  // 生成缓存键
  getCacheKey(key) {
    return `${this.cachePrefix}${key}`;
  }

  // 设置缓存
  setCache(key, data, expireTime = this.cacheExpireTime) {
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      expireTime: expireTime
    };
    
    try {
      localStorage.setItem(this.getCacheKey(key), JSON.stringify(cacheData));
    } catch (error) {
      console.error('设置缓存失败:', error);
    }
  }

  // 获取缓存
  getCache(key) {
    try {
      const cacheStr = localStorage.getItem(this.getCacheKey(key));
      if (!cacheStr) {
        return null;
      }

      const cacheData = JSON.parse(cacheStr);
      const now = Date.now();
      
      // 检查缓存是否过期
      if (now - cacheData.timestamp > cacheData.expireTime) {
        this.removeCache(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  }

  // 删除缓存
  removeCache(key) {
    try {
      localStorage.removeItem(this.getCacheKey(key));
    } catch (error) {
      console.error('删除缓存失败:', error);
    }
  }

  // 清除所有缓存
  clearAllCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('清除所有缓存失败:', error);
    }
  }

  // 检查缓存是否存在且有效
  isCacheValid(key) {
    return this.getCache(key) !== null;
  }

  // 获取缓存时间戳
  getCacheTimestamp(key) {
    try {
      const cacheStr = localStorage.getItem(this.getCacheKey(key));
      if (!cacheStr) {
        return null;
      }

      const cacheData = JSON.parse(cacheStr);
      return cacheData.timestamp;
    } catch (error) {
      console.error('获取缓存时间戳失败:', error);
      return null;
    }
  }
}

// 创建缓存管理器实例
const cacheManager = new CacheManager();

// 网站列表缓存相关功能
export const websiteCache = {
  // 缓存键
  WEBSITES_KEY: 'websites_list',
  MY_WEBSITES_KEY: 'my_websites_list',
  USER_WEBSITE_ORDERS_KEY: 'user_website_orders',

  // 缓存网站列表
  setWebsites: (websites) => {
    cacheManager.setCache(websiteCache.WEBSITES_KEY, websites);
  },

  // 获取缓存的网站列表
  getWebsites: () => {
    return cacheManager.getCache(websiteCache.WEBSITES_KEY);
  },

  // 缓存我的网站列表
  setMyWebsites: (websites) => {
    cacheManager.setCache(websiteCache.MY_WEBSITES_KEY, websites);
  },

  // 获取缓存的我的网站列表
  getMyWebsites: () => {
    return cacheManager.getCache(websiteCache.MY_WEBSITES_KEY);
  },

  // 缓存用户网站排序
  setUserWebsiteOrders: (orders) => {
    cacheManager.setCache(websiteCache.USER_WEBSITE_ORDERS_KEY, orders);
  },

  // 获取缓存的用户网站排序
  getUserWebsiteOrders: () => {
    return cacheManager.getCache(websiteCache.USER_WEBSITE_ORDERS_KEY);
  },

  // 清除所有网站相关缓存
  clearWebsiteCache: () => {
    cacheManager.removeCache(websiteCache.WEBSITES_KEY);
    cacheManager.removeCache(websiteCache.MY_WEBSITES_KEY);
    cacheManager.removeCache(websiteCache.USER_WEBSITE_ORDERS_KEY);
  },

  // 检查网站列表缓存是否有效
  isWebsitesCacheValid: () => {
    return cacheManager.isCacheValid(websiteCache.WEBSITES_KEY);
  },

  // 检查我的网站列表缓存是否有效
  isMyWebsitesCacheValid: () => {
    return cacheManager.isCacheValid(websiteCache.MY_WEBSITES_KEY);
  },

  // 获取网站列表缓存时间戳
  getWebsitesCacheTimestamp: () => {
    return cacheManager.getCacheTimestamp(websiteCache.WEBSITES_KEY);
  }
};

// Toast提示功能
export const showToast = (message, type = 'info', duration = 3000) => {
  // 创建toast元素
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // 添加样式
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    font-size: 14px;
    z-index: 10000;
    max-width: 300px;
    word-wrap: break-word;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
  `;
  
  // 根据类型设置背景色
  switch (type) {
    case 'success':
      toast.style.backgroundColor = '#52c41a';
      break;
    case 'error':
      toast.style.backgroundColor = '#ff4d4f';
      break;
    case 'warning':
      toast.style.backgroundColor = '#faad14';
      break;
    default:
      toast.style.backgroundColor = '#1890ff';
  }
  
  // 添加到页面
  document.body.appendChild(toast);
  
  // 动画效果
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // 自动移除
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, duration);
};

export default cacheManager;