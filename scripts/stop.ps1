# VoxNest 论坛系统停止脚本 (PowerShell)
# 支持 Windows PowerShell 5.1+ 和 PowerShell Core 7+

param(
    [switch]$Help,
    [switch]$Force,
    [switch]$OnlyFrontend,
    [switch]$OnlyBackend,
    [int[]]$Ports = @(5000, 54976, 3000, 4173, 5173)
)

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
    Write-Host "  -OnlyFrontend  仅停止前端服务" -ForegroundColor White
    Write-Host "  -OnlyBackend   仅停止后端服务" -ForegroundColor White
    Write-Host "  -Ports         指定要检查的端口列表" -ForegroundColor White
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\stop.ps1                    # 停止所有服务" -ForegroundColor White
    Write-Host "  .\stop.ps1 -Force            # 强制停止所有相关进程" -ForegroundColor White
    Write-Host "  .\stop.ps1 -OnlyFrontend     # 仅停止前端" -ForegroundColor White
    Write-Host "  .\stop.ps1 -Ports 5000,3000  # 仅停止指定端口" -ForegroundColor White
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

# 函数：停止指定进程
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
            $Process.CloseMainWindow()
            if (-not $Process.WaitForExit(5000)) {
                Write-Host "[警告] 进程未响应，强制终止..." -ForegroundColor Yellow
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

# 函数：停止后端服务
function Stop-Backend {
    param([switch]$Force)
    
    Write-Host "[后端] 正在停止 .NET 服务器..." -ForegroundColor Green
    
    $stoppedCount = 0
    
    # 查找 dotnet 进程
    $dotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue
    
    foreach ($process in $dotnetProcesses) {
        try {
            # 检查是否是 VoxNest.Server 相关的进程
            $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($process.Id)").CommandLine
            if ($commandLine -and ($commandLine -like "*VoxNest.Server*" -or $commandLine -like "*dotnet run*")) {
                if (Stop-ProcessSafely -Process $process -Force:$Force) {
                    $stoppedCount++
                }
            }
        }
        catch {
            # 无法获取命令行，可能权限不足
            Write-Host "[警告] 无法检查进程 $($process.Id) 的命令行" -ForegroundColor Yellow
        }
    }
    
    # 通过端口停止
    $backendPorts = @(5000)
    foreach ($port in $backendPorts) {
        $processes = Get-ProcessByPort -Port $port
        foreach ($process in $processes) {
            if (Stop-ProcessSafely -Process $process -Force:$Force) {
                $stoppedCount++
            }
        }
    }
    
    Write-Host "[后端] 已停止 $stoppedCount 个进程" -ForegroundColor Green
    return $stoppedCount -gt 0
}

# 函数：停止前端服务
function Stop-Frontend {
    param([switch]$Force)
    
    Write-Host "[前端] 正在停止开发服务器..." -ForegroundColor Blue
    
    $stoppedCount = 0
    
    # 查找 Node.js 进程
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    
    foreach ($process in $nodeProcesses) {
        try {
            # 检查是否是前端开发服务器
            $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($process.Id)").CommandLine
            if ($commandLine -and ($commandLine -like "*vite*" -or $commandLine -like "*webpack*" -or $commandLine -like "*dev*")) {
                if (Stop-ProcessSafely -Process $process -Force:$Force) {
                    $stoppedCount++
                }
            }
        }
        catch {
            # 无法获取命令线，可能权限不足
        }
    }
    
    # 通过端口停止
    $frontendPorts = @(54976, 3000, 4173, 5173)
    foreach ($port in $frontendPorts) {
        $processes = Get-ProcessByPort -Port $port
        foreach ($process in $processes) {
            if ($process.ProcessName -eq "node" -or $process.ProcessName -like "*vite*") {
                if (Stop-ProcessSafely -Process $process -Force:$Force) {
                    $stoppedCount++
                }
            }
        }
    }
    
    Write-Host "[前端] 已停止 $stoppedCount 个进程" -ForegroundColor Blue
    return $stoppedCount -gt 0
}

# 函数：停止指定端口的进程
function Stop-ProcessesByPorts {
    param(
        [int[]]$Ports,
        [switch]$Force
    )
    
    $totalStopped = 0
    
    foreach ($port in $Ports) {
        Write-Host "[信息] 检查端口 $port..." -ForegroundColor Yellow
        $processes = Get-ProcessByPort -Port $port
        
        if ($processes.Count -eq 0) {
            Write-Host "[信息] 端口 $port 未被占用" -ForegroundColor Gray
            continue
        }
        
        foreach ($process in $processes) {
            if (Stop-ProcessSafely -Process $process -Force:$Force) {
                $totalStopped++
            }
        }
    }
    
    return $totalStopped
}

# 主函数
function Main {
    # 显示帮助
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "       VoxNest 论坛系统停止脚本" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $totalStopped = 0
    
    # 根据参数停止相应服务
    if ($OnlyBackend) {
        Write-Host "[信息] 仅停止后端服务..." -ForegroundColor Yellow
        if (Stop-Backend -Force:$Force) {
            Write-Host "[成功] 后端服务已停止" -ForegroundColor Green
        }
    }
    elseif ($OnlyFrontend) {
        Write-Host "[信息] 仅停止前端服务..." -ForegroundColor Yellow
        if (Stop-Frontend -Force:$Force) {
            Write-Host "[成功] 前端服务已停止" -ForegroundColor Green
        }
    }
    else {
        Write-Host "[信息] 正在停止 VoxNest 论坛系统..." -ForegroundColor Yellow
        Write-Host ""
        
        # 停止后端
        Stop-Backend -Force:$Force | Out-Null
        
        # 停止前端
        Stop-Frontend -Force:$Force | Out-Null
        
        # 通过端口停止剩余进程
        Write-Host "[信息] 检查并停止占用端口的进程..." -ForegroundColor Yellow
        $portstopped = Stop-ProcessesByPorts -Ports $Ports -Force:$Force
        
        if ($portstopped -eq 0) {
            Write-Host "[信息] 没有发现运行中的 VoxNest 服务" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "[成功] VoxNest 论坛系统已停止！" -ForegroundColor Green
    
    # 显示剩余的相关进程
    Write-Host ""
    Write-Host "[信息] 检查剩余进程..." -ForegroundColor Yellow
    
    $remainingDotnet = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue
    $remainingNode = Get-Process -Name "node" -ErrorAction SilentlyContinue
    
    if ($remainingDotnet.Count -gt 0) {
        Write-Host "[警告] 仍有 $($remainingDotnet.Count) 个 dotnet 进程运行" -ForegroundColor Yellow
        if ($Force) {
            Write-Host "[信息] 强制停止所有 dotnet 进程..." -ForegroundColor Red
            $remainingDotnet | ForEach-Object { Stop-ProcessSafely -Process $_ -Force }
        }
    }
    
    if ($remainingNode.Count -gt 0) {
        Write-Host "[警告] 仍有 $($remainingNode.Count) 个 node 进程运行" -ForegroundColor Yellow
        if ($Force) {
            Write-Host "[信息] 强制停止所有 node 进程..." -ForegroundColor Red
            $remainingNode | ForEach-Object { Stop-ProcessSafely -Process $_ -Force }
        }
    }
    
    if ($remainingDotnet.Count -eq 0 -and $remainingNode.Count -eq 0) {
        Write-Host "[成功] 没有发现相关进程" -ForegroundColor Green
    }
}

# 执行主函数
Main
