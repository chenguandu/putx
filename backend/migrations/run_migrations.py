import os
import importlib.util
import sys

def run_all_migrations():
    """运行migrations目录下的所有迁移脚本"""
    # 获取当前脚本所在目录
    migrations_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 获取所有迁移脚本文件
    migration_files = [f for f in os.listdir(migrations_dir) 
                      if f.endswith('.py') and f != 'run_migrations.py' and f != '__init__.py']
    
    # 按文件名排序，确保按正确顺序执行迁移
    migration_files.sort()
    
    print(f"找到 {len(migration_files)} 个迁移脚本")
    
    # 执行每个迁移脚本
    for migration_file in migration_files:
        print(f"\n执行迁移: {migration_file}")
        
        # 构建脚本的完整路径
        script_path = os.path.join(migrations_dir, migration_file)
        
        # 动态导入并执行迁移脚本
        try:
            # 加载模块
            spec = importlib.util.spec_from_file_location(migration_file[:-3], script_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            # 执行迁移
            if hasattr(module, 'run_migration'):
                module.run_migration()
                print(f"迁移 {migration_file} 成功完成")
            else:
                print(f"警告: {migration_file} 没有 run_migration() 函数")
                
        except Exception as e:
            print(f"执行迁移 {migration_file} 失败: {e}")
            sys.exit(1)
    
    print("\n所有迁移已成功完成！")

if __name__ == "__main__":
    run_all_migrations()