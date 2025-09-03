// 默认API配置
const DEFAULT_API_CONFIG = {
  apiUrl: 'https://putx.cn/api'
};

// DOM元素
const websitesContainer = document.getElementById('websitesContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');
const toast = document.getElementById('toast');

// 登录相关DOM元素
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeModalBtn = document.querySelector('.close');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  loadApiConfigAndWebsites();
  updateLoginButtonState();
  
  // 绑定重试事件
  retryBtn.addEventListener('click', loadApiConfigAndWebsites);
  
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
  chrome.storage.local.get(['authToken', 'user'], function(result) {
    if (result.authToken && result.user) {
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
    
    // 登录成功，保存令牌
    chrome.storage.local.set({ authToken: data.access_token }, async function() {
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
function logout() {
  chrome.storage.local.remove(['authToken', 'user'], function() {
    // 更新登录按钮状态
    updateLoginButtonState();
    
    // 重新加载网站数据（使用默认排序）
    loadApiConfigAndWebsites();
  });
}

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

// 加载网站数据
async function loadWebsites(apiBaseUrl) {
  try {
    showLoading(true);
    hideError();
    
    // 确保URL格式正确
    const normalizedUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    
    // 获取所有激活的网站
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
    
    // 尝试获取用户特定的排序
    let userWebsiteOrders = [];
    try {
      // 检查是否有认证令牌
      const token = await new Promise((resolve) => {
        chrome.storage.local.get(['authToken'], (result) => {
          resolve(result.authToken || null);
        });
      });
      
      if (token) {
        // 获取用户特定的排序
        const ordersResponse = await fetch(`${normalizedUrl}/user-website-orders/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (ordersResponse.ok) {
          userWebsiteOrders = await ordersResponse.json();
        }
      }
    } catch (err) {
      console.error('获取用户排序失败:', err);
      // 失败时继续使用默认排序
    }
    
    // 应用用户特定的排序（如果有）
    if (userWebsiteOrders.length > 0) {
      // 创建网站ID到位置的映射
      const orderMap = {};
      userWebsiteOrders.forEach(order => {
        orderMap[order.website_id] = order.position;
      });
      
      // 应用自定义排序
      websites.sort((a, b) => {
        const posA = orderMap[a.id] !== undefined ? orderMap[a.id] : (a.position || 0);
        const posB = orderMap[b.id] !== undefined ? orderMap[b.id] : (b.position || 0);
        return posA - posB;
      });
    } else {
      // 使用默认位置排序
      websites.sort((a, b) => (a.position || 0) - (b.position || 0));
    }
    
    renderWebsites(websites);
  } catch (error) {
    console.error('加载网站数据失败:', error);
    showError();
  } finally {
    showLoading(false);
  }
}

// 渲染网站（不按分类显示）
function renderWebsites(websites) {
  websitesContainer.innerHTML = '';
  
  const websiteGrid = document.createElement('div');
  websiteGrid.className = 'website-grid';
  
  // 存储所有网站数据，用于拖拽排序
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
  
  // 添加拖拽提示
  const dragHint = document.createElement('div');
  dragHint.className = 'drag-hint';
  dragHint.textContent = '拖动网站卡片可以自定义排序';
  
  websitesContainer.appendChild(websiteGrid);
  websitesContainer.appendChild(dragHint);
}

// 创建网站卡片
function createWebsiteCard(website) {
  const card = document.createElement('div');
  card.className = 'website-card';
  card.addEventListener('click', () => {
    // 在当前页面中打开网站
    window.location.href = website.url;
  });

  const content = document.createElement('div');
  content.className = 'website-content';

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

  const info = document.createElement('div');
  info.className = 'website-info';

  const name = document.createElement('div');
  name.className = 'website-name';
  name.textContent = website.name;

  info.appendChild(name);

  // 添加描述（如果存在）
  if (website.description) {
    const description = document.createElement('p');
    description.className = 'website-description';
    description.textContent = website.description;
    info.appendChild(description);
  }

  content.appendChild(icon);
  content.appendChild(info);
  card.appendChild(content);

  return card;
}

// 显示/隐藏加载指示器
function showLoading(show) {
  loadingIndicator.style.display = show ? 'block' : 'none';
  websitesContainer.style.display = show ? 'none' : 'block';
}

// 显示错误消息
function showError() {
  errorMessage.style.display = 'block';
  websitesContainer.style.display = 'none';
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