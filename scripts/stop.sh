#!/bin/bash

# VoxNest 论坛系统停止脚本 (Linux/macOS)
# 适配新的启动方式：利用 .NET SPA 代理功能

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
HELP=false

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
    echo ""
    echo -e "${YELLOW}说明:${NC}"
    echo -e "  ${WHITE}新版本启动脚本使用 .NET SPA 代理功能${NC}"
    echo -e "  ${WHITE}只需停止后端进程，前端会自动停止${NC}"
}

# 函数：检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 函数：通过端口获取进程PID
get_process_by_port() {
    local port=$1
    local pids=()
    
    if command_exists lsof; then
        local lsof_output=$(lsof -t -i ":$port" 2>/dev/null)
        if [ -n "$lsof_output" ]; then
            while IFS= read -r pid; do
                [ -n "$pid" ] && pids+=("$pid")
            done <<< "$lsof_output"
        fi
    elif command_exists netstat; then
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
    
    printf '%s\n' "${pids[@]}" | sort -u | grep -v '^$'
}

# 函数：停止进程
stop_process() {
    local pid=$1
    local force=$2
    local timeout=${3:-10}
    
    if ! kill -0 "$pid" 2>/dev/null; then
        return 1  # 进程不存在
    fi
    
    local process_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
    echo -e "${YELLOW}[信息] 停止进程: $process_name (PID: $pid)${NC}"
    
    if [ "$force" = true ]; then
        kill -9 "$pid" 2>/dev/null
        return $?
    else
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
    
    echo -e "${YELLOW}[信息] 正在停止 VoxNest 论坛系统...${NC}"
    echo ""
    
    local stopped_count=0
    
    # 停止 VoxNest.Server dotnet 进程
    echo -e "${GREEN}[信息] 停止后端服务器（前端将自动停止）...${NC}"
    
    local voxnest_pids=$(pgrep -f "dotnet.*VoxNest.Server\|dotnet run.*VoxNest" 2>/dev/null)
    if [ -n "$voxnest_pids" ]; then
        while IFS= read -r pid; do
            if [ -n "$pid" ] && stop_process "$pid" "$FORCE"; then
                echo -e "${GREEN}[成功] 已停止 VoxNest 进程 $pid${NC}"
                stopped_count=$((stopped_count + 1))
            fi
        done <<< "$voxnest_pids"
    fi
    
    # 如果没有找到特定的VoxNest进程，查找通用的dotnet run进程
    if [ $stopped_count -eq 0 ]; then
        echo -e "${YELLOW}[信息] 未找到 VoxNest.Server 进程，检查通用 dotnet run 进程...${NC}"
        local dotnet_run_pids=$(pgrep -f "dotnet run" 2>/dev/null)
        if [ -n "$dotnet_run_pids" ]; then
            while IFS= read -r pid; do
                if [ -n "$pid" ] && stop_process "$pid" "$FORCE"; then
                    echo -e "${GREEN}[成功] 已停止 dotnet run 进程 $pid${NC}"
                    stopped_count=$((stopped_count + 1))
                fi
            done <<< "$dotnet_run_pids"
        fi
    fi
    
    # 检查并停止占用关键端口的进程
    echo -e "${BLUE}[信息] 检查并停止占用端口的进程...${NC}"
    
    local ports=(5000 54977)  # 后端端口和SPA代理端口
    for port in "${ports[@]}"; do
        local port_pids=$(get_process_by_port "$port")
        if [ -n "$port_pids" ]; then
            while IFS= read -r pid; do
                if [ -n "$pid" ] && stop_process "$pid" "$FORCE"; then
                    echo -e "${GREEN}[成功] 已停止占用端口 $port 的进程 $pid${NC}"
                    stopped_count=$((stopped_count + 1))
                fi
            done <<< "$port_pids"
        fi
    done
    
    echo ""
    if [ $stopped_count -gt 0 ]; then
        echo -e "${GREEN}[成功] VoxNest 论坛系统已停止！ (停止了 $stopped_count 个进程)${NC}"
    else
        echo -e "${YELLOW}[信息] 没有发现运行中的 VoxNest 服务${NC}"
    fi
    
    # 显示剩余的相关进程
    echo ""
    echo -e "${BLUE}[信息] 检查剩余进程...${NC}"
    
    local remaining_dotnet=$(pgrep -f dotnet 2>/dev/null | wc -l)
    local remaining_node=$(pgrep -f node 2>/dev/null | wc -l)
    
    if [ "$remaining_dotnet" -gt 0 ]; then
        echo -e "${YELLOW}[信息] 仍有 $remaining_dotnet 个 dotnet 进程运行${NC}"
        if [ "$FORCE" = true ]; then
            echo -e "${RED}[信息] 强制停止所有 dotnet 进程...${NC}"
            pkill -9 -f dotnet 2>/dev/null
        else
            echo -e "${CYAN}[提示] 使用 --force 参数强制停止所有相关进程${NC}"
        fi
    fi
    
    if [ "$remaining_node" -gt 0 ]; then
        echo -e "${YELLOW}[信息] 仍有 $remaining_node 个 node 进程运行${NC}"
        echo -e "${CYAN}[说明] 这些可能是其他项目的进程，请手动检查${NC}"
    fi
    
    if [ "$remaining_dotnet" -eq 0 ] && [ "$remaining_node" -eq 0 ]; then
        echo -e "${GREEN}[成功] 没有发现相关进程${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}说明：${NC}"
    echo -e "  ${WHITE}- 新版本启动脚本使用 .NET SPA 代理功能${NC}"
    echo -e "  ${WHITE}- 只需停止后端进程，前端会自动停止${NC}"
    echo -e "  ${WHITE}- 如需查看进程详情，使用: ps aux | grep -E 'dotnet|node'${NC}"
}

# 执行主函数
main "$@"