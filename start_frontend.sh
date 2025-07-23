#!/bin/bash

# 进入前端目录
cd "$(dirname "$0")/frontend"

# 检查node_modules是否存在，如果不存在则安装依赖
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

# 启动前端开发服务器
echo "启动前端服务..."
npm start