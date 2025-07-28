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
const webVersionBtn = document.getElementById('webVersionBtn'); // 新增网页版按钮

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  loadApiConfigAndWebsites();
  
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
    
    // 按分类组织网站
    const categories = {};
    websites.forEach(website => {
      const category = website.category || '未分类';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(website);
    });
    
    // 按位置排序
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => (a.position || 0) - (b.position || 0));
    });
    
    renderCategories(categories);
  } catch (error) {
    console.error('加载网站数据失败:', error);
    showError();
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
    
    websites.forEach(website => {
      const websiteCard = createWebsiteCard(website);
      websiteGrid.appendChild(websiteCard);
    });
    
    categorySection.appendChild(websiteGrid);
    categoriesContainer.appendChild(categorySection);
  });
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