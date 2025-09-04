@echo off
REM VoxNest 论坛系统通用启动器 (Windows)
REM 自动检测环境并选择合适的脚本

setlocal enabledelayedexpansion

echo ========================================
echo       VoxNest 论坛系统启动器
echo ========================================
echo.

REM 获取脚本目录
set SCRIPT_DIR=%~dp0

REM 检查PowerShell是否可用
powershell -Command "exit 0" >nul 2>&1
if %errorlevel% equ 0 (
    echo [信息] 检测到 PowerShell，使用 PowerShell 脚本
    echo [信息] 正在启动 VoxNest...
    echo.
    
    REM 检查参数并传递给PowerShell脚本
    set PS_ARGS=
    :parse_args
    if "%~1"=="" goto run_ps
    set PS_ARGS=!PS_ARGS! %1
    shift
    goto parse_args
    
    :run_ps
    powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%start.ps1" !PS_ARGS!
) else (
    echo [信息] PowerShell 不可用，使用批处理脚本
    echo [信息] 正在启动 VoxNest...
    echo.
    call "%SCRIPT_DIR%start.bat"
)

echo.
echo [信息] 启动完成
pause
