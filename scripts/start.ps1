# VoxNest 论坛系统启动脚本 (PowerShell)
# 支持 Windows PowerShell 5.1+ 和 PowerShell Core 7+

param(
    [switch]$Help,
    [switch]$NoFrontend,
    [switch]$NoBackend,
    [switch]$Production,
    [int]$BackendPort = 5000,
    [int]$FrontendPort = 54976
)

# 函数：显示帮助信息
function Show-Help {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "       VoxNest 论坛系统启动脚本" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "用法: .\start.ps1 [参数]" -ForegroundColor White
    Write-Host ""
    Write-Host "参数:" -ForegroundColor Yellow
    Write-Host "  -Help          显示此帮助信息" -ForegroundColor White
    Write-Host "  -NoFrontend    仅启动后端服务" -ForegroundColor White
    Write-Host "  -NoBackend     仅启动前端服务" -ForegroundColor White
    Write-Host "  -Production    以生产模式启动" -ForegroundColor White
    Write-Host "  -BackendPort   指定后端端口 (默认: 5000)" -ForegroundColor White
    Write-Host "  -FrontendPort  指定前端端口 (默认: 54976)" -ForegroundColor White
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1                    # 启动前端和后端" -ForegroundColor White
    Write-Host "  .\start.ps1 -NoFrontend       # 仅启动后端" -ForegroundColor White
    Write-Host "  .\start.ps1 -Production       # 生产模式启动" -ForegroundColor White
    Write-Host "  .\start.ps1 -BackendPort 8080 # 自定义后端端口" -ForegroundColor White
}

# 函数：检查命令是否存在
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# 函数：检查端口是否被占用
function Test-Port {
    param([int]$Port)
    try {
        $listener = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners()
        return $listener | Where-Object { $_.Port -eq $Port }
    }
    catch {
        return $false
    }
}

# 函数：启动后端服务
function Start-Backend {
    param([int]$Port)
    
    Write-Host "[后端] 正在启动 .NET 服务器..." -ForegroundColor Green
    
    $backendPath = Join-Path $PSScriptRoot "..\VoxNest.Server"
    
    if (-not (Test-Path $backendPath)) {
        Write-Host "[错误] 未找到后端项目路径: $backendPath" -ForegroundColor Red
        return $false
    }
    
    # 检查端口占用
    if (Test-Port -Port $Port) {
        Write-Host "[警告] 端口 $Port 已被占用" -ForegroundColor Yellow
        $continue = Read-Host "是否继续？(Y/N)"
        if ($continue -ne "Y" -and $continue -ne "y") {
            return $false
        }
    }
    
    try {
        # 启动后端（在新窗口中）
        $processArgs = @{
            FilePath = "powershell.exe"
            ArgumentList = "-NoExit", "-Command", "cd '$backendPath'; Write-Host '[后端] 启动中...' -ForegroundColor Green; dotnet run --urls 'http://localhost:$Port'"
            WindowStyle = "Normal"
        }
        
        $process = Start-Process @processArgs -PassThru
        Start-Sleep 2
        
        Write-Host "[后端] 服务器已启动 - PID: $($process.Id)" -ForegroundColor Green
        Write-Host "[后端] 地址: http://localhost:$Port" -ForegroundColor Cyan
        Write-Host "[后端] API文档: http://localhost:$Port/swagger" -ForegroundColor Cyan
        
        return $true
    }
    catch {
        Write-Host "[错误] 启动后端失败: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 函数：启动前端服务
function Start-Frontend {
    param([int]$Port)
    
    Write-Host "[前端] 正在启动开发服务器..." -ForegroundColor Blue
    
    $frontendPath = Join-Path $PSScriptRoot "..\voxnest.client"
    
    if (-not (Test-Path $frontendPath)) {
        Write-Host "[错误] 未找到前端项目路径: $frontendPath" -ForegroundColor Red
        return $false
    }
    
    try {
        # 检查并安装依赖
        $packageJsonPath = Join-Path $frontendPath "package.json"
        $nodeModulesPath = Join-Path $frontendPath "node_modules"
        
        if (-not (Test-Path $nodeModulesPath)) {
            Write-Host "[前端] 正在安装依赖..." -ForegroundColor Blue
            Push-Location $frontendPath
            npm install
            Pop-Location
        }
        
        # 启动前端（在新窗口中）
        $processArgs = @{
            FilePath = "powershell.exe"
            ArgumentList = "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '[前端] 启动中...' -ForegroundColor Blue; npm run dev -- --port $Port"
            WindowStyle = "Normal"
        }
        
        $process = Start-Process @processArgs -PassThru
        Start-Sleep 2
        
        Write-Host "[前端] 开发服务器已启动 - PID: $($process.Id)" -ForegroundColor Blue
        Write-Host "[前端] 地址: http://localhost:$Port" -ForegroundColor Cyan
        
        return $true
    }
    catch {
        Write-Host "[错误] 启动前端失败: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 主函数
function Main {
    # 显示帮助
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "       VoxNest 论坛系统启动脚本" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # 检查运行环境
    Write-Host "[信息] 检查运行环境..." -ForegroundColor Yellow
    
    if (-not (Test-Command "node")) {
        Write-Host "[错误] 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
        return
    }
    
    if (-not (Test-Command "dotnet")) {
        Write-Host "[错误] 未找到 .NET，请先安装 .NET 9.0 SDK" -ForegroundColor Red
        return
    }
    
    if (-not (Test-Command "npm")) {
        Write-Host "[错误] 未找到 npm，请检查 Node.js 安装" -ForegroundColor Red
        return
    }
    
    Write-Host "[成功] 运行环境检查通过" -ForegroundColor Green
    Write-Host ""
    
    # 显示版本信息
    $nodeVersion = node --version
    $dotnetVersion = dotnet --version
    $npmVersion = npm --version
    
    Write-Host "[信息] 环境版本:" -ForegroundColor Yellow
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor White
    Write-Host "  .NET: $dotnetVersion" -ForegroundColor White
    Write-Host "  npm: $npmVersion" -ForegroundColor White
    Write-Host ""
    
    # 启动服务
    $success = $true
    
    if (-not $NoBackend) {
        if (-not (Start-Backend -Port $BackendPort)) {
            $success = $false
        }
        Start-Sleep 3
    }
    
    if (-not $NoFrontend) {
        if (-not (Start-Frontend -Port $FrontendPort)) {
            $success = $false
        }
    }
    
    if ($success) {
        Write-Host ""
        Write-Host "[成功] VoxNest 论坛系统启动完成！" -ForegroundColor Green
        Write-Host ""
        Write-Host "服务地址:" -ForegroundColor Yellow
        if (-not $NoFrontend) {
            Write-Host "  前端: http://localhost:$FrontendPort" -ForegroundColor Cyan
        }
        if (-not $NoBackend) {
            Write-Host "  后端: http://localhost:$BackendPort" -ForegroundColor Cyan
            Write-Host "  API文档: http://localhost:$BackendPort/swagger" -ForegroundColor Cyan
        }
        Write-Host ""
        Write-Host "要停止服务，请运行: .\stop.ps1" -ForegroundColor Yellow
    }
    else {
        Write-Host ""
        Write-Host "[警告] 部分服务启动失败" -ForegroundColor Yellow
    }
}

# 执行主函数
Main
