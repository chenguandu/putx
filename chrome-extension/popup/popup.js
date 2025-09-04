// 默认API配置
const DEFAULT_API_CONFIG = {
  apiUrl: 'https://putx.cn/api'
};

// DOM元素
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoriesContainer = document.getElementById('categoriesContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');
const settingsBtn = document.getElementById('settingsBtn');
const webVersionBtn = document.getElementById('webVersionBtn'); // 网页版按钮
const loginBtn = document.getElementById('loginBtn'); // 登录按钮
const loginModal = document.getElementById('loginModal'); // 登录模态框
const closeModalBtn = document.querySelector('.close'); // 关闭模态框按钮
const loginForm = document.getElementById('loginForm'); // 登录表单
const loginError = document.getElementById('loginError'); // 登录错误消息
const usernameInput = document.getElementById('username'); // 用户名输入框
const passwordInput = document.getElementById('password'); // 密码输入框
const loginSubmitBtn = document.getElementById('loginSubmitBtn'); // 登录提交按钮
const toast = document.getElementById('toast'); // Toast提示元素

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  loadApiConfigAndWebsites();
  updateLoginButtonState();
  
  // 绑定事件
  searchBtn.addEventListener('click', searchWebsites);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchWebsites();
    }
  });
  
  retryBtn.addEventListener('click', loadApiConfigAndWebsites);
  settingsBtn.addEventListener('click', function() {
    // 在新标签页中打开选项页面
    chrome.tabs.create({ url: 'options/options.html' });
  });
  
  // 网页版按钮点击事件
  webVersionBtn.addEventListener('click', function() {
    // 在新标签页中打开PutX网站
    chrome.tabs.create({ url: 'https://putx.cn' });
  });
  
  // 登录按钮点击事件
  loginBtn.addEventListener('click', function() {
    // 检查是否已登录
    chrome.storage.local.get(['authToken'], function(result) {
      if (result.authToken) {
        // 已登录，执行登出操作
        logout();
      } else {
        // 未登录，显示登录模态框
        showLoginModal();
      }
    });
  });
  
  // 关闭模态框按钮点击事件
  closeModalBtn.addEventListener('click', hideLoginModal);
  
  // 点击模态框外部关闭模态框
  window.addEventListener('click', function(event) {
    if (event.target === loginModal) {
      hideLoginModal();
    }
  });
  
  // 登录表单提交事件
  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    handleLogin();
  });
});

// 加载API配置并获取网站数据
async function loadApiConfigAndWebsites() {
  try {
    // 从Chrome存储中获取配置
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_API_CONFIG, resolve);
    });
    
    await loadWebsites(settings.apiUrl);
  } catch (error) {
    console.error('加载配置失败:', error);
    showError();
  }
}

// 显示登录模态框
function showLoginModal() {
  loginModal.style.display = 'block';
  usernameInput.focus();
  // 清空表单和错误信息
  loginForm.reset();
  hideLoginError();
}

// 隐藏登录模态框
function hideLoginModal() {
  loginModal.style.display = 'none';
}

// 显示登录错误信息
function showLoginError(message) {
  loginError.textContent = message;
  loginError.style.display = 'block';
}

// 隐藏登录错误信息
function hideLoginError() {
  loginError.style.display = 'none';
}

// 更新登录按钮状态
function updateLoginButtonState() {
  chrome.storage.local.get(['authToken', 'user', 'tokenData'], function(result) {
    // 检查token是否过期
    if (result.authToken && result.user && result.tokenData) {
      const now = new Date();
      const expiresAt = new Date(result.tokenData.expires_at);
      
      if (now >= expiresAt) {
        // Token已过期，清除存储并显示登录状态
        chrome.storage.local.remove(['authToken', 'user', 'tokenData', 'websiteCache']);
        loginBtn.textContent = '登录';
        loginBtn.title = '点击登录';
        return;
      }
      
      loginBtn.textContent = `登出 (${result.user.username})`;
      loginBtn.title = '点击登出';
    } else {
      loginBtn.textContent = '登录';
      loginBtn.title = '点击登录';
    }
  });
}

// 处理登录
async function handleLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!username || !password) {
    showLoginError('请输入用户名和密码');
    return;
  }
  
  try {
    // 禁用登录按钮，显示加载状态
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = '登录中...';
    hideLoginError();
    
    // 从Chrome存储中获取API配置
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_API_CONFIG, resolve);
    });
    
    // 确保URL格式正确
    const normalizedUrl = settings.apiUrl.endsWith('/') ? settings.apiUrl.slice(0, -1) : settings.apiUrl;
    
    // 准备表单数据
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    // 发送登录请求
    const response = await fetch(`${normalizedUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    // 解析响应
    const data = await response.json();
    
    if (!response.ok) {
      // 登录失败
      showLoginError(data.detail || '登录失败，请检查用户名和密码');
      return;
    }
    
    // 登录成功，保存持久化token信息
    const tokenData = {
      access_token: data.access_token,
      token_type: data.token_type || 'bearer',
      expires_at: data.expires_at,
      device_info: data.device_info,
      created_at: new Date().toISOString()
    };
    
    chrome.storage.local.set({ 
      authToken: data.access_token,
      tokenData: tokenData 
    }, async function() {
      // 获取用户信息
      try {
        const userResponse = await fetch(`${normalizedUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          chrome.storage.local.set({ user: userData });
        }
      } catch (err) {
        console.error('获取用户信息失败:', err);
      }
      
      // 更新登录按钮状态
      updateLoginButtonState();
      
      // 隐藏登录模态框
      hideLoginModal();
      
      // 重新加载网站数据（应用用户特定排序）
      loadApiConfigAndWebsites();
    });
  } catch (error) {
    console.error('登录请求失败:', error);
    showLoginError('登录请求失败，请检查网络连接');
  } finally {
    // 恢复登录按钮状态
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = '登录';
  }
}

// 登出
async function logout() {
  try {
    // 获取当前token信息
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['authToken', 'tokenData'], resolve);
    });
    
    if (result.authToken) {
      // 尝试调用后端登出API
      try {
        const settings = await new Promise((resolve) => {
          chrome.storage.sync.get(DEFAULT_API_CONFIG, resolve);
        });
        
        const normalizedUrl = settings.apiUrl.endsWith('/') ? settings.apiUrl.slice(0, -1) : settings.apiUrl;
        
        await fetch(`${normalizedUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${result.authToken}`
          }
        });
      } catch (err) {
        console.error('后端登出失败:', err);
        // 即使后端登出失败，也要清除本地存储
      }
    }
  } catch (error) {
    console.error('登出过程出错:', error);
  }
  
  // 清除本地存储
  chrome.storage.local.remove(['authToken', 'user', 'tokenData', 'websiteCache'], function() {
    // 更新登录按钮状态
    updateLoginButtonState();
    
    // 重新加载网站数据（使用默认排序）
    loadApiConfigAndWebsites();
  });
}

// 加载网站数据
async function loadWebsites(apiBaseUrl) {
  try {
    showLoading(true);
    hideError();
    
    // 确保URL格式正确
    const normalizedUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    
    // 尝试从缓存加载数据
    let cachedData = null;
    try {
      const cache = await new Promise((resolve) => {
        chrome.storage.local.get(['websiteCache'], resolve);
      });
      
      if (cache.websiteCache) {
        const cacheAge = Date.now() - cache.websiteCache.timestamp;
        // 缓存有效期5分钟
        if (cacheAge < 5 * 60 * 1000) {
          cachedData = cache.websiteCache;
          // 先显示缓存数据
          renderCategories(cachedData.categories || []);
          showLoading(false);
        }
      }
    } catch (err) {
      console.error('读取缓存失败:', err);
    }
    
    // 获取所有激活的网站
    let websites;
    try {
      const response = await fetch(`${normalizedUrl}/websites/?is_active=true`);
      
      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP错误 ${response.status}: ${response.statusText}`);
      }
      
      // 检查内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('服务器响应不是JSON格式:', text);
        throw new Error('服务器响应格式错误，不是有效的JSON数据');
      }
      
      websites = await response.json();
    } catch (networkError) {
      // 网络请求失败，如果有缓存数据则使用缓存
      if (cachedData) {
        console.warn('网络请求失败，使用缓存数据:', networkError);
        showToast('网络连接失败，显示缓存数据', 3000);
        return;
      }
      // 没有缓存数据时，显示toast提示
      console.error('网络请求失败且无缓存数据:', networkError);
      showToast('网络连接失败，请检查网络设置', 3000);
      return;
    }
    
    // 尝试获取用户特定的排序
    let userWebsiteOrders = [];
    try {
      // 检查是否有认证令牌和token是否有效
      const tokenInfo = await new Promise((resolve) => {
        chrome.storage.local.get(['authToken', 'tokenData'], (result) => {
          resolve(result);
        });
      });
      
      if (tokenInfo.authToken && tokenInfo.tokenData) {
        // 检查token是否过期
        const now = new Date();
        const expiresAt = new Date(tokenInfo.tokenData.expires_at);
        
        if (now < expiresAt) {
          // 获取用户特定的排序
          const ordersResponse = await fetch(`${normalizedUrl}/user-website-orders/`, {
            headers: {
              'Authorization': `Bearer ${tokenInfo.authToken}`
            }
          });
          
          if (ordersResponse.ok) {
            userWebsiteOrders = await ordersResponse.json();
          } else if (ordersResponse.status === 401) {
            // Token无效，清除本地存储
            chrome.storage.local.remove(['authToken', 'user', 'tokenData', 'websiteCache']);
            updateLoginButtonState();
          }
        } else {
          // Token已过期，清除本地存储
          chrome.storage.local.remove(['authToken', 'user', 'tokenData', 'websiteCache']);
          updateLoginButtonState();
        }
      }
    } catch (err) {
      console.error('获取用户排序失败:', err);
      // 失败时继续使用默认排序
    }
    
    // 创建网站ID到位置的映射（如果有用户特定排序）
    const orderMap = {};
    if (userWebsiteOrders.length > 0) {
      userWebsiteOrders.forEach(order => {
        orderMap[order.website_id] = order.position;
      });
    }
    
    // 按分类组织网站
    const categories = {};
    websites.forEach(website => {
      const category = website.category || '未分类';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(website);
    });
    
    // 按位置排序（应用用户特定排序或默认排序）
    Object.keys(categories).forEach(category => {
      if (userWebsiteOrders.length > 0) {
        // 使用用户特定排序
        categories[category].sort((a, b) => {
          const posA = orderMap[a.id] !== undefined ? orderMap[a.id] : (a.position || 0);
          const posB = orderMap[b.id] !== undefined ? orderMap[b.id] : (b.position || 0);
          return posA - posB;
        });
      } else {
        // 使用默认排序
        categories[category].sort((a, b) => (a.position || 0) - (b.position || 0));
      }
    });
    
    // 保存到缓存
    const cacheData = {
      categories: categories,
      websites: websites,
      userWebsiteOrders: userWebsiteOrders,
      timestamp: Date.now()
    };
    
    chrome.storage.local.set({ websiteCache: cacheData }, function() {
      if (chrome.runtime.lastError) {
        console.error('保存缓存失败:', chrome.runtime.lastError);
      }
    });
    
    renderCategories(categories);
  } catch (error) {
    console.error('加载网站数据失败:', error);
    // 检查是否有缓存数据，如果没有才显示错误页面
    try {
      const cache = await new Promise((resolve) => {
        chrome.storage.local.get(['websiteCache'], resolve);
      });
      
      if (!cache.websiteCache) {
        showError();
      }
    } catch (cacheError) {
      showError();
    }
  } finally {
    showLoading(false);
  }
}

// 搜索网站
async function searchWebsites() {
  const searchTerm = searchInput.value.trim();
  if (!searchTerm) {
    loadApiConfigAndWebsites();
    return;
  }
  
  try {
    showLoading(true);
    hideError();
    
    // 从Chrome存储中获取配置
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_API_CONFIG, resolve);
    });
    
    // 确保URL格式正确
    const normalizedUrl = settings.apiUrl.endsWith('/') ? settings.apiUrl.slice(0, -1) : settings.apiUrl;
    
    const response = await fetch(`${normalizedUrl}/websites/?is_active=true`);
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP错误 ${response.status}: ${response.statusText}`);
    }
    
    // 检查内容类型
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('服务器响应不是JSON格式:', text);
      throw new Error('服务器响应格式错误，不是有效的JSON数据');
    }
    
    const websites = await response.json();
    const filteredWebsites = websites.filter(website => 
      website.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (website.description && website.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (website.category && website.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // 创建搜索结果分类
    const searchResults = {
      '搜索结果': filteredWebsites
    };
    
    renderCategories(searchResults);
  } catch (error) {
    console.error('搜索网站失败:', error);
    showError();
  } finally {
    showLoading(false);
  }
}

// 渲染分类和网站
function renderCategories(categories) {
  categoriesContainer.innerHTML = '';
  
  Object.keys(categories).forEach(categoryName => {
    const websites = categories[categoryName];
    
    if (websites.length === 0) return;
    
    const categorySection = document.createElement('div');
    categorySection.className = 'category-section';
    
    const categoryTitle = document.createElement('h2');
    categoryTitle.className = 'category-title';
    categoryTitle.textContent = categoryName;
    categorySection.appendChild(categoryTitle);
    
    const websiteGrid = document.createElement('div');
    websiteGrid.className = 'website-grid';
    websiteGrid.dataset.category = categoryName;
    websiteGrid.dataset.websites = JSON.stringify(websites);
    
    websites.forEach(website => {
      const cardContainer = document.createElement('div');
      cardContainer.className = 'website-card-container';
      cardContainer.dataset.websiteId = website.id;
      cardContainer.draggable = true;
      
      // 添加拖拽事件监听器
      cardContainer.addEventListener('dragstart', handleDragStart);
      cardContainer.addEventListener('dragover', handleDragOver);
      cardContainer.addEventListener('dragenter', handleDragEnter);
      cardContainer.addEventListener('dragleave', handleDragLeave);
      cardContainer.addEventListener('drop', handleDrop);
      cardContainer.addEventListener('dragend', handleDragEnd);
      
      const websiteCard = createWebsiteCard(website);
      cardContainer.appendChild(websiteCard);
      websiteGrid.appendChild(cardContainer);
    });
    
    categorySection.appendChild(websiteGrid);
    categoriesContainer.appendChild(categorySection);
  });
  
  // 添加拖拽提示
  const dragHint = document.createElement('div');
  dragHint.className = 'drag-hint';
  dragHint.textContent = '拖动网站卡片可以自定义排序';
  categoriesContainer.appendChild(dragHint);
}

// 创建网站卡片
function createWebsiteCard(website) {
  const card = document.createElement('div');
  card.className = 'website-card';
  card.addEventListener('click', () => {
    // 在当前标签页中打开网站
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.update(tabs[0].id, {url: website.url});
    });
  });
  
  const icon = document.createElement('div');
  icon.className = 'website-icon';
  
  if (website.icon) {
    const img = document.createElement('img');
    img.src = website.icon;
    img.alt = website.name;
    img.onerror = function() {
      // 图片加载失败时显示首字母
      icon.innerHTML = `<span>${website.name.charAt(0)}</span>`;
    };
    icon.appendChild(img);
  } else {
    icon.innerHTML = `<span>${website.name.charAt(0)}</span>`;
  }
  
  const name = document.createElement('div');
  name.className = 'website-name';
  name.textContent = website.name;
  
  card.appendChild(icon);
  card.appendChild(name);
  
  return card;
}

// 显示/隐藏加载指示器
function showLoading(show) {
  loadingIndicator.style.display = show ? 'block' : 'none';
  categoriesContainer.style.display = show ? 'none' : 'block';
}

// 显示错误消息
function showError() {
  errorMessage.style.display = 'block';
  categoriesContainer.style.display = 'none';
}

// 隐藏错误消息
function hideError() {
  errorMessage.style.display = 'none';
}

// 拖拽相关变量
let draggedItem = null;
let originalOrder = []; // 保存原始排序

// 拖拽开始
function handleDragStart(e) {
  draggedItem = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.websiteId);
  
  // 保存拖拽前的原始排序
  const websiteGrid = this.parentNode;
  originalOrder = Array.from(websiteGrid.querySelectorAll('.website-card-container')).map(item => item.dataset.websiteId);
}

// 拖拽经过
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

// 拖拽进入
function handleDragEnter(e) {
  this.classList.add('drag-over');
}

// 拖拽离开
function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

// 放置
function handleDrop(e) {
  e.stopPropagation();
  e.preventDefault();
  
  // 移除所有元素的drag-over类
  document.querySelectorAll('.website-card-container').forEach(item => {
    item.classList.remove('drag-over');
  });
  
  // 如果拖拽到自己上面，不做任何操作
  if (draggedItem === this) return false;
  
  const websiteGrid = this.parentNode;
  const items = Array.from(websiteGrid.querySelectorAll('.website-card-container'));
  const fromIndex = items.indexOf(draggedItem);
  const toIndex = items.indexOf(this);
  
  // 重新排序DOM元素
  if (fromIndex < toIndex) {
    websiteGrid.insertBefore(draggedItem, this.nextSibling);
  } else {
    websiteGrid.insertBefore(draggedItem, this);
  }
  
  // 保存新的排序
  saveNewOrder(websiteGrid);
  
  return false;
}

// 拖拽结束
function handleDragEnd(e) {
  this.classList.remove('dragging');
  draggedItem = null;
}

// 显示Toast提示
function showToast(message, duration = 3000) {
  toast.textContent = message;
  toast.style.display = 'block';
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300); // 等待淡出动画完成
  }, duration);
}

// 恢复原始排序
function restoreOriginalOrder(websiteGrid) {
  if (!originalOrder.length) return;
  
  const items = Array.from(websiteGrid.querySelectorAll('.website-card-container'));
  const itemsMap = {};
  
  // 创建网站ID到元素的映射
  items.forEach(item => {
    itemsMap[item.dataset.websiteId] = item;
  });
  
  // 清空网格
  websiteGrid.innerHTML = '';
  
  // 按原始顺序重新添加元素
  originalOrder.forEach(websiteId => {
    if (itemsMap[websiteId]) {
      websiteGrid.appendChild(itemsMap[websiteId]);
    }
  });
}

// 保存新的排序
async function saveNewOrder(websiteGrid) {
  try {
    // 获取所有网站卡片
    const items = Array.from(websiteGrid.querySelectorAll('.website-card-container'));
    const websites = JSON.parse(websiteGrid.dataset.websites || '[]');
    
    // 检查是否有认证令牌
    const token = await new Promise((resolve) => {
      chrome.storage.local.get(['authToken'], (result) => {
        resolve(result.authToken || null);
      });
    });
    
    if (!token) {
      console.log('未登录，无法保存排序');
      showToast('请先登录后再进行排序');
      restoreOriginalOrder(websiteGrid);
      return;
    }
    
    // 从Chrome存储中获取API配置
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_API_CONFIG, resolve);
    });
    
    // 确保URL格式正确
    const normalizedUrl = settings.apiUrl.endsWith('/') ? settings.apiUrl.slice(0, -1) : settings.apiUrl;
    
    // 准备排序数据
    // 获取当前用户信息
    const user = await new Promise((resolve) => {
      chrome.storage.local.get(['user'], (result) => {
        resolve(result.user || null);
      });
    });
    
    if (!user || !user.id) {
      console.error('无法获取用户ID');
      showToast('无法获取用户信息，排序失败');
      restoreOriginalOrder(websiteGrid);
      throw new Error('无法获取用户ID');
    }
    
    const orders = [];
    items.forEach((item, index) => {
      const websiteId = parseInt(item.dataset.websiteId);
      orders.push({
        user_id: user.id,
        website_id: websiteId,
        position: index
      });
    });
    
    // 发送批量更新请求
    const response = await fetch(`${normalizedUrl}/user-website-orders/batch`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orders)
    });
    
    if (!response.ok) {
      showToast(`保存排序失败: ${response.status}`);
      restoreOriginalOrder(websiteGrid);
      throw new Error(`保存排序失败: ${response.status}`);
    }
    
    console.log('排序已保存');
    showToast('排序已保存');
  } catch (error) {
    console.error('保存排序失败:', error);
    showToast('保存排序失败，已恢复原始顺序');
    restoreOriginalOrder(websiteGrid);
  }
}