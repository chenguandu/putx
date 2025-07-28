// PutX Chrome扩展配置文件
const Config = {
  // 默认API配置
  DEFAULT_API_CONFIG: {
    apiUrl: 'http://localhost:8000'
  },
  
  // 存储键名
  STORAGE_KEYS: {
    API_URL: 'apiUrl'
  }
};

// 使配置在全局可访问
window.PutXConfig = Config;