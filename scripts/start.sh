#!/bin/bash

# VoxNest 论坛系统启动脚本 (Linux/macOS)
# 使用方法: ./start.sh [选项]

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 默认配置
BACKEND_PORT=5000
FRONTEND_PORT=54976
NO_FRONTEND=false
NO_BACKEND=false
PRODUCTION=false
HELP=false

# PID文件路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_DIR="$SCRIPT_DIR/.pids"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

# 创建PID目录
mkdir -p "$PID_DIR"

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
    echo -e "  ${WHITE}--no-frontend       仅启动后端服务${NC}"
    echo -e "  ${WHITE}--no-backend        仅启动前端服务${NC}"
    echo -e "  ${WHITE}--production        以生产模式启动${NC}"
    echo -e "  ${WHITE}--backend-port PORT 指定后端端口 (默认: 5000)${NC}"
    echo -e "  ${WHITE}--frontend-port PORT指定前端端口 (默认: 54976)${NC}"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo -e "  ${WHITE}./start.sh                    # 启动前端和后端${NC}"
    echo -e "  ${WHITE}./start.sh --no-frontend     # 仅启动后端${NC}"
    echo -e "  ${WHITE}./start.sh --production      # 生产模式启动${NC}"
    echo -e "  ${WHITE}./start.sh --backend-port 8080 # 自定义后端端口${NC}"
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
        echo -e "${YELLOW}[警告] 无法检查端口占用情况（缺少 lsof/netstat/ss）${NC}"
        return 1
    fi
}

# 函数：等待端口可用
wait_for_port() {
    local port=$1
    local timeout=${2:-30}
    local count=0
    
    echo -e "${YELLOW}[信息] 等待端口 $port 可用...${NC}"
    
    while [ $count -lt $timeout ]; do
        if check_port $port; then
            echo -e "${GREEN}[成功] 端口 $port 已可用${NC}"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    
    echo -e "${RED}[错误] 等待端口 $port 超时${NC}"
    return 1
}

# 函数：启动后端服务
start_backend() {
    local port=$1
    
    echo -e "${GREEN}[后端] 正在启动 .NET 服务器...${NC}"
    
    local backend_path="$PROJECT_ROOT/VoxNest.Server"
    
    if [ ! -d "$backend_path" ]; then
        echo -e "${RED}[错误] 未找到后端项目路径: $backend_path${NC}"
        return 1
    fi
    
    # 检查端口占用
    if check_port $port; then
        echo -e "${YELLOW}[警告] 端口 $port 已被占用${NC}"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    # 切换到后端目录并启动
    cd "$backend_path" || return 1
    
    echo -e "${GREEN}[后端] 启动中...${NC}"
    
    # 启动后端服务（后台运行）
    nohup dotnet run --urls "http://localhost:$port" > "$PID_DIR/backend.log" 2>&1 &
    local backend_pid=$!
    
    # 保存PID
    echo $backend_pid > "$BACKEND_PID_FILE"
    
    # 等待服务启动
    sleep 3
    
    # 检查进程是否还在运行
    if kill -0 $backend_pid 2>/dev/null; then
        echo -e "${GREEN}[后端] 服务器已启动 - PID: $backend_pid${NC}"
        echo -e "${CYAN}[后端] 地址: http://localhost:$port${NC}"
        echo -e "${CYAN}[后端] API文档: http://localhost:$port/swagger${NC}"
        echo -e "${CYAN}[后端] 日志文件: $PID_DIR/backend.log${NC}"
        return 0
    else
        echo -e "${RED}[错误] 后端启动失败${NC}"
        echo -e "${YELLOW}[信息] 查看日志: cat $PID_DIR/backend.log${NC}"
        rm -f "$BACKEND_PID_FILE"
        return 1
    fi
}

# 函数：启动前端服务
start_frontend() {
    local port=$1
    
    echo -e "${BLUE}[前端] 正在启动开发服务器...${NC}"
    
    local frontend_path="$PROJECT_ROOT/voxnest.client"
    
    if [ ! -d "$frontend_path" ]; then
        echo -e "${RED}[错误] 未找到前端项目路径: $frontend_path${NC}"
        return 1
    fi
    
    # 切换到前端目录
    cd "$frontend_path" || return 1
    
    # 检查并安装依赖
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}[前端] 正在安装依赖...${NC}"
        npm install || {
            echo -e "${RED}[错误] 安装依赖失败${NC}"
            return 1
        }
    fi
    
    echo -e "${BLUE}[前端] 启动中...${NC}"
    
    # 启动前端服务（后台运行）
    nohup npm run dev -- --port $port --host > "$PID_DIR/frontend.log" 2>&1 &
    local frontend_pid=$!
    
    # 保存PID
    echo $frontend_pid > "$FRONTEND_PID_FILE"
    
    # 等待服务启动
    sleep 5
    
    # 检查进程是否还在运行
    if kill -0 $frontend_pid 2>/dev/null; then
        echo -e "${BLUE}[前端] 开发服务器已启动 - PID: $frontend_pid${NC}"
        echo -e "${CYAN}[前端] 地址: http://localhost:$port${NC}"
        echo -e "${CYAN}[前端] 日志文件: $PID_DIR/frontend.log${NC}"
        return 0
    else
        echo -e "${RED}[错误] 前端启动失败${NC}"
        echo -e "${YELLOW}[信息] 查看日志: cat $PID_DIR/frontend.log${NC}"
        rm -f "$FRONTEND_PID_FILE"
        return 1
    fi
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            HELP=true
            shift
            ;;
        --no-frontend)
            NO_FRONTEND=true
            shift
            ;;
        --no-backend)
            NO_BACKEND=true
            shift
            ;;
        --production)
            PRODUCTION=true
            shift
            ;;
        --backend-port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        --frontend-port)
            FRONTEND_PORT="$2"
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
    # 显示帮助
    if [ "$HELP" = true ]; then
        show_help
        exit 0
    fi
    
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}       VoxNest 论坛系统启动脚本${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    
    # 检查运行环境
    echo -e "${YELLOW}[信息] 检查运行环境...${NC}"
    
    if ! command_exists node; then
        echo -e "${RED}[错误] 未找到 Node.js，请先安装 Node.js${NC}"
        exit 1
    fi
    
    if ! command_exists dotnet; then
        echo -e "${RED}[错误] 未找到 .NET，请先安装 .NET 9.0 SDK${NC}"
        exit 1
    fi
    
    if ! command_exists npm; then
        echo -e "${RED}[错误] 未找到 npm，请检查 Node.js 安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}[成功] 运行环境检查通过${NC}"
    echo ""
    
    # 显示版本信息
    local node_version=$(node --version)
    local dotnet_version=$(dotnet --version)
    local npm_version=$(npm --version)
    
    echo -e "${YELLOW}[信息] 环境版本:${NC}"
    echo -e "  ${WHITE}Node.js: $node_version${NC}"
    echo -e "  ${WHITE}.NET: $dotnet_version${NC}"
    echo -e "  ${WHITE}npm: $npm_version${NC}"
    echo ""
    
    # 检查现有服务
    if [ -f "$BACKEND_PID_FILE" ] && kill -0 "$(cat "$BACKEND_PID_FILE")" 2>/dev/null; then
        echo -e "${YELLOW}[警告] 后端服务已在运行 (PID: $(cat "$BACKEND_PID_FILE"))${NC}"
    fi
    
    if [ -f "$FRONTEND_PID_FILE" ] && kill -0 "$(cat "$FRONTEND_PID_FILE")" 2>/dev/null; then
        echo -e "${YELLOW}[警告] 前端服务已在运行 (PID: $(cat "$FRONTEND_PID_FILE"))${NC}"
    fi
    
    # 启动服务
    local success=true
    
    if [ "$NO_BACKEND" != true ]; then
        if ! start_backend $BACKEND_PORT; then
            success=false
        fi
        sleep 2
    fi
    
    if [ "$NO_FRONTEND" != true ]; then
        if ! start_frontend $FRONTEND_PORT; then
            success=false
        fi
    fi
    
    echo ""
    if [ "$success" = true ]; then
        echo -e "${GREEN}[成功] VoxNest 论坛系统启动完成！${NC}"
        echo ""
        echo -e "${YELLOW}服务地址:${NC}"
        if [ "$NO_FRONTEND" != true ]; then
            echo -e "  ${CYAN}前端: http://localhost:$FRONTEND_PORT${NC}"
        fi
        if [ "$NO_BACKEND" != true ]; then
            echo -e "  ${CYAN}后端: http://localhost:$BACKEND_PORT${NC}"
            echo -e "  ${CYAN}API文档: http://localhost:$BACKEND_PORT/swagger${NC}"
        fi
        echo ""
        echo -e "${YELLOW}要停止服务，请运行: ./stop.sh${NC}"
        echo -e "${YELLOW}查看日志: tail -f $PID_DIR/*.log${NC}"
    else
        echo -e "${YELLOW}[警告] 部分服务启动失败${NC}"
        echo -e "${YELLOW}[信息] 查看日志文件以获取详细信息${NC}"
    fi
}

# 执行主函数
main
