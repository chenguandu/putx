// Chrome扩展后台脚本

// 扩展安装事件
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('PutX网站导航扩展已安装或更新');
  
  // 如果是首次安装，设置默认配置
  if (details.reason === 'install') {
    console.log('首次安装扩展');
    // 设置默认配置
    chrome.storage.sync.set({
      apiUrl: 'https://putx.cn/api'
    }, function() {
      console.log('默认配置已设置');
    });
  }
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // 根据需要处理消息
  if (request.action === 'getSettings') {
    // 从存储中获取设置
    chrome.storage.sync.get({
      apiUrl: 'https://putx.cn/api'
    }, function(settings) {
      sendResponse(settings);
    });
    return true; // 保持消息通道开放以进行异步响应
  }
});

// 监听存储变化
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync') {
    for (let key in changes) {
      console.log(`设置 "${key}" 已从 "${changes[key].oldValue}" 更改为 "${changes[key].newValue}"`);
    }
  }
});