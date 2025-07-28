// 默认API配置
const DEFAULT_API_CONFIG = {
  apiUrl: 'https://putx.cn/api'
};

// DOM元素
const websitesContainer = document.getElementById('websitesContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  loadApiConfigAndWebsites();
  
  // 绑定重试事件
  retryBtn.addEventListener('click', loadApiConfigAndWebsites);
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
    
    // 按位置排序
    websites.sort((a, b) => (a.position || 0) - (b.position || 0));
    
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
  
  websites.forEach(website => {
    const websiteCard = createWebsiteCard(website);
    websiteGrid.appendChild(websiteCard);
  });
  
  websitesContainer.appendChild(websiteGrid);
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