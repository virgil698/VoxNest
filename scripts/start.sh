#!/bin/bash

# VoxNest 论坛系统启动脚本 (Linux/macOS)
# 利用 .NET SPA 代理功能，只需启动后端，前端会自动启动

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 默认配置
BACKEND_PORT=${BACKEND_PORT:-5000}
PRODUCTION=${PRODUCTION:-false}

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_PATH="$PROJECT_ROOT/VoxNest.Server"
FRONTEND_PATH="$PROJECT_ROOT/voxnest.client"

# 函数：显示帮助信息
show_help() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}       VoxNest 论坛系统启动脚本${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    echo -e "${WHITE}用法: ./start.sh [选项]${NC}"
    echo ""
    echo -e "${YELLOW}选项:${NC}"
    echo -e "  ${WHITE}-h, --help          显示此帮助信息${NC}"
    echo -e "  ${WHITE}--production        以生产模式启动${NC}"
    echo -e "  ${WHITE}--port PORT         指定后端端口 (默认: 5000)${NC}"
    echo ""
    echo -e "${YELLOW}环境变量:${NC}"
    echo -e "  ${WHITE}BACKEND_PORT        后端端口 (默认: 5000)${NC}"
    echo -e "  ${WHITE}PRODUCTION          生产模式 (true/false)${NC}"
    echo ""
    echo -e "${YELLOW}说明:${NC}"
    echo -e "  ${WHITE}本脚本利用 .NET SPA 代理功能，只需启动后端${NC}"
    echo -e "  ${WHITE}前端会通过 SPA 代理自动启动在端口 54977${NC}"
}

# 函数：检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 函数：检查端口是否被占用
check_port() {
    local port=$1
    if command_exists lsof; then
        lsof -i ":$port" >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -tuln 2>/dev/null | grep ":$port " >/dev/null
    elif command_exists ss; then
        ss -tuln 2>/dev/null | grep ":$port " >/dev/null
    else
        return 1
    fi
}

# 清理函数
cleanup() {
    echo ""
    echo -e "${YELLOW}[信息] 正在停止服务...${NC}"
    # 杀死后台进程组
    if [ ! -z "$BACKEND_PID" ]; then
        kill -TERM -$BACKEND_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}[信息] 服务已停止${NC}"
    exit 0
}

# 注册信号处理
trap cleanup SIGINT SIGTERM

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --production)
            PRODUCTION=true
            shift
            ;;
        --port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}[错误] 未知参数: $1${NC}"
            echo "使用 --help 查看帮助信息"
            exit 1
            ;;
    esac
done

# 主函数
main() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}       VoxNest 论坛系统启动脚本${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    
    # 检查运行环境
    echo -e "${YELLOW}[信息] 检查运行环境...${NC}"
    
    if ! command_exists dotnet; then
        echo -e "${RED}[错误] 未找到 .NET，请先安装 .NET 9.0 SDK${NC}"
        exit 1
    fi
    
    if ! command_exists node; then
        echo -e "${RED}[错误] 未找到 Node.js，请先安装 Node.js${NC}"
        exit 1
    fi
    
    if ! command_exists npm; then
        echo -e "${RED}[错误] 未找到 npm，请检查 Node.js 安装${NC}"
        exit 1
    fi
    
    # 显示版本信息
    local dotnet_version=$(dotnet --version)
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    
    echo -e "${GREEN}[成功] 运行环境检查通过${NC}"
    echo -e "${YELLOW}[信息] 环境版本:${NC}"
    echo -e "  ${WHITE}.NET: $dotnet_version${NC}"
    echo -e "  ${WHITE}Node.js: $node_version${NC}"
    echo -e "  ${WHITE}npm: $npm_version${NC}"
    echo ""
    
    # 检查项目目录
    if [ ! -d "$BACKEND_PATH" ]; then
        echo -e "${RED}[错误] 未找到后端项目路径: $BACKEND_PATH${NC}"
        exit 1
    fi
    
    if [ ! -d "$FRONTEND_PATH" ]; then
        echo -e "${RED}[错误] 未找到前端项目路径: $FRONTEND_PATH${NC}"
        exit 1
    fi
    
    # 检查前端依赖
    if [ ! -d "$FRONTEND_PATH/node_modules" ]; then
        echo -e "${BLUE}[信息] 正在安装前端依赖...${NC}"
        cd "$FRONTEND_PATH" || exit 1
        npm install || {
            echo -e "${RED}[错误] 安装前端依赖失败${NC}"
            exit 1
        }
    fi
    
    # 检查后端端口占用
    if check_port $BACKEND_PORT; then
        echo -e "${YELLOW}[警告] 端口 $BACKEND_PORT 已被占用${NC}"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # 切换到后端目录
    cd "$BACKEND_PATH" || exit 1
    
    echo -e "${GREEN}[信息] 正在启动 VoxNest 论坛系统...${NC}"
    echo ""
    echo -e "${YELLOW}服务地址:${NC}"
    echo -e "  ${CYAN}前端: http://localhost:54977 ${NC}${WHITE}(SPA代理自动启动)${NC}"
    echo -e "  ${CYAN}后端: http://localhost:$BACKEND_PORT${NC}"
    echo -e "  ${CYAN}API文档: http://localhost:$BACKEND_PORT/swagger${NC}"
    echo ""
    echo -e "${YELLOW}[信息] 按 Ctrl+C 停止服务${NC}"
    echo ""
    
    # 启动后端服务（会自动通过SPA代理启动前端）
    if [ "$PRODUCTION" = true ]; then
        echo -e "${GREEN}[后端] 以生产模式启动...${NC}"
        dotnet run --configuration Release --urls "http://localhost:$BACKEND_PORT" &
    else
        echo -e "${GREEN}[后端] 以开发模式启动（前端将自动启动）...${NC}"
        dotnet run --urls "http://localhost:$BACKEND_PORT" &
    fi
    
    BACKEND_PID=$!
    
    # 等待服务启动
    echo -e "${YELLOW}[信息] 等待服务启动...${NC}"
    sleep 5
    
    # 检查后端是否启动成功
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}[错误] 后端启动失败${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}[成功] VoxNest 论坛系统启动完成！${NC}"
    echo -e "${YELLOW}[信息] 前端通过 SPA 代理自动启动，请稍等...${NC}"
    
    # 等待进程结束
    wait $BACKEND_PID
}

# 执行主函数
main "$@"