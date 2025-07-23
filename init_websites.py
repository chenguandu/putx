#!/usr/bin/env python

"""
初始化15条网站数据到数据库的脚本
运行此脚本将创建15个常用网站的数据
"""

import os
import sys
from datetime import datetime

# 添加项目根目录到Python路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, 'backend'))

# 导入数据库模型
from database import engine, SessionLocal
from models import Website

# 15个常用网站数据
WEBSITES_DATA = [
    {
        'name': '百度',
        'url': 'https://www.baidu.com',
        'description': '中文搜索引擎',
        'icon': 'https://www.baidu.com/favicon.ico',
        'category': '搜索',
        'position': 0,
        'is_active': True
    },
    {
        'name': '谷歌',
        'url': 'https://www.google.com',
        'description': '全球最大的搜索引擎',
        'icon': 'https://www.google.com/favicon.ico',
        'category': '搜索',
        'position': 1,
        'is_active': True
    },
    {
        'name': '哔哩哔哩',
        'url': 'https://www.bilibili.com',
        'description': '中国年轻人喜爱的视频弹幕网站',
        'icon': 'https://www.bilibili.com/favicon.ico',
        'category': '视频',
        'position': 2,
        'is_active': True
    },
    {
        'name': '知乎',
        'url': 'https://www.zhihu.com',
        'description': '中文问答社区',
        'icon': 'https://static.zhihu.com/heifetz/favicon.ico',
        'category': '社区',
        'position': 3,
        'is_active': True
    },
    {
        'name': 'GitHub',
        'url': 'https://github.com',
        'description': '全球最大的代码托管平台',
        'icon': 'https://github.com/favicon.ico',
        'category': '开发',
        'position': 4,
        'is_active': True
    },
    {
        'name': '淘宝',
        'url': 'https://www.taobao.com',
        'description': '中国最大的网上购物平台',
        'icon': 'https://www.taobao.com/favicon.ico',
        'category': '购物',
        'position': 5,
        'is_active': True
    },
    {
        'name': '微博',
        'url': 'https://weibo.com',
        'description': '中国最大的社交媒体平台',
        'icon': 'https://weibo.com/favicon.ico',
        'category': '社交',
        'position': 6,
        'is_active': True
    },
    {
        'name': '腾讯视频',
        'url': 'https://v.qq.com',
        'description': '腾讯旗下视频平台',
        'icon': 'https://v.qq.com/favicon.ico',
        'category': '视频',
        'position': 7,
        'is_active': True
    },
    {
        'name': '网易云音乐',
        'url': 'https://music.163.com',
        'description': '中国流行的音乐流媒体服务',
        'icon': 'https://s1.music.126.net/style/favicon.ico',
        'category': '音乐',
        'position': 8,
        'is_active': True
    },
    {
        'name': '掘金',
        'url': 'https://juejin.cn',
        'description': '中国专业的开发者社区',
        'icon': 'https://juejin.cn/favicon.ico',
        'category': '开发',
        'position': 9,
        'is_active': True
    },
    {
        'name': '豆瓣',
        'url': 'https://www.douban.com',
        'description': '中国文化社区网站',
        'icon': 'https://www.douban.com/favicon.ico',
        'category': '社区',
        'position': 10,
        'is_active': True
    },
    {
        'name': '京东',
        'url': 'https://www.jd.com',
        'description': '中国综合网上购物平台',
        'icon': 'https://www.jd.com/favicon.ico',
        'category': '购物',
        'position': 11,
        'is_active': True
    },
    {
        'name': 'Stack Overflow',
        'url': 'https://stackoverflow.com',
        'description': '全球最大的程序员问答社区',
        'icon': 'https://stackoverflow.com/favicon.ico',
        'category': '开发',
        'position': 12,
        'is_active': True
    },
    {
        'name': 'YouTube',
        'url': 'https://www.youtube.com',
        'description': '全球最大的视频分享平台',
        'icon': 'https://www.youtube.com/favicon.ico',
        'category': '视频',
        'position': 13,
        'is_active': True
    },
    {
        'name': '微信公众平台',
        'url': 'https://mp.weixin.qq.com',
        'description': '微信公众号运营平台',
        'icon': 'https://mp.weixin.qq.com/favicon.ico',
        'category': '社交',
        'position': 14,
        'is_active': True
    }
]

def init_websites():
    """初始化15条网站数据到数据库"""
    # 创建数据库会话
    db = SessionLocal()
    
    try:
        # 检查数据库中是否已有网站数据
        existing_count = db.query(Website).count()
        if existing_count > 0:
            choice = input(f"数据库中已有 {existing_count} 条网站数据，是否继续添加？(y/n): ")
            if choice.lower() != 'y':
                print("操作已取消")
                return
        
        # 插入网站数据
        for website_data in WEBSITES_DATA:
            # 检查该网站是否已存在
            existing = db.query(Website).filter(Website.url == website_data['url']).first()
            if existing:
                print(f"网站 {website_data['name']} 已存在，跳过")
                continue
                
            # 创建新网站记录
            new_website = Website(
                name=website_data['name'],
                url=website_data['url'],
                description=website_data['description'],
                icon=website_data['icon'],
                category=website_data['category'],
                position=website_data['position'],
                is_active=website_data['is_active']
            )
            db.add(new_website)
        
        # 提交事务
        db.commit()
        print(f"成功添加网站数据到数据库")
        
    except Exception as e:
        db.rollback()
        print(f"初始化数据时出错: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_websites()