# VoxNest 论坛系统启动脚本

本目录包含了 VoxNest 论坛系统的启动和停止脚本，支持 Windows 和 Linux 系统。

## 特性

- **简化启动**：利用 .NET SPA 代理功能，只需启动后端，前端会自动启动
- **跨平台支持**：支持 Windows、Linux 和 macOS
- **智能检测**：自动检查运行环境和依赖
- **优雅停止**：智能识别和停止相关进程

## 文件说明

### 启动脚本

| 文件 | 平台 | 说明 |
|------|------|------|
| `start.bat` | Windows | Windows 批处理脚本 |
| `start.sh` | Linux/macOS | Bash Shell 脚本 |
| `start.ps1` | Windows | PowerShell 脚本 |

### 停止脚本

| 文件 | 平台 | 说明 |
|------|------|------|
| `stop.bat` | Windows | Windows 批处理脚本 |
| `stop.sh` | Linux/macOS | Bash Shell 脚本 |
| `stop.ps1` | Windows | PowerShell 脚本 |

## 使用方法

### Windows 系统

#### 方法一：使用批处理文件
```cmd
# 启动
scripts\start.bat

# 停止
scripts\stop.bat
```

#### 方法二：使用 PowerShell
```powershell
# 启动
.\scripts\start.ps1

# 停止
.\scripts\stop.ps1

# 查看帮助
.\scripts\start.ps1 -Help
.\scripts\stop.ps1 -Help
```

### Linux/macOS 系统

```bash
# 启动
./scripts/start.sh

# 停止
./scripts/stop.sh

# 查看帮助
./scripts/start.sh --help
./scripts/stop.sh --help
```

## 高级选项

### 启动选项

#### PowerShell (start.ps1)
```powershell
# 生产模式启动
.\scripts\start.ps1 -Production

# 自定义端口
.\scripts\start.ps1 -Port 8080
```

#### Bash (start.sh)
```bash
# 生产模式启动
./scripts/start.sh --production

# 自定义端口
./scripts/start.sh --port 8080
```

### 停止选项

#### PowerShell (stop.ps1)
```powershell
# 强制停止所有相关进程
.\scripts\stop.ps1 -Force
```

#### Bash (stop.sh)
```bash
# 强制停止所有相关进程
./scripts/stop.sh --force
```

## 服务地址

启动成功后，可以通过以下地址访问服务：

- **前端**: http://localhost:54977 (SPA代理自动启动)
- **后端**: http://localhost:5000
- **API文档**: http://localhost:5000/swagger

## 系统要求

### 必需组件

- **.NET 9.0 SDK** - 后端运行环境
- **Node.js** (LTS版本) - 前端构建和开发环境
- **npm** - Node.js 包管理器

### 检查安装

```bash
# 检查 .NET
dotnet --version

# 检查 Node.js
node --version

# 检查 npm
npm --version
```

## 工作原理

1. **启动过程**:
   - 检查系统环境 (.NET, Node.js, npm)
   - 安装前端依赖 (如需要)
   - 启动后端服务器
   - .NET SPA 代理自动启动前端开发服务器

2. **停止过程**:
   - 查找并停止 VoxNest.Server dotnet 进程
   - 检查并停止占用关键端口的进程
   - 由于使用 SPA 代理，前端会随后端自动停止

## 故障排除

### 常见问题

1. **中文显示乱码 (Windows)**
   - **bat脚本**: 已自动设置UTF-8编码 (`chcp 65001`)
   - **PowerShell脚本**: 已自动设置控制台UTF-8编码
   - 如果仍有乱码，请确保：
     - 命令行窗口字体支持中文 (如 Consolas, SimSun)
     - 脚本文件保存为UTF-8编码
   
   ```cmd
   REM 手动设置编码（如果需要）
   chcp 65001  REM UTF-8编码
   chcp 936    REM GBK编码（中文简体）
   ```

2. **端口被占用**
   - 脚本会检测端口占用并提示
   - 可以选择继续或停止其他占用进程

3. **权限不足 (Linux)**
   ```bash
   chmod +x scripts/*.sh
   ```

4. **PowerShell执行策略限制 (Windows)**
   ```powershell
   # 临时允许脚本执行
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   
   # 或者绕过执行策略运行
   powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1
   ```

5. **依赖缺失**
   - 脚本会自动检查并提示缺失的组件
   - 按提示安装相应组件

6. **前端依赖问题**
   ```bash
   cd voxnest.client
   rm -rf node_modules package-lock.json
   npm install
   ```

### 手动操作

如果脚本无法正常工作，可以手动执行：

```bash
# 手动启动后端
cd VoxNest.Server
dotnet run --urls "http://localhost:5000"

# 手动停止 (Linux)
pkill -f "dotnet.*VoxNest"

# 手动停止 (Windows)
taskkill /f /im dotnet.exe
```

## 开发说明

- 脚本利用 .NET 的 SPA 代理功能，配置在 `VoxNest.Server.csproj` 中
- `SpaProxyServerUrl` 设置为 `http://localhost:54977`
- `SpaProxyLaunchCommand` 设置为 `npm run dev`
- 前端项目路径由 `SpaRoot` 指定为 `../voxnest.client`

## 编码说明

### Windows 中文支持

为了解决Windows系统下中文显示乱码问题，脚本已进行以下优化：

1. **批处理脚本 (start.bat, stop.bat)**
   - 自动设置UTF-8编码 (`chcp 65001`)
   - 支持现代Windows系统的中文显示

2. **PowerShell脚本 (start.ps1, stop.ps1)**
   - 自动设置控制台输出编码为UTF-8
   - 兼容PowerShell 5.1+ 和 PowerShell Core 7+

### 备用解决方案

如果在较老的Windows系统上仍有编码问题，已提供GBK编码版本的脚本：

```cmd
REM 使用GBK编码版本（适用于老版本Windows）
scripts\start-gbk.bat
scripts\stop-gbk.bat

REM 或者手动修改现有脚本
REM 将 chcp 65001 改为 chcp 936
```

**文件说明**:
- `start.bat` / `stop.bat` - UTF-8编码版本（推荐）
- `start-gbk.bat` / `stop-gbk.bat` - GBK编码版本（兼容老系统）

## 更新日志

- **v2.1**: 修复Windows中文显示乱码问题
- **v2.0**: 简化启动流程，利用 SPA 代理功能  
- **v1.0**: 分别启动前端和后端服务