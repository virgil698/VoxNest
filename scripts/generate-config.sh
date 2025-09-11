#!/bin/bash

# VoxNest 配置生成脚本
# 用于自动生成安全的JWT密钥和配置文件

# 默认参数
ENVIRONMENT="Development"
FORCE=false
VALIDATE_ONLY=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -v|--validate-only)
            VALIDATE_ONLY=true
            shift
            ;;
        -h|--help)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  -e, --environment  指定环境 (默认: Development)"
            echo "  -f, --force       强制覆盖现有配置文件"
            echo "  -v, --validate-only 仅验证现有配置"
            echo "  -h, --help        显示帮助信息"
            exit 0
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

# 设置脚本目录和项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$PROJECT_ROOT/VoxNest.Server"

echo "🔧 VoxNest 配置生成工具"
echo "环境: $ENVIRONMENT"

# 检查.NET项目是否存在
if [ ! -f "$SERVER_DIR/VoxNest.Server.csproj" ]; then
    echo "❌ 错误：未找到VoxNest.Server项目文件"
    exit 1
fi

# 切换到服务器目录
cd "$SERVER_DIR" || exit 1

if [ "$VALIDATE_ONLY" = true ]; then
    echo "🔍 验证现有配置..."
    dotnet run --no-build -- --validate-config
else
    echo "🔑 生成安全配置..."
    
    if [ "$FORCE" = true ]; then
        dotnet run --no-build -- --generate-config
    else
        # 检查配置文件是否已存在
        FILES_EXIST=()
        
        if [ -f ".env" ]; then
            FILES_EXIST+=(".env")
        fi
        
        if [ -f "Configuration/appsettings.Local.json" ]; then
            FILES_EXIST+=("appsettings.Local.json")
        fi
        
        if [ ${#FILES_EXIST[@]} -gt 0 ]; then
            echo "⚠️  以下配置文件已存在："
            for file in "${FILES_EXIST[@]}"; do
                echo "  - $file"
            done
            echo ""
            
            read -p "是否覆盖现有文件？(y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                dotnet run --no-build -- --generate-config
            else
                echo "操作已取消"
                exit 0
            fi
        else
            dotnet run --no-build -- --generate-config
        fi
    fi
fi

if [ "$VALIDATE_ONLY" != true ]; then
    echo ""
    echo "📖 使用说明："
    echo "1. 检查生成的配置文件，特别是数据库连接字符串"
    echo "2. 如需要，可以手动编辑 .env 或 appsettings.Local.json"
    echo "3. 确保敏感配置文件不被提交到版本控制"
    echo "4. 重启应用程序以使新配置生效"
    echo ""
    echo "💡 提示：使用 -v 参数可以验证配置安全性"
fi

echo "✅ 完成!"
