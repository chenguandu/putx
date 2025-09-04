import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 使用相对导入
from .database import engine, Base
from .routers import websites, auth, users, categories, user_website_orders

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 创建FastAPI应用
app = FastAPI(
    title="PutX指南网API",
    description="PutX指南网项目的后端API",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由
app.include_router(websites.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(user_website_orders.router)

# 根路由
@app.get("/")
def read_root():
    return {"message": "欢迎使用网站导航API"}

# 直接运行此文件时启动服务器
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)