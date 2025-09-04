#!/bin/bash

# VoxNest 论坛系统停止脚本 (Linux/macOS)
# 使用方法: ./stop.sh [选项]

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 默认配置
FORCE=false
ONLY_FRONTEND=false
ONLY_BACKEND=false
HELP=false
PORTS=(5000 54976 3000 4173 5173)

# PID文件路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

# 函数：显示帮助信息
show_help() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}       VoxNest 论坛系统停止脚本${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    echo -e "${WHITE}用法: ./stop.sh [选项]${NC}"
    echo ""
    echo -e "${YELLOW}选项:${NC}"
    echo -e "  ${WHITE}-h, --help          显示此帮助信息${NC}"
    echo -e "  ${WHITE}-f, --force         强制停止所有相关进程${NC}"
    echo -e "  ${WHITE}--only-frontend     仅停止前端服务${NC}"
    echo -e "  ${WHITE}--only-backend      仅停止后端服务${NC}"
    echo -e "  ${WHITE}--ports PORT1,PORT2 指定要检查的端口列表${NC}"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo -e "  ${WHITE}./stop.sh                    # 停止所有服务${NC}"
    echo -e "  ${WHITE}./stop.sh --force           # 强制停止所有相关进程${NC}"
    echo -e "  ${WHITE}./stop.sh --only-frontend   # 仅停止前端${NC}"
    echo -e "  ${WHITE}./stop.sh --ports 5000,3000 # 仅停止指定端口${NC}"
}

# 函数：检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 函数：通过PID停止进程
stop_process_by_pid() {
    local pid=$1
    local force=$2
    local timeout=${3:-10}
    
    if ! kill -0 "$pid" 2>/dev/null; then
        return 1  # 进程不存在
    fi
    
    if [ "$force" = true ]; then
        echo -e "${YELLOW}[信息] 强制终止进程 $pid${NC}"
        kill -9 "$pid" 2>/dev/null
        return $?
    else
        echo -e "${YELLOW}[信息] 优雅停止进程 $pid${NC}"
        kill -TERM "$pid" 2>/dev/null
        
        # 等待进程退出
        local count=0
        while [ $count -lt $timeout ] && kill -0 "$pid" 2>/dev/null; do
            sleep 1
            count=$((count + 1))
        done
        
        # 如果进程还在运行，强制终止
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}[警告] 进程 $pid 未响应，强制终止...${NC}"
            kill -9 "$pid" 2>/dev/null
        fi
        
        return $?
    fi
}

# 函数：通过端口获取进程PID
get_process_by_port() {
    local port=$1
    local pids=()
    
    if command_exists lsof; then
        # 使用 lsof
        local lsof_output=$(lsof -t -i ":$port" 2>/dev/null)
        if [ -n "$lsof_output" ]; then
            while IFS= read -r pid; do
                pids+=("$pid")
            done <<< "$lsof_output"
        fi
    elif command_exists netstat; then
        # 使用 netstat
        local netstat_output=$(netstat -tulpn 2>/dev/null | grep ":$port ")
        if [ -n "$netstat_output" ]; then
            while IFS= read -r line; do
                local pid=$(echo "$line" | awk '{print $7}' | cut -d'/' -f1)
                if [[ "$pid" =~ ^[0-9]+$ ]]; then
                    pids+=("$pid")
                fi
            done <<< "$netstat_output"
        fi
    elif command_exists ss; then
        # 使用 ss
        local ss_output=$(ss -tulpn 2>/dev/null | grep ":$port ")
        if [ -n "$ss_output" ]; then
            while IFS= read -r line; do
                local pid=$(echo "$line" | grep -o 'pid=[0-9]*' | cut -d'=' -f2)
                if [[ "$pid" =~ ^[0-9]+$ ]]; then
                    pids+=("$pid")
                fi
            done <<< "$ss_output"
        fi
    fi
    
    # 去重并返回
    printf '%s\n' "${pids[@]}" | sort -u
}

# 函数：停止后端服务
stop_backend() {
    local force=$1
    local stopped_count=0
    
    echo -e "${GREEN}[后端] 正在停止 .NET 服务器...${NC}"
    
    # 通过PID文件停止
    if [ -f "$BACKEND_PID_FILE" ]; then
        local pid=$(cat "$BACKEND_PID_FILE")
        if stop_process_by_pid "$pid" "$force"; then
            echo -e "${GREEN}[后端] 已停止进程 $pid${NC}"
            stopped_count=$((stopped_count + 1))
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # 查找 dotnet 进程
    local dotnet_pids=$(pgrep -f "dotnet.*VoxNest.Server\|dotnet run" 2>/dev/null)
    if [ -n "$dotnet_pids" ]; then
        while IFS= read -r pid; do
            if stop_process_by_pid "$pid" "$force"; then
                echo -e "${GREEN}[后端] 已停止 dotnet 进程 $pid${NC}"
                stopped_count=$((stopped_count + 1))
            fi
        done <<< "$dotnet_pids"
    fi
    
    # 通过端口停止（后端端口）
    local backend_ports=(5000)
    for port in "${backend_ports[@]}"; do
        local port_pids=$(get_process_by_port "$port")
        if [ -n "$port_pids" ]; then
            while IFS= read -r pid; do
                local process_name=$(ps -p "$pid" -o comm= 2>/dev/null)
                if [[ "$process_name" =~ dotnet|VoxNest ]]; then
                    if stop_process_by_pid "$pid" "$force"; then
                        echo -e "${GREEN}[后端] 已停止端口 $port 上的进程 $pid${NC}"
                        stopped_count=$((stopped_count + 1))
                    fi
                fi
            done <<< "$port_pids"
        fi
    done
    
    echo -e "${GREEN}[后端] 已停止 $stopped_count 个进程${NC}"
    return $([ $stopped_count -gt 0 ])
}

# 函数：停止前端服务
stop_frontend() {
    local force=$1
    local stopped_count=0
    
    echo -e "${BLUE}[前端] 正在停止开发服务器...${NC}"
    
    # 通过PID文件停止
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local pid=$(cat "$FRONTEND_PID_FILE")
        if stop_process_by_pid "$pid" "$force"; then
            echo -e "${BLUE}[前端] 已停止进程 $pid${NC}"
            stopped_count=$((stopped_count + 1))
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # 查找 Node.js 进程
    local node_pids=$(pgrep -f "node.*vite\|npm.*dev\|vite.*dev" 2>/dev/null)
    if [ -n "$node_pids" ]; then
        while IFS= read -r pid; do
            if stop_process_by_pid "$pid" "$force"; then
                echo -e "${BLUE}[前端] 已停止 node 进程 $pid${NC}"
                stopped_count=$((stopped_count + 1))
            fi
        done <<< "$node_pids"
    fi
    
    # 通过端口停止（前端端口）
    local frontend_ports=(54976 3000 4173 5173)
    for port in "${frontend_ports[@]}"; do
        local port_pids=$(get_process_by_port "$port")
        if [ -n "$port_pids" ]; then
            while IFS= read -r pid; do
                local process_name=$(ps -p "$pid" -o comm= 2>/dev/null)
                if [[ "$process_name" =~ node|vite|npm ]]; then
                    if stop_process_by_pid "$pid" "$force"; then
                        echo -e "${BLUE}[前端] 已停止端口 $port 上的进程 $pid${NC}"
                        stopped_count=$((stopped_count + 1))
                    fi
                fi
            done <<< "$port_pids"
        fi
    done
    
    echo -e "${BLUE}[前端] 已停止 $stopped_count 个进程${NC}"
    return $([ $stopped_count -gt 0 ])
}

# 函数：停止指定端口的进程
stop_processes_by_ports() {
    local ports=("$@")
    local force=$FORCE
    local total_stopped=0
    
    for port in "${ports[@]}"; do
        echo -e "${YELLOW}[信息] 检查端口 $port...${NC}"
        local port_pids=$(get_process_by_port "$port")
        
        if [ -z "$port_pids" ]; then
            echo -e "${WHITE}[信息] 端口 $port 未被占用${NC}"
            continue
        fi
        
        while IFS= read -r pid; do
            local process_name=$(ps -p "$pid" -o comm= 2>/dev/null)
            echo -e "${YELLOW}[信息] 发现进程: $process_name (PID: $pid) 占用端口 $port${NC}"
            
            if stop_process_by_pid "$pid" "$force"; then
                echo -e "${GREEN}[成功] 已停止进程 $pid${NC}"
                total_stopped=$((total_stopped + 1))
            else
                echo -e "${RED}[错误] 无法停止进程 $pid${NC}"
            fi
        done <<< "$port_pids"
    done
    
    return $total_stopped
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            HELP=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        --only-frontend)
            ONLY_FRONTEND=true
            shift
            ;;
        --only-backend)
            ONLY_BACKEND=true
            shift
            ;;
        --ports)
            IFS=',' read -ra PORTS <<< "$2"
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
    echo -e "${CYAN}       VoxNest 论坛系统停止脚本${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    
    # 根据参数停止相应服务
    if [ "$ONLY_BACKEND" = true ]; then
        echo -e "${YELLOW}[信息] 仅停止后端服务...${NC}"
        if stop_backend $FORCE; then
            echo -e "${GREEN}[成功] 后端服务已停止${NC}"
        else
            echo -e "${YELLOW}[信息] 没有发现运行中的后端服务${NC}"
        fi
    elif [ "$ONLY_FRONTEND" = true ]; then
        echo -e "${YELLOW}[信息] 仅停止前端服务...${NC}"
        if stop_frontend $FORCE; then
            echo -e "${GREEN}[成功] 前端服务已停止${NC}"
        else
            echo -e "${YELLOW}[信息] 没有发现运行中的前端服务${NC}"
        fi
    else
        echo -e "${YELLOW}[信息] 正在停止 VoxNest 论坛系统...${NC}"
        echo ""
        
        # 停止后端
        stop_backend $FORCE
        
        # 停止前端
        stop_frontend $FORCE
        
        # 通过端口停止剩余进程
        echo -e "${YELLOW}[信息] 检查并停止占用端口的进程...${NC}"
        stop_processes_by_ports "${PORTS[@]}"
    fi
    
    # 清理PID文件
    rm -f "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE"
    
    echo ""
    echo -e "${GREEN}[成功] VoxNest 论坛系统已停止！${NC}"
    
    # 显示剩余的相关进程
    echo ""
    echo -e "${YELLOW}[信息] 检查剩余进程...${NC}"
    
    local remaining_dotnet=$(pgrep -f dotnet 2>/dev/null | wc -l)
    local remaining_node=$(pgrep -f node 2>/dev/null | wc -l)
    
    if [ "$remaining_dotnet" -gt 0 ]; then
        echo -e "${YELLOW}[警告] 仍有 $remaining_dotnet 个 dotnet 进程运行${NC}"
        if [ "$FORCE" = true ]; then
            echo -e "${RED}[信息] 强制停止所有 dotnet 进程...${NC}"
            pkill -9 -f dotnet 2>/dev/null
        else
            echo -e "${YELLOW}[提示] 使用 --force 参数强制停止所有相关进程${NC}"
        fi
    fi
    
    if [ "$remaining_node" -gt 0 ]; then
        echo -e "${YELLOW}[警告] 仍有 $remaining_node 个 node 进程运行${NC}"
        if [ "$FORCE" = true ]; then
            echo -e "${RED}[信息] 强制停止所有 node 进程...${NC}"
            pkill -9 -f node 2>/dev/null
        else
            echo -e "${YELLOW}[提示] 使用 --force 参数强制停止所有相关进程${NC}"
        fi
    fi
    
    if [ "$remaining_dotnet" -eq 0 ] && [ "$remaining_node" -eq 0 ]; then
        echo -e "${GREEN}[成功] 没有发现相关进程${NC}"
    fi
    
    # 清理日志文件（可选）
    if [ -d "$PID_DIR" ]; then
        echo ""
        echo -e "${YELLOW}[信息] 日志文件位置: $PID_DIR/*.log${NC}"
        echo -e "${WHITE}[提示] 可使用 'rm $PID_DIR/*.log' 清理日志文件${NC}"
    fi
}

# 执行主函数
main
