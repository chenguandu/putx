// 默认设置
const DEFAULT_SETTINGS = {
  apiUrl: 'https://putx.cn/api'
};

// DOM元素
const settingsForm = document.getElementById('settingsForm');
const apiUrlInput = document.getElementById('apiUrl');
const resetButton = document.getElementById('resetButton');
const statusMessage = document.getElementById('statusMessage');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  
  // 绑定事件
  settingsForm.addEventListener('submit', saveSettings);
  resetButton.addEventListener('click', resetSettings);
});

// 加载设置
function loadSettings() {
  // 从Chrome存储中加载设置
  chrome.storage.sync.get(DEFAULT_SETTINGS, function(settings) {
    apiUrlInput.value = settings.apiUrl;
  });
}

// 保存设置
function saveSettings(event) {
  event.preventDefault();
  
  const settings = {
    apiUrl: apiUrlInput.value
  };
  
  // 保存设置到Chrome存储
  chrome.storage.sync.set(settings, function() {
    showMessage('设置已保存', 'success');
  });
}

// 重置设置
function resetSettings() {
  apiUrlInput.value = DEFAULT_SETTINGS.apiUrl;
  
  // 保存重置后的设置到Chrome存储
  chrome.storage.sync.set(DEFAULT_SETTINGS, function() {
    showMessage('设置已重置为默认值', 'success');
  });
}

// 显示消息
function showMessage(text, type) {
  statusMessage.textContent = text;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = 'block';
  
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}