# VoxNest 论坛系统停止脚本 (PowerShell)
# 适配新的启动方式：利用 .NET SPA 代理功能

param(
    [switch]$Help,
    [switch]$Force
)

# 设置控制台编码为UTF-8以正确显示中文
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
if ($Host.UI.RawUI) {
    $Host.UI.RawUI.OutputEncoding = [System.Text.Encoding]::UTF8
}

# 函数：显示帮助信息
function Show-Help {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "       VoxNest 论坛系统停止脚本" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "用法: .\stop.ps1 [参数]" -ForegroundColor White
    Write-Host ""
    Write-Host "参数:" -ForegroundColor Yellow
    Write-Host "  -Help          显示此帮助信息" -ForegroundColor White
    Write-Host "  -Force         强制停止所有相关进程" -ForegroundColor White
    Write-Host ""
    Write-Host "说明:" -ForegroundColor Yellow
    Write-Host "  新版本启动脚本使用 .NET SPA 代理功能" -ForegroundColor White
    Write-Host "  只需停止后端进程，前端会自动停止" -ForegroundColor White
}

# 函数：获取占用端口的进程
function Get-ProcessByPort {
    param([int]$Port)
    
    try {
        $netstat = netstat -ano | Select-String ":$Port\s"
        $processes = @()
        
        foreach ($line in $netstat) {
            if ($line -match "\s+(\d+)$") {
                $pid = $matches[1]
                try {
                    $process = Get-Process -Id $pid -ErrorAction Stop
                    $processes += $process
                }
                catch {
                    # 进程可能已经不存在
                }
            }
        }
        
        return $processes | Sort-Object Id -Unique
    }
    catch {
        return @()
    }
}

# 函数：安全停止进程
function Stop-ProcessSafely {
    param(
        [System.Diagnostics.Process]$Process,
        [switch]$Force
    )
    
    try {
        if ($Process.HasExited) {
            return $true
        }
        
        Write-Host "[信息] 停止进程: $($Process.ProcessName) (PID: $($Process.Id))" -ForegroundColor Yellow
        
        if ($Force) {
            $Process.Kill()
        }
        else {
            # 尝试优雅关闭
            if ($Process.CloseMainWindow()) {
                if (-not $Process.WaitForExit(5000)) {
                    Write-Host "[警告] 进程未响应，强制终止..." -ForegroundColor Yellow
                    $Process.Kill()
                }
            }
            else {
                # 如果无法优雅关闭，直接终止
                $Process.Kill()
            }
        }
        
        return $true
    }
    catch {
        Write-Host "[错误] 无法停止进程 $($Process.Id): $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 主函数
function Stop-VoxNest {
    # 显示帮助
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "       VoxNest 论坛系统停止脚本" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "[信息] 正在停止 VoxNest 论坛系统..." -ForegroundColor Yellow
    Write-Host ""
    
    $stoppedCount = 0
    
    # 停止 dotnet 进程（会自动停止 SPA 代理启动的前端）
    Write-Host "[信息] 停止后端服务器（前端将自动停止）..." -ForegroundColor Green
    
    # 查找 VoxNest.Server 相关的 dotnet 进程
    $dotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue
    
    foreach ($process in $dotnetProcesses) {
        try {
            # 检查是否是 VoxNest.Server 相关的进程
            $commandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($process.Id)").CommandLine
            if ($commandLine -and ($commandLine -like "*VoxNest.Server*" -or $commandLine -like "*dotnet run*")) {
                if (Stop-ProcessSafely -Process $process -Force:$Force) {
                    Write-Host "[成功] 已停止 VoxNest 进程 $($process.Id)" -ForegroundColor Green
                    $stoppedCount++
                }
            }
        }
        catch {
            # 无法获取命令行，可能权限不足，跳过
        }
    }
    
    # 检查并停止占用关键端口的进程
    Write-Host "[信息] 检查并停止占用端口的进程..." -ForegroundColor Blue
    
    $keyPorts = @(5000, 54977)  # 后端端口和SPA代理端口
    foreach ($port in $keyPorts) {
        $processes = Get-ProcessByPort -Port $port
        if ($processes.Count -gt 0) {
            Write-Host "[信息] 发现 $($processes.Count) 个进程占用端口 $port" -ForegroundColor Yellow
            foreach ($process in $processes) {
                if (Stop-ProcessSafely -Process $process -Force:$Force) {
                    Write-Host "[成功] 已停止占用端口 $port 的进程 $($process.Id)" -ForegroundColor Green
                    $stoppedCount++
                }
            }
        }
    }
    
    Write-Host ""
    if ($stoppedCount -gt 0) {
        Write-Host "[成功] VoxNest 论坛系统已停止！ (停止了 $stoppedCount 个进程)" -ForegroundColor Green
    }
    else {
        Write-Host "[信息] 没有发现运行中的 VoxNest 服务" -ForegroundColor Gray
    }
    
    # 显示剩余的相关进程
    Write-Host ""
    Write-Host "[信息] 检查剩余进程..." -ForegroundColor Blue
    
    $remainingDotnet = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue
    $remainingNode = Get-Process -Name "node" -ErrorAction SilentlyContinue
    
    if ($remainingDotnet.Count -gt 0) {
        Write-Host "[信息] 仍有 $($remainingDotnet.Count) 个 dotnet 进程运行" -ForegroundColor Yellow
        if ($Force) {
            Write-Host "[信息] 强制停止所有 dotnet 进程..." -ForegroundColor Red
            $remainingDotnet | ForEach-Object { Stop-ProcessSafely -Process $_ -Force }
        }
        else {
            Write-Host "[提示] 使用 -Force 参数强制停止所有相关进程" -ForegroundColor Cyan
        }
    }
    
    if ($remainingNode.Count -gt 0) {
        Write-Host "[信息] 仍有 $($remainingNode.Count) 个 node 进程运行" -ForegroundColor Yellow
        Write-Host "[说明] 这些可能是其他项目的进程，请手动检查" -ForegroundColor Cyan
    }
    
    if ($remainingDotnet.Count -eq 0 -and $remainingNode.Count -eq 0) {
        Write-Host "[成功] 没有发现相关进程" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "说明：" -ForegroundColor Cyan
    Write-Host "  - 新版本启动脚本使用 .NET SPA 代理功能" -ForegroundColor White
    Write-Host "  - 只需停止后端进程，前端会自动停止" -ForegroundColor White
    Write-Host "  - 如需查看进程详情，请使用任务管理器" -ForegroundColor White
}

# 执行主函数
Stop-VoxNest
