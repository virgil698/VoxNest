# VoxNest 论坛系统启动脚本

这个文件夹包含了 VoxNest 论坛系统的启动和管理脚本，支持 Windows、Linux 和 macOS 平台。

## 📁 文件结构

```
scripts/
├── README.md           # 本文档
├── start.bat          # Windows 批处理启动脚本
├── stop.bat           # Windows 批处理停止脚本
├── start.ps1          # Windows PowerShell 启动脚本（推荐）
├── stop.ps1           # Windows PowerShell 停止脚本（推荐）
├── start.sh           # Linux/macOS 启动脚本
├── stop.sh            # Linux/macOS 停止脚本
├── voxnest.cmd        # Windows 通用启动器
├── voxnest            # Linux/macOS 通用启动器
└── .pids/             # PID 文件存储目录（自动创建）
```

## 🚀 快速开始

### Windows

#### 方法1：使用通用启动器（推荐）
```cmd
# 启动所有服务
voxnest.cmd

# 停止所有服务
scripts\stop.ps1
```

#### 方法2：直接使用 PowerShell 脚本（推荐）
```powershell
# 启动所有服务
.\start.ps1

# 停止所有服务
.\stop.ps1

# 查看帮助
.\start.ps1 -Help
.\stop.ps1 -Help
```

#### 方法3：使用批处理文件
```cmd
# 启动所有服务
start.bat

# 停止所有服务
stop.bat
```

### Linux/macOS

#### 方法1：使用通用启动器（推荐）
```bash
# 给脚本添加执行权限（首次使用）
chmod +x voxnest start.sh stop.sh

# 启动所有服务
./voxnest start

# 停止所有服务
./voxnest stop

# 重启服务
./voxnest restart

# 查看状态
./voxnest status
```

#### 方法2：直接使用脚本
```bash
# 启动所有服务
./start.sh

# 停止所有服务
./stop.sh

# 查看帮助
./start.sh --help
./stop.sh --help
```

## 📖 详细使用说明

### 启动脚本参数

#### Windows PowerShell (start.ps1)
```powershell
# 基本用法
.\start.ps1 [参数]

# 参数说明
-Help                   # 显示帮助信息
-NoFrontend            # 仅启动后端服务
-NoBackend             # 仅启动前端服务
-Production            # 以生产模式启动
-BackendPort <PORT>    # 指定后端端口（默认：5000）
-FrontendPort <PORT>   # 指定前端端口（默认：54976）

# 示例
.\start.ps1                           # 启动前端和后端
.\start.ps1 -NoFrontend              # 仅启动后端
.\start.ps1 -BackendPort 8080        # 自定义后端端口
.\start.ps1 -NoBackend -FrontendPort 3000  # 仅启动前端，使用端口3000
```

#### Linux/macOS (start.sh)
```bash
# 基本用法
./start.sh [选项]

# 选项说明
-h, --help              # 显示帮助信息
--no-frontend           # 仅启动后端服务
--no-backend            # 仅启动前端服务
--production            # 以生产模式启动
--backend-port PORT     # 指定后端端口（默认：5000）
--frontend-port PORT    # 指定前端端口（默认：54976）

# 示例
./start.sh                            # 启动前端和后端
./start.sh --no-frontend             # 仅启动后端
./start.sh --backend-port 8080       # 自定义后端端口
./start.sh --no-backend --frontend-port 3000  # 仅启动前端，使用端口3000
```

### 停止脚本参数

#### Windows PowerShell (stop.ps1)
```powershell
# 基本用法
.\stop.ps1 [参数]

# 参数说明
-Help                   # 显示帮助信息
-Force                  # 强制停止所有相关进程
-OnlyFrontend          # 仅停止前端服务
-OnlyBackend           # 仅停止后端服务
-Ports <PORT1,PORT2>   # 指定要检查的端口列表

# 示例
.\stop.ps1                           # 停止所有服务
.\stop.ps1 -Force                   # 强制停止所有相关进程
.\stop.ps1 -OnlyFrontend            # 仅停止前端
.\stop.ps1 -Ports 5000,3000         # 仅停止指定端口的进程
```

#### Linux/macOS (stop.sh)
```bash
# 基本用法
./stop.sh [选项]

# 选项说明
-h, --help              # 显示帮助信息
-f, --force             # 强制停止所有相关进程
--only-frontend         # 仅停止前端服务
--only-backend          # 仅停止后端服务
--ports PORT1,PORT2     # 指定要检查的端口列表

# 示例
./stop.sh                           # 停止所有服务
./stop.sh --force                  # 强制停止所有相关进程
./stop.sh --only-frontend          # 仅停止前端
./stop.sh --ports 5000,3000        # 仅停止指定端口的进程
```

## 🔧 环境要求

### 必需软件
- **Node.js** (推荐 20.19+ 或 22.12+)
- **.NET 9.0 SDK**
- **npm** (通常随 Node.js 安装)

### Windows 额外要求
- **PowerShell 5.1+** 或 **PowerShell Core 7+**（推荐）
- **Windows 10/11** 或 **Windows Server 2016+**

### Linux/macOS 额外要求
- **Bash 4.0+**
- 标准 Unix 工具：`ps`, `kill`, `pgrep`, `pkill`
- 可选：`lsof`, `netstat`, 或 `ss`（用于端口检查）

## 📊 默认端口配置

| 服务 | 默认端口 | 说明 |
|------|----------|------|
| 后端 API | 5000 | .NET Web API 服务器 |
| 前端开发服务器 | 54976 | Vite 开发服务器 |
| Swagger 文档 | 5000/swagger | API 文档界面 |

### 常见端口冲突解决

如果遇到端口冲突，可以：

1. **指定自定义端口**：
   ```bash
   # Linux/macOS
   ./start.sh --backend-port 8080 --frontend-port 3000
   
   # Windows
   .\start.ps1 -BackendPort 8080 -FrontendPort 3000
   ```

2. **停止占用端口的进程**：
   ```bash
   # Linux/macOS
   ./stop.sh --ports 5000,54976
   
   # Windows
   .\stop.ps1 -Ports 5000,54976
   ```

## 🛠️ 故障排除

### 常见问题

#### 1. 脚本无法执行（Windows PowerShell）
```powershell
# 临时允许脚本执行
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# 或者使用绕过策略运行
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

#### 2. 脚本无权限执行（Linux/macOS）
```bash
# 添加执行权限
chmod +x *.sh voxnest
```

#### 3. 端口被占用
```bash
# 查看端口占用情况
# Linux/macOS
lsof -i :5000
netstat -tulpn | grep 5000

# Windows
netstat -ano | findstr :5000
```

#### 4. 进程无法停止
```bash
# 强制停止所有相关进程
# Linux/macOS
./stop.sh --force

# Windows
.\stop.ps1 -Force
```

#### 5. 依赖未安装
确保已安装所需依赖：
```bash
# 检查 Node.js
node --version

# 检查 .NET
dotnet --version

# 检查 npm
npm --version
```

### 日志文件

脚本会生成日志文件，用于调试：

#### Linux/macOS
- 后端日志：`scripts/.pids/backend.log`
- 前端日志：`scripts/.pids/frontend.log`

#### Windows
日志会在各自的控制台窗口中显示。

### 查看服务状态

#### Linux/macOS
```bash
# 使用通用启动器查看状态
./voxnest status

# 手动检查 PID 文件
cat scripts/.pids/backend.pid
cat scripts/.pids/frontend.pid
```

#### Windows
```powershell
# 检查进程
Get-Process | Where-Object { $_.ProcessName -like "*dotnet*" -or $_.ProcessName -like "*node*" }

# 检查端口
netstat -ano | findstr "5000\|54976"
```

## 🔄 开发工作流

### 典型开发流程

1. **启动开发环境**：
   ```bash
   # 启动所有服务
   ./voxnest start        # Linux/macOS
   voxnest.cmd            # Windows
   ```

2. **仅重启前端**（前端代码修改后）：
   ```bash
   ./stop.sh --only-frontend && ./start.sh --no-backend
   ```

3. **仅重启后端**（后端代码修改后）：
   ```bash
   ./stop.sh --only-backend && ./start.sh --no-frontend
   ```

4. **完全重启**：
   ```bash
   ./voxnest restart      # Linux/macOS
   ```

### 生产部署

对于生产环境，建议：

1. 使用反向代理（如 Nginx）
2. 配置 SSL/TLS 证书
3. 使用进程管理器（如 PM2, systemd）
4. 配置日志轮转
5. 设置监控和告警

## 📝 自定义配置

### 修改默认端口

编辑脚本文件中的默认端口设置：

```bash
# start.sh
BACKEND_PORT=5000
FRONTEND_PORT=54976

# start.ps1
[int]$BackendPort = 5000,
[int]$FrontendPort = 54976
```

### 添加环境变量

可以在脚本中添加环境变量：

```bash
# Linux/macOS (start.sh)
export NODE_ENV=development
export ASPNETCORE_ENVIRONMENT=Development

# Windows (start.ps1)
$env:NODE_ENV = "development"
$env:ASPNETCORE_ENVIRONMENT = "Development"
```

## 🤝 贡献

如果您发现问题或有改进建议，请：

1. 提交 Issue 描述问题
2. 提交 Pull Request 包含修复
3. 更新文档说明新功能

## 📄 许可证

本脚本与 VoxNest 项目使用相同的许可证。
