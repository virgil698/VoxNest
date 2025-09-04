# VoxNest 论坛系统启动脚本 (PowerShell)
# 利用 .NET SPA 代理功能，只需启动后端，前端会自动启动

param(
    [switch]$Help,
    [switch]$Production,
    [int]$Port = 5000
)

# 设置控制台编码为UTF-8以正确显示中文
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
if ($Host.UI.RawUI) {
    $Host.UI.RawUI.OutputEncoding = [System.Text.Encoding]::UTF8
}

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
    Write-Host "  -Production    以生产模式启动" -ForegroundColor White
    Write-Host "  -Port          指定后端端口 (默认: 5000)" -ForegroundColor White
    Write-Host ""
    Write-Host "环境变量:" -ForegroundColor Yellow
    Write-Host "  `$env:BACKEND_PORT    后端端口 (默认: 5000)" -ForegroundColor White
    Write-Host "  `$env:PRODUCTION      生产模式 (true/false)" -ForegroundColor White
    Write-Host ""
    Write-Host "说明:" -ForegroundColor Yellow
    Write-Host "  本脚本利用 .NET SPA 代理功能，只需启动后端" -ForegroundColor White
    Write-Host "  前端会通过 SPA 代理自动启动在端口 54977" -ForegroundColor White
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
        return ($listener | Where-Object { $_.Port -eq $Port }) -ne $null
    }
    catch {
        return $false
    }
}

# 主函数
function Start-VoxNest {
    # 显示帮助
    if ($Help) {
        Show-Help
        return
    }
    
    # 从环境变量获取配置
    if ($env:BACKEND_PORT) {
        $Port = [int]$env:BACKEND_PORT
    }
    if ($env:PRODUCTION -eq "true") {
        $Production = $true
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "       VoxNest 论坛系统启动脚本" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # 检查运行环境
    Write-Host "[信息] 检查运行环境..." -ForegroundColor Yellow
    
    if (-not (Test-Command "dotnet")) {
        Write-Host "[错误] 未找到 .NET，请先安装 .NET 9.0 SDK" -ForegroundColor Red
        return
    }
    
    if (-not (Test-Command "node")) {
        Write-Host "[错误] 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
        return
    }
    
    if (-not (Test-Command "npm")) {
        Write-Host "[错误] 未找到 npm，请检查 Node.js 安装" -ForegroundColor Red
        return
    }
    
    # 显示版本信息
    $dotnetVersion = dotnet --version
    $nodeVersion = node --version
    $npmVersion = npm --version
    
    Write-Host "[成功] 运行环境检查通过" -ForegroundColor Green
    Write-Host "[信息] 环境版本:" -ForegroundColor Yellow
    Write-Host "  .NET: $dotnetVersion" -ForegroundColor White
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor White
    Write-Host "  npm: $npmVersion" -ForegroundColor White
    Write-Host ""
    
    # 获取项目路径
    $projectRoot = Split-Path $PSScriptRoot -Parent
    $backendPath = Join-Path $projectRoot "VoxNest.Server"
    $frontendPath = Join-Path $projectRoot "voxnest.client"
    
    # 检查项目目录
    if (-not (Test-Path $backendPath)) {
        Write-Host "[错误] 未找到后端项目路径: $backendPath" -ForegroundColor Red
        return
    }
    
    if (-not (Test-Path $frontendPath)) {
        Write-Host "[错误] 未找到前端项目路径: $frontendPath" -ForegroundColor Red
        return
    }
    
    # 检查前端依赖
    $nodeModulesPath = Join-Path $frontendPath "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Host "[信息] 正在安装前端依赖..." -ForegroundColor Blue
        Push-Location $frontendPath
        try {
            npm install
            if ($LASTEXITCODE -ne 0) {
                throw "npm install failed"
            }
        }
        catch {
            Write-Host "[错误] 安装前端依赖失败" -ForegroundColor Red
            Pop-Location
            return
        }
        Pop-Location
    }
    
    # 检查端口占用
    if (Test-Port -Port $Port) {
        Write-Host "[警告] 端口 $Port 已被占用" -ForegroundColor Yellow
        $continue = Read-Host "是否继续？(Y/N)"
        if ($continue -ne "Y" -and $continue -ne "y") {
            return
        }
    }
    
    Write-Host "[信息] 正在启动 VoxNest 论坛系统..." -ForegroundColor Green
    Write-Host ""
    Write-Host "服务地址:" -ForegroundColor Yellow
    Write-Host "  前端: http://localhost:54977 (SPA代理自动启动)" -ForegroundColor Cyan
    Write-Host "  后端: http://localhost:$Port" -ForegroundColor Cyan
    Write-Host "  API文档: http://localhost:$Port/swagger" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[信息] 按 Ctrl+C 停止服务" -ForegroundColor Yellow
    Write-Host ""
    
    # 切换到后端目录
    Push-Location $backendPath
    
    try {
        # 启动后端服务（会自动通过SPA代理启动前端）
        if ($Production) {
            Write-Host "[后端] 以生产模式启动..." -ForegroundColor Green
            dotnet run --configuration Release --urls "http://localhost:$Port"
        }
        else {
            Write-Host "[后端] 以开发模式启动（前端将自动启动）..." -ForegroundColor Green
            dotnet run --urls "http://localhost:$Port"
        }
    }
    catch {
        Write-Host "[错误] 启动失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    finally {
        Pop-Location
        Write-Host ""
        Write-Host "[信息] 服务已停止" -ForegroundColor Yellow
    }
}

# 执行主函数
Start-VoxNest