#!/bin/bash

echo "启动网站导航项目..."

# 获取当前脚本所在目录
DIR="$(cd "$(dirname "$0")" && pwd)"

# 启动后端服务（在后台运行）
echo "启动后端服务..."
terminal-notifier -message "启动后端服务" -title "网站导航项目" 2>/dev/null || echo "启动后端服务"
"$DIR/start_backend.sh" &
BACKEND_PID=$!

# 等待几秒钟让后端启动
sleep 3

# 启动前端服务
echo "启动前端服务..."
terminal-notifier -message "启动前端服务" -title "网站导航项目" 2>/dev/null || echo "启动前端服务"
"$DIR/start_frontend.sh"

# 当前端关闭时，也关闭后端
kill $BACKEND_PID 2>/dev/null
echo "已关闭所有服务"