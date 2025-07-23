# 个人网站导航项目

这是一个用于收集和管理个人常用网站的导航项目。

## 功能特点

- 前端使用九宫格方式展示网站
- 后台管理功能：添加、修改、删除、查询网站
- 简约风格设计，以黑白为主色调

## 技术栈

- 前端：React, HTML, CSS, JavaScript
- 后端：Python, FastAPI
- 数据库：SQLite

## 项目结构

```
.
├── backend/             # 后端代码
│   ├── app.py          # FastAPI 应用主入口
│   ├── models.py       # 数据模型
│   ├── database.py     # 数据库连接
│   ├── schemas.py      # Pydantic 模型
│   └── routers/        # API 路由
├── frontend/           # 前端代码
│   ├── public/         # 静态资源
│   └── src/            # React 源代码
│       ├── components/ # React 组件
│       ├── pages/      # 页面组件
│       └── App.js      # 主应用组件
└── requirements.txt    # Python 依赖
```

## 安装与运行

### 初始化数据

```bash
# 初始化示例数据（可选）
python init_data.py
```

### 使用启动脚本

```bash
# 启动后端服务
./start_backend.sh

# 启动前端服务
./start_frontend.sh

# 或者同时启动前后端服务
./start_all.sh
```

### 手动启动

#### 后端

```bash
# 安装依赖
pip install -r requirements.txt

# 运行后端服务
cd backend
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

#### 前端

```bash
# 安装依赖
cd frontend
npm install

# 运行开发服务器
npm start
```

## 使用说明

- 前端访问：http://localhost:3000
- 后端API：http://localhost:8000
- 后端API文档：http://localhost:8000/docs
- 后台管理：http://localhost:3000/admin