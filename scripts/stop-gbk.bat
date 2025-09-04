@echo off
REM 设置GBK编码以正确显示中文（适用于老版本Windows）
chcp 936 >nul

echo ========================================
echo       VoxNest 论坛系统停止脚本
echo ========================================
echo.

REM 设置颜色
color 0C

echo [信息] 正在停止 VoxNest 论坛系统...
echo.

REM 获取当前脚本目录的上级目录
set PROJECT_ROOT=%~dp0..

REM 停止 dotnet 进程（会自动停止 SPA 代理启动的前端）
echo [信息] 停止后端服务器（前端将自动停止）...

REM 查找并终止 VoxNest.Server dotnet 进程
set FOUND_PROCESS=0
for /f "tokens=2,9 delims=," %%a in ('wmic process where "Name='dotnet.exe'" get ProcessId^,CommandLine /format:csv ^| findstr /i VoxNest.Server') do (
    if not "%%a"=="" (
        echo [信息] 发现 VoxNest.Server 进程: %%a
        taskkill /pid %%a /f >nul 2>&1
        if !errorlevel! equ 0 (
            echo [成功] 已停止进程 %%a
            set FOUND_PROCESS=1
        ) else (
            echo [错误] 无法停止进程 %%a
        )
    )
)

REM 如果没有找到特定进程，检查通用 dotnet run 进程
if %FOUND_PROCESS% equ 0 (
    echo [信息] 未找到 VoxNest.Server 进程，检查通用 dotnet run 进程...
    for /f "tokens=2,9 delims=," %%a in ('wmic process where "Name='dotnet.exe'" get ProcessId^,CommandLine /format:csv ^| findstr /i "dotnet run"') do (
        if not "%%a"=="" (
            echo [信息] 发现 dotnet run 进程: %%a
            taskkill /pid %%a /f >nul 2>&1
            if !errorlevel! equ 0 (
                echo [成功] 已停止进程 %%a
                set FOUND_PROCESS=1
            )
        )
    )
)

REM 检查并停止占用关键端口的进程
echo [信息] 检查并停止占用端口的进程...

REM 检查端口 5000 (后端)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    if not "%%a"=="0" (
        echo [信息] 停止占用端口 5000 的进程 %%a
        taskkill /pid %%a /f >nul 2>&1
        set FOUND_PROCESS=1
    )
)

REM 检查端口 54977 (SPA 代理前端)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :54977 ^| findstr LISTENING') do (
    if not "%%a"=="0" (
        echo [信息] 停止占用端口 54977 的进程 %%a
        taskkill /pid %%a /f >nul 2>&1
        set FOUND_PROCESS=1
    )
)

echo.
if %FOUND_PROCESS% equ 1 (
    echo [成功] VoxNest 论坛系统已停止！
) else (
    echo [信息] 没有发现运行中的 VoxNest 服务
)

REM 显示提示信息
echo.
echo 说明：
echo   - 新版本启动脚本使用 .NET SPA 代理功能
echo   - 只需停止后端进程，前端会自动停止
echo   - 如需手动检查剩余进程，请使用任务管理器
echo.
echo 按任意键关闭此窗口...
pause >nul
